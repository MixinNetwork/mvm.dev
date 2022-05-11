## 二、计数器合约

::: tip 学完本章将会了解

1. [remix](https://remix.ethereum.org/)(或其他方式) 编写/部署/合约/调用
2. 使用 nodejs/Messenger 调用 mvm 内的合约(不含参数及传入参数).

:::

::: danger 注意
此教程需要掌握以下内容

1. 安装 [nodejs](https://nodejs.org/en/download/) 及 js 的基本语法.
2. 手机里已经有 [Mixin Messenger](https://mixin.one/messenger)

:::

### 1. 编写计数器合约

```sol
//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract Counter { // 计数器合约
    uint256 public count; // 计数器
    constructor() { // 初始化函数
        count = 0; // 将计数器置为 0
    }

    function addOne() public { // 计数器+1 的函数
        count = count + 1;
    }

    function addAny(uint256 num) public { // 计数器+num 的函数
        count = count + num;
    }
}
```

### 2. 编译、并发布计数器合约

> 合约地址: `0x4f31E2eAF25DCDD46651AcE019B61E3E750023E0`

### 3. 调用测试计数器合约

### 4. 使用 Messenger 调用计数器合约

下面进入重头戏, 其实合约代码的部分都很简单.

核心是如何通过 Messenger 能够直接与合约进行交互.

> 以下调用示例语言为 js

### 4.1 初始化项目

```shell
mkdir mvm-invoke # 初始化工作目录
cd mvm-invoke # 进入工作目录
npm init -y # 初始化 npm 项目
npm install mixin-node-sdk # 安装 nodejs 的 sdk
# 注意 mixin-node-sdk 的版本要 >= 3.0.24
```

### 4.2 准备 `keystore.json`

如果要使用 sdk 直接发送交易来调用合约的话, 需要往这个机器人里充一点 CNB.

> 建议直接换成自己的 keystore.json, 然后冲入一些 CNB

```json title='keystore.json'
{
  "client_id": "3dbf04fe-afc4-35ca-b686-a174437ccdb5",
  "session_id": "43bab197-fbb1-4534-9930-99fc9830e25c",
  "full_name": "MVM Contract User 1648870654",
  "private_key": "pIRdMkYeNBplIYhvU1yh-8Cn6VklwL_Bf7QQ3Ts3ivrd7gcG5GrWWXDB6UEJYXXLNkEv9eVo9HwxDm9M6iPSdQ",
  "pin": "102350",
  "pin_token": "yRhF-J7_7Pj9lys9BHxQ8DecdcxDa7rGTasISHk_9TQ"
}
```

### 4.3 不带参数的合约调用

1. 直接用 sdk 发送交易, 调用合约

```js
const { paymentGenerateByInfo, Client } = require('mixin-node-sdk')
const keystore = require('./keystore.json')
const client = new Client(keystore)

async function main() {
  // 2. 生成 payment
  const txInput = await paymentGenerateByInfo({
    // 要调用的合约地址
    contractAddress: '0x4f31E2eAF25DCDD46651AcE019B61E3E750023E0',
    // 合约方法
    methodName: 'addOne',
    payment: {
      type: 'tx',
    },
  })

  // 4.1. 直接发送交易
  const res = await client.transaction(txInput) // 此操作需要上述账户有 0.00000001 CNB.
  // 转账完毕后, cnb 会自行退回.
  console.log(res)
}
```

2. 在 Mixin Messenger 内发送交易, 调用合约

:::tip 提示
在 Mixin 内调用起支付, 其实只用让用户打开特定格式的链接就可以实现, 如:
`mixin://codes/xxxxx`
:::

```js
const { paymentGenerateByInfo } = require('mixin-node-sdk')
async function main() {
  // 到这里, 同上. (注释同上)
  // 生成 payment
  const payment = await paymentGenerateByInfo({
    contractAddress: '0x4f31E2eAF25DCDD46651AcE019B61E3E750023E0',
    methodName: 'addOne',
  })
  console.log(`mixin://codes/${payment.code_id}`)
  // 控制台看到这条消息, 然后将这条消息复制到 Mixin Messenger 中,
  // 直接用 Mixin Messenger 打开, 就可以直接付款了.
}
```

### 4.4 带参数的合约调用

1. 直接用 sdk 发送交易, 调用合约

```js
const { paymentGenerateByInfo, Client } = require('mixin-node-sdk')
const keystore = require('./keystore.json')
// 1. 初始化 Mixin 客户端
const client = new Client(keystore)

async function main() {
  // 2. 生成 txInput
  const txInput = await paymentGenerateByInfo({
    // 要调用的合约地址
    contractAddress: '0x4f31E2eAF25DCDD46651AcE019B61E3E750023E0',
    methodName: 'addAny', // 合约方法
    types: ['uint256'], // 合约的对应参数类型列表
    values: [2], // 合约的对应参数的值
    payment: {
      type: 'tx',
    },
  })
  // 3. 直接发送交易
  const txOutput = client.transaction(txInput) // 此操作需要上述账户有 0.00000001 CNB.
  // 转账完毕后, 红包会自行退回.
}
```

2. 在 Mixin Messenger 内发送交易, 调用合约

:::tip 提示
在 Mixin 内调用起支付, 其实只用让用户打开特定格式的链接就可以实现, 如:
`mixin://codes/xxxxx`
:::

```js
const { paymentGenerateByInfo, Client } = require('mixin-node-sdk')
async function main() {
  // 到这里, 同上. (注释同上)
  // 生成 payment
  const payment = await paymentGenerateByInfo({
    contractAddress: '0x4f31E2eAF25DCDD46651AcE019B61E3E750023E0',
    methodName: 'addAny', // addAny(uint256)
    types: ['uint256'], // 合约的对应参数类型列表
    values: [2], // 合约的对应参数的值
  })
  console.log(`mixin://codes/${payment.code_id}`)
  // 控制台看到这条消息, 然后将这条消息复制到 Mixin Messenger 中,
  // 直接用 Mixin Messenger 打开, 就可以直接付款了.
}
```

:::tip 提示

这里需要注意的是, `参数类型列表` 和 `参数的值列表`, 一定要跟要调用的方法, 保持一致.

:::

> 好了, 到这里, 我们已经掌握了
>
> 1. 如何调用 Mvm 的智能合约(带参数的和不带参数的).
> 2. 如何生成 code_id , 然后使用 Mixin Messenger 来调用 Mvm 的智能合约