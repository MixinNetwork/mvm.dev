# registry.sol 解析

registry 是 MVM 代理, 其它合约都可以通过给它的 `function mixin(bytes memory raw) public returns (bool) {` 发送一定格式的数据来执行相关的合约。

开源代码地址: https://github.com/MixinNetwork/trusted-group/tree/master/mvm/quorum/contracts

主要包含:

1. 执行入口，`function mixin(bytes memory raw) public returns (bool) {`
2. MixinUser, 将 mixin 里的用户跟 evm 里的帐户进行关联
3. MixinAsset, mixin 里的资产跟 evm 里的资产进行关联

如果需要获取对应关系可以从，这以下三个公开的 map 里获取:

```
mapping(address => bytes) public users;
mapping(address => uint128) public assets;
mapping(uint => address) public contracts;
```
