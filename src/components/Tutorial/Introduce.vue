<template>
  <div>
    <h1>Mixin Safe Computer</h1>

    <div class="content mt-10">
      Safe Computer 是一个用于金融计算的去中心化计算机。该计算机运行在 Mixin Safe 内部，并利用
      Solana Network 的基建。
    </div>

    <div class="mt-10">
      <h2>功能介绍</h2>
      <div class="mt-2">
        <RouterLink to="/register" class="content link">注册用户</RouterLink>
        <RouterLink to="/call" class="content link">发起 Solana 交易</RouterLink>
      </div>
    </div>

    <div class="mt-10">
      <h2>开源代码</h2>
      <div class="mt-2">
        <a
          class="content link"
          href="https://github.com/MixinNetwork/safe/tree/main/computer"
          target="_blank"
        >
          Computer
        </a>
        <a
          class="content link"
          href="https://github.com/MixinNetwork/bot-api-nodejs-client"
          target="_blank"
        >
          Mixin Node SDK
        </a>
      </div>
    </div>
  </div>
</template>
