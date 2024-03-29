# API Service

For the convenience of developers, we provide bridge-api service to make deposit and withdrawal simple.

| Domain                     | Type   |
|:---------------------------| :----- |
| <https://bridge.mvm.dev> | Global |

### 1. GET `/`

This API returns the deployed address of Registry, Storage, Bridge and withdrawal Contract, the pid of Registry,
the address of Bridge source code。


### 2. POST `/users`

This API returns the information of Mixin Network User bound to current wallet address.

Request：

```json
{
  "public_key": "0xE2aD78Fdf6C29338f5E2434380740ac889457256"
}
```

* `public_key` is the address of a wallet like metamask, imtoken

[//]: # ("signature": "0xee8b45ee93f56f6bbbb0949b48bf1695083e1d9916b381b29e460541e607f34519759c93ddb6de6fd1b04c4d3c6f598d3e2e977185cf467c087918e108ce49691c")
[//]: # (* `signature` 是钱包对字符串 `MVM:Bridge:Proxy:8MfEmL3g8s-PoDpZ4OcDCUDQPDiH4u1_OmxB0Aaknzg:<public_key>` keccak256 hash 的签名)

Response:

```json
{
  "user_id":    "ee234f3c-56c2-42d0-9816-29104cd8d3a8",
  "session_id": "ee234f3c-56c2-42d0-9816-29104cd8d3a8",
  "full_name":  "address",
  "created_at": "2022-07-06T03:30:19.128244Z",
  "key": {
    "client_id":   "ee234f3c-56c2-42d0-9816-29104cd8d3a8",
    "session_id":  "ee234f3c-56c2-42d0-9816-29104cd8d3a8",
    "private_key": "12345..abcde"
  },
  "contract": "0x12266b2Bbd....0CF83c3997Bc8dbAD0be0"
}
```

* Response is the information of a Mixin Network User.
  You can request `GET /assets/:id` api to fetch the deposit address of a specific asset.
* The default value of `full_name` is the address of wallet
* `contract` is the MVM User Contract Address bound with the Mixin User, 
  also the most important parameter and the key to interact with Mixin: 
  1. If there's no Mixin Network User bound to the wallet，a new Mixin Network User will be created and returned,
     a MVM User Contract will be bound to it at the same time
     (the mapping between Mixin Network User and MVM User Contract can be obtained in Registry, see [Q&A](/resources/qa)).
  2. If there's no transaction records of Mixin Network User, `contract` may be empty
  3. `contract` is used in cross-chain withdrawal and transferring asset to a Mixin Network User, 
     details in [Cross-Chain Withdrawal](/zh/bridge/withdrawal)


API Document: <https://developers.mixin.one/docs/api/assets/asset>

### 3. POST `/extra`

This API is used to generate `extra` when cross-chain withdrawing or transferring asset to a Mixin Account.

Request:

```JSON
{
  "action": {
    "destination": "0x12266b2Bbd....0CF83c3997Bc8dbAD0be0",
    "tag": "EOS memo",
    "receivers": [
      "58099349-b159-4662-ad51-c18e809c9035"
    ],
    "threshold": 1,
    "extra": "extra"
  }
}
```

* `destination` and `tag` is for cross-chain withdrawal, `tag` could be empty

* `receivers` and `threshold` is for transferring assets to a Mixin Account

* `extra` of withdrawal asset should be `<trace_id>:A`, `extra` of fee asset should be `<trace_id>:B`
and the both `<trace_id>` should be same

Response:

```
{"extra": "bd67087276ce3263b9333aa337e212a4ef241988d19892fe4eff4935256087f4fdc5ecaa49418e68591cc61481576f3b4f5ef7b52959ce50ab14e7c4f7c416eaeb670a42e6185dd2af0df71763bad5b1909db4f9aeb7a87eed8a06640fb94d35563a0d23feb1c682e3618b34c6889e0bf55786de958dcce4f53da1bbf89cc76f3e970d46085a57053a2b621c393dfd06bcd45ed143d4250d61be6e79cd50a41ed38d40c21b7ccf4623fc14e1ef62bcf12f76d7b4"}
```

Response is `extra` in the format of `process || storage || public_key || encrypted_action`：
* `bd67087276ce3263b9333aa337e212a4` is the PID of Registry Contract
* `ef241988d19892fe4eff4935256087f4fdc5ecaa` is the address of Storage Contract
* The final part is the keccak256 hash of `action` and `action` itself

Example：

```javascript
import { BridgeApi, MVMMainnet } from '@mixin.dev/mixin-node-sdk';

const action = {
  "receivers": ["58099349-b159-4662-ad51-c18e809c9035"],
  "threshold": 1,
  "extra": "blahblahblah"
};

// use bridge api
const client = BridgeApi();
const extra = await client.generateExtra(action);

// generate locally
const value = Buffer.from(JSON.stringify(action)).toString('hex');
const hash = ethers.utils.keccak256(`0x${value}`).slice(2);
return `0x${MVMMainnet.Registry.PID.replaceAll('-', '')}${MVMMainnet.Storage.Contract.toLowerCase().slice(2)}${hash}${value}`;
```
