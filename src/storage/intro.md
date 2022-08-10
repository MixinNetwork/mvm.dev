# The Principle and Usage of Storage Contract

In [Registry Storage](/Registry/call)，we introduce the way to call other contracts deployed on [Quorum](/quorum/join)
through [Registry Contract](https://github.com/MixinNetwork/trusted-group/blob/master/mvm/quorum/contracts/registry.sol)，

So far, you can call multiple contract functions through
[Registry](https://github.com/MixinNetwork/trusted-group/blob/master/mvm/quorum/contracts/registry.sol)
on MVM by generate `extra` based on the information of the contract functions to be called and pay transactions with
`memo` based on it.

It is a remarkable fact that there's a length restriction of `extra` in [mtg](https://github.com/MixinNetwork/trusted-group).
Before pay the transaction with more than 200 characters in `extra`, you should first calculate the `keccak256` hash of
`extra` and write hash and `extra` itself to public state in Storage Contract, then pay the transaction with a new `extra`.

## Implementation
There are two functions implemented in Storage Contract:
[read](https://github.com/MixinNetwork/mvm-contracts/blob/main/contracts/mixin/Storage.sol#L7) and
[write](https://github.com/MixinNetwork/mvm-contracts/blob/main/contracts/mixin/Storage.sol#L11).
They are simply used to read and write key-value pair, in which the key must be the `keccak256` hash。

### Source Code

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

## Summary

We talk about the principle of Storage Contract in this chapter and its usage to handle extra with long length.
For more details, refer to [this chapter](/registry/long_memo/).