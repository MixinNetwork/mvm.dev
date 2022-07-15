# MVM bridge 简介

Bridge 是 MetaMask 跟其它链的一个跨链桥，也就是像 BTC, ETH, TRON, SOL, LTC 等等，只要是 Mixin 支持的所有主链都可以直接转入 MetaMask，来使用智能合约。这里的 MetaMask 可以是所有的 ETH 钱包, 比如 imtoken 等，这里我们只是以 MetaMask 为例。

整个的实现用到的概念相对比较多，需要一些时间去理解，大部分开发者其实只需要关注如何使用即可，所以接下来的内容，我们会以如何使用 Bridge 来把资产转到 MVM 为主，具体的实现可以看最后的开源代码。

## 基础概念

* Mixin Asset 是指的 Mixin 中可充值提现的原生资产, 例如 [BTC](https://mixin.one/snapshots/c6d0c728-2624-429b-8e0d-d9d19b6592fa)
* MVM Asset Address 是指的 BTC 在 MVM 中所对应的地址，有点类似于 WBTC 的概念
* MVM User Address 是指 Mixin user 在 MVM 中的合约地址，类似于普通的帐号
* MetaMask Address 是指的传统的 ETH 的帐号地址, 跟上面的 MVM User Address 其实是一类都是 MVM 地址

了解了这几个名词概念以后我们对理解接下来的操作会更容易一些

## Bridge 主要实现的功能

* `bind` 把一个 MVM User Address 跟 MetaMask Address 绑定
* `pass` 把与 MetaMask Address 绑定的 MVM 地址 (msg.sender) 里的资产转到 MetaMask Address
* `vault` 把 erc20 XIN 转入到 Bridge 合约
* bridge 可以接收到原生的 XIN 并给用户转回 erc20 的 XIN

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