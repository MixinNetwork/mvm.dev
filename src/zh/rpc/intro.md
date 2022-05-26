# MVM RPC 列表

MVM 提供了一些 API 接口查询信息, 这些接口是提供给 MVM 节点的，合约开发不需要。

## getmtgkeys

MVM 是基于 MTG 的进行开发, 为了确保合约收到的内容都是真实有效的，发送到合约的内容需要经过 MTG 签名。
同样合约收到这些信息需要用公钥对信息进行验证，所以部署合约时，需要知道 MTG 的 public key。

这个接口就是用来返回 MTG 的公钥信息，用来验证合约内容的。

请求示例：

```
curl  -X POST -H "Content-Type: application/json" http://127.0.0.1:9000 \n
--data '{"method": "getmtgkeys","params":[],"id":"1"}'
```

## 源代码

https://github.com/MixinNetwork/trusted-group/tree/master/mvm/rpc
