# 使用 bridge 进行跨链充值

上一章介绍了 bridge 相关的 api，本章将介绍如何用 MVM Bridge 实现跨链充值。

在这篇文章里，我们会以 MetaMask 为例，其它的 ETH 钱包同理，没有区别。

## 充值步骤

* ### 获取 MetaMask 的私钥
* ### POST `/users` 获取 MetaMask 对应的 Mixin Network User 信息

  [官方 js sdk](https://github.com/MixinNetwork/bot-api-nodejs-client) 代码示例：
  ```javascript
  import { BridgeApi } from '@mixin.dev/mixin-node-sdk';
  import { Wallet } from 'ethers';
  
  const bridgeClient = BridgeApi();
  const user = await bridgeClient.register({
    public_key: '', // 钱包地址
  });
  ```

* ### 通过 Mixin Network User 信息获取不同链的充值地址

  [官方 js sdk](https://github.com/MixinNetwork/bot-api-nodejs-client) 代码示例：
  ```javascript
  import { MixinApi } from '@mixin.dev/mixin-node-sdk'; 
  
  // 接上节
  const keystore = {
    ...user,
    ...user.key
  };
  const mixinClient = MixinApi({ keystore });
  
  // 查看所有资产的信息
  const assets = mixinClient.asset.fetchList();
  console.log(assets);
  // 获取特定资产的充值地址
  const asset = await mixinClient.asset.fetch(
    'c94ac88f-4671-3976-b60a-09064f1811e8' // XIN 的 asset_id
  );
  console.log(asset.destination);
  ```

* ### 充值

  在上一步中，拿到具体的 BTC, ETH, SOL, DOT 等代币的地址之后，只需要对相关的资产进行链上充值, 之后 MetaMask 中就会有相关的 ERC20 资产。

  整个流程中重要的是获取 MetaMask address 对应的 Mixin Network User 在不同链上的充值地址。

## Bridge 的开源地址：

<https://github.com/MixinNetwork/trusted-group/tree/master/mvm/quorum/bridge>

接下来，我们会介绍如何通过 Metamask 地址完成对其它链的提现。

