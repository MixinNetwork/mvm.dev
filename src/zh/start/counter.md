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

> 合约地址: `0x2E8f70631208A2EcFC6FA47Baf3Fde649963baC7`

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
npm install @mixin.dev/mixin-node-sdk # 安装 nodejs 的 sdk
# 注意 @mixin.dev/mixin-node-sdk 的版本要 >= 4.2.0
```

### 4.2 准备 `keystore.json`

如果要使用 sdk 直接发送交易来调用合约的话, 需要往这个机器人里充一点 CNB.

> 建议直接换成自己的 keystore.json, 然后冲入一些 CNB

```json title='keystore.json'
{
  client_id: "7a522ae4-841b-357b-a7b1-4f5f51488b8f",
  session_id: "9e8ba070-0e63-4488-89a2-f82c12bbd196",
  private_key: "UVXRC3f4sWyFMFq2BmutrYWskXJFy6vmkXY_61weQ1VQl_H_oUba4BRh9nDv8BwlovfqmytE6Q8GEaPgEc09YQ",
  pin: "291843",
  pin_token: "dRSDk0j2tkDF1hJak3MmSGYNEWPE5928IqvXTcIT3Uo",
};
```

### 4.3 不带参数的合约调用

1. 直接用 sdk 发送交易, 调用合约

```js
import { v4 as uuid } from 'uuid';
const { 
  MixinApi, 
  getExtra,
  MVMMainnet
} = require('@mixin.dev/mixin-node-sdk');
const keystore = require('./keystore.json');

keystore.user_id = keystore.client_id;
const client = MixinApi({ keystore });

async function main() {
  const contract = {
    address: '0x2E8f70631208A2EcFC6FA47Baf3Fde649963baC7', // contract address
    method: 'addOne', // contract function
  };
  
  // 1 生成 extra
  const extra = getExtra([contract]);
  
  // 2. 构造请求参数
  const params = {
    // 默认币种
    asset_id: '965e5c6e-434c-3fa9-b780-c50f43cd955c',
    // 默认金额
    amount: '0.00000001', 
    // 唯一标识
    trace_id: uuid(),
    // 备注
    memo: extra,
    // 多签
    opponent_multisig: {
      receivers: MVMMainnet.MVMMenbers,
      threshold: MVMMainnet.MVMThreshold,
    }
  };

  // 3 生成付款码
  const txInput = await client.payment.request(params);
  // 4 发送交易
  const res = await client.transfer.toAddress(txInput); // 此操作需要上述账户有 0.00000001 CNB.
  // 转账完毕后, cnb 会自行退回.
  console.log(res);
}
```

2. 在 Mixin Messenger 内发送交易, 调用合约

:::tip 提示
在 Mixin 内调用起支付, 其实只用让用户打开特定格式的链接就可以实现, 如:
`mixin://codes/xxxxx`
:::

```js
async function main() {
  // 到这里, 同上. (注释同上)
  // const txInput = await mixinClient.payment.request(params);
  
  console.log(`mixin://codes/${txInput.code_id}`)
  // 控制台看到这条消息, 然后将这条消息复制到 Mixin Messenger 中,
  // 直接用 Mixin Messenger 打开, 就可以直接付款了.
}
```

### 4.4 带参数的合约调用

1. 直接用 sdk 发送交易, 调用合约

```js
import { v4 as uuid } from 'uuid';
const { 
  MixinApi, 
  getExtra, 
  MVMMainnet 
} = require('@mixin.dev/mixin-node-sdk');
const keystore = require('./keystore.json');

keystore.user_id = keystore.client_id;
const client = MixinApi({ keystore });

async function main() {
  const contract = {
    address: '0x2E8f70631208A2EcFC6FA47Baf3Fde649963baC7', // contract address
    method: 'addAny', // contract function
    types: ['uint256'], // function parameters type array
    values: [2], // function parameters value array
  };
  
  // 1 生成 extra
  const extra = getExtra([contract]);

  // 2. 构造请求参数
  const params = {
    // 默认币种
    asset_id: '965e5c6e-434c-3fa9-b780-c50f43cd955c',
    // 默认金额
    amount: '0.00000001',
    // 唯一标识
    trace_id: uuid(),
    // 备注
    memo: extra,
    // 多签
    opponent_multisig: {
      receivers: MVMMainnet.MVMMenbers,
      threshold: MVMMainnet.MVMThreshold,
    },
  };

  // 3 生成付款码
  const txInput = await client.payment.request(params);
  // 4 发送交易  
  const res = await client.transfer.toAddress(txInput) // 此操作需要上述账户有 0.00000001 CNB.
  // 转账完毕后, 红包会自行退回.
}
```

2. 在 Mixin Messenger 内发送交易, 调用合约

:::tip 提示
在 Mixin 内调用起支付, 其实只用让用户打开特定格式的链接就可以实现, 如:
`mixin://codes/xxxxx`
:::

```js
async function main() {
  // 到这里, 同上. (注释同上)
  // const txInput = await mixinClient.payment.request(params);

  console.log(`mixin://codes/${txInput.code_id}`)
  // 控制台看到这条消息, 然后将这条消息复制到 Mixin Messenger 中,
  // 直接用 Mixin Messenger 打开, 就可以直接付款了.
}
```

:::tip 提示

这里需要注意的是, `参数类型列表` 和 `参数的值列表`, 一定要跟要调用的方法, 保持一致.

:::

### 4.5 批量调用多个合约

1. 直接用 sdk 发送交易, 调用合约
```javascript
import { v4 as uuid } from 'uuid';
const {
  MixinApi,
  getExtra,
  MVMMainnet
} = require('@mixin.dev/mixin-node-sdk');
const keystore = require('./keystore.json');

keystore.user_id = keystore.client_id;
const client = MixinApi({ keystore });

async function main() {
  const contract1 = {
    address: '0x2E8f70631208A2EcFC6FA47Baf3Fde649963baC7', // contract address
    method: 'count', // contract function
  };
  const contract2 = {
    address: '0x2E8f70631208A2EcFC6FA47Baf3Fde649963baC7', // contract address
    method: 'addAny', // contract function
    types: ['uint256'], // function parameters type array
    values: [2], // function parameters value array
  };

  // 1 生成 extra
  const extra = getExtra([contract1, contract2, contract1]);

  // 2. 构造请求参数
  const params = {
    // 默认币种
    asset_id: '965e5c6e-434c-3fa9-b780-c50f43cd955c',
    // 默认金额
    amount: '0.00000001',
    // 唯一标识
    trace_id: uuid(),
    // 备注
    memo: extra,
    // 多签
    opponent_multisig: {
      receivers: MVMMainnet.MVMMenbers,
      threshold: MVMMainnet.MVMThreshold,
    },
  };

  // 3 生成付款码
  const txInput = await client.payment.request(params);
  // 4 发送交易  
  const res = await client.transfer.toAddress(txInput) // 此操作需要上述账户有 0.00000001 CNB.
  // 转账完毕后, 红包会自行退回.
}
```

2. 在 Mixin Messenger 内发送交易, 调用合约

:::tip 提示
在 Mixin 内调用起支付, 其实只用让用户打开特定格式的链接就可以实现, 如:
`mixin://codes/xxxxx`
:::

```js
async function main() {
  // 到这里, 同上. (注释同上)
  // const txInput = await mixinClient.payment.request(params);

  console.log(`mixin://codes/${txInput.code_id}`)
  // 控制台看到这条消息, 然后将这条消息复制到 Mixin Messenger 中,
  // 直接用 Mixin Messenger 打开, 就可以直接付款了.
}
```
> 好了, 到这里, 我们已经掌握了
>
> 1. 如何调用 Mvm 的智能合约(带参数的和不带参数的).
> 2. 如何生成 code_id , 然后使用 Mixin Messenger 来调用 Mvm 的智能合约