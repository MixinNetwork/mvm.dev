# MVM 数据编码规范

上一篇我们介绍了如何部署合约，在调用智能合约前，还需要了解中间传输的数据规范, 这里介绍数据编码部分。总共有 3 部分：

1. 开发者需要根据要调用的合约（可以是多个），生成 `extra`
2. 开发者把 `Operation` 编码成多签的 `memo`
3. MVM 在调用合约时，会把 `memo` 及用户，资产信息，编码成 `Event`

开发者只需要关注 1、2 部分的编码, 在 `Operation` 里放入合适的值，第 2 部分我们做介绍，方便开发者了解

## 根据调用合约生成 extra

`Extra` 是执行合约时最重要的值，它以要执行的合约数量的十六进制开头，之后是每个合约调用的编码。
上一节我们部署了 Counter 合约，合约地址为 `0x2E8f70631208A2EcFC6FA47Baf3Fde649963baC7`。

如果我们想多次调用该合约，如：1 给计数器加 2；2 读取计数器增加后的值，此时将会调用两次合约，即 `extra` 要以 `0002` 开头。

之后是每个合约调用的编码，由 合约地址 + （转化成 byte 后的）合约输入长度的十六进制 + 合约输入 构成，合约输入由 函数签名的 ABI 编码的前 8 位 + 函数输入的 ABI 编码 构成（[代码示例](https://github.com/MixinNetwork/mvm-contracts/blob/main/contracts/mixin/User.sol#L52)）：
1. 给计数器加 2 这一步需要执行合约中的 `function addAny(uint256 num)` 函数， 函数签名 `addAny(uint256)` 的 ABI 编码前 8 位为 `77ad0aab`

   函数输入 2 的 ABI 编码为 `0000000000000000000000000000000000000000000000000000000000000002`，
  
   则合约输入长度的十六进制为 `0024`，所以该合约调用的编码为 `2e8f70631208a2ecfc6fa47baf3fde649963bac7002477ad0aab0000000000000000000000000000000000000000000000000000000000000002`

   代码示例：

   ```javascript
   // 使用 ethers 例子
   let contractExtra = '0x2E8f70631208A2EcFC6FA47Baf3Fde649963baC7'.slice(2);
   contractExtra += utils.id('addAny(uint256)').slice(2, 10)
   const abiCoder = new ethers.utils.AbiCoder();
   contractExtra += abiCoder.encode(['uint256'], [2]).slice(2);
   ```

2. 读取计数器的值 这一步需要执行合约中的 `function count()` 函数，函数签名 `count()` 的 ABI 编码为 `06661abd`，该函数没有参数，所以长度的十六进制为 `0004`，

   所以该合约调用的编码为 `2e8f70631208a2ecfc6fa47baf3fde649963bac7000406661abd`

   ```javascript
    // 使用 ethers 例子
    let contractExtra = '0x2E8f70631208A2EcFC6FA47Baf3Fde649963baC7'.slice(2);
    contractExtra += utils.id('count()').slice(2, 10)
    ```

最终，`extra` 为 `00022e8f70631208a2ecfc6fa47baf3fde649963bac7002477ad0aab00000000000000000000000000000000000000000000000000000000000000022e8f70631208a2ecfc6fa47baf3fde649963bac7000406661abd`

ABI 编码格式参照：<https://docs.soliditylang.org/en/v0.8.12/abi-spec.html>

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

1. Purpose: 这笔转帐的用处，`11` 发布合约，`1` 执行合约, 大部分情况下，开发者只需要关注 `1` 就行。
2. Process: PID 大部分情况下是 registry 的 PID。
3. Platform: `quorum` 或 `eos`, 目前只支持 `quorum`。
4. Address: 只有 发布合约的时候需要用到，大部分开发者不需要。
5. Extra: 执行合约最重要的值

   a. 可选项: 只有发布合约可用 `META` 参数，执行合约是否需要资产信息

   b. 必选项：执行合约内容, 上面已经介绍过

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

开源地址：<https://github.com/MixinNetwork/trusted-group/blob/c11cd4f516874f4d3a5d6ee4b429427188d82eb7/mvm/encoding/operation.go#L30>

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

开源地址：<https://github.com/MixinNetwork/trusted-group/blob/07473dac20a7ae1a9cfecb3e9be6c5400612e147/mvm/encoding/event.go#L58>

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

开源地址：<https://github.com/MixinNetwork/trusted-group/blob/07473dac20a7ae1a9cfecb3e9be6c5400612e147/mvm/encoding/event.go#L33>

## 总结

在编码中 MVM 完成了大部分的工作，开发者只需要关注执行合约时 memo 的生成。下一节我们将介绍如何通过 Registry 调用已部署的合约。
