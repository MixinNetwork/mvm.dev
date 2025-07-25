<template>
  <div class="pb-10">
    <h1>注册用户</h1>

    <div class="content mt-10">
      在使用 Mixin Safe Computer 前，必须先注册用户。本文将介绍如何通过
      Javascript 注册用户。
    </div>

    <div class="mt-10">
      <h2>1. 请求格式</h2>
      <div class="content my-2">注册用户时，请求的格式为:</div>
      <Code code="1 | MIX_ADDRESS" />

      <div class="content my-2">以 Javascript 为例：</div>
      <Code :code="code1" />
    </div>

    <div class="mt-10">
      <h2>2. 交易 Memo 格式</h2>
      <div class="my-2 content">
        在向 Mixin Safe Computer 这样的
        [MTG](https://github.com/MixinNetwork/trusted-group) 发送交易时，memo
        必须按指定格式编码：
      </div>
      <Code :code="code2" />
    </div>

    <div class="mt-10">
      <h2>3. 发送请求</h2>
      <div class="my-2" content>扫码发送注册用户的申请，费用为 0.001 XIN.</div>
      <Code :code="code3" />
    </div>

    <div class="mt-10">
      <h2>4. 查询用户信息</h2>
      <div class="my-2 content">
        待注册成功后，查询用户信息以便发起 Solana 交易，包含用户的 id、Solana
        链上地址等信息。
      </div>
      <Code :code="code4" />
    </div>
  </div>
</template>

<script setup lang="ts">
import Code from "@/components/Code.vue";

const code1 = `import { buildMixAddress, buildComputerExtra, OperationTypeAddUser } from "@mixin.dev/mixin-node-sdk";

const user_id = "4b79fe76-0d9d-49e6-85fd-0f6be01147da";
const mix = buildMixAddress({
  version: 2,
  uuidMembers: [user_id],
  xinMembers: [],
  threshold: 1
}); // MIX3QEeHEkbmkthQcHMdhpksk3nATrPTsw

const extra = buildComputerExtra(OperationTypeAddUser, Buffer.from(mix));
console.log(extra.toString('hex')); // 014d49583351456548456b626d6b74685163484d6468706b736b336e41547250547377;
`;
const code2 = `import { parse } from "uuid";
import { encodeMtgExtra } from "@mixin.dev/mixin-node-sdk";

const requestComputerApi = async (method, url, body) => {
  const resp = await fetch('https://computer.mixin.dev' + url, { method, body });
  const data = await resp.text();
  return JSON.parse(data)
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
`;
const code3 = `import { buildMixAddress } from "@mixin.dev/mixin-node-sdk";
// 生成 Computer MTG MIX 地址
const destination = buildMixAddress({ 
    version: 2,
    xinMembers: [],
    uuidMembers: computerInfo.members.members,
    threshold: computerInfo.members.threshold,
});

let codeUrl = 'https://mixin.one/pay/' + destination;
codeUrl += '?amount=' + computerInfo.params.operation.price;
codeUrl += '&asset=' + computerInfo.params.operation.asset;
codeUrl += '&memo=' + memo;
`;
const code4 = `const user = await requestComputerApi('GET', '/users/MIX3QEeHEkbmkthQcHMdhpksk3nATrPTsw', undefined);
console.log(user)
// {
//   id: '281474976710657',
//   chain_address: '2LQbfjqGn7paKFTDRPnu68VkgrMZ2JUEXm8PVYgNf8Rh',
//   mix_address: 'MIX3QEeHEkbmkthQcHMdhpksk3nATrPTsw'
// }`;
</script>
