# MVM bridge 简介

Bridge 简单的说是一个跨链桥，但是它是连接 Mixin 所有支持的链与 MVM 的跨链桥，也就是像 BTC, ETH, TRON, SOL, LTC 等等，只要是 Mixin 支持的所有主链都可以直接转入 MVM，来使用智能合约。

整个的实现用到的概念相对比较多，需要一些时间去理解，大部分开发者其实只需要关注如何使用即可，所以接下来的内容，我们会以如何使用 Bridge 来把资产转到 MVM 为主，具体的实现可以看最后的开源代码。

## 基础概念

* Mixin Asset 是指的 Mixin 中可充值提现的原生资产, 例如 BTC, https://mixin.one/snapshots/c6d0c728-2624-429b-8e0d-d9d19b6592fa
* MVM Asset Address 是指的 BTC 在 MVM 中所对应的地址，有点类似于 WBTC 的概念
* MVM User Address 是指 Mixin user 在 MVM 中的合约地址，类似于普通的帐号
* MetaMask Address 是指的传统的 ETH 的帐号地址, 跟上面的 MVM User Address 其实是一类都是 MVM 地址

了解了这几个名词概念以后我们对理解接下来的操作会更容易一些

## Bridge 主要实现的功能

* `bind` 把一个 MVM User Address 跟 MetaMask Address 绑定
* `pass` 把 msg.sender 里的资产转到绑定的 MVM 地址
* `vault` 把 erc20 XIN 转入到 Bridge 合约
* bridge 可以接收到原生的 XIN 并给用户转回 erc20 的 XIN

接下来我们详细的解读一下每个的合约方法

## bind 方法

把一个 MVM 的地址绑定到 msg.sender 上, 其中 receiver 不能为空，内容如下

```solidty
  function bind(address receiver) public {
      require(receiver != address(0), "invalid address");
      bridges[msg.sender] = receiver;
      emit Bound(msg.sender, receiver);
  }
```

## pass 方法

完成上一步绑定之后, 就可以通过 msg.sender 给上面绑定的地址转帐, 主要分为两部分:

1. 普通的 erc20 资产，会直接转到绑定帐号
2. erc20 的 XIN, 会转成 native 的 XIN 转到绑定帐号

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

## 完整 bridge.sol 代码
https://github.com/MixinNetwork/trusted-group/blob/master/mvm/quorum/bridge/contracts/Bridge.sol

## Bridge 的开源地址：

https://github.com/MixinNetwork/trusted-group/tree/master/mvm/quorum/bridge
