import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { buildMixAddress, MixinApi, SafeUtxoOutput, type OAuthKeystore } from '@mixin.dev/mixin-node-sdk';
import { User, UserAssetBalance, UserAssetBalanceWithoutAsset } from './types';
import { useLocalStorage } from '@vueuse/core';
import { initComputerClient } from './utils/api';
import { add } from './utils/number';
import { SOL_ASSET_ID } from './utils/constant';

const MIXIN_OAUTH = 'oauth';
const cc = initComputerClient();

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

  const user = ref<User | undefined>(undefined);
  const profile = async () => {
    try {
      user.value = await mixinClient.value.user.profile();
      const mix = buildMixAddress({
        version: 2,
        uuidMembers: [user.value.user_id],
        xinMembers: [],
        threshold: 1,
      });

      const c = initComputerClient();
      const u = await c.fetchUser(mix);
      user.value.info = u;
    } catch(e) {
      console.error(e);
    }
  };


  const balances = ref<Record<string, UserAssetBalance>>({});
  const updateBalances = async () => {
    if (!user.value) return;
    const das = await cc.fetchAssets();

    const members = [user.value.user_id];
    let offset = 0
    let total: SafeUtxoOutput[] = []
    while(true) {
      const outputs = await mixinClient.value.utxo.safeOutputs({
        limit: 500,
        members,
        threshold: 1,
        state: 'unspent',
        offset
      });
      total = [...total, ...outputs]
      if (outputs.length < 500) {
        break;
      }
      offset = outputs[outputs.length - 1].sequence + 1
    }
    const bm = total.reduce((prev, cur) => {
      const key = cur.asset_id;
      if (prev[key]) {
        prev[key].total_amount = add(prev[key].total_amount, cur.amount).toString();
      } else {
        const address = das.find(a => a.asset_id === cur.asset_id)?.address;
        prev[key] = {
          asset_id: cur.asset_id,
          total_amount: cur.amount,
          address
        }
      }
      return prev
    }, {} as Record<string, UserAssetBalanceWithoutAsset>);

    const assets = await mixinClient.value.safe.fetchAssets(Object.keys(bm));
    const fbm = assets.reduce((prev, cur) => {
      const b = bm[cur.asset_id]
      const v: UserAssetBalance = { ...b, asset: {
        ...cur,
        name: cur.display_name,
        symbol: cur.display_symbol,
      } }
      if (cur.chain_id === SOL_ASSET_ID) 
        v.address = cur.asset_key;
      prev[cur.asset_id] = v;
      return prev
    }, {} as Record<string, UserAssetBalance>);

    balances.value = fbm;
  };


  return {
    auth,
    mixinClient,
    saveUserAuth,
    clearUserAuth,

    user,
    profile,
    balances,
    updateBalances,
  };
});
