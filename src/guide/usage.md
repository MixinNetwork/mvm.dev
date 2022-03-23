# Messenger 用户如何调用合约

在上一步我们完整的部署了一个 uniswap 的合约，以及如何通过 registry 来调用这个 uniswap 的合约，添加流动性，在这一篇中我们将更详细解释一下，这个流程中，开发者需要做什么，MVM 做了什么工作。

首先需要理解，在用户通过 MVM 调用合约的过程，就是向 MTG 转帐，通过特定的 memo 来完成。

## 生成用户支付的链接

接口 POST /payments , 以上一步的 BTC 为例：

```
{
  "asset_id":     "c6d0c728-2624-429b-8e0d-d9d19b6592fa",
  "amount":       "0.00002",
  "opponent_multisig":  {
    "receivers": [
      "a15e0b6d-76ed-4443-b83f-ade9eca2681a",
      "b9126674-b07d-49b6-bf4f-48d965b2242b",
      "15141fe4-1cfd-40f8-9819-71e453054639",
      "3e72ca0c-1bab-49ad-aa0a-4d8471d375e7"
    ],
    "threshold": 3
  },
  "trace_id":     "5a74b05c-55d3-4081-99d0-f98917079fdf",
  "memo":         "7c15d0d2faa1b63862880bed982bd3020e1f1a9a5668870000000000000000000000000099cfc3d0c229d03c5a712b158a29ff186b294ab300000000000000000000000000000000000000000000000000000000000007d0",
}
```

1. asset_id 就是资产的 id
2. amount 是转帐资产的数量
3. 'opponent_multisig.receivers' 是 MTG 里的可信任节点的 id
4. 'opponent_multisig.receivers' 是 3/4 签名里的 3
5. trace_id 是转帐的唯一 id, 每次都要重新生成
6. memo 调用合约的核心部分，我们单独解释一下

具体 API 文档： https://developers.mixin.one/zh-CN/docs/api/transfer/payment#post-payments

### memo 的编码格式

我们以 uniswap 的合约为例：

```
7c15d0d2faa1b63862880bed982bd3020e1f1a9a5668870000000000000000000000000099cfc3d0c229d03c5a712b158a29ff186b294ab300000000000000000000000000000000000000000000000000000000000007d0
```

`0x7c15d0D2faA1b63862880Bed982bd3020e1f1A9A` 去掉 0x 后全部小写, 是 UniswapMVMRouter 的地址。

`566887` 是 addLiquidity(address,uint256) abi 编码。

`0000000000000000000000000099cfc3d0c229d03c5a712b158a29ff186b294ab3` 是 mixin BTC 对应 registry 里的资产合约地址。
`00000000000000000000000000000000000000000000000000000000000007d0` 是转帐数量的 abi 编码，也就是 "0.00002" 的编码。

## 用户支付

生成的链接格式 https://mixin.one/codes/:id，用户可以通过扫码或者 messenger 中唤起支付。

## MVM 内部调用

1. 用户完成支付后，MVM 会收到 output，通过解析 output 的 memo, 拿到资产，金额，执行合约地址等相关信息，保存为 Event
2. MVM 把 Event 按格式编码之后，发送给 registry 合约
3. registry 反编码 Event, 然后按需要创建帐号及资产信息
4. 验证信息通过后，执行 uniswap 的 addLiquidity 方法
5. 调用完成后，通过 ` event MixinTransaction(bytes);`  返回给 MVM 相关信息
5. MVM 获取到结果后处理，由于添加流动性不需要有结果的返回，所以就到此结束，用户不会收到退款之类的信息
