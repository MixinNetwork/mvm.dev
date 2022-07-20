# API 服务

为了更方便开发者使用, 在开发过程中, 可以使用 bridge-api 提供的 API 服务.

| Domain                     | Type   |
|:---------------------------| :----- |
| <https://bridge.mvm.dev> | Global |

主要有以下 API：

### 1. GET `/`

这个 API 会返回 Registry、Storage、Bridge 和 withdrawal 合约的部署地址，Registry 合约对应的 pid，
Bridge 服务的源码等。访问 [https://bridge.mvm.dev/](https://bridge.mvm.dev/) 即可以看到相关信息。


### 2. POST `/users`

这个 API 会返回钱包（如 MetaMask）地址所绑定的 Mixin Network User 的信息；
如果这个钱包地址还没有绑定的 Mixin Network User，会创建 Mixin Network User 和对应的 MVM User Contract 与其绑定并返回。

请求参数：

```json
{
  "public_key": "0xE2aD78Fdf6C29338f5E2434380740ac889457256",
  "signature": "0xee8b45ee93f56f6bbbb0949b48bf1695083e1d9916b381b29e460541e607f34519759c93ddb6de6fd1b04c4d3c6f598d3e2e977185cf467c087918e108ce49691c"
}
```

* `public_key` 是一个 eth 的帐号地址，可以在任意的钱包直接使用的，例如 metamask, imtoken 等等。

* `signature` 是钱包对字符串 `MVM:Bridge:Proxy:8MfEmL3g8s-PoDpZ4OcDCUDQPDiH4u1_OmxB0Aaknzg:<public_key>` keccak256 hash 的签名

返回值:

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

返回值是一个 Mixin Network User 信息。在充值时，可通过 GET `https://api.mixin.one/assets/:asset_Id` 可以获取具体资产的充值地址，

API 文档: <https://developers.mixin.one/docs/api/assets/asset>

### 3. POST `/extra`

这个 API 用于生成提现或转账时的 extra。

请求参数:

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

* `action` 的 `destination` 跟 `tag` 是给多链提现使用，`extra` 可以不填。

* `receivers` 跟 `threshold` 是给 Mixin User 转帐使用，提现资产的 `extra` 为 `<trace_id>:A`，
支付手续费的资产的 `extra` 为 `<trace_id>:B`，且两处 `<trace_id>` 应相同。

返回值:

```
{"extra": "bd67087276ce3263b9333aa337e212a4ef241988d19892fe4eff4935256087f4fdc5ecaa49418e68591cc61481576f3b4f5ef7b52959ce50ab14e7c4f7c416eaeb670a42e6185dd2af0df71763bad5b1909db4f9aeb7a87eed8a06640fb94d35563a0d23feb1c682e3618b34c6889e0bf55786de958dcce4f53da1bbf89cc76f3e970d46085a57053a2b621c393dfd06bcd45ed143d4250d61be6e79cd50a41ed38d40c21b7ccf4623fc14e1ef62bcf12f76d7b4"}
```

返回值为 `process || storage || public_key || encrypted_action` 格式的 extra：
* `bd67087276ce3263b9333aa337e212a4` 为 `Registry` 的 `PID`
* `ef241988d19892fe4eff4935256087f4fdc5ecaa` 为 `Storage` 合约的地址
* 之后的部分为 `action` 的 keccak256 hash 和 `action`

公钥和加密后的 `action` 必须写入到 Storage 合约内，代码示例：

```javascript
import { BridgeApi, StorageContract } from '@mixin.dev/mixin-node-sdk';
import { keccak256 } from 'ethers/libs/utils';

const client = BridgeApi();

// 请求参数
const action = {
  "receivers": ["58099349-b159-4662-ad51-c18e809c9035"],
  "threshold": 1,
  "extra": "blahblahblah"
};
const res = await client.generateExtra(action);

// 获得 key value
const key = res.slice(74, 138);
const value = res.slice(138);
// 写入 Storage 合约
const storage = StorageContract({ privateKey: '' }); // 钱包的私钥
await storage.writeValue(value, key);

// 写入 Storage 合约后，生成对应格式的 extra：process || storage || key
const extra = '0x' + res.slice(0, 138);
```