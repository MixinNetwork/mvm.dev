# Terminology

## MTG

MTG is an open source protocol with multi-signature escrow nodes. The owners can choose some trusted nodes to implement and run this program. 

## Quorum

An EVM compatible POS network managed by multiple nodes, deployed with MVM. 

## PID

PID is the abbreviation of process id. The bot ID (or bot user ID) in Mixin is mapped with the EVM contract address in MVM. It mainly contains the following aspects: 

1. When MVM publishes the contract, the configuration conditions will be binded with the PID. 
2. When a Mixin user calls a contract, it will read the configuration at the time of publishing and the user's parameters, and call the EVM contract after encoding.  
3. The EVM contract will judge whether it is from the specific PID according to the value in raw. 
4. Ways to obtain: it can be obtained from any bot (or bot user) that has not been used in MVM, and a bot user can be obtained from 7000103716. For example: bot user id: 27d0c319-a4e3-38b4-93ff-cb45da8adbe1, by removing `-` and adding `0x` in front of the user id, you can get the PID: 0x27d0c319a4e338b493ffcb45da8adbe1

## Registry

Registry is a proxy contract for MVM to help EVM contract developers migrate contracts. 

## Function Mixin (bytes memory raw)

The mixin function is the only entry point for smart contracts in MVM, that all the contracts need to implement. Since the Registry has implemented this function, if other contracts are called through the Registry, then there will be no need to implement this function again.  

## Event MixinTransaction (bytes)

The only return data export of the smart contracts in MVM. We also implemented this function in the Registry. Thus, other smart contracts do not need to implement this function again if they are called through the Registry. 

Note: `event MixinTransaction(bytes)` can only be used in the contract registered with publish, while other contracts cannot use it, that is to say, if you use Registry, you cannot write this in your contract. 
