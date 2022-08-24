# Deploy a Contract in MVM

We will show you how deploy a contract to [MVM network](/quorum/join) here.
You can choose the way you familiar with: [remix](https://remix-project.org/) or [hardhat](https://hardhat.org/).

## Prepare

1. Install Metamask in browser
   [Chrome](https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn) 
   [Firefox](https://addons.mozilla.org/zh-CN/firefox/addon/ether-metamask/?utm_source=addons.mozilla.org&utm_medium=referral&utm_content=search)

2. Add [MVM network](/quorum/join) to Metamask

## Contract

Take a simple counter contract for example：

```solidity
//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract Counter {
    uint256 public count;
    constructor() {
        count = 0;
    }

    function addOne() public {
        count = count + 1;
    }

    function addAny(uint256 num) public {
        count = count + num;
    }
}
```

## Deploy Contract

### hardhat

We already prepared the [hardhat](https://hardhat.org/) [deploy examples](<https://github.com/MixinNetwork/mvmcontracts>), 
[MVM](/quorum/join) mainnet and testnet settings are provided.

run to deploy：
```shell
PRIVATE_KEY=privateKey yarn hardhat run --network quorum scripts/counter.ts
```

::: tip Notice 
Gas is needed to deploy contract, you should fill the private key of your wallet in.
:::

### remix

Deploy details in <https://developers.mixin.one/docs/mainnet/mvm/remix>

## Summary

We introduced how to deploy a contract on [MVM](/quorum/join) in this chapter.
You should save the deployed contract address, which will be used in chapter [Call Contract](/registry/call).

