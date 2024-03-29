## 五、 uniswap(v2) 迁移教程

### 1. 本章须知

::: tip 学完本章将会了解

1. 将现有的合约迁移到 Mvm 的思路
2. 如何动用 mvm(registry) 映射的用户地址里的 erc20 的资产

:::

:::danger
请完成之前的内容讲解后, 再继续学习本章.
:::

### 2. 前置准备

1. [uniswap 工厂合约地址](https://etherscan.io/address/0x7a250d5630b4cf539739df2c5dacb4c659f2488d#code)

2. [uniswap 路由合约地址](https://etherscan.io/address/0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f#code)

### 3. 部署 uniswap 工厂合约

1. 添加 `INIT_CODE` 到工厂合约

```sol
bytes32 public constant INIT_CODE = keccak256(abi.encodePacked(type(UniswapV2Pair).creationCode));
```

2. 修改 `chain_id=83927`

3. 修改部署参数并部署合约

### 4. 部署 uniswap 路由合约

1. 获取工厂合约 `INIT_CODE`

2. 修改路由合约 _701 行_ 的 `hex` 为 `INIT_CODE`(去掉 0x)

3. 修改部署参数并部署合约

### 5. 关于 uniswap 合约的改造 (mvmRouter 合约)

先上代码

```sol
pragma solidity =0.6.6;


interface IUniswapV2Factory {
    event PairCreated(address indexed token0, address indexed token1, address pair, uint);

    function feeTo() external view returns (address);
    function feeToSetter() external view returns (address);

    function getPair(address tokenA, address tokenB) external view returns (address pair);
    function allPairs(uint) external view returns (address pair);
    function allPairsLength() external view returns (uint);

    function createPair(address tokenA, address tokenB) external returns (address pair);

    function setFeeTo(address) external;
    function setFeeToSetter(address) external;
}


interface IUniswapV2Router01 {
    function factory() external pure returns (address);
    function WETH() external pure returns (address);

    function addLiquidity(

        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB, uint liquidity);
    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external payable returns (uint amountToken, uint amountETH, uint liquidity);
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB);
    function removeLiquidityETH(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external returns (uint amountToken, uint amountETH);
    function removeLiquidityWithPermit(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external returns (uint amountA, uint amountB);
    function removeLiquidityETHWithPermit(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external returns (uint amountToken, uint amountETH);
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline)
        external
        payable
        returns (uint[] memory amounts);
    function swapTokensForExactETH(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline)
        external
        returns (uint[] memory amounts);
    function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)
        external
        returns (uint[] memory amounts);
    function swapETHForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline)
        external
        payable
        returns (uint[] memory amounts);

    function quote(uint amountA, uint reserveA, uint reserveB) external pure returns (uint amountB);
    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) external pure returns (uint amountOut);
    function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut) external pure returns (uint amountIn);
    function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts);
    function getAmountsIn(uint amountOut, address[] calldata path) external view returns (uint[] memory amounts);
}
interface IUniswapV2Router02 is IUniswapV2Router01 {
    function removeLiquidityETHSupportingFeeOnTransferTokens(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external returns (uint amountETH);
    function removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external returns (uint amountETH);

    function swapExactTokensForTokensSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external;
    function swapExactETHForTokensSupportingFeeOnTransferTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable;
    function swapExactTokensForETHSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external;
}

interface IERC20 {
    event Approval(address indexed owner, address indexed spender, uint value);
    event Transfer(address indexed from, address indexed to, uint value);

    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
    function totalSupply() external view returns (uint);
    function balanceOf(address owner) external view returns (uint);
    function allowance(address owner, address spender) external view returns (uint);

    function approve(address spender, uint value) external returns (bool);
    function transfer(address to, uint value) external returns (bool);
    function transferFrom(address from, address to, uint value) external returns (bool);
}

library SafeMath {
    function add(uint x, uint y) internal pure returns (uint z) {
        require((z = x + y) >= x, 'ds-math-add-overflow');
    }

    function sub(uint x, uint y) internal pure returns (uint z) {
        require((z = x - y) <= x, 'ds-math-sub-underflow');
    }

    function mul(uint x, uint y) internal pure returns (uint z) {
        require(y == 0 || (z = x * y) / y == x, 'ds-math-mul-overflow');
    }
}

interface IUniswapV2Pair {
    event Approval(address indexed owner, address indexed spender, uint value);
    event Transfer(address indexed from, address indexed to, uint value);

    function name() external pure returns (string memory);
    function symbol() external pure returns (string memory);
    function decimals() external pure returns (uint8);
    function totalSupply() external view returns (uint);
    function balanceOf(address owner) external view returns (uint);
    function allowance(address owner, address spender) external view returns (uint);

    function approve(address spender, uint value) external returns (bool);
    function transfer(address to, uint value) external returns (bool);
    function transferFrom(address from, address to, uint value) external returns (bool);

    function DOMAIN_SEPARATOR() external view returns (bytes32);
    function PERMIT_TYPEHASH() external pure returns (bytes32);
    function nonces(address owner) external view returns (uint);

    function permit(address owner, address spender, uint value, uint deadline, uint8 v, bytes32 r, bytes32 s) external;

    event Mint(address indexed sender, uint amount0, uint amount1);
    event Burn(address indexed sender, uint amount0, uint amount1, address indexed to);
    event Swap(
        address indexed sender,
        uint amount0In,
        uint amount1In,
        uint amount0Out,
        uint amount1Out,
        address indexed to
    );
    event Sync(uint112 reserve0, uint112 reserve1);

    function MINIMUM_LIQUIDITY() external pure returns (uint);
    function factory() external view returns (address);
    function token0() external view returns (address);
    function token1() external view returns (address);
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
    function price0CumulativeLast() external view returns (uint);
    function price1CumulativeLast() external view returns (uint);
    function kLast() external view returns (uint);

    function mint(address to) external returns (uint liquidity);
    function burn(address to) external returns (uint amount0, uint amount1);
    function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external;
    function skim(address to) external;
    function sync() external;

    function initialize(address, address) external;
}
library UniswapV2Library {
    using SafeMath for uint;

    // returns sorted token addresses, used to handle return values from pairs sorted in this order
    function sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
        require(tokenA != tokenB, 'UniswapV2Library: IDENTICAL_ADDRESSES');
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), 'UniswapV2Library: ZERO_ADDRESS');
    }

    // calculates the CREATE2 address for a pair without making any external calls
    function pairFor(address factory, address tokenA, address tokenB) internal pure returns (address pair) {
        (address token0, address token1) = sortTokens(tokenA, tokenB);
        pair = address(uint(keccak256(abi.encodePacked(
                hex'ff',
                factory,
                keccak256(abi.encodePacked(token0, token1)),
                hex'1080610c708f393d5ef01d6d4476f26a3420492740ce209f0f1d8bb4d1d2d213' // init code hash
            ))));
    }

    // fetches and sorts the reserves for a pair
    function getReserves(address factory, address tokenA, address tokenB) internal view returns (uint reserveA, uint reserveB) {
        (address token0,) = sortTokens(tokenA, tokenB);
        (uint reserve0, uint reserve1,) = IUniswapV2Pair(pairFor(factory, tokenA, tokenB)).getReserves();
        (reserveA, reserveB) = tokenA == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
    }

    // given some amount of an asset and pair reserves, returns an equivalent amount of the other asset
    function quote(uint amountA, uint reserveA, uint reserveB) internal pure returns (uint amountB) {
        require(amountA > 0, 'UniswapV2Library: INSUFFICIENT_AMOUNT');
        require(reserveA > 0 && reserveB > 0, 'UniswapV2Library: INSUFFICIENT_LIQUIDITY');
        amountB = amountA.mul(reserveB) / reserveA;
    }

    // given an input amount of an asset and pair reserves, returns the maximum output amount of the other asset
    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) internal pure returns (uint amountOut) {
        require(amountIn > 0, 'UniswapV2Library: INSUFFICIENT_INPUT_AMOUNT');
        require(reserveIn > 0 && reserveOut > 0, 'UniswapV2Library: INSUFFICIENT_LIQUIDITY');
        uint amountInWithFee = amountIn.mul(997);
        uint numerator = amountInWithFee.mul(reserveOut);
        uint denominator = reserveIn.mul(1000).add(amountInWithFee);
        amountOut = numerator / denominator;
    }

    // given an output amount of an asset and pair reserves, returns a required input amount of the other asset
    function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut) internal pure returns (uint amountIn) {
        require(amountOut > 0, 'UniswapV2Library: INSUFFICIENT_OUTPUT_AMOUNT');
        require(reserveIn > 0 && reserveOut > 0, 'UniswapV2Library: INSUFFICIENT_LIQUIDITY');
        uint numerator = reserveIn.mul(amountOut).mul(1000);
        uint denominator = reserveOut.sub(amountOut).mul(997);
        amountIn = (numerator / denominator).add(1);
    }

    // performs chained getAmountOut calculations on any number of pairs
    function getAmountsOut(address factory, uint amountIn, address[] memory path) internal view returns (uint[] memory amounts) {
        require(path.length >= 2, 'UniswapV2Library: INVALID_PATH');
        amounts = new uint[](path.length);
        amounts[0] = amountIn;
        for (uint i; i < path.length - 1; i++) {
            (uint reserveIn, uint reserveOut) = getReserves(factory, path[i], path[i + 1]);
            amounts[i + 1] = getAmountOut(amounts[i], reserveIn, reserveOut);
        }
    }

    // performs chained getAmountIn calculations on any number of pairs
    function getAmountsIn(address factory, uint amountOut, address[] memory path) internal view returns (uint[] memory amounts) {
        require(path.length >= 2, 'UniswapV2Library: INVALID_PATH');
        amounts = new uint[](path.length);
        amounts[amounts.length - 1] = amountOut;
        for (uint i = path.length - 1; i > 0; i--) {
            (uint reserveIn, uint reserveOut) = getReserves(factory, path[i - 1], path[i]);
            amounts[i - 1] = getAmountIn(amounts[i], reserveIn, reserveOut);
        }
    }
}

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
            IERC20(op.asset).approve(router, 0);
        }
        if (amount > amountB) {
            IERC20(asset).transfer(msg.sender, amount - amountB);
            IERC20(asset).approve(router, 0);
        }
        operations[msg.sender].asset = address(0);
    }


    function removeLiquidity(
        address pair,
        address tokenA,
        address tokenB,
        address to,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin
    ) public {
        IERC20(pair).approve(router, liquidity);
        IUniswapV2Router02(router).removeLiquidity(
            tokenA, tokenB,
            liquidity,
            amountAMin, amountBMin,
            to,
            block.timestamp + AGE
        );
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

#### 思路讲解

1. 添加流动性

   基于现有的 registry 合约的规则. 所有的资产在调用结束后都会尝试退还. 所以并不支持直接通过 `mvm` 内 `erc20` 的 `approve` 的方法来使用 Mixin 的资产.

   所以添加流动性的改造部分思路就是,

   先要添加的第一个资产转账给 mvmRouter 合约.

   再将第二个资产转账给 mvmRouter 合约.

   然后通过 mvmRouter 合约一次性调用 uniswapRouter 合约的 `addLiquidity` 方法.

   最后将多余的资产退还给用户合约.

2. 兑换

   兑换这部分就可以直接调用 `uniswapRouter` 合约的 `swapTokensForExactTokens` 方法.

3. 移除流动性

   添加完流动性后, 权益凭证的资产会转给 `registry` 映射的用户合约, 由于这个资产并没有在 Mixin 上注册过, 所以会留在那个用户合约的账户中(并不会转给 Mixin 的用户).

   所以这里首先需要用户合约的环境来调用 `approve` 方法. 将资产授权给 `uniswapRouter` 合约, 然后再调用 `removeLiquidity` 方法.

### 6. 使用上述合约进行工作

1. 添加流动性

```js
import { 
  MixinApi, 
  Registry, 
  MVMMainnet, 
  getExtra,
  encodeMemo
} from '@mixin.dev/mixin-node-sdk';
import { v4 as uuid } from 'uuid';
import keystore from './keystore.json';

keystore.user_id = keystore.client_id;
const client = MixinApi({ keystore });
const registry = new Registry({
  address: MVMMainnet.Registry.Address,
  uri: MVMMainnet.RPCUri,
});

const cnbAssetID = '965e5c6e-434c-3fa9-b780-c50f43cd955c';
const roayAssetID = '69b2d237-1eb2-3b6c-8e1d-3876e507b263';

async function addLiquidity() {
  const assetAmount = 0.0001;
  const assetContract = await registry.fetchAssetContract(cnbAssetID);

  const contract = {
    address: '0xD69D54724c6d6B4F071429ED8D562c1F97CDF7f0',
    method: 'addLiquidity',
    types: ['address', 'uint256'],
    values: [assetContract, assetAmount * 1e8], 
  };
  const extra = getExtra([contract]);

  const params = {
    asset_id: roayAssetID,
    // 默认金额
    amount: String(assetAmount),
    // 唯一标识
    trace_id: uuid(),
    // 备注
    memo: encodeMemo(extra, MVMMainnet.Registry.Contract),
    // 多签
    opponent_multisig: {
      receivers: MVMMainnet.MVMMembers,
      threshold: MVMMainnet.MVMThreshold,
    },
  };
  
  const txInput = await client.payment.request(params);
  const res = await client.transfer.toAddress(keystore.pin, txInput);
  console.log(res);
}
```

2. 兑换

```js
import { 
  MVMApi,
  MVMApiURI,
  Registry, 
  MVMMainnet, 
  getExtra 
} from '@mixin.dev/mixin-node-sdk';
import { v4 as uuid } from 'uuid';

const client = MVMApi(MVMApiURI);
const registry = new Registry({
  address: MVMMainnet.Registry.Address,
  uri: MVMMainnet.RPCUri
});

const cnbAssetID = '965e5c6e-434c-3fa9-b780-c50f43cd955c';
const roayAssetID = '69b2d237-1eb2-3b6c-8e1d-3876e507b263';

async function swap() {
  const tokenA = await registry.fetchAssetContract(roayAssetID);
  const tokenB = await registry.fetchAssetContract(cnbAssetID);
  const _amountA = 0.000001;
  const _amountB = 0.00000005;
  const amountA = (_amountA * 1e8) | 0;
  const amountB = (_amountB * 1e8) | 0;
  const userContract = await registry.fetchUserContract('3dbf04fe-afc4-35ca-b686-a174437ccdb5');
  const time = Math.ceil(Date.now() / 1000) + 300;
  const types = ['uint', 'uint', 'address[]', 'address', 'uint'];
  const values = [amountA, amountB, [tokenA, tokenB], userContract, time];

  const contract = {
    address: '0xa71E83E79DED8dD19F471dA4Eda58dCc06D5cEb6',
    method: 'swapExactTokensForTokens',
    types,
    values,
  };
  const extra = getExtra([contract]);

  const params = {
    // 币种
    asset_id: roayAssetID,
    // 默认金额
    amount: String(_amountA),
    // 唯一标识
    trace_id: uuid(),
    // 备注
    memo: encodeMemo(extra, MVMMainnet.Registry.PID),
    // 多签
    opponent_multisig: {
      receivers: MVMMainnet.MVMMembers,
      threshold: MVMMainnet.MVMThreshold,
    },
  };

  // extra.length > 200
  const txInput = await client.payments(params);
  console.log(`mixin://codes/${txInput.code_id}`);
}
```

3. 移除流动性

```js
import {
  MVMApi, 
  MVMApiURI,
  Registry, 
  MVMMainnet, 
  getExtra 
} from '@mixin.dev/mixin-node-sdk';
import { v4 as uuid } from 'uuid';

const client = MVMApi(MVMApiURI);
const registry = new Registry({
  address: MVMMainnet.Registry.Address,
  uri: MVMMainnet.RPCUri,
});

const cnbAssetID = '965e5c6e-434c-3fa9-b780-c50f43cd955c';
const roayAssetID = '69b2d237-1eb2-3b6c-8e1d-3876e507b263';

async function main() {
  const tokenA = await registry.fetchAssetContract(roayAssetID);
  const tokenB = await registry.fetchAssetContract(cnbAssetID);
  const userContract = await registry.fetchUserContract('3dbf04fe-afc4-35ca-b686-a174437ccdb5');

  const contract = {
    address: '0xD69D54724c6d6B4F071429ED8D562c1F97CDF7f0',
    method: 'removeLiquidity', 
    types: ['address', 'address', 'address', 'address', 'uint256', 'uint256', 'uint256'],
    values: [
       '0xc9f4bc2A7afEe68E6e8202fFc2b8d77d7E7B9eC9',
       tokenA,
       tokenB,
       userContract,
       (9e-16 * 1e18) | 0,
       0,
       0,
    ],
  };
  const extra = getExtra([contract]);

  const params = {
    // 默认币种
    asset_id: cnbAssetID,
    // 默认金额
    amount: '0.00000001',
    // 唯一标识
    trace_id: uuid(),
    // 备注
    memo: encodeMemo(extra, MVMMainnet.Registry.PID),
    // 多签
    opponent_multisig: {
      receivers: MVMMainnet.MVMMembers,
      threshold: MVMMainnet.MVMThreshold,
    },
  };
  
  // extra.length > 200
  const txInput = await client.payments(params);
  console.log(`mixin://codes/${txInput.code_id}`);
}
```
