<template>
  <div>
    <div v-if="user" class="flex items-center">
      <NAvatar 
        :circle="true" 
        :size="32"
        :src="user.avatar_url"
      />
      <div class="ml-2 text-lg">{{ user.full_name }}</div>
    </div>

    <div v-else>
      <div class="font-normal text-lg text-blue-600 underline cursor-pointer" @click="handleLogin">
        请登录
      </div>
    </div>
  </div>

  <n-modal v-model:show="showModal">
    <n-card
      style="width: 378px; height: 360px;"
      :bordered="false"
      size="huge"
      aria-modal="true"
      :on-mask-click="handleClear"
    >
      <n-qr-code v-if="loginCode" :value="loginCode" error-correction-level="H" :size="300" :padding="0"/>
      <n-skeleton v-else :width="300" :height="300" :sharp="false" :animated="true" />
    </n-card>
  </n-modal>
  <!-- <div
    v-if="user"
    ref="userPanel"
    class="flex justify-between items-center relative w-full bg-white rounded-xl cursor-pointer"
    @click.stop="useTogglePanel"
  >
    <div class="flex flex-row items-center mr-1">
      <div
        class="flex flex-none justify-center items-center w-10 h-10 rounded-[50%] overflow-hidden"
      >
        <img v-if="user.avatar_url" class="w-full" :src="user.avatar_url" alt="user icon" />
        <span v-else>{{ user.full_name.slice(0, 1) }}</span>
      </div>

      <div class="ml-3 min-h-10 h-auto">
        <div class="flex">
          <div
            class="max-w-[111px] font-semibold text-sm leading-[17px] text-safeBlack ellipsis break-all"
          >
            {{ user.full_name }}
          </div>
          <img
            v-if="user.plan !== 'none'"
            :src="planIcon[user.plan]"
            :alt="user.plan"
            class="flex-none self-end ml-2 w-4 h-4"
          />
        </div>
        <div class="mt-1.5 font-normal text-xs leading-[15px] text-safeBlack/40">
          {{ t(`plans.level.${user.plan}`) }} · {{ user.identity_number }}
        </div>
      </div>
    </div>

    <Arrow :class="['flex-none w-6 h-6 select-none', !showPanel && 'rotate-180']" />

    <div
      v-if="showPanel"
      class="flex justify-center items-center absolute right-0 bottom-8 w-[98px] h-full bg-white border-[1px] border-warningBorder rounded cursor-pointer select-none"
      @click="useClickLogout"
    >
      <span class="font-normal text-sm leading-[14px] text-safeBlack">
        {{ t('sidebar.logout') }}
      </span>
    </div>
  </div> -->
</template>

<script setup lang="ts">
import { onUnmounted, ref, watchEffect } from 'vue';
import { AuthorizationResponse, base64RawURLEncode, getChallenge, getED25519KeyPair, OAuthKeystore } from '@mixin.dev/mixin-node-sdk';
import { storeToRefs } from 'pinia';
import { NModal, NQrCode, NSkeleton, NCard, NAvatar } from 'naive-ui';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { useStore } from '@/store';
import { useAuthorization } from '@/utils/login';
import { BOT } from '@/utils/constant';

const userStore = useStore();
const { user, mixinClient } = storeToRefs(userStore);
const { saveUserAuth, profile } = userStore;

const showModal = ref(false);
const loginCode = ref('');
const ws = ref<ReconnectingWebSocket | undefined>(undefined);

const handleLogin = () => showModal.value = true;
const handleClear = () => {
  showModal.value = false;
  loginCode.value = '';
  if (!ws.value) return;
  ws.value.close();
  ws.value = undefined;
};

const useLogin = async (code: string, code_verifier: string) => {
  const { seed, publicKey } = getED25519KeyPair();
  const client = mixinClient.value;

  try {
    const { scope, authorization_id } = await client.oauth.getToken({
      client_id: BOT,
      code: code,
      ed25519: base64RawURLEncode(publicKey),
      code_verifier,
    });

    if (
      !scope ||
      scope.indexOf('ASSETS:READ') < 0
    ) {
      return;
    }

    const keystore: OAuthKeystore = {
      app_id: BOT,
      scope,
      authorization_id,
      session_private_key: seed.toString('hex'),
    };
    saveUserAuth(keystore);
    await profile();

    if (user.value) handleClear();
  } catch (e: any) {
    console.error(e);
  }
};

watchEffect(() => {
  if (!showModal.value) return;
  const scope = 'PROFILE:READ ASSETS:READ';
  const { verifier, challenge } = getChallenge();
  
  ws.value = useAuthorization(BOT, scope, challenge, (a: AuthorizationResponse) => {
    if (a && !loginCode.value) loginCode.value = `mixin://codes/${a.code_id}`;
    if (a.authorization_code.length > 16) {
      useLogin(a.authorization_code, verifier);
      return true;
    }
    return false;
  });
  return () => ws.value.close();
})

onUnmounted(handleClear);
// const userPanel = ref<HTMLElement>();

// const showPanel = ref(false);
// const useTogglePanel = () => {
//   const expect = !showPanel.value;
//   if (expect) useShowGlobalMenu(showPanel);
//   else useCloseGlobalMenu();
// };

// const useClickLogout = () => {
//   setTimeout(() => {
//     useToggleDrawer();
//     clearUserAuth();
//     router.push('/');
//   }, 300);
// };
</script>
