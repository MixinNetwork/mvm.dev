# 在 Quorum 中部署合约

本节，我们将介绍如何将一个合约部署到 [Quorum](/zh/quorum/join) 网络中。
开发者可以选择自己熟悉的部署方式：[remix](https://remix-project.org/), [hardhat](https://hardhat.org/) 等。


## 前置准备

1. 浏览器如何安装 Metamask
   [Chrome](https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=zh-CN) 
   [Firefox](https://addons.mozilla.org/zh-CN/firefox/addon/ether-metamask/?utm_source=addons.mozilla.org&utm_medium=referral&utm_content=search)

2. Metamask 如何添加 [Quorum 网](/zh/quorum/join)

## 准备合约

以一个简单的 Counter 合约为例：

```solidity
//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract Counter { // 计数器合约
    uint256 public count; // 计数器
    constructor() { // 构造函数
        count = 0; // 将计数器置为 0
    }

    function addOne() public { // 计数器+1 的函数
        count = count + 1;
    }

    function addAny(uint256 num) public { // 计数器+num 的函数
        count = count + num;
    }
}
```

## 部署合约

### 使用 hardhat

我们提供了 [hardhat](https://hardhat.org/) 的[部署示例](<https://github.com/MixinNetwork/mvmcontracts>), 
已经配置好 [Quorum](/zh/quorum/join) 正式网和测试网，可以直接使用。

执行以下命令：

```shell
PRIVATE_KEY=privateKey yarn hardhat run --network quorum scripts/counter.ts
```

::: tip 注意 
privateKey 需要替换成钱包的私钥，部署合约需要一定的手续费。
:::

### 使用 remix

详见 <https://developers.mixin.one/zh-CN/docs/mainnet/mvm/remix>

## 总结

本节我们介绍了如何将合约部署到 [Quorum](/zh/quorum/join) 网络。你需要记下合约部署的地址，在 [调用合约](/zh/registry/call) 这节我们将会用到它。

