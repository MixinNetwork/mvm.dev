# 如何使用 Registry 合约

## 步骤

1. 开发者部署 EVM 智能合约，部署完成后拿到合约地址。

2. 开发者根据合约地址和要调用的合约函数及参数，生成 `extra`，详见 [上一节](/zh/encoding)

3. 生成 `memo`，`memo` 为 `Operation` 的 base64 编码

   `Operation` 结构
   ```golang
   op := &encoding.Operation{
    Purpose: encoding.OperationPurposeGroupEvent, // 固定值 1
    Process: c.String("process"), // Registry 合约的机器人的 client_id，主网为 bd67087276ce3263b9333aa337e212a4
    Extra: extra, // 合约执行的内容
   }
   ```
   
4. 构造交易参数，例：
   ```json
   {
     // XIN 的 asset_id
     "asset_id": "965e5c6e-434c-3fa9-b780-c50f43cd955c", 
     // 支付的金额
     "amount": "0.00000001",
     // uuid
     "trace_id": "8c120f19-752a-402a-a47d-ca626f71938d", 
     // 上一步生成的 memo
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
   
5. 用户获取支付参数后，有两种方式进行支付：

   一：通过 POST /payments 返回的 code_id，生成支付链接 `https://mixin.one/codes/:code_id`，然后在 Mixin Messenger 中支付。
   ::: tip
   这个支付地址的生成没有限制，任何人只需知道合约地址都可以生成，相关文档：<https://developers.mixin.one/zh-CN/docs/api/transfer/payment>
   :::

   二：通过 POST /transactions 进行支付，该消息需要签名。

8. MVM 收到这个 output 后，解析 memo 成 Event，[代码示例](https://github.com/MixinNetwork/trusted-group/blob/cf3fae2ecacf95e3db7e21c10b7729ab9c11474b/mvm/eos/utils.go#L46)
9. MVM 把 Event 按格式编码之后，发送给 [Registry](#开源代码) 合约
10. [Registry](#开源代码) 执行 `function mixin`，并调用相关合约
11. 执行完成后，通过 `event MixinTransaction(bytes)`  返回给 MVM 相关 Event 信息
12. MVM 获取到结果后，如果有需要则转帐给用户，不需要则跳过

开发者只需要完成前五步支付，即可调用合约, 剩下的都是 MVM 的执行逻辑。

## 官方 js sdk 示例

这里我们用 [官方 js sdk](https://github.com/MixinNetwork/bot-api-nodejs-client) 演示调用 Counter 合约

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
 
// 合约调用信息
const contract1 = {
  address: '0x2E8f70631208A2EcFC6FA47Baf3Fde649963baC7', // Counter 合约地址
  method: 'addAny',   // 调用的函数
  types: ['uint256'], // 函数参数类型数组
  values: [2],        // 函数参数数组
};
const contract2 = {
  address: '0x2E8f70631208A2EcFC6FA47Baf3Fde649963baC7', // Counter 合约地址
  method: 'count',    // 调用的函数
};
const contracts = [contract1, contract2];
   
// 1 生成 extra
const extra = getExtra(contracts);
   
// 2 构造生成支付链接的请求参数
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
  // 3 选择一种方式支付
  // 3.1 通过 sdk post /payments
  // 需要 keystore；extra 长度超过 200 时需自行将其写入 storage 合约
  const res1 = await mixinClient.payment.request(transactionInput);
  // 通过下面的支付链接支付
  console.log(`mixin://codes/${res1.code_id}`);

  // 3.2 通过 mvmapi post /payments
  // MVMApi 可免费自动处理 extra 超长的问题，24 小时内每个 ip 限 32 次
  const mvmClient = MVMApi(MVMApiURI);
  const res2 = await mvmClient.payments(transactionInput);
  // 通过下面的支付链接支付
  console.log(`mixin://codes/${res2.code_id}`);

  // 3.3 通过 sdk post /transactions
  // keystore 对应的账户中需要有余额支付；extra 长度超过 200 时需自行将其写入 storage 合约
  const res3 = await mixinClient.transfer.toAddress(
    keystore.pin,
    transactionInput
  );
  console.log(res3);
}
```

::: tip 注意
mtg 对 memo 的长度有限制。当 memo 的长度超过 200 时，请求会报错，无法进行支付。我们将在下一节介绍如何处理 memo/extra。
:::

关于 Event 的编码，可以从[这篇文章](/zh/guide/encoding.html#mtg-到-mvm-的编码格式)了解。

## Messenger 用户、资产跟 MVM 合约中如何对应

Messenger 用户、资产都需要跟 MVM 里的帐号跟资产对应，对应方式都在以下三个公开的 map 里获取:

```solidity
mapping(address => bytes) public users;
mapping(address => uint128) public assets;
mapping(uint => address) public contracts;
```

## 总结

Registry 合约辅助实现了：Mixin 用户与 [Quorum](/zh/quorum/join) 帐户的映射、mixin 资产与 [Quorum](/zh/quorum/join) 资产的映射、合约调用以及执行结果返回的工作。EVM 合约也可以直接迁移不需要作修改。

但是，由于 mtg 对 extra 的长度有限制，当 extra 的长度超过 200 时，需要进行额外的处理，我们将在下一节介绍 Storage 合约的原理和使用以解决这个问题。
