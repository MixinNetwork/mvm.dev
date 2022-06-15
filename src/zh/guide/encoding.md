# MVM 数据编码规范

上一篇我们介绍了如何使用 MVM 的合约，开发者或者用户想要使用智能合约，中间传输的数据需要一些规范, 这里介绍数据编码部分。总共有两部分：

1. 开发者需要把 `Operation` 编码成多签的 memo
2. MVM 在调用合约时，会把 memo 及用户，资产信息，编码成 Event

开发者只需要关注第 1 部分的编码, 在 Operation 里放入合适的值，第 2 部分我们做介绍，方便开发者了解

## 多签里 memo 的生成

```golang
type Operation struct {
 Purpose  int
 Process  string
 Platform string
 Address  string
 Extra    []byte
}

func (o *Operation) Encode() []byte {
 enc := common.NewEncoder()
 enc.WriteInt(o.Purpose)
 writeUUID(enc, o.Process)
 writeBytes(enc, []byte(o.Platform))
 writeBytes(enc, []byte(o.Address))
 writeBytes(enc, o.Extra)
 return enc.Bytes()
}
```

1. Purpose: 这笔转帐的用处, `11` 发布合约，`1` 执行合约, 大部分情况下，开发者只需要关注 `1` 就行。
2. Process: PID 大部分情况下是 registry 的 PID。
3. Platform: `quorum` 或 `eos`, 目前只支持 `quorum`。
4. Address: 只有 发布合约的时候需要用到，大部分开发者不需要。
5. Extra: 执行合约最重要的值

   a. 可选项: 只有发布合约可用 `META` 参数，执行合约是否需要资产信息

   b. 必选项：执行合约内容, 例如:

   ```comment
    extra: 7c15d0d2faa1b63862880bed982bd3020e1f1a9a5668870000000000000000000000000099cfc3d0c229d03c5a712b158a29ff186b294ab300000000000000000000000000000000000000000000000000000000000007d0
  
    extra 分成三部分:
    a. 0x7c15d0D2faA1b63862880Bed982bd3020e1f1A9A 去掉 0x 后全部小写, 是需要执行合约的地址
    b. 56688700 开始则是 addLiquidity(address,uint256) 方法加参数类型的 ABI 编码, 
    c. 之后的则是参数值的 ABI 编码
       0000000000000000000000000099cfc3d0c229d03c5a712b158a29ff186b294ab3 是 mixin BTC 对应 registry 里的资产合约地址。
       00000000000000000000000000000000000000000000000000000000000007d0 是转帐金额的 ABI 编码，也就是 "0.00002" 的编码。

    编码格式参照：https://docs.soliditylang.org/en/v0.8.12/abi-spec.html
   ```

## Memo 反编成 Operation

MVM 收到一个 output, 会解析 memo 成 Operation

```golang
func DecodeOperation(b []byte) (*Operation, error) {
 dec := common.NewDecoder(b)
 purpose, err := dec.ReadInt()
 if err != nil {
  return nil, err
 }
 process, err := readUUID(dec)
 if err != nil {
  return nil, err
 }
 platform, err := dec.ReadBytes()
 if err != nil {
  return nil, err
 }
 address, err := dec.ReadBytes()
 if err != nil {
  return nil, err
 }
 extra, err := dec.ReadBytes()
 if err != nil {
  return nil, err
 }
 return &Operation{
  Purpose:  purpose,
  Process:  process,
  Platform: string(platform),
  Address:  string(address),
  Extra:    extra,
 }, nil
}
```

## MTG 到 MVM 的编码格式

在第三步中 Event 会按 process || nonce || asset || amount || extra || timestamp || members || threshold || sig 顺序进行编码

代码示例

```golang
func DecodeEvent(b []byte) (*Event, error) {
 dec := common.NewDecoder(b)
 process, err := readUUID(dec)
 if err != nil {
  return nil, err
 }
 nonce, err := dec.ReadUint64()
 if err != nil {
  return nil, err
 }
 asset, err := readUUID(dec)
 if err != nil {
  return nil, err
 }
 amount, err := dec.ReadInteger()
 if err != nil {
  return nil, err
 }
 extra, err := dec.ReadBytes()
 if err != nil {
  return nil, err
 }
 timestamp, err := dec.ReadUint64()
 if err != nil {
  return nil, err
 }

 ml, err := dec.ReadInt()
 if err != nil {
  return nil, err
 }
 members := make([]string, ml)
 for i := 0; i < ml; i++ {
  m, err := readUUID(dec)
  if err != nil {
   return nil, err
  }
  members[i] = m
 }
 threshold, err := dec.ReadInt()
 if err != nil {
  return nil, err
 }
 sig, err := dec.ReadBytes()
 if err != nil {
  return nil, err
 }

 return &Event{
  Process:   process,
  Asset:     asset,
  Members:   members,
  Threshold: threshold,
  Amount:    amount,
  Extra:     extra,
  Timestamp: timestamp,
  Nonce:     nonce,
  Signature: sig,
 }, nil
}
```

## MVM 到 MTG 的编码格式

在第四步中，MVM 将收到的结果按 process || nonce || asset || amount || extra || timestamp || members || threshold 顺序解码

代码示例

```golang
func (e *Event) Encode() []byte {
 enc := common.NewEncoder()
 writeUUID(enc, e.Process)
 enc.WriteUint64(e.Nonce)
 writeUUID(enc, e.Asset)
 enc.WriteInteger(e.Amount)
 writeBytes(enc, e.Extra)
 enc.WriteUint64(e.Timestamp)

 if len(e.Members) > 64 {
  panic(len(e.Members))
 }
 enc.WriteInt(len(e.Members))
 for _, m := range e.Members {
  writeUUID(enc, m)
 }
 if e.Threshold > len(e.Members) {
  panic(e.Threshold)
 }
 enc.WriteInt(e.Threshold)
 writeBytes(enc, e.Signature)

 return enc.Bytes()
}
```

## 总结

在编码中 MVM 完成了，大部分的工作，开发者只需要关注, 执行合约部署 memo 的生成，也就是 Operation 的生成即可。
