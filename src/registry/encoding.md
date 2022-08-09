# MVM Encoding

Previously we talked about how to deploy a contract, before continuing to call contract，
some specifications should be known to transmit data. Hereby we introduce the data encoding part. 

There are three parts in total:

1. Generate `extra` according to the contract (or multiple contracts) to be executed
2. Encode multi-signature `memo` from `Operation`
3. MVM encodes `memo`, user and asset information to `Event`

Developers only need to focus on part 1 and part 2 to generate `memo`，and we will give a brief introduction about part3.

## Generate Extra

`Extra` is the most important value when you want to call a contract function，
it starts with the hexadecimal number of contracts to be called，and followed by each contract encode.

Each contract encode consists of contract address, the hexadecimal length of contract input and the contract input.

The contract input is formed by the first 8 ABI encoding of function signature
and the ABI encoding of function input（[code example](https://github.com/MixinNetwork/mvm-contracts/blob/main/contracts/mixin/User.sol#L52)）：

Here, take the previously deployed Counter Contract for example, its address is `0x2E8f70631208A2EcFC6FA47Baf3Fde649963baC7`.

If we want call the contract twice：

1. counter + 2;
2. read the current value of counter;

then the contract will be called twice so that `extra` should start with `0002`.

1. First step need to call `function addAny(uint256 num)`, 
   the first 8 characters of the ABI encode of its signature `addAny(uint256)` is `77ad0aab`

   the ABI encode of uint256 2 is `0000000000000000000000000000000000000000000000000000000000000002`，

   so the hexadecimal length of contract input is `0024`，

   the contract encode is `2e8f70631208a2ecfc6fa47baf3fde649963bac7002477ad0aab0000000000000000000000000000000000000000000000000000000000000002`

   example code：

   ```javascript
   // use ethers.js
   let contractExtra = '0x2E8f70631208A2EcFC6FA47Baf3Fde649963baC7'.slice(2);
   contractExtra += utils.id('addAny(uint256)').slice(2, 10)
   const abiCoder = new ethers.utils.AbiCoder();
   contractExtra += abiCoder.encode(['uint256'], [2]).slice(2);
   ```

2. Second step need to call `function count()`, the first 8 characters of the ABI encode of its signature `count()` is `06661abd`,
   it has no parameters, so the hexadecimal length of contract input is `0004`，

   the contract encode is `2e8f70631208a2ecfc6fa47baf3fde649963bac7000406661abd`

   example code：

   ```javascript
   // use ethers.js
   let contractExtra = '0x2E8f70631208A2EcFC6FA47Baf3Fde649963baC7'.slice(2);
   contractExtra += utils.id('count()').slice(2, 10)
   ```

The final `extra` is `00022e8f70631208a2ecfc6fa47baf3fde649963bac7002477ad0aab00000000000000000000000000000000000000000000000000000000000000022e8f70631208a2ecfc6fa47baf3fde649963bac7000406661abd`

ABI encode details：<https://docs.soliditylang.org/en/v0.8.12/abi-spec.html>

## Generate Memo

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

1. Purpose represents the usage of transfer: `11` for publishing contract，`1` for calling contract, developers only use `1` here。
2. Process: most circumstances the is PID of Registry。
3. Platform: `quorum`
4. Address: only needed when publishing contract
5. Extra: 

   a. optional: `META` when publishing contract

   b. required：information about contract executing, introduced above

## Parse Memo

When MVM receives an output, `memo` will be parsed into `Operation`

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

open source code：<https://github.com/MixinNetwork/trusted-group/blob/c11cd4f516874f4d3a5d6ee4b429427188d82eb7/mvm/encoding/operation.go#L30>

## Encode Format from MTG to MVM

Event will be encoded as in turn of process || nonce || asset || amount || extra || timestamp || members || threshold || sig

code examples:

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

open source code：<https://github.com/MixinNetwork/trusted-group/blob/07473dac20a7ae1a9cfecb3e9be6c5400612e147/mvm/encoding/event.go#L58>

## Encode format from MVM to MTG

MVM parse result in turn of process || nonce || asset || amount || extra || timestamp || members || threshold

code examples:

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

open source code：<https://github.com/MixinNetwork/trusted-group/blob/07473dac20a7ae1a9cfecb3e9be6c5400612e147/mvm/encoding/event.go#L33>

## 总结

MVM accomplish the most work for encoding，developers only need to focus on the generation of `memo`. 
We will introduce how to call contract function in next chapter.
