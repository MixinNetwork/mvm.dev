# MVM 的主要术语

## MTG

MTG 多重签名托管节点，是一个开源协议, 所有者可以选择一些可信任的节点来，实现并运行这个程序。

## Quorum 网络

由 MVM 部署的，多个节点管理的 EVM 兼容的 POS 网络。[加入测试网络](/testnet/join.html)

## PID

PID 是 process id 的缩写，MVM 把 Mixin 里的机器人 ID (或者机器人用户 ID) 跟 EVM 合约地址进行映射。主要以下几个方面

1. 在 MVM 发布合约时候，会将配置条件跟 PID 绑定。
2. Mixin 用户调用合约时，会读取发布时的配置，跟用户的参数，编码后调用 EVM 合约。
3. EVM 合约会根据 raw 里的值判断，是否是来自这个 PID。
4. 如何获取，任意的机器人（或者机器人用户）没有在 MVM 使用过，都可以，可以从 7000103716 获取一个机器人用户。

    示例：

    ```text
    机器人用户的 ID: 27d0c319-a4e3-38b4-93ff-cb45da8adbe1
    // 把 user id, 去掉 `-` 前面加 `0x`
    PID: 0x27d0c319a4e338b493ffcb45da8adbe1
    ```

## Registry

Registry 是 MVM 的代理合约，来帮助 EVM 合约开发者迁移合约。

## function mixin(bytes memory raw)

mixin 函数是 MVM 里智能合约的唯一入口, 所有的合约都需要实现这个函数, Registry 也实现了这个函数，如果是通过 Registry 来调用其它合约, 那么其它合约不需要再实现这个函数。

## event MixinTransaction(bytes)

MVM 里智能合约的，唯一返回数据出口, 同样我们在 Registry 里实现了这个函数，其它智能合约如果通过 Registry 调用也不需要实现这个函数。

> 注意: `event MixinTransaction(bytes)` 只能在注册 publish 的那一个合约里用，其他合约用不了，也就是如果是用 Registry，就不能在自己的合约里写这个。
