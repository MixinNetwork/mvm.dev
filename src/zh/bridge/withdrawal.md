# 通过 MetaMask 对多链提现

在上一章中我们完成了通过其它链，比如 BTC, ETH, SOL, DOT 等等, 给 MetaMask 的地址充值, 在接下来，我们会讨论如何通过 MetaMask 进行多链提现。

::: warning

这里的 MetaMask Address 可以是任意的 ETH 钱包，比如 imtoken 等等，原理跟流程都是相同的。

:::

## 如何多链提现

多链提现，相对于充值会更加简单一些, 只需要调用相关的合约方法, 示例如下:

```
...
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
...
```

我们需要准备的以下参数:

* receiver 是 metamask 绑定的 Mixin Network User 对应的 MVM 帐号地址
* asset, amount 是提现的资产地址跟数量
* feeAsset, feeAmount 是提现的资产地址跟数量
* ma 对应提现资产的信息
* mb 对应提现需要手续费的信息

上面的地址对应可以通过 [Mixin 跟 MVM 地址对应](/zh/resources/qa.html), 里获取。

另外我们提供了 js SDK 来获取相关对应：<https://github.com/MixinNetwork/bot-api-nodejs-client/blob/main/src/mvm/registry.ts>

## ma 的生成

在上一篇中我们提到了 `POST "/extra"` 这个 API, 其中的 `description` 跟 `tag` 就是给这里的提现使用的。

生成 ma 里，需要的参数：

```javascript
{
  "destination": "0x12266b2Bbd....0CF83c3997Bc8dbAD0be0",
  "tag": "EOS memo",
  "extra: "extra ..."
}
```

::: warning

注意：  
* 像 eth, tron 提现的时候，以 usdt 为例, 钱包里需要同时有 usdt 跟 ETH, TRON, 其中 ETH, TRON 是 feeAsset。 
* 像 LTC 这种 asset 跟 feeAsset 的地址是相同的

:::

## 给 Mixin User 转帐

除了实现了链上提现的功能，Bridge 同时实现 MetaMask 给 Mixin User 跟 多签帐号免费转帐的功能，这个流程跟提现基本一致，只是不需要手续费, feeAmount 可以设置为 0。

生成 ma 时需要用到的参数

```
{
  "receivers": ["58099349-b159-4662-ad51-c18e809c9035", "58099349-b159-4662-ad51-c18e809c9035", ...],
  "threshold": 1,
  "extra: "extra ..."
}
```

## withdrawal.sol 完整代码

<https://github.com/MixinNetwork/trusted-group/blob/master/mvm/quorum/bridge/contracts/Withdrawal.sol>