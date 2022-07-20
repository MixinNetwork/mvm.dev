# MVM 的主要术语

## MTG

[MTG](https://github.com/MixinNetwork/trusted-group) 多重签名托管节点，是一个开源协议，所有者可以选择一些可信任的节点来实现并运行这个程序。

## Quorum 网络

由 MVM 部署的，多个节点管理的 EVM 兼容的 POS 网络。详见 [加入网络](/zh/quorum/join.html)

## PID

PID 是 process id 的缩写，MVM 将 Mixin 中机器人的 client_id (或者机器人用户的 client_id) 与 EVM 合约地址进行映射。主要有以下几个方面需要注意：

1. 在 MVM 发布合约时，会将配置条件跟 PID 绑定。
2. Mixin 用户调用合约时，会读取发布时的配置和用户的参数，对其编码后调用 EVM 合约。
3. EVM 合约会根据 raw 里的值判断，是否是来自这个 PID，[参考代码](https://github.com/MixinNetwork/trusted-group/blob/master/mvm/quorum/registry/contracts/Registry.sol#L169)。
4. 可以在 [Mixin Messenger](https://mixin.one/messenger) 上添加 7000103716 机器人，回复 `claim` 获取一个机器人用户。

示例：
```text
机器人用户的 client_id: 27d0c319-a4e3-38b4-93ff-cb45da8adbe1
去掉 `-`，前面加 `0x`
则 PID: 0x27d0c319a4e338b493ffcb45da8adbe1
```

## Registry

[Registry](https://github.com/MixinNetwork/trusted-group/blob/master/mvm/quorum/registry/contracts/Registry.sol) 
合约是 MVM 的代理合约，用来帮助 EVM 合约开发者迁移合约。我们将在下一章详细介绍 Registry 合约。

## Bridge 
[Bridge](https://github.com/MixinNetwork/trusted-group/blob/master/mvm/quorum/bridge/contracts/Bridge.sol) 
合约是 MVM 的跨链桥，用户可以通过该合约进行多链充值和多链转账。

## Storage
[Storage](https://github.com/MixinNetwork/trusted-group/blob/master/mvm/quorum/registry/contracts/Storage.sol) 
合约可以读写键值对，解决合约调用过程中会遇到的一些问题。

