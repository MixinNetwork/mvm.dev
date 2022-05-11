### API

`POST /payment`

### 参数

| 参数            |   类型   | 必填  | 说明               |
| :-------------- | :------: | :---: | :----------------- |
| contractAddress |  string  | true  | 要调用的合约地址   |
| methodName      |  string  | true  | 要调用的合约方法名 |
| types           | string[] | false | 参数类型列表       |
| values          |  any[]   | false | 参数值列表         |
| payment         |  object  | false | 详情见下文         |
| options         |  object  | false | 详情见下文         |

payment 参数是跟构建支付相关的参数
| 参数 | 类型 | 必填 | 说明 |
| :----- | :----: | :---: | :-------------------------- |
| type | string | false | 默认为 `payment`, 可选 `tx` |
| trace | string | false | 转账的 trace_id, 默认随机 `uuid` |
| asset | string | false | 转账的币种, 默认 `cnb` 的 `asset_id` |
| amount | string | false | 转账的金额, 默认 `0.00000001` |

> `type`=`tx` 主要是为了方便服务端直接调用 `POST /transaction` 直接完成支付.

options 参数是跟构建合约相关的参数

| 参数         |  类型  | 必填  | 说明                  |
| :----------- | :----: | :---: | :-------------------- |
| delegatecall |  bool  | false |                       |
| uploadKey    | string | false | 测试版暂时不用填      |
| process      | string | false | registry 的 processID |
| address      | string | false | registry 的 address   |

> 1. `delegatecall` 主要是为了提供让用户调用 `mvm` 中未与 `mixin` 映射的资产.
> 2. `uploadKey`: 由于 `mixin` 转账的 `memo` 长度限制, 针对参数较多的合约调用, 将会由服务端先将参数写入到合约里, 然后再调用合约.
> 3. `process` 和 `address` 请配套使用. 基本现有的 `registry` 可以满足绝大部分需求.

### 返回值

1. 当指定 `payment='tx'` 时. 会返回 `txInput`

```json
{
  "asset_id": "965e5c6e-434c-3fa9-b780-c50f43cd955c",
  "amount": "0.00000001",
  "trace_id": "8ee8abc3-9a25-4b35-927b-08c79dd2aff5",
  "opponent_multisig": {
    "receivers": [
      "a15e0b6d-76ed-4443-b83f-ade9eca2681a",
      "b9126674-b07d-49b6-bf4f-48d965b2242b",
      "15141fe4-1cfd-40f8-9819-71e453054639",
      "3e72ca0c-1bab-49ad-aa0a-4d8471d375e7"
    ],
    "threshold": 3
  },
  "memo": "AAGGxYdl7IE8pKNbh181oK19AAAAAAA5AJbciA7QNc_dLzNIdDebtqEorKeIgbrBTwAAAAAAAAAAAAAAAJqe4TJWQW9BoqSZwNQXlmNAcmmo"
}
```

> 这个返回的内容, 可以直接用于 `POST /transaction` 的参数.

2. 其他情况会返回 `payment`

```json
{
  "type": "payment",
  "trace_id": "19f7e906-45b5-4638-891f-5595a0a09495",
  "asset_id": "965e5c6e-434c-3fa9-b780-c50f43cd955c",
  "amount": "0.00000001",
  "threshold": 3,
  "receivers": [
    "a15e0b6d-76ed-4443-b83f-ade9eca2681a",
    "b9126674-b07d-49b6-bf4f-48d965b2242b",
    "15141fe4-1cfd-40f8-9819-71e453054639",
    "3e72ca0c-1bab-49ad-aa0a-4d8471d375e7"
  ],
  "memo": "AAGGxYdl7IE8pKNbh181oK19AAAAAAA5AJbciA7QNc_dLzNIdDebtqEorKeIgbrBTwAAAAAAAAAAAAAAAJqe4TJWQW9BoqSZwNQXlmNAcmmo",
  "created_at": "2022-05-11T09:44:33.544707789Z",
  "status": "pending",
  "code_id": "bffb3218-87de-4e85-a7ad-d672194259ad"
}
```

> 开发者核心需要关注的是 `code_id`, 构建完 `mixin://codes/:code_id`, 让用户在 Messenger 内, 直接访问这个链接, 就可以调起支付从而完成合约调用.

### 示例

1. 无需资产的合约调用

计数器合约+1

```json
{
  "contractAddress": "0x4f31E2eAF25DCDD46651AcE019B61E3E750023E0",
  "methodName": "addOne"
}
```

跨链桥合约绑定地址方法调用

```json
{
  "contractAddress": "0x96dC880Ed035CFdd2F334874379bb6A128aca788",
  "methodName": "bind",
  "types": ["address"],
  "values": ["0x9A9EE13256416f41a2a499C0d4179663407269A8"]
}
```

2. 需要资产的合约调用

跨链桥合约转账方法调用

```json
{
  "contractAddress": "0x96dC880Ed035CFdd2F334874379bb6A128aca788",
  "methodName": "deposit",
  "types": ["address", "uint256"],
  "values": ["0x001fB10b1bFede8505AB138c2Bb2E239CB3b50dC", "100000000"],
  "payment": { "asset": "965e5c6e-434c-3fa9-b780-c50f43cd955c", "amount": "1" }
}
```

3. 复杂的合约调用

uniswap 的 swap 合约方法调用(values 可以为一个数组或者对象)

```json
{
  "contractAddress": "0xe4aeAc26BCd161aFAEea468AC22F45FE5a35737F",
  "methodName": "swapExactTokensForTokens",
  "types": ["uint256", "uint256", "address[]", "address", "uint256"],
  "values": [
    "100000000",
    "12400948731547",
    [
      "0x001fB10b1bFede8505AB138c2Bb2E239CB3b50dC",
      "0x71c1C2D82b39C0e952751c9BEA39c28c70c47Ff4"
    ],
    "0xa192D5856A9a7c07731bc13559Da7489C7829C74",
    1652262893
  ],
  "payment": { "asset": "965e5c6e-434c-3fa9-b780-c50f43cd955c", "amount": "1" }
}
```

4. 需要非 mixin 映射资产的调用.

> 如 uniswap 合约, 当添加流动性的时候, 会生成一个 uniswap 的流动性凭证, 该凭证也是一个 erc20 的资产, 但不是 mixin 内的资产, 此时, 这个资产会到 mixin 映射的用户合约地址内. 并不会直接发送到 mixin. 当要花费这类资产时, 就需要使用 `delegatecall` 方法来调用.
>
> [delegatecall 相关信息可以查看]()

uniswap 的移除流动性方法调用

```json
{
  "contractAddress": "0x774A9E576f14d81d7fB439efB1Eb14973a7144Fb",
  "methodName": "removeLiquidity",
  "types": [
    "address",
    "address",
    "address",
    "address",
    "uint256",
    "uint256",
    "uint256"
  ],
  "values": [
    "0x5EFDe32C3857fe54b152D3ffa7DCE31e28b83aC6",
    "0x001fB10b1bFede8505AB138c2Bb2E239CB3b50dC",
    "0x71c1C2D82b39C0e952751c9BEA39c28c70c47Ff4",
    "0xa192D5856A9a7c07731bc13559Da7489C7829C74",
    "44",
    0,
    0
  ],
  "options": { "uploadkey": "123", "delegatecall": true }
}
```
