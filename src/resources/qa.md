# MVM 问题汇总

## 如何获取到 Mixin User 跟 MVM 帐户的对应

在 registry.sol 里有两个公开的 map

```
mapping(address => bytes) public users;
mapping(uint => address) public contracts;
```

## 如何获取到 Mixin Asset 跟 MVM 资产的对应关系

同样在 registry.sol 里有两个公开的 map

```
mapping(address => uint128) public assets;
mapping(uint => address) public contracts;
```

## 用户调用合约后，没有正在执行，资产会在哪里

用户调用合约后，MVM 会把资产转给相关的合约，只有合约有使用权。比如一笔 usdt, 转给一个合约，只能通过合约来退款。
