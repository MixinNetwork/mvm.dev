import { ref, computed, watchEffect } from "vue";
import { defineStore } from "pinia";
import {
  buildMixAddress,
  MixinApi,
  SafeUtxoOutput,
  formatUnits,
  type OAuthKeystore,
} from "@mixin.dev/mixin-node-sdk";
import { Connection, PublicKey } from "@solana/web3.js";
import type {
  ComputerAssetResponse,
  ComputerInfoResponse,
  TokenBalance,
  TokenMetadataAsset,
  User,
  UserAssetBalance,
  UserAssetBalanceWithoutAsset,
} from "./types";
import { useLocalStorage } from "@vueuse/core";
import { getAssets, initComputerClient } from "./utils/api";
import { add } from "./utils/number";
import { RPC, SOL_ADDRESS, SOL_ASSET_ID, SOL_DECIMAL } from "./utils/constant";

const MIXIN_OAUTH = "oauth";
const cc = initComputerClient();
const connection = new Connection(RPC);

export const useStore = defineStore("store", () => {
  const auth = useLocalStorage(MIXIN_OAUTH, "", {
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
    const userAuth = Buffer.from(JSON.stringify(k)).toString("base64");
    auth.value = userAuth;
  };
  const readUserAuth = () => {
    if (!auth.value) return undefined;
    try {
      const k = JSON.parse(Buffer.from(auth.value, "base64").toString());
      return k as OAuthKeystore;
    } catch {
      return undefined;
    }
  };
  const clearUserAuth = () => {
    user.value = undefined;
    auth.value = "";
    localStorage.removeItem(MIXIN_OAUTH);
  };

  const user = ref<User | undefined>(undefined);
  const profile = async () => {
    try {
      const profileUser = await mixinClient.value.user.profile();
      const mix = buildMixAddress({
        version: 2,
        uuidMembers: [profileUser.user_id],
        xinMembers: [],
        threshold: 1,
      });

      const c = initComputerClient();
      const u = await c.fetchUser(mix);
      user.value = u ? { ...profileUser, info: u } : profileUser;
    } catch (e) {}
  };

  const balances = ref<Record<string, UserAssetBalance>>({});
  const updateBalances = async (das: ComputerAssetResponse[]) => {
    const currentUser = user.value;
    if (!currentUser) return;
    const members = [currentUser.user_id];
    let offset = 0;
    let total: SafeUtxoOutput[] = [];
    while (true) {
      const outputs = await mixinClient.value.utxo.safeOutputs({
        limit: 500,
        members,
        threshold: 1,
        state: "unspent",
        offset,
      });
      total = [...total, ...outputs];
      if (outputs.length < 500) {
        break;
      }
      const lastOutput = outputs[outputs.length - 1];
      if (!lastOutput) break;
      offset = lastOutput.sequence + 1;
    }
    const bm = total.reduce(
      (prev, cur) => {
        const key = cur.asset_id;
        const existing = prev[key];
        if (existing) {
          existing.total_amount = add(
            existing.total_amount,
            cur.amount,
          ).toString();
        } else {
          const address = das.find((a) => a.asset_id === cur.asset_id)?.address;
          prev[key] = {
            asset_id: cur.asset_id,
            total_amount: cur.amount,
            address,
          };
        }
        return prev;
      },
      {} as Record<string, UserAssetBalanceWithoutAsset>,
    );

    const assets = await mixinClient.value.safe.fetchAssets(Object.keys(bm));
    const fbm = assets.reduce(
      (prev, cur) => {
        const b = bm[cur.asset_id];
        if (!b) return prev;
        const v: UserAssetBalance = {
          ...b,
          asset: {
            ...cur,
            name: cur.display_name,
            symbol: cur.display_symbol,
          },
        };
        if (cur.chain_id === SOL_ASSET_ID) v.address = cur.asset_key;
        prev[cur.asset_id] = v;
        return prev;
      },
      {} as Record<string, UserAssetBalance>,
    );

    balances.value = fbm;
  };

  const tokens = ref<Record<string, TokenBalance>>({});
  const getTokenMeta = async (mints: string[]) => {
    const metas = await getAssets(mints);
    return metas.data.result.map((m: TokenMetadataAsset) => ({
      mint: m.id,
      name: m.content.metadata.name,
      symbol: m.content.metadata.symbol,
      uri: m.content.links.image,
    }));
  };
  const updateTokens = async (das: ComputerAssetResponse[]) => {
    const currentInfo = user.value?.info;
    if (!currentInfo) return;
    const ts: Record<string, TokenBalance> = {};
    const publicKey = new PublicKey(currentInfo.chain_address);

    const solBalance = await connection.getBalance(publicKey);
    if (solBalance > 0) {
      ts[SOL_ADDRESS] = {
        mint: SOL_ADDRESS,
        token_account: "",
        balance: `${solBalance}`,
        showBalance: formatUnits(solBalance, SOL_DECIMAL).toString(),
        name: "Solana",
        symbol: "SOL",
        icon_url:
          "https://images.mixin.one/eTzm8_cWke8NqJ3zbQcx7RkvbcTytD_NgBpdwIAgKJRpOoo0S0AQ3IQ-YeBJgUKmpsMPUHcZFzfuWowv3801cF5HXfya5MQ9fTA9HQ=s128",
        decimal: SOL_DECIMAL,
      };
    }

    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      publicKey,
      {
        programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
      },
    );
    tokenAccounts.value.forEach((a) => {
      const tokenAccount = a.account.data.parsed.info;
      const mint = tokenAccount.mint;
      const amount = tokenAccount.tokenAmount.amount;
      if (amount === "0") return;
      ts[mint] = {
        mint,
        token_account: a.pubkey.toString(),
        balance: amount,
        showBalance: formatUnits(
          amount,
          tokenAccount.tokenAmount.decimals,
        ).toString(),
        decimal: tokenAccount.tokenAmount.decimals,
        name: "",
        symbol: "",
        icon_url: "",
      };
    });

    das.forEach((asset) => {
      const token = ts[asset.address];
      if (!token) return;
      token.name = asset.name;
      token.symbol = asset.symbol;
      token.icon_url = asset.uri;
      token.asset = asset;
    });
    const mints = Object.values(ts)
      .filter((t) => !t.name)
      .map((t) => t.mint);
    if (mints.length) {
      const metas = await getTokenMeta(mints);
      metas.forEach((meta) => {
        const token = ts[meta.mint];
        if (!token) return;
        token.name = meta.name;
        token.symbol = meta.symbol;
        token.icon_url = meta.uri;
      });
    }
    tokens.value = ts;
  };

  const update = async () => {
    const das = await cc.fetchAssets();
    updateBalances(das);
    updateTokens(das);
  };

  let timer: number | undefined;
  watchEffect(async () => {
    if (!user.value?.info) return;
    update();
    timer = window.setInterval(update, 1000 * 30);
    return () => window.clearInterval(timer);
  });

  const computer = ref<ComputerInfoResponse | undefined>(undefined);
  const fetchComputer = async () => {
    computer.value = await cc.fetchInfo();
  };

  return {
    auth,
    mixinClient,
    saveUserAuth,
    clearUserAuth,

    user,
    profile,
    balances,
    tokens,
    updateBalances,

    computer,
    fetchComputer,
  };
});
