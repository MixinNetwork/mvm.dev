<script setup>
import { useRoute } from "vue-router";
import { NNotificationProvider } from "naive-ui";

const route = useRoute();
const routes = [
  { to: "/", text: "介绍", name: "introduce" },
  { to: "/register", text: "用户注册", name: "register_user" },
  { to: "/call", text: "发起 Solana 交易", name: "call" },
];
</script>

<template>
  <n-notification-provider placement="bottom-right">
    <header
      class="flex justify-between items-center fixed top-0 left-0 px-10 w-full h-20 border-b border-gray-950 bg-white"
    >
      <div class="">
        <div class="font-medium text-[24px] select-none">Computer 中文教程</div>
        <RouterLink
          to="/demo"
          class="font-medium text-[20px] select-none text-blue-600 cursor-pointer"
        >
          Demo
        </RouterLink>
      </div>
    </header>

    <div class="flex pt-20 w-full min-h-screen">
      <div class="flex-none w-[280px] border-r border-gray-950">
        <div class="fixed top-[120px] left-10">
          <RouterLink
            v-for="r of routes"
            :key="r.text"
            :to="r.to"
            :class="[
              'block mb-4 text-lg ',
              route.name === r.name ? 'text-blue-500' : 'text-black',
            ]"
            >{{ r.text }}</RouterLink
          >
        </div>
      </div>

      <div class="flex-1 px-10 pt-10">
        <RouterView />
      </div>
    </div>
  </n-notification-provider>
</template>
