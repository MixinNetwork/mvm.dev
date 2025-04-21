import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { MixinApi, OAuthKeystore, type UserResponse } from '@mixin.dev/mixin-node-sdk';
import { useLocalStorage } from '@vueuse/core';

const MIXIN_OAUTH = 'oauth';

export const useStore = defineStore('store', () => {
  const auth = useLocalStorage(MIXIN_OAUTH, '', {
    listenToStorageChanges: true,
  });
  const mixinClient = computed(() => {
    const keystore = readUserAuth();
    return MixinApi({
      requestConfig: {
        timeout: 1000 * 10,
      },
      keystore,
    });
  });
  const saveUserAuth = (k: OAuthKeystore) => {
    const userAuth = Buffer.from(JSON.stringify(k)).toString('base64');
    auth.value = userAuth;
  };
  const readUserAuth = () => {
    if (!auth.value) return undefined;
    try {
      const k = JSON.parse(Buffer.from(auth.value, 'base64').toString());
      return k as OAuthKeystore;
    } catch {
      return undefined;
    }
  };
  const clearUserAuth = () => {
    user.value = undefined;
    auth.value = '';
    localStorage.removeItem(MIXIN_OAUTH);
  };

  const user = ref<UserResponse | undefined>(undefined);
  const profile = async () => {
    user.value = await mixinClient.value.user.profile();
  };

  return {
    auth,
    mixinClient,
    saveUserAuth,
    clearUserAuth,

    user,
    profile,
  };
});
