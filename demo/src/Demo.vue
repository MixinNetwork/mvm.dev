<script setup>
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { NNotificationProvider } from 'naive-ui';
import User from './components/User.vue';
import { useStore } from '@/store';

const route = useRoute();
const routes = [
  { to:"/", text: '注册', name: ['register'] },
  { to:"/transfer", text: '转账', name: ['balances', 'transfer'] },
  { to:"/deposit", text: '充值', name: ['deposit'] },
];

const { profile, fetchComputer } = useStore();
onMounted(async () => {
  try {
    await profile();
  } catch {}
});
onMounted(fetchComputer);
</script>

<template>
  <n-notification-provider placement="bottom-right">
    <header class="flex justify-between items-center px-10 w-full h-20 border-b border-gray-950">
      <div class="font-medium text-[40px] select-none">Computer Demo</div>

      <div class="flex items-center h-15">
        <User />
      </div>
    </header>

    <div class="flex flex-col justify-start items-center px-10 pt-10 w-full h-[600px]">
      <div class="flex justify-center items-center w-full font-normal text-lg h-10">
        <RouterLink 
          v-for="r of routes" 
          :key="r.to" 
          :to="r.to"
          :class="[
            'mr-5', r.name.includes(route.name) && 'text-[#4B7CDD]']"
        >
          {{ r.text }}
        </RouterLink>
      </div>
      <div class="mt-10 w-full">
        <RouterView />
      </div>
    </div>
  </n-notification-provider>
</template>