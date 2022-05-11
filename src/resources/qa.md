# FAQ of MVM 

## How to get the correspondence between Mixin user and MVM account?

There are two public maps in registry.sol 

```solidity
mapping(address => bytes) public users;
mapping(uint => address) public contracts;
```

## How to get the correspondence between Mixin asset and MVM asset? 

Similarly in registry.sol there are two public maps

```solidity
mapping(address => uint128) public assets;
mapping(uint => address) public contracts;
```

##  Where is the asset in the case of the user calls the contract, but it is not being executed? 

After the user invokes the contract, MVM will transfer the asset to the relevant contract, and only the contract has the right to use it. For example, some amount of usdt is transferred to a contract, then the refund can only be done through the contract. If this contract does not have a refund function, then the asset is equivalent to entering a black hole address.  

## Do MVM-based contracts have only one entry? 

Yes. All smart contracts need to be called through the Registry, or implement the `function mixin(bytes memory raw) public returns (bool)` function.

Calling with Registry is recommended, since this is maintained by the official.

## Do MVM based contracts have only one exit?

Yes. The Registry has implemented the return of the result. In fact, all the contracts need to implement `event MixinTransaction(bytes)` to return the result.

The Registry call is recommended to be used, so that the contract does not need to implement this part of the result return.

Note: `event MixinTransaction(bytes)` can only be used in the contract registered with publish, other contracts cannot use it, that is to say, if you use Registry, you cannot write this in your contract.   
