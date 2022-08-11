# 通过 MetaMask 对多链提现

在上一章中我们介绍了如何通过其它链，比如 BTC、ETH、SOL、DOT 等, 给 MetaMask 的地址充值, 在接下来，我们会讨论如何通过 MetaMask 进行多链提现。

::: warning 注意

这里的 MetaMask Address 可以是任意的 ETH 钱包，比如 imtoken 等等，原理跟流程都是相同的。

:::

## 如何多链提现

相对于多链充值，多链提现更加简单，对于 MVM 原生的 ETH 代币，只需要调用两次 [Bridge](https://github.com/MixinNetwork/trusted-group/blob/master/mvm/quorum/bridge/contracts/Bridge.sol)
合约的 `release` 方法；
对于其他 ERC20 代币，只需要调用两次对应资产 [Asset](https://github.com/MixinNetwork/trusted-group/blob/master/mvm/quorum/registry/contracts/Asset.sol)
合约的 `transferWithExtra` 方法。
一次用于支付要提现的代币，一次用于支付跨链的手续费。

`release` 方法如下:

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

`transferWithExtra` 方法如下：

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

我们需要准备的以下参数：

* `release` 方法中的 `receiver` 和 `transferWithExtra` 方法中的 `to` 是 metamask 绑定的 Mixin Network User 对应的 MVM 帐号地址，
  可通过 post `/users` API 返回值中的 `contract` 获取。

* `transferWithExtra` 方法中的 `value` 是转账金额。

* `release` 方法中的 `input` 和 `transferWithExtra` 方法中的 `extra` 都是两笔交易中提现资产的信息和提现手续费的信息，
  在 [Bridge APi](/zh/bridge/api) 中，我们介绍了 POST `/extra` 这个 API, 其中的 `destination` 跟 `tag` 就是用来生成这一信息的。
  1. 需要在 `action` 的 `destination` 中填写目标链上的地址，当转到 EOS 之类的链时需要填写 `tag` 作为 `memo`，
     提现资产的 `extra` 为 `<trace_id>:A`，手续费资产的 `extra` 为 `<trace_id>:B`，且两处 `<trace_id>` 相同
  2. 通过 `POST /extra` 接口获得编码后的 `input`
 
  代码示例：
  ```javascript
  import { BridgeApi } from '@mixin.dev/mixin-node-sdk';
  
  const action = {
    "destination": "0x12266b2Bbd....0CF83c3997Bc8dbAD0be0",
    "tag": "EOS memo",
    "extra": "400f4072-2936-461b-a667-d9938d4a7973:A", // 或 400f4072-2936-461b-a667-d9938d4a7973:B
  };
  const client = BridgeApi();
  const input = await client.generateExtra(action);
  ```

::: warning 注意
* 提现到 ETH（TRON） 网络时，以 usdt 为例, 钱包里需要同时有 usdt 跟 ETH（TRON）, 其中 ETH（TRON） 是 feeAsset
:::

## 给 Mixin User 转帐

除了实现了链上提现的功能，Bridge 还实现了 MetaMask 给 Mixin User 和多签帐号免费转帐的功能。这个流程跟提现基本一致，只是 input 的参数不同。

生成 input 的参数
```
{
  "receivers": ["58099349-b159-4662-ad51-c18e809c9035", "58099349-b159-4662-ad51-c18e809c9035", ...],
  "threshold": 1,
  "extra: "blahblahblah"
}
```

* `receivers` 为转账的账户，给 Mixin User 转账时只填一个该用户的 `client_id` 即可

## withdrawal.sol 完整代码

<https://github.com/MixinNetwork/trusted-group/blob/master/mvm/quorum/bridge/contracts/Withdrawal.sol>