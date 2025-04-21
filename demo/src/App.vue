<script setup>
import { onMounted } from 'vue';
import User from './components/User.vue';
import { useStore } from '@/store';

const { profile } = useStore();

onMounted(profile);
</script>

<template>
  <header class="flex justify-between items-center px-10 w-full h-20 border-b border-gray-950">
    <div class="font-medium text-[40px]">Computer Demo</div>

    <div class="flex items-center h-15">
      <User />
    </div>
  </header>

  <div class="h-10">123</div>
</template>