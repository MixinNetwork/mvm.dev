# 通过 MetaMask 对多链提现

在上一章中我们介绍了如何通过其它链，比如 BTC、ETH、SOL、DOT 等, 给 MetaMask 的地址充值, 在接下来，我们会讨论如何通过 MetaMask 进行多链提现。

::: warning 注意

这里的 MetaMask Address 可以是任意的 ETH 钱包，比如 imtoken 等等，原理跟流程都是相同的。

:::

## 如何多链提现

相对于多链充值，多链提现更加简单，只需要调用 Withdrawal 合约的 `submit` 方法, `submit` 方法如下:

```solidity
function submit(
    address receiver,
    address asset,
    uint256 amount,
    address feeAsset,
    uint256 feeAmount,
    bytes memory ma,
    bytes memory mb
) public payable {
    require(feeAsset != XIN, "invalid fee asset");
    if (asset == XIN) {
        require(msg.value / BASE == amount, "invalid withdrawal amount");
        transferXIN(receiver, ma);
    } else {
        transferERC20(receiver, asset, amount, ma);
    }
    transferERC20(receiver, feeAsset, feeAmount, mb);
}
```

我们需要准备的以下参数：

* receiver 是 metamask 绑定的 Mixin Network User 对应的 MVM 帐号地址，可通过 post `/users` API 返回值中的 `contract` 获取
* asset，amount 是提现的资产地址跟数量
* feeAsset，feeAmount 是提现手续费的资产地址跟数量
* ma 对应提现资产的信息
* mb 对应提现需要手续费的信息

上面用到的资产地址可以通过 [Mixin 跟 MVM 地址对应](/zh/resources/qa.html) 获取。
另外我们提供了 js SDK 来获取资产地址：<https://github.com/MixinNetwork/bot-api-nodejs-client/blob/main/src/mvm/registry.ts>

::: warning 注意
* 提现到 ETH（TRON） 网络时，以 usdt 为例, 钱包里需要同时有 usdt 跟 ETH（TRON）, 其中 ETH（TRON） 是 feeAsset
* LTC 提现时 asset 跟 feeAsset 的地址是相同的
  :::

## ma、mb 的生成

在 [Bridge APi](/zh/bridge/api) 中，我们介绍了 POST `/extra` 这个 API, 其中的 `destination` 跟 `tag` 就是用来生成 ma 和 mb 的。

需要的参数：

```json
{
  "destination": "0x12266b2Bbd....0CF83c3997Bc8dbAD0be0",
  "tag": "EOS memo",
  "extra": "blahblahblah"
}
```

* `destination` 为提现地址
* `tag` 为部分链所需要的 `memo`，如 EOS


## 给 Mixin User 转帐

除了实现了链上提现的功能，Bridge 还实现了 MetaMask 给 Mixin User 和多签帐号免费转帐的功能。
这个流程跟提现基本一致，只是不需要手续费, feeAmount 可以设置为 0。

生成 ma 时需要用到的参数

```
{
  "receivers": ["58099349-b159-4662-ad51-c18e809c9035", "58099349-b159-4662-ad51-c18e809c9035", ...],
  "threshold": 1,
  "extra: "blahblahblah"
}
```

* `receivers` 为转账的账户，给单个 Mixin User 转账时只填该用户的 `client_id` 即可

## withdrawal.sol 完整代码

<https://github.com/MixinNetwork/trusted-group/blob/master/mvm/quorum/bridge/contracts/Withdrawal.sol>