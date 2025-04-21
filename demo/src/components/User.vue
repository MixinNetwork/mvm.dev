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
</script>
