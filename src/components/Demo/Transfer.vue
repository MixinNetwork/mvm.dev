<template>
  <div class="flex justify-center">
    <div v-if="!user || !user.info" class="text-lg">请先登录并完成注册</div>
    <div v-else-if="!balance">未找到该资产</div>
    <div v-else class="flex flex-col w-1/2">
      <div>
        <div class="flex justify-between items-center text-base">
          <div class="flex items-center">
            <NAvatar
              :src="balance.icon_url"
              :size="16"
              :circle="true"
            ></NAvatar>
            <div class="ml-1">{{ balance.name }}</div>
          </div>
          <div>{{ `${balance.showBalance} ${balance.symbol}` }}</div>
        </div>
        <input
          :value="amount"
          :class="[
            'flex items-center pl-[14px] pr-[68px] w-full h-11',
            isValidAmount !== false ? '' : '!border-[#DD4B65]',
          ]"
          type="text"
          @input="useRestrictAmount($event, amount)"
        />
      </div>

      <div>
        <div class="mt-5 text-base">收款人</div>
        <textarea
          ref="destinationRef"
          v-model.trim="destination"
          :class="[
            'p-[14px] pr-11 w-full h-[46px] font-normal text-sm leading-4 text-safeBlack overflow-hidden',
            isValidAddress !== false ? '' : '!border-[#DD4B65]',
          ]"
          type="text"
        ></textarea>
        <div class="mt-1 text-sm">不可转给当前地址</div>
        <div class="mt-1 text-sm">请勿将非 Solana 资产（如 BTC、XIN 等）转给 Mixin 充值地址</div>
      </div>

      <div
        :class="[
          'flex justify-center self-center mt-8 py-2 w-[100px] text-lg  text-white rounded',
          isValidAddress && isValidAmount
            ? 'bg-blue-500 cursor-pointer'
            : 'bg-gray-300 cursor-not-allowed',
        ]"
        @click="useTransfer"
      >
        <n-spin v-if="loading" size="small" stroke="white" />
        <div v-else>转账</div>
      </div>
    </div>

    <n-modal :show="!!track" :mask-closable="false">
      <n-card
        v-if="track && !track.state"
        style="width: 378px; height: 360px"
        :bordered="false"
        size="huge"
        aria-modal="true"
      >
        <n-qr-code
          :value="track.scheme"
          error-correction-level="H"
          :size="300"
          :padding="0"
        />
      </n-card>
      <n-card
        v-else
        style="width: 300px; height: 80px"
        :bordered="false"
        size="huge"
        aria-modal="true"
      >
        交易处理中。。。
      </n-card>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import {
  attachInvoiceEntry,
  attachStorageEntry,
  buildMixAddress,
  formatUnits,
  getInvoiceString,
  newMixinInvoice,
  OperationTypeUserDeposit,
  parseUnits,
  userIdToBytes,
} from "@mixin.dev/mixin-node-sdk";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { v4 } from "uuid";
import {
  buildComputerExtra,
  buildSystemCallExtra,
  encodeMtgExtra,
  OperationTypeSystemCall,
} from "@mixin.dev/mixin-node-sdk";
import {
  getMint,
  getAccount,
  getAssociatedTokenAddressSync,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
} from "@solana/spl-token";
import { computed, ref, watchEffect } from "vue";
import { storeToRefs } from "pinia";
import { useRoute } from "vue-router";
import { NAvatar, useNotification, NSpin } from "naive-ui";
import BigNumber from "bignumber.js";
import { useStore } from "@/store";
import { initComputerClient } from "@/utils/api";
import { RPC, SOL_ADDRESS, XIN_ASSET_ID } from "@/utils/constant";

const notification = useNotification();

const userStore = useStore();
const { user, tokens, computer, mixinClient } = storeToRefs(userStore);

const route = useRoute();
const id = computed(() => route.params.id as string);
const balance = computed(() => tokens.value[id.value]);
const mix = computed(() =>
  user.value
    ? buildMixAddress({
        version: 2,
        uuidMembers: [user.value.user_id],
        xinMembers: [],
        threshold: 1,
      })
    : "",
);

const loading = ref(false);
const amount = ref("");
const destination = ref("");
const isValidAmount = computed(() => {
  if (balance.value && amount.value) {
    try {
      const amt = BigNumber(amount.value);
      const minimum = balance.value.mint === SOL_ADDRESS 
        ? BigNumber("0.00203928") 
        : BigNumber("0.0001");
      const maximum = BigNumber(balance.value.showBalance);
      return (
        maximum.isGreaterThanOrEqualTo(amt) && minimum.isLessThanOrEqualTo(amt)
      );
    } catch (e) {
      return false;
    }
  } else return undefined;
});
const isValidAddress = computed(() => {
  if (!destination.value) return undefined;
  if (destination.value === user.value.info.chain_address) return false;
  try {
    new PublicKey(destination.value);
    return true;
  } catch {
    return false;
  }
});

const useRestrictAmount = (e: Event, oldValue: string) => {
  const target = e.target as HTMLInputElement;

  if (target.value.match(/^(\d*\.?\d{0,8})?$/)?.[0] === undefined) {
    amount.value = oldValue ?? "";
    target.value = amount.value;
  } else amount.value = target.value;
};

const track = ref<
  | {
      trace: string;
      call: string;
      state: string;
      scheme: string;
    }
  | undefined
>(undefined);

const c = initComputerClient();
const useTransfer = async () => {
  if (
    !user.value ||
    !computer.value ||
    !isValidAddress.value ||
    !isValidAddress.value
  )
    return;
  loading.value = true;

  const src = new PublicKey(user.value.info.chain_address);
  const dst = new PublicKey(destination.value);
  const nonce = await c.getNonce(mix.value);
  const tx = new Transaction();
  tx.feePayer = new PublicKey(computer.value.payer);
  tx.recentBlockhash = nonce.nonce_hash;
  tx.add(
    SystemProgram.nonceAdvance({
      authorizedPubkey: new PublicKey(computer.value.payer),
      noncePubkey: new PublicKey(nonce.nonce_address),
    }),
  );

  let extraFee = 0;
  if (balance.value.mint === SOL_ADDRESS) {
    tx.add(
      SystemProgram.transfer({
        fromPubkey: src,
        toPubkey: new PublicKey(destination.value),
        lamports: parseUnits(amount.value, 9).toNumber(),
      }),
    );
  } else {
    const connection = new Connection(RPC);
    const mint = new PublicKey(balance.value.mint);
    const acc = await connection.getAccountInfo(mint);
    const owner = acc.owner;

    const srcAta = getAssociatedTokenAddressSync(mint, src, false, owner);
    const dstAta = getAssociatedTokenAddressSync(mint, dst, false, owner);

    try {
      await getAccount(connection, dstAta);
    } catch (e) {
      if (
        e instanceof TokenAccountNotFoundError ||
        e instanceof TokenInvalidAccountOwnerError
      ) {
        tx.add(
          createAssociatedTokenAccountInstruction(
            src,
            dstAta,
            dst,
            mint,
            owner,
          ),
        );

        const rent = await connection.getMinimumBalanceForRentExemption(
          165,
          "confirmed",
        );
        extraFee += formatUnits(rent, 9).toNumber();
      }
    }

    tx.add(
      createTransferCheckedInstruction(
        srcAta,
        mint,
        dstAta,
        src,
        parseUnits(amount.value, balance.value.decimal).toNumber(),
        balance.value.decimal,
        [],
        owner,
      ),
    );
  }

  const fee =
    extraFee > 0 ? await c.getFeeOnXin(extraFee.toString()) : undefined;
  const callId = v4();
  const callExtra = buildSystemCallExtra(
    user.value.info.id,
    callId,
    false,
    fee?.fee_id,
  );
  const memo = encodeMtgExtra(
    computer.value.members.app_id,
    buildComputerExtra(OperationTypeSystemCall, callExtra),
  );

  const r = buildMixAddress({
    version: 2,
    xinMembers: [],
    uuidMembers: computer.value.members.members,
    threshold: computer.value.members.threshold,
  });
  const invoice = newMixinInvoice(r);

  const txBuf = Buffer.from(
    tx.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    }),
  );
  attachStorageEntry(invoice, v4(), txBuf);

  let total = BigNumber(computer.value.params.operation.price);
  if (fee) total = total.plus(fee.xin_amount);
  const trace = v4();
  attachInvoiceEntry(invoice, {
    trace_id: trace,
    asset_id: XIN_ASSET_ID,
    amount: total.toFixed(8, BigNumber.ROUND_CEIL),
    extra: Buffer.from(memo),
    index_references: [0],
    hash_references: [],
  });
  console.log(invoice);

  const invoiceStr = `https://mixin.one/pay/${getInvoiceString(invoice)}`;
  const code = await mixinClient.value.code.schemes(invoiceStr);
  const scheme = `https://mixin.one/schemes/${code.scheme_id}`;

  track.value = {
    scheme,
    trace,
    call: callId,
    state: "",
  };
};

watchEffect(() => {
  if (!track.value) return;
  const client = mixinClient.value;
  const timer = window.setInterval(async () => {
    try {
      if (!track.value.state) {
        const req = await client.utxo.fetchTransaction(track.value.trace);
        if (req && req.state === "spent") track.value.state = "spent";
        return;
      }

      const call = await c.fetchCall(track.value.call);
      if (call && ["done", "failed"].includes(call.state)) {
        window.clearInterval(timer);
        track.value = undefined;
        loading.value = false;
        if (call.state === "done")
          notification["success"]({
            title: "交易成功",
          });
        if (call.state === "failed")
          notification["error"]({
            title: "交易失败",
          });
      }
    } catch {}
  }, 1000 * 5);
  return () => window.clearInterval(timer);
});
</script>
