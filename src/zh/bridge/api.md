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

这个 API 会返回钱包（如 MetaMask）地址所绑定的 Mixin Network User 的信息。

请求参数：

```json
{
  "public_key": "0xE2aD78Fdf6C29338f5E2434380740ac889457256",
}
```

* `public_key` 是一个 eth 的帐号地址，可以在任意的钱包直接使用的，例如 metamask, imtoken 等等。

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

* 返回值是一个 Mixin Network User 信息。在充值时，可用 `key` 签名请求 `GET /assets/:id` API 获取具体资产的充值地址
* `full_name` 的默认值为钱包地址
* `contract` 为该 Mixin Network User 所关联的 MVM User Contract，是返回中最重要的参数，是与 Mixin 交互的关键：

  1. 如果这个钱包地址还没有绑定的 Mixin Network User，会创建 Mixin Network User 和对应的 MVM User Contract 与其绑定并返回
 （Mixin Network User 和 MVM User Contract 映射详见 [Q&A](/zh/resources/qa)）。
  2. 当没有转账交易记录时，`contract` 的值可能为空
  3. `contract` 用于多链提现和向 Mixin Network User 转账，详见 [多链提现](/zh/bridge/withdrawal)

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

代码示例:

```javascript
import { BridgeApi, MVMMainnet } from '@mixin.dev/mixin-node-sdk';

const action = {
  "receivers": ["58099349-b159-4662-ad51-c18e809c9035"],
  "threshold": 1,
  "extra": "blahblahblah"
};

// 通过该 APi 生成
const client = BridgeApi();
const extra = await client.generateExtra(action);

// 本地生成
const value = Buffer.from(JSON.stringify(action)).toString('hex');
const hash = ethers.utils.keccak256(`0x${value}`).slice(2);
return `0x${MVMMainnet.Registry.PID.replaceAll('-', '')}${MVMMainnet.Storage.Contract.toLowerCase().slice(2)}${hash}${value}`;
```
