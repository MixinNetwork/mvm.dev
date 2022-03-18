# MVM 问题汇总

## 如何获取到 Mixin User 跟 MVM 帐户的对应

registry.sol 里有 `mapping(address => bytes) public users;` 跟 `mapping(uint => address) public contracts;` 这两个 public map, 可以获取 user 跟 mvm 帐户对应关系。

## 如何获取到 Mixin Asset 跟 MVM 资产的对应关系

registry.sol 里有 `mapping(address => bytes) public assets;` 跟 `mapping(uint => address) public contracts;` 这两个 public map, 可以获取 address 跟 mvm 对应关系。
