<template>
  <div class="p-2 border border-black bg-gray-100 rounded">
    <n-code :code="code" language="javascript"></n-code>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  code: string;
}>();
</script>