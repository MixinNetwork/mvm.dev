# 使用 bridge 进行跨链充值

在上一章中我们简介了 bridge.sol 里实现的功能，然后又基于 MVM 实现了跨链充值, 这里我们会为开发者介绍一下，如何用 MVM Bridge 实现跨链充值。

## Bridge 的 API 接口列表

Bridge RPC host: https://bridge.mvm.dev

* GET "/" 
* POST "/users"
* POST "/extra"

## GET "/"

这个 API 会返回，bridge, registry, pid, storage, withdrawal 的相关合约地址。

## POST "/users"

请求参数：

```solidty
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

返回值是一个 Mixin Network User, 通过 `https://api.mixin.one/assets/6eece248-09db-3417-8f70-767896cf5217` 可以拿到具体资产的充值地址, 详细的 API 文档: https://developers.mixin.one/docs/api/assets/asset

## 充值

在上一步中，拿到具体的 BTC, ETH, SOL, DOT 等等的地址之后，只需要对相关的资产进行链上充值, 之后 MetaMask 中就会有相关的 erc20 资产。


## Bridge 的开源地址：

https://github.com/MixinNetwork/trusted-group/tree/master/mvm/quorum/bridge
