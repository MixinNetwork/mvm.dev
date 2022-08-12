# Cross-Chain Deposit

We will introduce you how to cross-chain deposit with MVM Bridge Contract

## Steps

* ### Get address of wallet like MetaMask
* ### POST `/users` to get information of the Mixin Network User bound to this address

  [official js sdk](https://github.com/MixinNetwork/bot-api-nodejs-client) example：
  ```javascript
  import { BridgeApi } from '@mixin.dev/mixin-node-sdk';
  
  const bridgeClient = BridgeApi();
  const user = await bridgeClient.register({
    public_key: '', // wallet address
  });
  ```

* ### Get this Mixin Network User's deposit addresses for different assets on different chains

  [official js sdk](https://github.com/MixinNetwork/bot-api-nodejs-client) 代码示例：
  ```javascript
  import { MixinApi } from '@mixin.dev/mixin-node-sdk'; 
  
  // ...
  const keystore = {
    ...user,
    ...user.key
  };
  const mixinClient = MixinApi({ keystore });
  
  // Get information of different assets
  const assets = mixinClient.asset.fetchList();
  console.log(assets);
  // Get deposit address of a specific asset
  const asset = await mixinClient.asset.fetch(
    'c94ac88f-4671-3976-b60a-09064f1811e8' // asset_id of XIN
  );
  console.log(asset.deposit_entries[0].destination);
  ```

* ### Deposit

  When having the deposit address of a specific asset, 
  you can accomplish the deposit by transferring asset to the address on the chain that the asset belongs to.
  Then, the ERC20 asset will show in your wallet on MVM.

  The crucial part of deposit is to get the deposit addresses of bound Mixin Network User on different chains.

## Bridge Open Source Code：

<https://github.com/MixinNetwork/trusted-group/tree/master/mvm/quorum/bridge>

Next, we will introduce you the way to withdraw asset to another chain.
