## 四、定位错误

基于 MVM 开发的时候, 由于所有的合约都是通过 `contract.call()` 的形式来调用的, 当合约出现错误或者某个 require 检测没通过而导致执行失败的时候, 并不会在 registry 合约上反应出来.
> 在 registry 上就是正常的一笔回退的转账. 

相当于错误没有暴露出来. 这导致了开发过程中的错误调试变得非常困难.

所以我们也为你准备了一套定位错误的方案. (建议仅用于合约开发和测试阶段)

> 用于已知复现的操作路径, 来快速定位合约出问题的位置. 从而更快速的解决合约问题.

### 一个真实的案例
```sol
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
```

上面的合约是一个对 `uniswap` 添加流动性的改造. 

代码逻辑并不复杂,
1. 首先将用户转过来的资产, 先暂存到合约, 并结束.
2. 用户第二次转移另外的资产, 跟第一次转过来的资产, 一并授权给 `router` 合约.
3. 直接调用 `router` 合约的添加流动性方法.
4. 将多余的 `token` 还给用户.

经过实际测试, 发现经常不能使用, 所以合约内部肯定存在问题. 有意思的是, 这个问题并不是100%复现的.即有时候是成功调用的, 但有的时候就失败了.

由于失败的时候, registry 合约并没有反映出任何有价值的错误信息(只知道合约执行失败了) ,从而并不知道具体是哪一行出问题了.

我们可以采用以下思路来排查错误. 
1. 建立对外可读的全局状态
2. 在所有调用其他函数的地方加上 `try` `catch`
3. 在 `catch` 中改变全局状态
4. 当合约出现问题的时候, 直接从 `mvm` 上查看全局状态, 就能知道是哪个函数出现问题了.

```sol
// 我们向外部暴露 3 个全局变量
uint256 public errorStatus = 10000;
string public errorMsg = "test msg";
bytes public errorBytes;
function addLiquidity(address asset, uint256 amount) public {
    // 在每一处函数的调用的地方加上 try catch 并指定唯一的 errorStatus
    try IERC20(asset).transferFrom(msg.sender, address(this), amount){
    } catch Error(string memory error) {
        errorStatus = 1;
        errorMsg = error;
        return;
    } catch (bytes memory error) {
        errorStatus = 2;
        errorBytes = error;
        return;
    }

    Operation memory op = operations[msg.sender];
    if (op.asset == address(0)) {
        op.asset = asset;
        op.amount = amount;
        op.deadline = block.timestamp + AGE;
        operations[msg.sender] = op;
        return;
    }

    if (op.deadline < block.timestamp || op.asset == asset) {
        try IERC20(op.asset).transfer(msg.sender, op.amount) {
        } catch Error(string memory error) {
            errorStatus = 3;
            errorMsg = error;
            return;
        } catch (bytes memory error) {
            errorStatus = 4;
            errorBytes = error;
            return;
        }
        try IERC20(asset).transfer(msg.sender, amount) {
        } catch Error(string memory error) {
            errorStatus = 5;
            errorMsg = error;
            return;
        } catch (bytes memory error) {
            errorStatus = 6;
            errorBytes = error;
            return;
        }
        operations[msg.sender].asset = address(0);
        return;
    }

    try IERC20(op.asset).approve(router, op.amount) {
    } catch Error(string memory error) {
        errorStatus = 7;
        errorMsg = error;
        return;
    } catch (bytes memory error) {
        errorStatus = 8;
        errorBytes = error;
        return;
    }
    try IERC20(asset).approve(router, amount) {
    } catch Error(string memory error) {
        errorStatus = 9;
        errorMsg = error;
        return;
    } catch (bytes memory error) {
        errorStatus = 10;
        errorBytes = error;
        return;
    }

    try IUniswapV2Router02(router).addLiquidity(
        op.asset, asset,
        op.amount, amount,
        op.amount / 2, amount / 2,
        msg.sender,
        block.timestamp + AGE
    ) returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        if (op.amount > amountA) {
            IERC20(op.asset).transfer(msg.sender, op.amount - amountA);
        }
        if (amount > amountB) {
            IERC20(asset).transfer(msg.sender, amount - amountB);
        }
        operations[msg.sender].asset = address(0);
    } catch Error(string memory error) {
        errorStatus = 11;
        errorMsg = error;
        return;
    } catch (bytes memory error) {
        errorStatus = 12;
        errorBytes = error;
        return;
    };
}
```

加上了全局状态 和 `try` `catch` 之后, 我们就可以重新部署合约了.

然后用新的合约再去复现之前的问题. 一旦复现成功, 然后我们再去读取合约的错误状态码就肯定有变化了.

从而能够帮助我们更快速的定位错误. 

修复了之后, 可以直接把所有的 `try` `catch` 都移除即可.

### 定位成功
通过上述的思路和方法, 成功定位到错误代码为 `8`, 即 `approve` 的时候出问题了.

再仔细查看 `erc20` 标准的 `approve` 的代码, 就一目了然了.

```sol
function approve(address _spender, uint256 _value) public override returns (bool) {
    // To change the approve amount you first have to reduce the addresses`
    //  allowance to zero by calling `approve(_spender, 0)` if it is not
    //  already 0 to mitigate the race condition described here:
    //  https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
    require((_value == 0) || (allowed[msg.sender][_spender] == 0));
    allowed[msg.sender][_spender] = _value;
    emit Approval(msg.sender, _spender, _value);
    return true;
}
```

问题就在于我们返还用户资产的时候, `_value` 和 `allowed[msg.sender][_spender]` 均不为 0. 此时如果直接修改 `allowed[msg.sender][_spender]` 的状态, 将会引起另外的一个问题.

> 当被授权的用户检测到了这笔交易后, 可以有机会在这笔交易之前转走 `allowed[msg.sender][_spender]` 剩余的 `token`, 然后再转走新增 `_value` 的 `token`. 导致授权的用户可能会有额外的损失.

知道了这个信息之后, 代码就很容易修复了. 

> 即在返还用户余额的时候, 把 `approve` `router` 的金额重新设置为 `0` 即可.

最终修复完成的代码如下
```sol
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
        IERC20(op.asset).approve(router, 0); // 新增本行
    }
    if (amount > amountB) {
        IERC20(asset).transfer(msg.sender, amount - amountB);
        IERC20(asset).approve(router, 0); // 新增本行
    }
    operations[msg.sender].asset = address(0);
}
```



