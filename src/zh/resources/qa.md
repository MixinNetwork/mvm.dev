# MVM 问题汇总

## 如何获取到 Mixin User 跟 MVM 帐户的对应?

在 registry.sol 里有两个公开的 map

```solidity
mapping(address => bytes) public users;
mapping(uint => address) public contracts;
```

registry 的合约代码：<https://github.com/MixinNetwork/trusted-group/tree/master/mvm/quorum/contracts>

## 如何获取到 Mixin Asset 跟 MVM 资产的对应关系?

同样在 registry.sol 里有两个公开的 map

```solidity
mapping(address => uint128) public assets;
mapping(uint => address) public contracts;
```

## 用户调用合约后，没有正在执行，资产会在哪里?

用户调用合约后，MVM 会把资产转给相关的合约，只有合约有使用权。比如一笔 usdt, 转给一个合约，只能通过合约来退款。如果这个合约没有退款功能，那么这笔钱相当于进了黑洞地址。

## 基于 MVM 的合约是否只有一个入口?

是, 所有的智能合约都需要通过 Registry 来调用，或者实现  `function mixin(bytes memory raw) public returns (bool)` 函数。

我们推荐用 Registry 调用, 这个会由官方维护

## 基于 MVM 的合约是否只有一个出口?

是, Registry 已经实现了结果的返回, 其实所有的合约都需要实现 `event MixinTransaction(bytes)` 来返回结果。

我们推荐用 Registry 调用, 这样合约也不用实现这结果返回这部分

> 注意: `event MixinTransaction(bytes)` 只能在注册 publish 的那一个合约里用，其他合约用不了，也就是如果是用 Registry，就不能在自己的合约里写这个。
