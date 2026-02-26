<template>
  <div class="flex justify-center">
    <div v-if="!user || !user.info" class="text-lg">请先登录并完成注册</div>
    <div v-else class="flex flex-col w-1/2">
      <div class="text-lg">Solana Network 地址间转账</div>
      <div class="mt-10 text-sm">Solana 资产列表</div>
      <div class="mt-5 pb-4">
        <RouterLink
          v-for="(a, id) of tokens"
          :key="id"
          :to="`/demo/transfer/${a.mint}`"
          class="block mb-4 p-2 border border-[#D9D9D9] rounded"
        >
          <div class="flex justify-between">
            <div class="flex items-center">
              <NAvatar :src="a.icon_url" :size="16" :circle="true"></NAvatar>
              <div class="ml-1">{{ a.symbol }}</div>
            </div>
            <div>{{ a.showBalance }}</div>
          </div>
          <div class="flex justify-between mt-2">
            <div>{{ a.name }}</div>
            <div>
              {{ a.mint && `${a.mint.slice(0, 6)}...${a.mint.slice(-6)}` }}
            </div>
          </div>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { NAvatar } from "naive-ui";
import { useStore } from "@/store";

const userStore = useStore();
const { user, tokens } = storeToRefs(userStore);
</script>
