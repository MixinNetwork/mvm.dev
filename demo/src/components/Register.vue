<template>
  <div class="flex justify-center">
    <div v-if="user && user.info" class="text-lg">您已注册</div>
    <div v-else-if="!user" class="text-lg">请先登录</div>
    <div 
      v-else 
      class="px-4 py-2 text-lg bg-blue-600 text-white rounded cursor-pointer" 
      @click="useRegister"
    >
      用户注册
    </div>

    <n-modal v-model:show="code.length">
      <n-card
        style="width: 378px; height: 360px;"
        :bordered="false"
        size="huge"
        aria-modal="true"
      >
        <n-qr-code :value="code" error-correction-level="H" :size="300" :padding="0"/>
      </n-card>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { storeToRefs } from 'pinia';
import { useStore } from '@/store';
import { buildMixAddress } from '@mixin.dev/mixin-node-sdk';
import { buildComputerExtra, encodeMtgExtra, OperationTypeAddUser } from '@/utils/mixin';
import { initComputerClient } from '@/utils/api';

const userStore = useStore();
const { user, computer } = storeToRefs(userStore);
const mix = computed(() => user.value ? buildMixAddress({
    version: 2,
    uuidMembers: [user.value.user_id],
    xinMembers: [],
    threshold: 1
  }): '');

const code = ref('');

const useRegister = () => {
  if (!mix.value || !computer.value) return;
  const extra = buildComputerExtra(OperationTypeAddUser, Buffer.from(mix.value));
  const memo = encodeMtgExtra(computer.value.members.app_id, extra);

  const destination = buildMixAddress({ 
    version: 2,
    xinMembers: [],
    uuidMembers: computer.value.members.members,
    threshold:   computer.value.members.threshold,
  });
  code.value = `https://mixin.one/pay/${destination}?amount=${computer.value.params.operation.price}&asset=${computer.value.params.operation.asset}&memo=${memo}`;
};

const c = initComputerClient();
watchEffect( () => {
  if (!code.value) return;
  const timer = window.setInterval(async () => {
    try {
      const u = await c.fetchUser(mix.value);
      if (u) {
        user.value.info = u;
        window.clearInterval(timer);
        code.value = '';
      }
    } catch {}
  }, 1000 * 5);
  return () => window.clearInterval(timer);
});
</script>