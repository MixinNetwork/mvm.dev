MVM 开源代码地址：https://github.com/MixinNetwork/trusted-group/tree/master/mvm

主要的目录的实现功能:

1. ./quorum MVM 主要通过这个目录与 evm 兼容网络交互
2. ./eos 跟 1 类似, 与 eos 交互
3. ./machine, 处理 Mixin 通过多签发送的数据，处理 MVM 返回的数据，并返回给 Mixin
4. ./store，持久化用户, 资产信息，相关的调用事件
