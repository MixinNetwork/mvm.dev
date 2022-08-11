# Debug 

## Browser Logs

You will find `ProcessCalled` event in a transaction log if `memo` is encoded correctly.
That is to say that it is probably the cause of `memo` if contract execution failed and there's no `ProcessCalled` event in the log.

The contract execution successes when `result` is `true` in `ProcessCalled` event, and `output` is the result of contract.

The contract execution fails when `result` is `false` in `ProcessCalled` event, and `output` is error, which you parse through `xxd`.

example：

```shell
# result: false
# output: 08c379a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000c6e6f742072656769737472790000000000000000000000000000000000000000
    
echo 08c379a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000c6e6f742072656769737472790000000000000000000000000000000000000000 | xxd -r -p
# �y� 
#     not registry    
```

## True Case
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

It is a modified contract of `addLiquidity` function in `uniswap`.

The steps are:
1. temporarily save the asset transferred by user to contract.
2. approve the two assets transferred by user to `router` contract.
3. call addLiquidity function of `router` contract.
4. return the extra `token` to user.

This function fails frequently but success sometimes.
We can debug following these steps:
1. set public state
2. add `try` `catch` when calling other function
3. change the public state in `catch`
4. check public state when error occurs

```sol
// expose 3 public state
uint256 public errorStatus = 10000;
string public errorMsg = "test msg";
bytes public errorBytes;

function addLiquidity(address asset, uint256 amount) public {
    // add try + catch when calling other function and specify the unique errorStatus
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

### success
After redeploying, successfully find errorStatus is `8`, which means the problem happens when `approve`.

This is standard `approve` function of ERC20 contract:

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

When return user's asset, `_value` and `allowed[msg.sender][_spender]` are both not 0. If we change `allowed[msg.sender][_spender]`, a problem will be caused:

> when approved contract detects the transaction, it has the chance to transfer the rest token in `allowed[msg.sender][_spender]`,
> then transfer the token from new `_value`. User may have extra loss.

Way to fix:

> Before return asset to user, set `approve` of `router` to `0`.

The final code is
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
        IERC20(op.asset).approve(router, 0); // new line
    }
    if (amount > amountB) {
        IERC20(asset).transfer(msg.sender, amount - amountB);
        IERC20(asset).approve(router, 0); // new line
    }
    operations[msg.sender].asset = address(0);
}
```