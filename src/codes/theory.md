# MVM Implementation Principle

It is complicated for Mixin users to use smart contracts. MVM has implemented a lot of work to make this more easily for developers and users to use. 

### MVM Procedure

You can refer to the developer part in the user guide for the development process. Here is mainly use process for the users. 

1. The user puts the method of calling the contract and parameters into the memo of the multi-signature transfer, and sends it to MTG. For the specific code, please refer to the file: ./invoke.go 
2. MVM will parse the memo, and other related information after it receives the multi-signature transfer, and then generate Event
3. MVM encodes the Event, and then send it to the registry's mixin function
4. After Mixin receives raw, it will be parsed, and then the related contract will be called, and the execution result event will be returned 
5. After MVM gets the execution result, a new event will be parsed and re-encoded, and then returns it to MTG  
6. MTG gets the execution result and transfers the asset to the user accordingly   

The structure of Event in MVM, 

```
type Event struct {
	Process   string
	Asset     string
	Members   []string // need to do user mask per process
	Threshold int
	Amount    common.Integer
	Extra     []byte
	Timestamp uint64
	Nonce     uint64
	Signature []byte
}
```

Open source code address：https://github.com/MixinNetwork/trusted-group/tree/master/mvm
