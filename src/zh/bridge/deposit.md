# 使用 bridge 进行跨链充值

在上一章中我们介绍了 bridge.sol 里的实现，然后又基于 MVM 实现了跨链充值, 这里我们会为开发者介绍一下，如何用 MVM Bridge 实现跨链充值。

在这篇文章里，我们会以 MetaMask 为例，其它的 ETH 钱包同理，没有区别。

## Bridge 的 API 接口列表

Bridge RPC host: https://bridge.mvm.dev

* GET "/" 
* POST "/users"
* POST "/extra"

## 开发流程, 只需要以下几步

* 获取 MetaMask 的地址 (Public Key)
* POST "/users" 创建 MetaMask 对应的 Mixin Network User
* 获取不同链的充值地址
* 正常流程充值

接下来我们会介绍每个 API 完成的功能

## GET "/"

这个 API 会返回，bridge, registry, pid, storage, withdrawal 的相关合约地址, 访问 [https://bridge.mvm.dev/](https://bridge.mvm.dev/) 可以看到相关信息。

## POST "/users"

请求参数：

```json
{"public_key": "0x12266b2Bbd....0CF83c3997Bc8dbAD0be0"}
```

返回值:

```
{
  "user_id":    "ee234f3c-56c2-42d0-9816-29104cd8d3a8",
  "session_id": "ee234f3c-56c2-42d0-9816-29104cd8d3a8",
  "full_name":  "address",
  "created_at": "2022-07-06T03:30:19.128244Z",
  "key": map[string]interface{}{
    "client_id":   "ee234f3c-56c2-42d0-9816-29104cd8d3a8",
    "session_id":  "ee234f3c-56c2-42d0-9816-29104cd8d3a8",
    "private_key": "12345..abcde",
  },
  "contract": "0x12266b2Bbd....0CF83c3997Bc8dbAD0be0",
}
```

其中请求参数中的 public_key 是一个 eth 的帐号地址，可以在任意的钱包直接使用的，例如 metamask, imtoken 等等。

返回值是一个 Mixin Network User, 通过 `https://api.mixin.one/assets/6eece248-09db-3417-8f70-767896cf5217` 可以拿到具体资产的充值地址, 
详细的 API 文档: <https://developers.mixin.one/docs/api/assets/asset>

## 充值

在上一步中，拿到具体的 BTC, ETH, SOL, DOT 等等的地址之后，只需要对相关的资产进行链上充值, 之后 MetaMask 中就会有相关的 erc20 资产。

整个流程中重要的是通过 API 请求拿到 MetaMask address 对应, 不同链的充值地址。

接下来，我们会介绍如何通过 Metamask 地址完成对其它链的提现。

## POST "/extra"

请求参数:

```JSON
{
  "destination": "0x12266b2Bbd....0CF83c3997Bc8dbAD0be0",
  "tag": "EOS memo",
  "receivers": ["58099349-b159-4662-ad51-c18e809c9035", "58099349-b159-4662-ad51-c18e809c9035", ...],
  "threshold": 1,
  "extra: "extra ..."
}
```

返回值: 

```
{"extra": "12345"}
```

其中 `destination` 跟 `tag` 是给多链提现使用，`receivers` 跟 `threshold` 是给 Mixin User 转帐使用。

这个 API 主要是给提现用的，在下一章，从 Metamask 提现到多链中我们会详细介绍。

## Bridge 的开源地址：

<https://github.com/MixinNetwork/trusted-group/tree/master/mvm/quorum/bridge>
