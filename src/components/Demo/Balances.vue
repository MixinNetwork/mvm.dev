<template>
  <div class="flex justify-center">
    <div v-if="!user || !user.info" class="text-lg">请先登录并完成注册</div>
    <div v-else class="flex flex-col w-1/2">
      <div class="text-lg">从 Mixin Network 转到 Solana Network</div>
      <div class="mt-10 text-sm">Mixin 资产列表</div>
      <div class="mt-5 pb-4">
        <RouterLink
          v-for="a of bs"
          :key="a.asset_id"
          :to="`/demo/withdraw/${a.asset_id}`"
          class="block mb-4 p-2 border border-[#D9D9D9] rounded"
        >
          <div class="flex justify-between">
            <div class="flex items-center">
              <NAvatar
                :src="a.asset.icon_url"
                :size="16"
                :circle="true"
              ></NAvatar>
              <div class="ml-1">{{ a.asset.symbol }}</div>
            </div>
            <div>{{ a.total_amount }}</div>
          </div>
          <div class="flex justify-between mt-2">
            <div>{{ a.asset.name }}</div>
            <div>
              {{
                a.address && `${a.address.slice(0, 6)}...${a.address.slice(-6)}`
              }}
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
import { computed } from "vue";
import { UserAssetBalance } from "@/types";
import { gt, mul } from "@/utils/number";

const userStore = useStore();
const { user, balances } = storeToRefs(userStore);

const bs = computed(() =>
  (Object.values(balances.value) as UserAssetBalance[]).sort(
    (a: UserAssetBalance, b: UserAssetBalance) =>
      gt(mul(a.asset.price_usd, a.total_amount), mul(b.asset.price_usd, b.total_amount)) ? -1 : 1,
  ),
);
</script>
