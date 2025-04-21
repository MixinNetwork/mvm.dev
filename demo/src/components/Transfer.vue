<template>
  <div class="flex justify-center">
    <div v-if="!user || !user.info" class="text-lg">请先登录并完成注册</div>
    <div v-else-if="!balance">未找到该资产</div>
    <div v-else class="flex flex-col w-1/2">
      <div class="flex justify-between items-center text-base">
        <div class="flex items-center">
          <NAvatar :src="balance.asset.icon_url" :size="16" :circle="true"></NAvatar>
          <div class="ml-1">{{ balance.asset.name }}</div>
        </div>
        <div>{{ `${balance.total_amount} ${balance.asset.symbol}` }}</div>
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { NAvatar } from 'naive-ui';
import { useStore } from '@/store';
import { PublicKey } from '@solana/web3.js';

const userStore = useStore();
const { user, balances } = storeToRefs(userStore);

const route = useRoute();
const id = computed(() => route.params.id as string);
const balance = computed(() => balances.value[id.value]);

const amount = ref('');
const destination = ref('');
const isValidAmount = computed(() => {
  if (balance.value && amount.value) {
    try {
      const amt = BigNumber(amount.value);
      const minimum = BigNumber('0.0001');
      const maximum = BigNumber(balance.value.total_amount);
      return maximum.isGreaterThanOrEqualTo(amt) && minimum.isLessThanOrEqualTo(amt);
    } catch (e) {
      return false;
    }
  } else return undefined;
});
const isValidAddress = computed(() => {
  if (!destination.value) return undefined;
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
    amount.value = oldValue ?? '';
    target.value = amount.value;
  } else amount.value = target.value;
};
</script>