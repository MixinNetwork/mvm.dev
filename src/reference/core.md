# Terminology

## MTG

[MTG](https://github.com/MixinNetwork/trusted-group)
is an open source protocol with multi-signature escrow nodes.
The owners can choose some trusted nodes to implement and run this program. 

## Quorum Network

An EVM compatible POS network managed by multiple nodes, deployed with MVM. 
You can connect to Quorum [follow instructions](/quorum/join.html)

## PID

PID is the abbreviation of process id.
The bot ID (or bot user ID) in Mixin is mapped with the EVM contract address in MVM. 
It mainly contains the following aspects: 

1. When MVM publishes the contract, the configuration conditions will be bound with the PID. 
2. When a Mixin user calls a contract, it will read the configuration at the time of publishing and the user's parameters, and call the EVM contract after encoding.  
3. The EVM contract will check whether it is from the specific PID according to the value in raw. 
4. A bot user can be obtained from 7000103716 in [Mixin Messenger](https://mixin.one/messenger).

Example:
```text
bot user client_id: 27d0c319-a4e3-38b4-93ff-cb45da8adbe1
start `0x` and remove `-`
PID: 0x27d0c319a4e338b493ffcb45da8adbe1
```

## Registry

[Registry](https://github.com/MixinNetwork/trusted-group/blob/master/mvm/quorum/registry/contracts/Registry.sol)
is a proxy contract for MVM to help EVM contract developers migrate contracts. 

## Bridge
[Bridge](https://github.com/MixinNetwork/trusted-group/blob/master/mvm/quorum/bridge/contracts/Bridge.sol)
Contract is a Cross-Chain bridge, you can deposit and withdraw assets through it.

## Storage
[Storage](https://github.com/MixinNetwork/trusted-group/blob/master/mvm/quorum/registry/contracts/Storage.sol)
Contract is designed to write and read key-value pair.
  
MVM is based on MTG and MTG places a restriction on the length of memo in transactions, 
so you can generate a new memo with its keccak256 hash and save the original one to Storage Contract when then length of it exceeds 200.

Besides, Storage Contract is used to protect the privacy of memo when withdrawing and transferring assets.  
