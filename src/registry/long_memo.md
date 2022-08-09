# Memo Error

In previous chapter, we talked about the way to execute contract by Registry, the core of which is the generation of extra.
However, when multiple contracts are called or a contract function has many parameters, 
you may face `memo has too many characters, maximum is 200` error.

To solve this error, you need to write the keccak256 hash of `extra` as key and `extra` as value
to the public state variable `values` in Storage Contract.
You can use gas-free MVM Api to write to Storage Contract with access times limitation, or finish this job on your own.

Storage Contract is detailed in [this chapter](/reference/storage)。

## Handle Error

Example：call five contract functions in turn，the length of `extra` would be 330.
We show how to shorten the extra using [official js sdk](https://github.com/MixinNetwork/bot-api-nodejs-client) here。

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


### Handle on your own

1. Call `write` function to save `extra` in public variable `values` of [Storage](https://github.com/MixinNetwork/trusted-group/blob/master/mvm/quorum/contracts/storage.sol).
   It costs gas to write to a contract, make sure you have enough balance in you wallet.

   [official js sdk](https://github.com/MixinNetwork/bot-api-nodejs-client) example：

   ```javascript
   import { StorageContract, MVMMainnet } from '@mixin.dev/mixin-node-sdk';
   import { keccak256 } from 'ethers/lib/utils';
   
   const storage = new StorageContract({
     address: MVMMainnet.Storage.Contract,
     uri: MVMMainnet.RPCUri,
     privateKey: '' // the private key of the wallet to pay gas
   });

   const write = async () => {
     // If the public variable `values` in Storage contract already has the key and the value of it is the same as extra,
     // it would not write again.
     const key = keccak256(extra);
     const { error } = await storage.writeValue(extra, key);
     if (error) throw new Error(error);
   }
   write()
   ```

2. After `extra` being written，a new `extra` is still needed to pay the transaction.
   It consists of：
   * PID od Registry Contract
   * Address of Storage Contract
   * Keccak256 hash of `extra`

   ```javascript
   import { MVMMainnet, getExtraWithStorageKey, MixinApi, encodeMemo } from '@mixin.dev/mixin-node-sdk';
   import { v4 as uuid } from 'uuid';
   import keystore from './keystore.json';
   
   // Generate new extra
   finalExtra = getExtraWithStorageKey(key, MVMMainnet.Registry.PID, MVMMainnet.Storage.Contract);
   // bd67087276ce3263b9333aa337e212a4ef241988D19892fE4efF4935256087F4fdc5ecAa3179976b4babd610973b16996df33c1ecd13a3ddff436d4734d3c3862a2c3fe9
   // * bd67087276ce3263b9333aa337e212a4 为 Registry PID bd670872-76ce-3263-b933-3aa337e212a4 去掉 -
   // * ef241988D19892fE4efF4935256087F4fdc5ecAa 为 Storage 合约地址 0xef241988D19892fE4efF4935256087F4fdc5ecAa 去掉 0x
   // * 3179976b4babd610973b16996df33c1ecd13a3ddff436d4734d3c3862a2c3fe9 为 keccak256 hash 去掉 0x
   
   keystore.user_id = keystore.client_id;
   const client = MixinApi({ keystore })
   
   // Build payment request
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
     // Get payment link and pay in mixin messenger
     const res = await client.payment.request(transactionInput);
     console.log(`mixin://codes/${res.code_id}`);
     // Or pay using the balance of the acount of keystore
     await client.transfer.toAddress(keystore.pin, transactionInput);
   }
   pay()
   ```
   
### Handle with MVMApi

MVMApi can help you with gas-freely writing your extra to Storage contract,
and there's a limitation that you can access 32 times in 24h each ip.
It doesn't count if the length of `extra` is smaller than 200.

[official js sdk](https://github.com/MixinNetwork/bot-api-nodejs-client) example：

```javascript
import { MVMApi, MVMApiURI, encodeMemo, MVMMainnet } from '@mixin.dev/mixin-node-sdk';
import { v4 as uuid } from 'uuid';

// Build payment request
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
  const res = await client.payments(transactionInput);
  console.log(`mixin://codes/${res.code_id}`);
}
pay();
```

You can use `post /values` API of MVMApi only to write value to Storage Contract, it shares the limitation with `post /payment` of MVMApi

[official js sdk](https://github.com/MixinNetwork/bot-api-nodejs-client) example：

```javascript
import { MixinApi, MVMApi, MVMApiURI, MVMMainnet, getExtraWithStorageKey, encodeMemo } from '@mixin.dev/mixin-node-sdk';
import { v4 as uuid } from 'uuid';
import { keccak256 } from 'ethers/lib/utils';
import keystore from './keystore.json';

keystore.user_id = keystore.client_id;
const mixinClient = MixinApi({ keystore });
const mvmClient = MVMApi(MVMApiURI);

const main = async () => {
  const key = keccak256(extra);
  // free access 32 times in 24h each ip
  const { error } = await mvmClient.writeValue(key, extra, MVMMainnet.Storage.Contract);
  if (error) throw new Error();

  // generate new extra
  const storageExtra = getExtraWithStorageKey(key);\
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

  // choose a way to pay
  // 1: post /payments 
  const res1 = await mixinClient.payment.request(transactionInput);
  console.log(`mixin://codes/${res1.code_id}`);

  // 2: post /payments of MVMApi
  const res2 = await mvmClient.payments(transactionInput);
  console.log(`mixin://codes/${res2.code_id}`);

  // 3: post /transactions
  const res3 = await mixinClient.transfer.toAddress(
    keystore.pin,
    transactionInput
  );
  console.log(res3);
};

main();
```