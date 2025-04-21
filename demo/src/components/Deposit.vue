<template>
  <div class="flex justify-center">
    <div v-if="!user || !user.info" class="text-lg">请先登录并完成注册</div>
    <div v-else class="flex flex-col">
      <div class="flex justify-center text-base">
        向该地址转账，即可向您的 Messenger 钱包充值
      </div>

      <div class="flex items-center mt-5">
        <div class="text-base">{{ user.info.chain_address }}</div>
        <div 
          class="ml-2 text-sm text-blue-600 cursor-pointer" 
          @click="copy(user.info.chain_address)"
        >
          {{ copied ? '已复制' : '复制' }}
        </div>
      </div>

      <div class="flex justify-center mt-5">
        <n-qr-code :value="user.info.chain_address" error-correction-level="H" :size="300" :padding="0"/>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useStore } from '@/store';
import { useClipboard } from '@vueuse/core';

const userStore = useStore();
const { user } = storeToRefs(userStore);

const { text, copy, copied, isSupported } = useClipboard({ source: user.value && user.value.info && user.value.info.chain_address })
</script>