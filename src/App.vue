<template>
  <n-config-provider :hljs="hljs">
    <RouterView />
  </n-config-provider>
</template>

<script setup lang="ts">
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";

hljs.registerLanguage("javascript", javascript);
</script>
