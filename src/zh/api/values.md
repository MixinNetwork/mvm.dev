### API

`POST https://api.mvm.dev/values`

### 介绍
当开发者通过 Registry 调用合约时，有可能遇到 `memo has too many characters, maximum is 200` 错误。
此时，开发者需要将原本的 `extra` 写入 Storage 合约，并生成一个新的 `extra` 来调用合约。

本 API 免费提供了将过长的 `extra` 写入 Storage 合约的服务，限制每个 ip 24 小时内请求 32 次。

### 参数

| 参数                |   类型   |  必填   | 说明                     |
|:------------------|:------:|:-----:|:-----------------------|
| key               | string | true  | extra 的 keccak256 hash |
| value             | string | true  | extra                  |
| address           | string | false | Storage 合约地址           |

### 返回值

```json
{
  "key": "0x85bf90f8d30b3b331ddc70622fd5036cf1816f58ee232cf6f013ad6bfc1a8bbf"
}
```

### 代码示例

```javascript
import { MVMApi, MVMApiURI, getExtra } from '@mixin.dev/mixin-node-sdk';

const contractReadCount = {
   address: '0x2E8f70631208A2EcFC6FA47Baf3Fde649963baC7', // contract address
   method: 'count', // contract function
};
const contractAddAnyCount = {
   address: '0x2E8f70631208A2EcFC6FA47Baf3Fde649963baC7', // contract address
   method: 'addAny', // contract function
   types: ['uint256'], // function parameters type array
   values: [2], // function parameters value array
};
const contractAddOneCount = {
   address: '0x2E8f70631208A2EcFC6FA47Baf3Fde649963baC7', // contract address
   method: 'addOne', // contract function
};
const contracts = [
   contractReadCount,
   contractAddOneCount,
   contractReadCount,
   contractAddAnyCount,
   contractReadCount,
];
const extra = getExtra(contracts);

const mvmClient = MVMApi(MVMApiURI);     
const key = keccak256(extra);
// 每个 IP 24 小时内限制访问 32 次        
const { error } = await mvmClient.writeValue(key, extra, MVMMainnet.Storage.Contract);
if (error) throw new Error();   
```