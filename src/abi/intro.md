# Specification of Smart Contract ABI 

When calling a contract, except the first part of extra is the contract address, the rest are the function name encoded with abi and the encoded value of the parameters, for example:

```golang
k256 := keccak256.New()
hex.EncodeToString(k256.Hash([]byte("addLiquidity(address,uint256)")))

// output
// 56688700f24ac725de0fbe55e9e709b05662b7a4afd6936b5ef13491342a2c18
// Only use the first 8 digits in extra

// amount: 0.00002, round up to 8 digits
b := make([]byte, 8)
binary.BigEndian.PutUint64(b, uint64(2000))
hex.EncodeToString(b)

// output
// 00000000000007d0
```

More detailed specifications:

https://docs.soliditylang.org/en/latest/abi-spec.html
