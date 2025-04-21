<template>
  <div class="">
    <div v-if="!user || !user.info" class="text-lg">请先登录并完成注册</div>
    <div v-else class="flex flex-col">
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useStore } from '@/store';

const userStore = useStore();
const { user } = storeToRefs(userStore);
</script>