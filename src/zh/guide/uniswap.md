# MVM 上部署 Uniswap

在上一篇文章中，我们提到通过 registry, 可以不用做任何修改来迁移 EVM 上的合约，这一章我们就来详细介绍一下，如何部署一个 uniswap 的合约。

我们会用 Uniswap V2 版本来部署。在部署之前需要先用 metamask 配置到 Quorum 的测试网，具体的配置方式可以参考，如何加入测试网那一章节内容。

核心的 uniswap 代码主要包含 [v2-core](https://github.com/Uniswap/v2-core) 跟 [v2-periphery](https://github.com/Uniswap/v2-periphery) 两部分。 v2-core 是 Uniswap 最核心的功能，v2-periphery 是在核心功能之上的一层简单的封装，给开发者提供更易用的接口。

## 部署及使用流程

1. 部署 UniswapV2Factory
2. 部署 UniswapV2Router02
3. 部署UniswapMVMRouter
4. 通过 registry 调用合约

## 部署 UniswapV2Factory

首先将所有的 v2-core 合约代码导入到 Remix IDE，然后对代码里面的几处参数作一下修改。

注意：这些修改不是因为要部署到 MVM 才修改的，这只是一些针对不同网络部署的配置文件性质的修改。

第一个是将 `contracts/UniswapV2ERC20.sol` 中的 chainId 修改成 Quorum 测试网的网络 ID，注意这里去掉了对 assembly 的调用，是因为 Uniswap 的代码非常古老，很多新的特性在新的网络上支持不好。

```solidity
     constructor() public {
-        uint chainId;
-        assembly {
-            chainId := chainid
-        }
+        uint chainId = 82397;
         DOMAIN_SEPARATOR = keccak256(
```

第二处修改是在 `contracts/UniswapV2Factory.sol` 的 constructor 中添加一个简单的 event 来方便知道 UniswapV2Pair 这个合约字节码的 keccak256 值，方便对后续的文件修改做准备。

```solidity
+    event InitCode(bytes32 indexed hash);

     constructor(address _feeToSetter) public {
         feeToSetter = _feeToSetter;
+        bytes memory bytecode = type(UniswapV2Pair).creationCode;
+        emit InitCode(keccak256(bytecode));
     }
```

然后直接通过 Remix 来部署 UniswapV2Factory 了，部署时只有一个参数，可以直接输入自己的测试网的地址即可，部署成功后，会得到这个合约的地址。在 MVM 的 Quorum 测试网浏览器，搜索这个合约地址打开后，查看 logs 会得到我们添加的这个 InitCode 事件的输出结果。

![image](https://prsdigg.com/rails/active_storage/blobs/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBcUFOIiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--ff2de56617bf6a8211019abd1bbe1d32d5131ca0/Screenshot%20from%202022-01-31%2008-35-56)

如图上所示，这里我们需要的是 `0x649f` 开头的字符串，在后面部署中需要用到。

## UniswapV2Router02 部署

这个合约是辅助合约，不需要它 Uniswap 就可以运行，但是有这个合约会让操作变得更简单。这个合约在 v2-periphery 项目中，同样的在 Remix IDE 中新建立一个项目，并把所有的合约文件导入，然后修改 `contracts/libraries/UniswapV2Libary.sol` 的 `pairFor` 方法。

就是把那一串数字换成我们上一个步骤部署 UniswapV2Factory 时得到的那个 `0x649f` 开头的数字，去掉 0x。

然后部署 UniswapV2Router02 这个合约，需要两个参数，factory 就是上一个步骤部署后的合约地址，另一个 WETH 参数可以随便使用一个 ETH 地址即可，因为我们 MVM 中并不需要 ETH 相关的操作。

至此 Uniswap V2 的所有代码都已经成功部署在了 MVM 的 Quorum 测试网

## UniswapMVMRouter 部署

这个合约是我们基于 Uniswap 做了一个简单的封装，来让 MM 用户调用更方便 （主要是添加，移除流动性)，代码非常简单，直接放在 `v2-periphery` 项目的 contracts/UniswapMVMRouter.sol 文件里即可。

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

这个合约部署，参数只有一个，就是上一步骤中我们部署的 `UniswapV2Router02` 的合约地址。在部署成功之后，我们会得到一个新的合约地址，有了这个地址我们就可以通过 MVM 命令发起最简单的 Registry 指令了。

## 通过 registry 调用合约

在上一篇文章中，我们已经详细介绍了 registry 的部署及原理，接下来通过这个示例来演示如何通过调用 uniswap 的合约。

第一步是添加流动性，在上一段中，我们提到 UniswapMVMRouter，主要是因为在 mixin 中，一次只能操作一个资产，所以需要分两次添加流动性。

### 添加 BTC 进流动池

Mixin 用户添加流动性的操作，也是通过一次给 mtg 的多签转帐完成的，分为两步：

1. 开发者(任意)生成一个 https://mixin.one/codes/:id

   把 Operation encode 之后做为 memo, 调用 POST /payments 接口, 相关文档：
   https://developers.mixin.one/zh-CN/docs/api/transfer/payment

  Operation 结构
  
  ```
  op := &encoding.Operation{
    Purpose: encoding.OperationPurposeGroupEvent, // 固定值 1
    Process: c.String("process"), // 官方维护的 registry 的 PID 60e17d47-fa70-3f3f-984d-716313fe838a TODO
    Extra:   extra, // 合约执行的内容
  }
  
  extra: 7c15d0d2faa1b63862880bed982bd3020e1f1a9a5668870000000000000000000000000099cfc3d0c229d03c5a712b158a29ff186b294ab300000000000000000000000000000000000000000000000000000000000007d0
  
    extra 分成两部分:
  a. 0x7c15d0D2faA1b63862880Bed982bd3020e1f1A9A 去掉 0x 后全部小写, 是需要执行合约的地址
  b. 从 566887 开始则是 addLiquidity(address,uint256) 方法加详细参数的 ABI 值, 
     上面的例子中是 c6d0c728-2624-429b-8e0d-d9d19b6592fa 是 BTC 在 Mixin 网络里的资产 ID
     amount 0.00002 的 ABI 编码, 这个我们会单独的介绍
     编码格式参照：https://docs.soliditylang.org/en/v0.8.12/abi-spec.html
  ```
  
  获取资产对应关系的方式，可以在 Q&A 里找到。

2. 用户支付，使用 mixin messenger 扫码（或者唤起）支付。

  在上一步中，会获取到 https://mixin.one/codes/:id 的链接，用户可以通过扫码或者 messenger 中唤起支付。

开发者需要做的是生成 `code_id`, 给用户提供支付链接 https://mixin.one/codes/:id, 用户使用合约，只需要通过该链接支付即可。

### 添加 XIN 进流动池

XIN 流动性的添加，跟 BTC 流动性添加方式一样，生成新的 extra

```
  op := &encoding.Operation{
    Purpose: encoding.OperationPurposeGroupEvent, // 固定值 1
    Process: c.String("process"), // 官方维护的 registry 的 PID 60e17d47-fa70-3f3f-984d-716313fe838a TODO
    Extra:   extra, // 合约执行的内容
  }
  
  extra: 7c15d0d2faa1b63862880bed982bd3020e1f1a9a56688700000000000000000000000000bd6efc2e2cb99aef928433209c0a3be09a34f11400000000000000000000000000000000000000000000000000000000000007d0
```

开发者生成支付链接 https://mixin.one/codes/:id ，用户通过扫码或者 messenger 中唤起支付。

到目前为止，在 MVM 上部署 Uniswap，给 Uniswap 添加流动性就完成了。通过 MVM 测试网浏览器（https://testnet.mvmscan.com/address/0x5aD700bd8B28C55a2Cac14DCc9FBc4b3bf37679B）可以方便的查看 Registry 进程相关的所有的操作结果。

## 部署示例

我们实现了一个通过 hardhat 部署 uniswap 的完整示例，其中的 Quorum 测试网可以直接使用，通过 fork 可以方便的部署自己的合约。

uniswap 部署脚本地址：https://github.com/MixinNetwork/mvmcontracts/blob/main/scripts/uniswap.ts

## 总结

在 MVM 上部署 Uniswap 非常简单，完全不需要修改代码，只是几个必须的配置参数的修改。
