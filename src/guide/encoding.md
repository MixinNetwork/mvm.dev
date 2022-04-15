# MVM Data Encoding Specification

In the previous article, we introduced how to use MVM contracts. The data transmitted needs some specifications when developers or users want to use the smart contracts. Hereby we introduce the data encoding part. There are two parts in total: 

1. Developers need to encode `Operation` into a multi-signature memo 
2. When MVM calls the contract, it will encode the memo, user, and asset information into Event 

Developers only need to pay attention to the coding in the first part, and put the appropriate value in the Operation. We will introduce the second part to make it easier for developers to understand.

## Generation of memo in multi-signature environment 

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

1. Purpose: the use of this transaction, `11` is to publish the contract, `1` is to execute the contract, in most cases, developers only need to pay attention to `1`.
2. Process: the PID is mostly the PID of the registry.
3. Platform: `quorum` or `eos`; currently only `quorum` is supported.
4. Address: it is only needed when publishing contracts, which most developers don't need pay attention to.
5. Extra: the most important value for excuting the contract

   a. optional: the `META` parameter is only available for publishing contracts, whether asset information is required for executing contracts
   
   b. required: the content of contract execution, for example:

   ```comment
    extra: 7c15d0d2faa1b63862880bed982bd3020e1f1a9a5668870000000000000000000000000099cfc3d0c229d03c5a712b158a29ff186b294ab300000000000000000000000000000000000000000000000000000000000007d0
  
    extra is divided into two parts:
    a. 0x7c15d0D2faA1b63862880Bed982bd3020e1f1A9A removing 0x, then all the characters lowercase,you can get the address where the contract executed 
    b. starting from 566887, it is addLiquidity(address,uint256) method and the ABI value with detailed parameters, 
     In the above example, c6d0c728-2624-429b-8e0d-d9d19b6592fa is the asset ID of BTC in the Mixin network 
     We will introduce separately for the ABI code of amount 0.00002
     Coding format reference：https://docs.soliditylang.org/en/v0.8.12/abi-spec.html
   ```

## Memo decoding into Operation 

MVM receives an output and then will parse memo into Operation 

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

## Encoding Format of MTG to MVM 

In the third step, the Event will be encoded in the order of process || nonce || asset || amount || extra || timestamp || members || threshold || sig 

Codes example:

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

## Encoding Format of MVM to MTG 

In the fourth step, MVM will decode the received results in the order of process || nonce || asset || amount || extra || timestamp || members || threshold 

Codes example:

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

## Conclusion

MVM completes most of the work in coding. Developers only need to pay attention to the generation of memo when contract is excuted and deployed, that is to say, the generation of Operation.
