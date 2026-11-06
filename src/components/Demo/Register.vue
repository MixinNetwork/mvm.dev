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

    <n-modal v-model:show="login.show">
      <n-card
        style="width: 378px; height: 360px"
        :bordered="false"
        size="huge"
        aria-modal="true"
      >
        <n-qr-code
          :value="login.code"
          error-correction-level="H"
          :size="300"
          :padding="0"
        />
      </n-card>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from "vue";
import { storeToRefs } from "pinia";
import { useStore } from "@/store";
import {
  buildMixAddress,
  buildComputerExtra,
  encodeMtgExtra,
  OperationTypeAddUser,
} from "@mixin.dev/mixin-node-sdk";
import { initComputerClient } from "@/utils/api";

const userStore = useStore();
const { user, computer } = storeToRefs(userStore);
const mix = computed(() => {
  const currentUser = user.value;
  return currentUser
    ? buildMixAddress({
        version: 2,
        uuidMembers: [currentUser.user_id],
        xinMembers: [],
        threshold: 1,
      })
    : "";
});

const login = ref({
  show: false,
  code: "",
});

const useRegister = () => {
  const currentComputer = computer.value;
  if (!mix.value || !currentComputer) return;
  const extra = buildComputerExtra(
    OperationTypeAddUser,
    Buffer.from(mix.value),
  );
  const memo = encodeMtgExtra(currentComputer.members.app_id, extra);

  const destination = buildMixAddress({
    version: 2,
    xinMembers: [],
    uuidMembers: currentComputer.members.members,
    threshold: currentComputer.members.threshold,
  });
  login.value = {
    show: true,
    code: `https://mixin.one/pay/${destination}?amount=${currentComputer.params.operation.price}&asset=${currentComputer.params.operation.asset}&memo=${memo}`,
  };
};

const c = initComputerClient();
watchEffect(() => {
  const currentMix = mix.value;
  if (!login.value.code || !login.value.show || !currentMix) return;
  const timer = window.setInterval(async () => {
    try {
      const u = await c.fetchUser(currentMix);
      const currentUser = user.value;
      if (u && currentUser) {
        user.value = { ...currentUser, info: u };
        window.clearInterval(timer);
        login.value = {
          show: false,
          code: "",
        };
      }
    } catch {}
  }, 1000 * 5);
  return () => window.clearInterval(timer);
});
</script>
