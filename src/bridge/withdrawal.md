# Cross-Chain Withdrawal

We introduced the way to cross-chain deposit to address in MVM through Bridge Contract in the previous chapter. 
Now, we are going to show you how to cross-chain withdrawal from address in MVM.

## Withdrawal

Compared to deposit, it's easier to cross-chain withdraw. You only need to call `release` function of 
[Bridge Contract](https://github.com/MixinNetwork/trusted-group/blob/master/mvm/quorum/bridge/contracts/Bridge.sol)
twice to withdraw native currency ETH in MVM;
Or call `transferWithExtra` function of
[Asset Contract](https://github.com/MixinNetwork/trusted-group/blob/master/mvm/quorum/registry/contracts/Asset.sol)
twice to withdraw other ERC20 token.
One for asset to be withdrawn and one for asset for withdrawal cost.

`release` function:

```solidity
function release(address receiver, bytes memory input) public payable {
    uint256 amount = msg.value / BASE;
    require(amount > 0, "value too small");

    address bound = bridges[msg.sender];
    require(bound == address(0) || receiver == bound, "bound not match");

    IERC20(XIN).transferWithExtra(receiver, amount, input);
    emit Through(XIN, msg.sender, receiver, amount);
}
```

`transferWithExtra` function：

```solidity
function transferWithExtra(
    address to,
    uint256 value,
    bytes memory extra
) public returns (bool) {
    _transfer(msg.sender, to, value);
    IRegistry(registry).burn(to, value, extra);
    return true;
}
```

These are arguments we need prepare：

* `receiver` in function `release` and `to` in function `transferWithExtra` are the same.
  It is the MVM User Contract Address of Mixin Network User bound to wallet address.
  You can get it from `contract` in the response of `POST /users` API.

* `value` in function `transferWithExtra` is the amount of asset.

* `input` in the function `release` and `extra` in the function `transferWithExtra` are the same.
  It is the information of asset to be withdrawn or asset for withdrawal cost.
  In [Bridge APi](/bridge/api), API `POST /extra` is used to generate it with `destination`, `tag` and `extra`

  1. `destination` in `action` is the transfer address，
     `tag` is required when transfer asset to chain like EOS, which set `tag` as `memo`.
     `extra` of asset to be withdrawn should be in the form of `<trace_id>:A`,
     `extra` of asset to be withdrawal fee should be in the form of `<trace_id>:B`，
     and the two `<trace_id>` must be same.
  2. After generating `action`, you can get the `input` or `extra` through `POST /extra` API.

  Example：
  ```javascript
  import { BridgeApi } from '@mixin.dev/mixin-node-sdk';
  
  const action = {
    "destination": "0x12266b2Bbd....0CF83c3997Bc8dbAD0be0",
    "tag": "EOS memo",
    "extra": "400f4072-2936-461b-a667-d9938d4a7973:A", // or 400f4072-2936-461b-a667-d9938d4a7973:B
  };
  const client = BridgeApi();
  const input = await client.generateExtra(action);
  ```

::: warning Notice
* When withdraw token to ETH(TRON), for example usdt, you must have balance for usdt and ETH(TRON) at the same time,
  the ETH(TRON) is withdrawal cost.
:::

Withdrawal Code Example：

```javascript
import { Wallet, ethers } from 'ethers';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { v4 } from 'uuid';
import { MVMMainnet, BridgeABI, BridgeApi, MixinApi } from '@mixin.dev/mixin-node-sdk';

const destination = ''; // withdrawal address
const tag = '';
const amount = 0.1;

const publicKey = ''; // address of wallet 
const privateKey = ''; // private key of wallet
const provider = new StaticJsonRpcProvider(MVMMainnet.RPCUri);
const signer = new Wallet(privateKey, provider);
const bridge = new ethers.Contract(
  '0x0915EaE769D68128EEd9711A0bc4097831BE57F3', // Bridge Contract address
  BridgeABI,
  signer
);

const bridgeClient = BridgeApi();
const mixinClient = MixinApi({});

const main = async () => {
  const traceId = v4();
  const action1 = {
    destination,
    tag,
    extra: `${traceId}:A`
  };
  const action2 = {
    destination,
    tag,
    extra: `${traceId}:B`
  };
  const extra1 = await bridgeClient.generateExtra(action1);
  const extra2 = await bridgeClient.generateExtra(action2);
  
  const { contract } = await bridgeClient.register({
    public_key: publicKey
  });
  const res1 = await bridge.release(contract, extra1, {
    gasPrice: 10000000, // 0.01 Gwei
    gasLimit: 350000,
    value: ethers.utils.parseEther(Number(amount).toFixed(8))
  });

  const asset = await mixinClient.network.fetchAsset("43d61dcd-e413-450d-80b8-101d5e903357"); // ETH
  const res2 = await bridge.release(contract, extra2, {
    gasPrice: 10000000, // 0.01 Gwei
    gasLimit: 350000,
    value: ethers.utils.parseEther(Number(asset.fee).toFixed(8)) // ETH withdrawal cost
  });
};
```

## Transfer to Mixin User

In addition to cross-chain withdrawal，Bridge Contract is capable of transferring asset to Mixin User freely.
The procedure is almost same with withdrawal, except for `action`.

Transfer `action`:
```
{
  "receivers": ["58099349-b159-4662-ad51-c18e809c9035", "58099349-b159-4662-ad51-c18e809c9035", ...],
  "threshold": 1,
  "extra: "blahblahblah"
}
```

* `receivers` is an array of `client_id` of Mixin User if you want to transfer asset to a multi-signature account.
Or you can put one `client_id` in it to transfer asset to regular Mixin User.
