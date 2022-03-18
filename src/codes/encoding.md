# MVM 数据编码规范

接着上一篇，开发者或者用户想要使用智能合约，中间传输的数据需要一些规范, 这里介绍数据编码部分。 

### MTG 到 MVM 的编码格式

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

### MVM 到 MTG 的编码格式

在第四步中，MVM 将收到的结果按 process || nonce || asset || amount || extra || timestamp || members || threshold 顺序解码

代码示例

```
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
