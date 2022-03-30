# MVM 实现原理

Mixin 用户想要使用智能合约比较复杂，MVM 实现了大量的工作让这部分工作，让开发者开发或者用户使用变得简单。

## MVM 流程

开发流程可以参照，使用指南，开发者部分, 这里主要是针对用户使用过程。

1. 用户把调用的合约方法，参数放到多签转帐的 memo 里, 发送给 MTG, 具体代码可以参照 ./invoke.go 文件
2. MVM 收到多签转帐后, 解析 memo, 及相关的其它信息，生成 Event
3. MVM 把 Event 编码之后，发送到 registry 的 mixin 函数
4. mixin 收到后 raw ，会解析，然后调用相关的合约, 并返回执行结果 event
5. MVM 拿到执行结果之后, 解析成新的 event, 并重新编码之后，返回给 MTG
6. MTG 拿到执行结果，然后转帐给用户

MVM 里 Event 的结构

```golang
type Event struct {
 Process   string
 Asset     string
 Members   []string // need to do user mask per process
 Threshold int
 Amount    common.Integer
 Extra     []byte
 Timestamp uint64
 Nonce     uint64
 Signature []byte
}
```

开源代码地址：<https://github.com/MixinNetwork/trusted-group/tree/master/mvm>
