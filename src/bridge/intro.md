# MVM bridge 简介

Bridge is the Cross-Chain Bridge, assets from any chain Mixin supports can be transfer to Mixin to use smart contract, like BTC, ETH, TRON, SOL, LTC .etc
You can use any ETH wallet here, for example, imtoken and MetaMask

Most developers only need to focus on how to use Bridge, since the implementation of it involves many concepts and it takes time to understand them.
We will demonstrate how to transfer asset to MVM next.

## Basic Concepts

* Mixin Asset means the native asset in Mixin, which can deposit or withdraw, like [BTC](https://mixin.one/snapshots/c6d0c728-2624-429b-8e0d-d9d19b6592fa)
* MVM Asset Address means the asset contract address in MVM，similar to the concept of WBTC
* MVM User Address means the user contract address of Mixin user in MVM
* MetaMask Address means the traditional address in chain like ETH, and it's the same as MVM User Address

It is easier for us to understand the next practice after having brief about these concepts

## Main Functions

* `bind`: bind a MVM User Address to a MetaMask Address
* `pass`: transfer asset from MVM User Address (msg.sender) bound with MetaMask Address to MetaMask Address
* `vault` Transfer erc20 XIN to Bridge Contract
* bridge 可以接收到原生的 ETH 并给用户转回 erc20 的 XIN

接下来我们详细的解读一下每个的合约方法

## bind 方法

把一个 MVM User Address (msg.sender) 绑定到 MetaMask Address (receiver) 上, 其中 receiver 不能为空，实现如下

```solidty
  function bind(address receiver) public {
      require(receiver != address(0), "invalid address");
      bridges[msg.sender] = receiver;
      emit Bound(msg.sender, receiver);
  }
```

在 Bridge 当中，这里是指 Mixin Network user 对应的 MVM User Address.

这里有详细的解释, [Mixin user 跟 MVM user address 如何对应](/zh/resources/qa.html)

另外我们提供了 js SDK 来获取用户对应地址：<https://github.com/MixinNetwork/bot-api-nodejs-client/blob/main/src/mvm/registry.ts#L51>

## pass 方法

完成上一步绑定之后, 就可以给 MetaMask Address 的地址转帐, 主要分为两部分:

* 普通的 erc20 资产，会直接转到 MetaMask Address
* erc20 的 XIN, 会转成 native 的 XIN 转到 MetaMask Address

```solidty
  function pass(address asset, uint256 amount) public {
      address receiver = bridges[msg.sender];
      require(receiver != address(0), "no address bound");
      require(amount > 0, "too small");

      asset = canonical(asset);
      if (asset == XIN) {
          passXIN(receiver, amount);
      } else {
          IERC20(asset).transferFrom(msg.sender, receiver, amount);
      }

      emit Through(asset, msg.sender, receiver, amount);
  }

  function passXIN(address receiver, uint256 amount) internal {
      IERC20(XIN).transferFrom(msg.sender, address(this), amount);
      payable(receiver).transfer(amount * BASE);
  }

  function canonical(address asset) internal view returns (address) {
      uint256 id = uint256(uint160(asset));
      address another = Factory(FACTORY).contracts(id);
      if (another != address(0)) {
          return another;
      }
      return asset;
  }
```

## vault 合约

把 erc20 的 XIN 转到 Bridge 合约，请注意，这里只支持 erc20 的 XIN

```
  function vault(address asset, uint256 amount) public {
      asset = canonical(asset);
      require(asset == XIN, "only XIN accepted");
      IERC20(asset).transferFrom(msg.sender, address(this), amount);
      emit Vault(msg.sender, amount);
  }
```

到这里应该对 Bridge 合约有基本的了解，我们使用 bridge 合约，作了进一步的开发，然后让开发者更加方便的使用，完成不同链到 MVM 的充值，下一篇，我们会针对开发者的使用做一个详细的介绍，开发者只需要关注下面的内容即可。

## 完整 bridge.sol 代码
<https://github.com/MixinNetwork/trusted-group/blob/master/mvm/quorum/bridge/contracts/Bridge.sol>

## Bridge 的开源地址：

<https://github.com/MixinNetwork/trusted-group/tree/master/mvm/quorum/bridge>