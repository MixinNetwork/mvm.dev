# Deploy Uniswap on MVM

In the previous article, we mentioned that through the registry, the contract on the EVM can be migrated without any modification. In this chapter, we will introduce in detail how to deploy a uniswap smart contract.

We will deploy with Uniswap V2. Before deployment, we need to configure the Quorum testnet with metamask. For the specific configuration method, please refer to the chapter on how to join the testnet. 

The core uniswap code mainly includes [v2-core](https://github.com/Uniswap/v2-core) and [v2-periphery](https://github.com/Uniswap/v2-periphery). v2-core is the core function of Uniswap, and v2-periphery is a simple encapsulation on top of the core function, providing developers with an easier-to-use interface.   

## Deployment and Usage Process

1. Deploy UniswapV2Factory
2. Deploy UniswapV2Router02
3. Deploy UniswapMVMRouter
4. Call the contract through the registry 

## Deploy UniswapV2Factory

First, import all the v2-core contract code into Remix IDE, and then modify several parameters in the code. 

Note: These modifications are not made for deployment to MVM, these are just some modifications according to the configuration requirements for different network deployments. 

The first is to change the chainId in `contracts/UniswapV2ERC20.sol` to the network ID of the Quorum testnet. Note that the call to assembly is removed here, because the Uniswap code is very old, and many new features on the new network are not easy to support.  

```solidity
     constructor() public {
-        uint chainId;
-        assembly {
-            chainId := chainid
-        }
+        uint chainId = 82397;
         DOMAIN_SEPARATOR = keccak256(
```

The second modification is to add a simple event to the constructor of `contracts/UniswapV2Factory.sol` to facilitate getting the keccak256 value of the UniswapV2Pair contract bytecode, so as to prepare for subsequent file modifications.  

```solidity
+    event InitCode(bytes32 indexed hash);

     constructor(address _feeToSetter) public {
         feeToSetter = _feeToSetter;
+        bytes memory bytecode = type(UniswapV2Pair).creationCode;
+        emit InitCode(keccak256(bytecode));
     }
```

Then deploy UniswapV2Factory directly through Remix. There is only one parameter when deploying, and you can directly enter the address of your own testnet. After successful deployment, you will get the address of the contract. In MVM's Quorum testnet browser, you can get the output of the InitCode event added through viewing logs by searching for the contract address and opening it.

![image](https://prsdigg.com/rails/active_storage/blobs/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBcUFOIiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--ff2de56617bf6a8211019abd1bbe1d32d5131ca0/Screenshot%20from%202022-01-31%2008-35-56)

As shown in the above screenshot, what we need here is the string of numbers starting with `0x649f`, which will be used in the subsequent deployments. 

## Deploy UniswapV2Router02 

This contract is an auxiliary contract, and Uniswap can run without it, but this contract can make the operation easier. This contract is in the v2-periphery project. Similarly, create a new project in the Remix IDE, import all the contract files, and then modify the `pairFor` way of `contracts/libraries/UniswapV2Libary.sol`. 

To replace the string of numbers with the number starting with `0x649f` obtained when we deployed UniswapV2Factory in the previous step, and then remove 0x.

Then to deploy the UniswapV2Router02 contract with two parameters required. The factory is the contract address deployed in the previous step, and for the other WETH parameter, we can use any ETH address, because we do not need ETH related operations in MVM. 

So far, all the code of Uniswap V2 has been successfully deployed on MVM's Quorum testnet.

## Deploy UniswapMVMRouter 

This contract is a simple encapsulation we made based on Uniswap to make it more convenient for MM users to call (mainly for adding and removing liquidity). The code is very simple and can be directly placed in the file of contracts/UniswapMVVMRouter.sol under the `v2-periphery` project.

```
pragma solidity =0.6.6;

import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol';

import './interfaces/IUniswapV2Router02.sol';
import './interfaces/IERC20.sol';
import './libraries/UniswapV2Library.sol';

contract UniswapMVMRouter {
    address immutable router;
    uint256 constant AGE = 300;
    mapping(address => Operation) public operations;

    struct Operation {
        address asset;
        uint256 amount;
        uint256 deadline;
    }

    constructor(address _router) public {
        router = _router;
    }

    function addLiquidity(address asset, uint256 amount) public {        
        IERC20(asset).transferFrom(msg.sender, address(this), amount);

        Operation memory op = operations[msg.sender];
        if (op.asset == address(0)) {
            op.asset = asset;
            op.amount = amount;
            op.deadline = block.timestamp + AGE;
            operations[msg.sender] = op;
            return;
        }

        if (op.deadline < block.timestamp || op.asset == asset) {
            IERC20(op.asset).transfer(msg.sender, op.amount);
            IERC20(asset).transfer(msg.sender, amount);
            operations[msg.sender].asset = address(0);
            return;
        }

        IERC20(op.asset).approve(router, op.amount);
        IERC20(asset).approve(router, amount);

        uint256 amountA = op.amount;
        uint256 amountB = amount;
        uint256 liquidity;
        (amountA, amountB, liquidity) = IUniswapV2Router02(router).addLiquidity(
            op.asset, asset,
            amountA, amountB,
            amountA / 2, amountB / 2,
            msg.sender,
            block.timestamp + AGE
        );

        if (op.amount > amountA) {
            IERC20(op.asset).transfer(msg.sender, op.amount - amountA);
        }
        if (amount > amountB) {
            IERC20(asset).transfer(msg.sender, amount - amountB);
        }
        operations[msg.sender].asset = address(0);
    }

    function claim() public {
        Operation memory op = operations[msg.sender];
        if (op.asset == address(0)) {
            return;
        }
        IERC20(op.asset).transfer(msg.sender, op.amount);
    }
}
```

This contract deployment has only one parameter, which is the contract address of the `UniswapV2Router02` we deployed in the previous step. After it is deployed successfully, we will get a new contract address, and with this address we can initiate the simplest Registry command through the MVM command. 

## Call the Contract Through the Registry

In the previous article, we have introduced the deployment and principle of registry in detail. Next, we will use this example to demonstrate how to call the uniswap contract through the registry. 

The first step is to add liquidity. In the previous paragraph, we mentioned UniswapMVVMRouter, mainly because in the mixin, you can only operate one asset at a time, so you need to add liquidity twice.

### Add BTC to the Liquidity Pool

The operation of adding liquidity by Mixin users is completed through a multi-signature transfer to mtg, as the following two steps:

1. The developer (arbitrarily) generates a https://mixin.one/codes/:id

   Use Operation encode as memo, and call POST /payments interface, related documentation: 
   https://developers.mixin.one/zh-CN/docs/api/transfer/payment

  Operation structure,
  
  ```
  op := &encoding.Operation{
    Purpose: encoding.OperationPurposeGroupEvent, // fixed value 1
    Process: c.String("process"), // officially maintained registry PID 60e17d47-fa70-3f3f-984d-716313fe838a TODO
    Extra:   extra, // the content of the contract execution
  }
  
  extra: 7c15d0d2faa1b63862880bed982bd3020e1f1a9a5668870000000000000000000000000099cfc3d0c229d03c5a712b158a29ff186b294ab300000000000000000000000000000000000000000000000000000000000007d0
  
    extra contains two parts:
  a. 0x7c15d0D2faA1b63862880Bed982bd3020e1f1A9A is all lowercase after removing 0x, which is the address of the contract execution 
  b. starting from 566887, it is the ABI value with detailed parameters through way of the addLiquidity(address,uint256), 
     In the above example, c6d0c728-2624-429b-8e0d-d9d19b6592fa is the asset ID of BTC in the Mixin network.
     ABI code of amount 0.00002, which will be introduced separately. 
     Code format reference：https://docs.soliditylang.org/en/v0.8.12/abi-spec.html
  ```
  
  The way to obtain the correspondence of assets can be found in the Q&A part. 

2. For the user payment, the mixin messenger can be used to scan the code (or evoke) to pay. 

  In the previous step, the link to https://mixin.one/codes/:id will be obtained, and the user can evoke payment by scanning the code or through messenger.

What the developer needs to do is to generate a `code_id`, and provide the user with a payment link https://mixin.one/codes/:id. Thus, the user only needs to pay through the link to use the contract. 

### Add XIN to the Liquidity Pool

The same way as the addition of BTC liquidity can be used for the addition of XIN liquidity. A new extra generation is needed. 

```
  op := &encoding.Operation{
    Purpose: encoding.OperationPurposeGroupEvent, // fixed value 1
    Process: c.String("process"), // officially maintained registry PID 60e17d47-fa70-3f3f-984d-716313fe838a TODO
    Extra:   extra, // the content of the contract execution
  }
  
  extra: 7c15d0d2faa1b63862880bed982bd3020e1f1a9a56688700000000000000000000000000bd6efc2e2cb99aef928433209c0a3be09a34f11400000000000000000000000000000000000000000000000000000000000007d0
```

The developer generates the payment link https://mixin.one/codes/:id, and the user invokes the payment by scanning the code or through the messenger.

So far, deploying Uniswap on MVM and adding liquidity to Uniswap is completed. Through the MVM testnet browser (https://testnet.mvmscan.com/address/0x5aD700bd8B28C55a2Cac14DCc9FBc4b3bf37679B), you can easily view all the operation results related to the Registry process.  

## Deployment Example

We have implemented a complete example of deploying uniswap through hardhat, in which the Quorum testnet can be used directly. Smart contracts can be easily deployed through fork.

uniswap deployment script address：https://github.com/MixinNetwork/mvmcontracts/blob/main/scripts/uniswap.ts

## Conclusion

Deploying Uniswap on MVM is very simple. There is no need to modify the codes, but only the modification of a few necessary configuration parameters. 
