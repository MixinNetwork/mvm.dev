<script setup>
import { onMounted } from 'vue';
import User from './components/User.vue';
import { useStore } from '@/store';

const { profile, updateBalances } = useStore();

onMounted(profile);
onMounted(() => {
  updateBalances();
  setInterval(updateBalances, 1000 * 5);
});
</script>

<template>
  <header class="flex justify-between items-center px-10 w-full h-20 border-b border-gray-950">
    <div class="font-medium text-[40px]">Computer Demo</div>

    <div class="flex items-center h-15">
      <User />
    </div>
  </header>

  <div class="flex flex-col justify-start items-center px-10 pt-10 w-full h-[600px]">
    <div class="flex justify-center items-center w-full font-normal text-lg h-10">
      <RouterLink to="/" class="mr-5">注册</RouterLink>
      <RouterLink to="/transfer" class="mr-5">转账</RouterLink>
      <RouterLink to="/deposit">充值</RouterLink>
    </div>
    <div class="mt-10 w-full">
      <RouterView />
    </div>
  </div>
</template>