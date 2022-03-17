# MVM 代码结构解析

开源代码地址：https://github.com/MixinNetwork/trusted-group/tree/master/mvm

主要的目录的实现功能:

1. ./encoding, 把 mixin 里的多签转帐数据, 编码成 MVM 可以处理的，把 mvm 的数据变成 mixin 对应的
2. ./machine, 处理 Mixin 通过多签发送的数据，处理 MVM 返回的数据，并返回给 Mixin
3. ./quorum MVM 主要通过这个目录与 evm 兼容网络交互
4. ./eos 跟 1 类似, 与 eos 交互
5. ./store，持久化用户, 资产信息，相关的调用事件
