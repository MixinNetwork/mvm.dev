# 智能合约 ABI 规范

在调用合约的时候, extra 除了第一部分是一个合约地址外，其它的都是用 abi 编码的函数名加参数的编码值, 例如

```golang
k256 := keccak256.New()
hex.EncodeToString(k256.Hash([]byte("addLiquidity(address,uint256)")))

// output
// 56688700f24ac725de0fbe55e9e709b05662b7a4afd6936b5ef13491342a2c18
// 在 extra 里只用取前 8 位

// amount: 0.00002, 精确到 8 位
b := make([]byte, 8)
binary.BigEndian.PutUint64(b, uint64(2000))
hex.EncodeToString(b)

// output
// 00000000000007d0
```

更多详细规范:

https://docs.soliditylang.org/en/latest/abi-spec.html
