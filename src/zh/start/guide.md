## 一、本章须知

::: tip 学完本章将会了解

1. 浏览器如何安装 Metamask
2. 如何将 [Quorum 测试网] 导入 Metamask 内
3. 在水龙头网站领取 Quorum 测试代币

:::

## 二、前置准备

1. 浏览器如何安装 Metamask
   [Chrome](https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=zh-CN) [Firefox](https://addons.mozilla.org/zh-CN/firefox/addon/ether-metamask/?utm_source=addons.mozilla.org&utm_medium=referral&utm_content=search)

2. Metamask 如何添加 [Quorum 测试网](/zh/quorum/join)

3. 在[水龙头网站](https://faucet.test.mixinbots.com/)领取 Quorum 测试代币

::: tip

遇到任何问题欢迎入群 <https://mixin.one/codes/a91c865c-5de7-40c1-a130-f6c92ee89bd7> 探讨.

:::

## 三、介绍

Mvm 有许多特点, 如 独有的编码方式、 `Registry` 等.

但其实开发者并不太用关注这些信息, 就可以直接开始进行合约的开发. 并且便捷的

甚至我们已经准备好了 `@mixin.dev/mixin-node-sdk` 与 `mvm 调用 api`, 让您能够方便快捷的使用 Mixin Messenger 快捷的进行收付款以及合约的调用.

> [详细的例子请点击](https://github.com/MixinNetwork/bot-api-nodejs-client/blob/main/example/mvm.js)

> 接下来, 我们来编写一些简单的智能合约, 开始 Mvm 之旅.

我们的合约教程分为以下几个部分.

> 1. 开发一个计数器合约, 然后用 Mixin Messenger 调用并完成+1.
> 2. 开发一个转账合约, 然后用 Mixin Messenger 调用合约并完成转账.

完成以上两个合约教程, 您将对以下内容有较为深入的理解.

> 1. 如何通过 Messenger 调用 Mvm 的智能合约.
> 2. Messenger 的用户与 Mvm 的用户的绑定关系.
> 3. Messenger 的资产与 Mvm 的资产的绑定关系.

好了, 让我们直接开始教程.
