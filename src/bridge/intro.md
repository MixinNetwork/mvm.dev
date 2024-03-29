# Introduction

Bridge is the Cross-Chain bridge, assets from any chain Mixin supports can be transferred to Mixin or withdrawn from Mixin,
like BTC, ETH, TRON, SOL, LTC .etc.
You can use any ETH wallet here, for example: imtoken and MetaMask.

Most developers only need to focus on the way to use Bridge, since the implementation of it involves many concepts and it takes time to understand them.
We will demonstrate how to transfer and withdraw in the following chapters.

## Basic Concepts

* Mixin Asset means the native asset in Mixin, which can be deposited or withdrawn, like [BTC](https://mixin.one/snapshots/c6d0c728-2624-429b-8e0d-d9d19b6592fa)
* MVM Asset Address means the asset contract address in MVM，similar to the concept of WBTC
* MVM User Address means the user contract address of Mixin user in MVM
* MetaMask Address means the address in a chain like ETH, and it's the same kind of address as MVM User Address

It is easier for us to understand the next practices after having a general knowing about these concepts.

## Main Functions

* `bind`: bind a MVM User Address to a MetaMask Address
* `pass`: transfer asset from MVM User Address (msg.sender) bound with MetaMask Address to MetaMask Address
* `vault` Transfer ERC20 ETH to Bridge Contract, and it returns ERC20 ETH

We will introduce every function in contract next.

## bind 

Bind a MVM User Address (msg.sender) to a MetaMask Address (receiver), `receiver` cannot be empty

```solidty
function bind(address receiver) public {
    require(receiver != address(0), "invalid address");
    bridges[msg.sender] = receiver;
    emit Bound(msg.sender, receiver);
}
```

MVM User Address is the contract address bound to a mixin user. For more details see [Q & A](/resources/qa.html)

Besides, we provide js SDK get the user address：<https://github.com/MixinNetwork/bot-api-nodejs-client/blob/main/src/mvm/registry.ts#L51>

## pass

After address binding, you can transfer asset to MetaMask Address:

* normal ERC20 asset will be directly transferred to MetaMask Address
* ERC20 ETH will be switched to native ETH first and then transferred to MetaMask Address

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

## vault

Only for transferring ERC20 ETH to Bridge Contract

```
  function vault(address asset, uint256 amount) public {
      asset = canonical(asset);
      require(asset == XIN, "only XIN accepted");
      IERC20(asset).transferFrom(msg.sender, address(this), amount);
      emit Vault(msg.sender, amount);
  }
```

You may have a basic understanding of Bridge Contract so far. 
For the convenience of developers, we provide the bridge api service to make cross-chain deposit and withdrawal to MVM available.
We will explain the usage of api in the next chapter.

## Open Code source
<https://github.com/MixinNetwork/trusted-group/blob/master/mvm/quorum/bridge/contracts/Bridge.sol>

## Bridge Api

<https://github.com/MixinNetwork/trusted-group/tree/master/mvm/quorum/bridge>