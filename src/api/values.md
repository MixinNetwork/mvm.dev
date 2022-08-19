### API

`POST /values`

### Introduction

When someone pays a transaction to call contract functions through Registry, 
`memo has too many characters, maximum is 200` error may occur.
To process it, the original `extra` and its `keccak256` hash should be written to Storage Contract ahead and
pay the transaction with a new `extra`.

You can write `extra` and its hash to the Storage Contract freely by this api with restriction that 32 times in 24h per ip.

### Parameters

| Parameter |  Type  | Required | Explain                  |
|:----------|:------:|:--------:|:-------------------------|
| key       | string |   true   | keccak256 hash of extra  |
| value     | string |   true   | extra                    |
| address   | string |  false   | Storage Contract Address |

### Response

```json
{
  "key": "0x85bf90f8d30b3b331ddc70622fd5036cf1816f58ee232cf6f013ad6bfc1a8bbf"
}
```

### Example

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
const { error } = await mvmClient.writeValue(key, extra, MVMMainnet.Storage.Contract);
if (error) throw new Error();   
```