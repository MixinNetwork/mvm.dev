# The Usage of Registry Contract

## Steps

1. Deploy the smart contract and note down the contract address, details in [Deploy Contract](/registry/deploy)

2. Generate `extra` according to contract address and parameters, details in [Encoding](/registry/encoding)

3. Generate `memo`，which is the base64 code of `Operation`

   `Operation`:
   ```golang
   op := &encoding.Operation{
    Purpose: encoding.OperationPurposeGroupEvent, // fixed value: 1
    Process: c.String("process"), // PID of Registry Contract: bd67087276ce3263b9333aa337e212a4 for mainnet
    Extra: extra, // information about contract calling
   }
   ```
   
4. Build Generate payment request, for example：
   ```json
   {
     // asset_id of XIN
     "asset_id": "965e5c6e-434c-3fa9-b780-c50f43cd955c",
     "amount": "0.00000001",
     // random uuid
     "trace_id": "8c120f19-752a-402a-a47d-ca626f71938d", 
     "memo": "AAG9Zwhyds4yY7kzOqM34hKkAAAAAAAcAAGq0XNgkKEmaHwxjLZ7Npox68_BmgAEBmYavQ",
     "opponent_multisig": {
       "threshold": 5,
       "receivers": [
         "d5a3a450-5619-47af-a3b1-aad08e6e10dd",
         "9d4a18aa-9b0a-40ed-ba57-ce8fbbbc6deb",
         "2f82a56a-7fae-4bdd-bc4d-aad5005c5041",
         "f7f33be1-399a-4d29-b50c-44e5f01cbb1b",
         "23a070df-6b87-4b66-bdd4-f009702770c9",
         "2385639c-eac1-4a38-a7f6-597b3f0f5b59",
         "ab357ad7-8828-4173-b3bb-0600c518eab2"
       ]
     }
   }
   ```
   
5. Two ways to pay the transaction：

   1：Get `code_id` by POST /payments，and pay in Mixin Messenger through `https://mixin.one/codes/:code_id`

   2：POST /transactions, signature needed。

6. MVM will parse memo into Event after receives the transaction output，[code](https://github.com/MixinNetwork/trusted-group/blob/cf3fae2ecacf95e3db7e21c10b7729ab9c11474b/mvm/eos/utils.go#L46)
7. MVM will encode the Event and send to Registry
8. Registry executes `function mixin` and call the corresponding contracts
9. Information will be returned to MVM through `event MixinTransaction(bytes)` after contracts calling
10. MVM will transfer asset to related user if needed after receiving outputs

Developers can call contract function after finishing the first 5 steps, and the rest steps will be handled by MVM

## Official js sdk example

We will show how to call Counter Contract functions using [official js sdk](https://github.com/MixinNetwork/bot-api-nodejs-client)

```javascript
import { 
  MVMMainnet, 
  getExtra, 
  encodeMemo,
  MixinApi, 
  MVMApi, 
  MVMApiURI
} from '@mixin.dev/mixin-node-sdk'; 
import { v4 as uuid } from 'uuid'; 
import keystore from './keystore.json';
 
// information about contract call
const contract1 = {
  address: '0x2E8f70631208A2EcFC6FA47Baf3Fde649963baC7', // Counter address
  method: 'addAny',   // called function
  types: ['uint256'], // function parameters' type array
  values: [2],        // function parameters array
};
const contract2 = {
  address: '0x2E8f70631208A2EcFC6FA47Baf3Fde649963baC7', // Counter address
  method: 'count',    // called function
};
const contracts = [contract1, contract2];
   
// 1 generate extra
const extra = getExtra(contracts);
   
// 2 build request to pay the transaction
const transactionInput = {
  // CNB asset_id: '965e5c6e-434c-3fa9-b780-c50f43cd955c'
  asset_id: 'c94ac88f-4671-3976-b60a-09064f1811e8', // XIN asset_id
  amount: '0.00000001',
  trace_id: uuid(),
  memo: encodeMemo(extra, MVMMainnet.Registry.Contract),
  opponent_multisig: {
    receivers: MVMMainnet.MVMMembers,
    threshold: MVMMainnet.MVMThreshold,
  },
};

keystore.user_id = keystore.client_id
const mixinClient = MixinApi({ keystore })

const payment = async () => {
  // 3 choose a way to pay the transaction
  // 3.1: post /payments to get code_id by mixin api
  // keystore needed；cannot directly use when your extra length exceeds 200
  const res1 = await mixinClient.payment.request(transactionInput);
  // pay throught link
  console.log(`mixin://codes/${res1.code_id}`);

  // 3.2: post /payments to get code_id by mvm api
  // automatically handle memo when its length exceeds 200, each ip can access 32 times every 24h
  const mvmClient = MVMApi(MVMApiURI);
  const res2 = await mvmClient.payments(transactionInput);
  // pay throught link
  console.log(`mixin://codes/${res2.code_id}`);

  // 3.3: post /transactions
  // keystore needed and the corresponding bot must have balance to pay；
  // cannot directly use when your extra length exceeds 200
  const res3 = await mixinClient.transfer.toAddress(
    keystore.pin,
    transactionInput
  );
  console.log(res3);
}
```

::: tip Notice
There's length limitation for memo. When the length of memo exceed 200, an error will be returned.
We will demonstrate how to deal with the memo that has invalid length.
:::

You can learn the encoding of event from [here](/registry/encoding.html#Encode-Format-from-MTG-to-MVM)。

## Map MVM contract to Messenger user and asset

You can obtain the map between contract and Mixin User, Mixin Asset by these three public state variable:

```solidity
mapping(address => bytes) public users;
mapping(address => uint128) public assets;
mapping(uint => address) public contracts;
```

## Summary

Registry Contract stores the map between Mixin user and [MVM](/quorum/join) user account, 
the map between mixin asset and [MVM](/quorum/join) asset contract,
and is capable of calling other contract functions and emitting the results. 
So EVM smart contract can directly migrate without any modification.

However, since the length restriction for memo, `extra` need to be shortened when the length of exceeds 200.
We will demonstrate how to solve this problem with Storage Contract.
