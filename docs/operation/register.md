# 注册用户

在使用 Mixin Safe Computer 前，必须先注册用户。本文将介绍如何通过 Javascript 注册用户。 


1. 请求格式

注册用户时，请求的格式为:

```1 | MIX_ADDRESS```

以 Javascript 为例：

```javascript
import { buildMixAddress } from "@mixin.dev/mixin-node-sdk";

const buildComputerExtra = (operation: number, extra: Buffer) => Buffer.concat([
  Buffer.from([operation]),
  extra,
]);

const user_id = "4b79fe76-0d9d-49e6-85fd-0f6be01147da";
const mix = buildMixAddress({
  version: 2,
  uuidMembers: [user_id],
  xinMembers: [],
  threshold: 1
}); // MIX3QEeHEkbmkthQcHMdhpksk3nATrPTsw

const OperationTypeAddUser = 1;
const extra = buildComputerExtra(OperationTypeAddUser. Buffer.from(mix));
console.log(extra.toString('hex')); // 014d49583351456548456b626d6b74685163484d6468706b736b336e41547250547377
```

2. 交易 Memo 格式

在向 Mixin Safe Computer 这样的 [MTG](https://github.com/MixinNetwork/trusted-group) 发送交易时，memo 必须按指定格式编码：

```javascript
import { parse } from "uuid";
import { base64RawURLEncode } from "@mixin.dev/mixin-node-sdk";

const requestComputerApi = async (method, url, body) => {
  const resp = await fetch('https://computer.mixin.dev' + url, { method, body });
  const data = await resp.text();
  return JSON.parse(data)
}

const encodeMtgExtra = (app_id: string, extra: Buffer) => {
  const computerAppId = "a7376114-5db3-4822-bd3c-26416b57da1b"    
  const data = Buffer.concat([
    parse(computerAppId),
    extra,
  ]);
  return base64RawURLEncode(data)
};

const computerInfo = await requestComputerApi('GET', '/' , undefined);
// {
//   members: {
//     app_id: 'a7376114-5db3-4822-bd3c-26416b57da1b',
//     members: [
//       '53480317-66e7-432d-b3af-28893cb531b3',
//       '67bdbae5-4bf8-4097-ad9c-b172fbd948e6',
//       'a1db8da1-d120-412a-bc6d-afa57552dc71',
//       'e077572e-93d6-45e1-b258-a18814153cd7'
//     ],
//     threshold: 3
//   },
//   params: {
//     operation: { asset: 'c94ac88f-4671-3976-b60a-09064f1811e8', price: '0.001' }
//   },
// }

const memo = encodeMtgExtra(computerInfo.members.app_id, extra);
console.log(memo); // pzdhFF2zSCK9PCZBa1faGwFNSVgzUUVlSEVrYm1rdGhRY0hNZGhwa3NrM25BVHJQVHN3
```

3. 发送请求

将上一步得到的 memo 发送给 Computer group，费用为 0.001 XIN.

```javascript
import { buildSafeTransaction, buildSafeTransactionRecipient } from "@mixin.dev/mixin-node-sdk";

const recipients = buildSafeTransactionRecipient(
  computerInfo.members.members, 
  computerInfo.members.threshold, 
  computerInfo.params.operation.price,
);

// fetch unspent utxos and handle the change
const tx = buildSafeTransaction(utxos, recipients, ghosts, Buffer.from(memo));
```