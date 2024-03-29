# Memo 过长错误

上一节我们介绍了如何通过 Registry 合约来调用合约，其核心是根据要调用的合约来生成 extra。
但当要调用的合约较多或输入的参数较多时，你可能会遇到 `memo has too many characters, maximum is 200` 错误。

此时，开发者需要将 `extra` 的 keccak256 hash 值和 `extra` 作为键值对写入 Storage 合约。
开发者可以选择通过免费的 MVM Api 写入 Storage 合约，也可以自行将键值对写入，[Storage 合约实现参考](/zh/storage/intro)。

## 处理 extra 过长问题

例：依次进行 5 个合约调用，`extra` 的长度为 330，超过 200。这里使用 [官方 js sdk](https://github.com/MixinNetwork/bot-api-nodejs-client) 演示如何处理该问题。

```javascript
import { getExtra } from '@mixin.dev/mixin-node-sdk';

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
console.log(extra);
// 0x00052e8f70631208a2ecfc6fa47baf3fde649963bac7000406661abd2e8f70631208a2ecfc6fa47baf3fde649963bac700046057d3ee2e8f70631208a2ecfc6fa47baf3fde649963bac7000406661abd2e8f70631208a2ecfc6fa47baf3fde649963bac7002477ad0aab00000000000000000000000000000000000000000000000000000000000000022e8f70631208a2ecfc6fa47baf3fde649963bac7000406661abd
```


### 自行处理

1. 调用 `write` 函数将 `extra` 保存在 [storage 合约](https://github.com/MixinNetwork/trusted-group/blob/master/mvm/quorum/contracts/storage.sol) 中。
   注意：此方法将会消耗一部分的 gas，请确保使用的钱包有一定余额。

   [官方 js sdk](https://github.com/MixinNetwork/bot-api-nodejs-client) 代码示例：

   ```javascript
   import { StorageContract, MVMMainnet } from '@mixin.dev/mixin-node-sdk';
   import { keccak256 } from 'ethers/lib/utils';
   
   const storage = new StorageContract({
     address: MVMMainnet.Storage.Contract,
     uri: MVMMainnet.RPCUri,
     privateKey: '' // 钱包对应的私钥
   });

   const write = async () => {
     // 保存至 Storage 合约
     // 如果 Storage 中已存在 key 且 value 与 extra 相等，将不会消耗 gas 再写入一次
     const key = keccak256(extra);
     const { error } = await storage.writeValue(extra, key);
     if (error) throw new Error(error);
   }
   write()
   ```

2. `extra` 写入 Storage 合约后，需要根据规则构造一个新的 `extra`，由以下三部分组成：
   * Registry 合约对应的 PID（去掉 `-`）
   * Storage 合约的地址（去掉 `0x`）
   * keccak256 hash（去掉 `0x`）

   ```javascript
   import { MVMMainnet, getExtraWithStorageKey, MixinApi, encodeMemo } from '@mixin.dev/mixin-node-sdk';
   import { v4 as uuid } from 'uuid';
   import keystore from './keystore.json';
   
   // 获得新的 extra
   finalExtra = getExtraWithStorageKey(key, MVMMainnet.Registry.PID, MVMMainnet.Storage.Contract);
   // bd67087276ce3263b9333aa337e212a4ef241988D19892fE4efF4935256087F4fdc5ecAa3179976b4babd610973b16996df33c1ecd13a3ddff436d4734d3c3862a2c3fe9
   // * bd67087276ce3263b9333aa337e212a4 为 Registry PID bd670872-76ce-3263-b933-3aa337e212a4 去掉 -
   // * ef241988D19892fE4efF4935256087F4fdc5ecAa 为 Storage 合约地址 0xef241988D19892fE4efF4935256087F4fdc5ecAa 去掉 0x
   // * 3179976b4babd610973b16996df33c1ecd13a3ddff436d4734d3c3862a2c3fe9 为 keccak256 hash 去掉 0x
   
   keystore.user_id = keystore.client_id;
   const client = MixinApi({ keystore })
   
   // 构造支付请求参数
   const transactionInput = {
     asset_id: 'c94ac88f-4671-3976-b60a-09064f1811e8', // XIN
     amount: '0.00000001',
     trace_id: uuid(),
     memo: encodeMemo(finalExtra, MVMMainnet.Registry.Contract),
     opponent_multisig: {
       receivers: MVMMainnet.MVMMembers,
       threshold: MVMMainnet.MVMThreshold,
     },
   };
   
   const pay = async () => {
     // 生成支付链接支付
     const res = await client.payment.request(transactionInput);
     console.log(`mixin://codes/${res.code_id}`);
     // 或用 keystore 对应账户的余额支付
     await client.transfer.toAddress(keystore.pin, transactionInput);
   }
   pay()
   ```
   
### 使用 MVMApi 处理

MVMApi 可以免费帮助写入 Storage 合约，不过每个请求 IP 有 24 小时内 32 次的限制，若 `extra` 不超过 200 则不作限制。

[官方 js sdk](https://github.com/MixinNetwork/bot-api-nodejs-client) 代码示例：

```javascript
import { MVMApi, MVMApiURI, encodeMemo, MVMMainnet } from '@mixin.dev/mixin-node-sdk';
import { v4 as uuid } from 'uuid';

// 构造支付请求参数
const transactionInput = {
  asset_id: 'c94ac88f-4671-3976-b60a-09064f1811e8', // XIN
  amount: '0.00000001',
  trace_id: uuid(),
  memo: encodeMemo(extra, MVMMainnet.Registry.PID),
  opponent_multisig: {
    receivers: MVMMainnet.MVMMembers,
    threshold: MVMMainnet.MVMThreshold,
  },
};

const client = MVMApi(MVMApiURI);
const pay = async () => {
  // extra 长度超过 200 时，免费处理，每个 ip 24 小时内可响应 32 次
  // extra 长度不超过 200 时，不作限制
  const res = await client.payments(transactionInput);
  console.log(`mixin://codes/${res.code_id}`);
}
pay();
```

开发者也可以通过 MVMApi 的 `post /values` API，将过长的 extra 免费写入 Storage 合约。该接口同样有访问次数限制。

[官方 js sdk](https://github.com/MixinNetwork/bot-api-nodejs-client) 代码示例：

```javascript
import { MixinApi, MVMApi, MVMApiURI, MVMMainnet, getExtraWithStorageKey, encodeMemo } from '@mixin.dev/mixin-node-sdk';
import { v4 as uuid } from 'uuid';
import { keccak256 } from 'ethers/lib/utils';
import keystore from './keystore.json';

keystore.user_id = keystore.client_id;
const mixinClient = MixinApi({ keystore });
const mvmClient = MVMApi(MVMApiURI);

const main = async () => {
  // 上一步得到的过长 extra
  const key = keccak256(extra);
  // 每个 IP 24 小时内限制访问 32 次
  const { error } = await mvmClient.writeValue(key, extra, MVMMainnet.Storage.Contract);
  if (error) throw new Error();

  // 写入 Storage 合约后生成新的 extra
  const storageExtra = getExtraWithStorageKey(key);
  // 构造支付请求参数
  const transactionInput = {
    asset_id: 'c94ac88f-4671-3976-b60a-09064f1811e8', // XIN
    amount: '0.00000001',
    trace_id: uuid(),
    memo: encodeMemo(storageExtra, MVMMainnet.Registry.PID),
    opponent_multisig: {
      receivers: MVMMainnet.MVMMembers,
      threshold: MVMMainnet.MVMThreshold,
    },
  };

  // 选择一种方式支付
  // 1 通过 sdk post /payments
  const res1 = await mixinClient.payment.request(transactionInput);
  // 通过下面的支付链接支付
  console.log(`mixin://codes/${res1.code_id}`);

  // 2 通过 mvmapi post /payments
  // 新的 extra 长度在允许范围内，此时该 api 没有访问限制
  const res2 = await mvmClient.payments(transactionInput);
  // 通过下面的支付链接支付
  console.log(`mixin://codes/${res2.code_id}`);

  // 3 通过 sdk post /transactions
  // keystore 对应的账户中需要有余额支付
  const res3 = await mixinClient.transfer.toAddress(
    keystore.pin,
    transactionInput
  );
  console.log(res3);
};

main();
```