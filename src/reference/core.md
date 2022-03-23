# MVM 的主要术语

## MTG

MTG 多重签名托管节点，是一个开源协议, 所有者可以选择一些可信任的节点来，实现并运行这个程序。

## Quorum

由 MMV 部署的，多个节点管理的 EVM 兼容的 POS 网络。

## PID

PID 是 process id 的缩写，MVM 把 Mixin 里的机器人 ID (或者机器人用户 ID) 跟 EVM 合约地址进行映射。主要以下几个方面

1.  在 MVM 发布合约时候，会将配置条件跟 PID 绑定。
2.  Mixin 用户调用合约时，会读取发布时的配置，跟用户的参数，编码后调用 EVM 合约。
3. EVM 合约会根据 raw 里的值判断，是否是来自这个 PID。
4. 如何获取，任意的机器人（或者机器人用户）没有在 MVM 使用过，都可以，可以从 7000103716 获取一个机器人用户。示例：机器人用户的  id: 27d0c319-a4e3-38b4-93ff-cb45da8adbe1, PID 0x27d0c319a4e338b493ffcb45da8adbe1，把 user id, 去掉 `-` 前面加 `0x`

## Registry

Registry 是 MVM 的代理合约，来帮助 EVM 合约开发者迁移合约。
