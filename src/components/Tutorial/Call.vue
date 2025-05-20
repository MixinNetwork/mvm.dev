<template>
  <div class="pb-10">
    <h1>发起 Solana 交易</h1>

    <div class="content mt-10">
      在完成用户注册，获取到用户 id 和链上地址之后，即可在 Solana
      网络上参与交互。
    </div>

    <div class="mt-10">
      <h2>1. 获取 Nonce Account 和 Fee Payer</h2>
      <div class="content my-2">
        第一步先通过 Computer Http Api 获取可用的 Nonce Account 和交易的 Payer
        地址。通过 Computer 执行的 Solana 交易，必须用 Nonce Account Hash 作为
        Recent Block Hash，且其第一个 Instruction 必须为 NonceAdvance。Payer
        只可作为交易的 Fee Payer，不可在 NonceAdvance 之后的 instruction
        中操作。一个 Nonce Account
        仅能用于发一笔交易，如果您需要发多笔交易请获取多个 Nonce Account。
      </div>
      <Code :code="code1" />
    </div>

    <div class="mt-10">
      <h2>2. 更新 Solana 交易</h2>
      <div class="my-2 content">
        在构造好你需要的 Solana 交易后，更新 Fee Payer、Recent Block Hash 和
        Instructions.
      </div>
      <Code :code="code2" />
    </div>

    <div class="mt-10">
      <h2>3. 处理手续费</h2>
      <div class="my-2 content">
        在与 Solana Program
        交互的过程中，可能会产生一些费用，如创建账号需要的租金。这部分费用需要由用户或应用来承担，在创建交易时超过
        `computerInfo.params.operation.price` 的费用将兑换为等值的
        SOL，并在交易发送前转至用户的 Solana 地址。
      </div>
      <Code :code="code3" />
    </div>

    <div class="mt-10">
      <h2>4. 请求格式</h2>
      <div class="my-2 content">发起交易时，请求的格式为:</div>
      <Code
        code="2 | UID (8 bytes) | CID (uuid) | SKIP_POSTPROCESS_FLAG (1 byte) | FEE_ID (uuid, optional)"
      />
      <div class="my-2 content">
        其中，UID 为 Computer Api 返回的 user id；CID 是为该 Solana 交易指定的
        uuid；SKIP_POSTPROCESS_FLAG 为 0 或 1，当设为 1
        时在交易成功后将不会处理剩余或收到的代币，如添加流动性成功后，将不会把
        Lp Token 转回用户的 MIX 地址，而是保留在链上地址；FEE_ID
        为上一步中的手续费 id，如果没有额外费用则不需要。
      </div>

      <Code :code="code4" />
    </div>

    <div class="mt-10">
      <h2>5. 申请创建交易</h2>
      <div class="my-2 content">
        通过 Invoice 的方式，向 Computer 发送创建 Solana 交易的申请。 Computer
        仅能完成 Payer 和 User Account 的签名， 如果您的交易中包含 2 个以上的
        Signer，需要完成剩余的签名后再发送给 Computer。
      </div>
      <Code :code="code5" />
    </div>
  </div>
</template>

<script setup lang="ts">
import Code from "@/components/Code.vue";

const code1 = `const requestComputerApi = async (method, url, body) => {
  const resp = await fetch('https://computer.mixin.dev' + url, { method, body });
  const data = await resp.text();
  return JSON.parse(data);
};

const computerInfo = await requestComputerApi('GET', '/' , undefined);
const nonce = await requestComputerApi('POST', '/nonce_accounts', JSON.stringify({
  mix: "MIX3QEeHEkbmkthQcHMdhpksk3nATrPTsw"
}));
`;

const code2 = `import { PublicKey, VersionedTransaction, TransactionMessage, SystemProgram } from '@solana/web3.js';
import { checkSystemCallSize } from "@mixin.dev/mixin-node-sdk";

// 构造你需要的 Solana 交易 txx

const nonceIns = SystemProgram.nonceAdvance({
  noncePubkey: new PublicKey(nonce.nonce_address),
  authorizedPubkey: new PublicKey(computerInfo.payer)
});

const messageV0 = new TransactionMessage({
  payerKey: new PublicKey(computerInfo.payer),
  recentBlockhash: nonce.nonce_hash,
  instructions: [nonceIns, ...txx.instructions],
}).compileToV0Message();
const tx = new VersionedTransaction(messageV0);

// Solana 交易有着长度限制，如果交易超出限制，可以将 instructions 分成多个 System Call 发送
const txBuf = Buffer.from(tx.serialize({
  requireAllSignatures: false,
  verifySignatures: false,
}));
const valid = checkSystemCallSize(txBuf);
if (!valid) {
  // ...split to multiple transactions
}
`;

const code3 = `// 例如发送某个 Spl Token 时，需要为对方创建 Associated Token Address，需要 0.00203928 SOL 租金
// 请求 api 得到当前需要支付的 XIN 金额和 fee_id
const solAmount = "0.00203928";
const fee = await requestComputerApi('POST', '/fee' , JSON.stringify({ sol_amount: solAmount }));
// {
//   fee_id: '3cb432ef-9010-3bc8-badc-f93176a0b42a',
//   xin_amount: '0.00145125'
// }
`;

const code4 = `import { buildMixAddress, buildSystemCallExtra, buildComputerExtra, encodeMtgExtra, OperationTypeSystemCall } from "@mixin.dev/mixin-node-sdk";
import { parse, v4 } from "uuid";
import BigNumber from 'bignumber.js';

const user = await requestComputerApi('GET', '/users/MIX3QEeHEkbmkthQcHMdhpksk3nATrPTsw', undefined);
const callExtra = buildSystemCallExtra(user.id, v4(), 0, fee.fee_id);
const extra = buildComputerExtra(OperationTypeSystemCall, callExtra);

// 处理为发给 mtg 的交易 memo
const computerInfo = await requestComputerApi('GET', '/' , undefined);
const memo = encodeMtgExtra(computerInfo.members.app_id, requestExtra);
`;

const code5 = `import { buildMixAddress, encodeMtgExtra, newMixinInvoice, attachStorageEntry, getInvoiceString } from "@mixin.dev/mixin-node-sdk";
import { v4 } from "uuid";
import BigNumber from 'bignumber.js';

const emtpyExtra = Buffer.from(encodeMtgExtra(computerInfo.members.app_id, Buffer.alloc(0))); // pzdhFF2zSCK9PCZBa1faGw

// 创建 invoice
const computer = buildMixAddress({ 
  version: 2,
  xinMembers: [],
  uuidMembers: computerInfo.members.members,
  threshold: computerInfo.members.threshold,
});
const invoice = newMixinInvoice(computer);

// 将 Solana 交易存在 Mixin Storage
attachStorageEntry(invoice, v4(), txBuf);

// 用户发出的币。如添加 BTC/SOL 流动性
attachInvoiceEntry(invoice, {
  trace_id: v4(),
  asset_id: "c6d0c728-2624-429b-8e0d-d9d19b6592fa", // BTC
  amount: "0.01",
  extra: emtpyExtra,
  index_references: [],
  hash_references: []
});
attachInvoiceEntry(invoice, {
  trace_id: v4(),
  asset_id: "64692c23-8971-4cf4-84a7-4dd1271dd887", // SOL
  amount: "0.01",
  extra: emtpyExtra,
  index_references: [],
  hash_references: []
});

// 创建交易的费用 = 0.001 + 额外费用
// fee_id 具有实效性，须尽快支付
let total = BigNumber(info.params.operation.price).plus(fee.xin_amount).toFixed(8, BigNumber.ROUND_CEIL);
attachInvoiceEntry(invoice, {
  trace_id: v4(),
  asset_id: "c94ac88f-4671-3976-b60a-09064f1811e8", // XIN
  amount: total,
  extra: Buffer.from(memo),
  index_references: [0, 1], // 引用前面的 invoice entry
  hash_references: []
});

// 扫码支付
const codeUrl = 'https://mixin.one/pay/' + getInvoiceString(invoice);
`;
</script>
