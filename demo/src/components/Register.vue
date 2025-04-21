<template>
  <div class="flex justify-center">
    <div v-if="user && user.info" class="text-lg">您已注册</div>
    <div v-else-if="!user" class="text-lg">请先登录</div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useStore } from '@/store';

const userStore = useStore();
const { user } = storeToRefs(userStore);
</script>