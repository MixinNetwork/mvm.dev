# Storage 合约原理及使用

在 [Registry](/zh/Registry/call) 中，我们介绍了如何通过代理合约 [Registry](https://github.com/MixinNetwork/trusted-group/blob/master/mvm/quorum/contracts/registry.sol)，
来执行部署在 [MVM](/zh/quorum/join) 上的其他合约。

目前 MVM 支持通过 [Registry](https://github.com/MixinNetwork/trusted-group/blob/master/mvm/quorum/contracts/registry.sol) 调用多个合约，
只需根据要调用的合约函数签名等信息生成 `extra`，并将其编码后作为交易的 `memo` 付款即可。
但 [mtg](https://github.com/MixinNetwork/trusted-group) 中对 `extra` 的长度有限制，当 `extra` 的长度超过 200 时，
需计算 `extra` 的 `keccak256` 哈希值，并把哈希值和 `extra` 作为一组键值对写入 Storage 合约中。

## Storage 合约实现
Storage 合约实现了两个函数，[read](https://github.com/MixinNetwork/mvm-contracts/blob/main/contracts/mixin/Storage.sol#L7) 
和 [write](https://github.com/MixinNetwork/mvm-contracts/blob/main/contracts/mixin/Storage.sol#L11)，
可以将键值对写入公开的 mapping 或从中读取键所对应的值。

`write` 函数会将一组键值对存在 mapping 类型的 `state` 变量中，且键必须是值的 `keccak256 hash`；`read` 函数可以通过传入的键在该变量中取相应的值。

### 源码
```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;

contract Storage {
    mapping(uint256 => bytes) internal values;

    function read(uint256 _key) public view returns (bytes memory) {
        return values[_key];
    }

    function write(uint256 _key, bytes memory raw) public {
        uint256 key = uint256(keccak256(raw));
        require(key == _key, "invalid key or raw");
        values[_key] = raw;
    }
}
```

## 总结

本章介绍了 Storage 合约的原理，及如何利用 Storage 合约处理 extra 过长的问题。
