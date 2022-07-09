### API

`POST /payments`

### 介绍
  当使用 sdk 请求 POST /payments api 时，需要 keystore 对消息签名才可以访问，却有可能暴露 keystore。
  
  此时，可以访问本 api 来生成支付链接，参数不变。另外，还有自动处理 extra 超过限制的功能
  （由于向 Storage 合约写入数据需要消耗 XIN，限制每个 ip 24 小时内请求 32 次超长 extra，长度 200 以内的 extra 不作限制）。

### 参数

| 参数                |   类型   |  必填   | 说明      |
|:------------------|:------:|:-----:|:--------|
| asset_id          | string | true  | 转账币种    |
| amount            | string | true  | 转账金额    |
| trace_id          | string | true  | 转账的唯一标识 |
| memo              | string | true  | 转账备注    |
| opponent_multisig | object | true  | 详情见下文   |

opponent_multisig 参数是跟多签相关的参数
| 参数 | 类型 | 必填 | 说明 |
| :----- | :----: | :---: | :-------------------------- |
| receivers | string[] | true | 参与多签的 user_id 数组 |
| threshold | number | true | 完成多签需要的人数 |

### 返回值

```json
{
  "type": "payment",
  "trace_id": "19f7e906-45b5-4638-891f-5595a0a09495",
  "asset_id": "965e5c6e-434c-3fa9-b780-c50f43cd955c",
  "amount": "0.00000001",
  "threshold": 3,
  "receivers": [
    "a15e0b6d-76ed-4443-b83f-ade9eca2681a",
    "b9126674-b07d-49b6-bf4f-48d965b2242b",
    "15141fe4-1cfd-40f8-9819-71e453054639",
    "3e72ca0c-1bab-49ad-aa0a-4d8471d375e7"
  ],
  "memo": "AAGGxYdl7IE8pKNbh181oK19AAAAAAA5AJbciA7QNc_dLzNIdDebtqEorKeIgbrBTwAAAAAAAAAAAAAAAJqe4TJWQW9BoqSZwNQXlmNAcmmo",
  "created_at": "2022-05-11T09:44:33.544707789Z",
  "status": "pending",
  "code_id": "bffb3218-87de-4e85-a7ad-d672194259ad"
}
```

> 开发者核心需要关注的是 `code_id`, 构建完 `mixin://codes/:code_id`, 让用户在 Messenger 内, 直接访问这个链接, 就可以调起支付从而完成合约调用.

### 示例

1. 无需资产的合约调用

计数器合约+1

```javascript
import { v4 as uuid } from 'uuid';
import { 
  MVMApi, 
  MVMApiTestURI, 
  getExtra, 
  MVMMainnet 
} from '@mixin.dev/mixin-node-sdk';

const contract = {
  address: '0x4f31E2eAF25DCDD46651AcE019B61E3E750023E0',
  method: 'addOne'
}
const extra = getExtra([contract]);

// step 2: 发送请求
const params = {
  // 默认币种
  asset_id: '965e5c6e-434c-3fa9-b780-c50f43cd955c',
  // 默认最小金额
  amount: '0.00000001',
  // 唯一标识
  trace_id: uuid(),
  // 备注
  memo: extra,
  // 多签
  opponent_multisig: {
    receivers: MVMMainnet.MVMMembers,
    threshold: MVMMainnet.MVMThreshold,  
  },
};

const mvmClient = MVMApi(MVMApiTestURI);
mvmClient.payments(params).then(res => {
  console.log(`mixin://codes/${res.code_id}`);
});
```

跨链桥合约绑定地址方法调用

```javascript
import { v4 as uuid } from 'uuid';
import { 
  MVMApi, 
  MVMApiTestURI, 
  getExtra, 
  MVMMainnet 
} from '@mixin.dev/mixin-node-sdk';

const contract = {
  address: '0x96dC880Ed035CFdd2F334874379bb6A128aca788',
  method: 'bind',
  types: ['address'],
  values: ['0x9A9EE13256416f41a2a499C0d4179663407269A8']
}
const extra = getExtra([contract]);

// step 2: 发送请求
const params = {
  // 默认币种
  asset_id: '965e5c6e-434c-3fa9-b780-c50f43cd955c',
  // 默认最小金额
  amount: '0.00000001',
  // 唯一标识
  trace_id: uuid(),
  // 备注
  memo: extra,
  // 多签
  opponent_multisig: {
    receivers: MVMMainnet.MVMMembers,
    threshold: MVMMainnet.MVMThreshold,
  },
};

const mvmClient = MVMApi(MVMApiTestURI);
mvmClient.payments(params).then(res => {
  console.log(`mixin://codes/${res.code_id}`);
});
```

2. 需要资产的合约调用

跨链桥合约转账方法调用

```javascript
import { v4 as uuid } from 'uuid';
import { 
  MVMApi, 
  MVMApiTestURI, 
  getExtra, 
  MVMMainnet 
} from '@mixin.dev/mixin-node-sdk';

// 资产地址
const asset_id = "965e5c6e-434c-3fa9-b780-c50f43cd955c";
// 转账金额
const amount = "1";

const contract = {
  address: '0x96dC880Ed035CFdd2F334874379bb6A128aca788',
  method: 'deposit',
  types: ["address", "uint256"],
  values: ["0x001fB10b1bFede8505AB138c2Bb2E239CB3b50dC", "100000000"]
}
const extra = getExtra(contractAddress, methodName, types, values);

// step 2: 发送请求
const params = {
  // 转账币种
  asset_id,
  // 转账金额
  amount,
  // 唯一标识
  trace_id: uuid(),
  // 备注
  memo: extra,
  // 多签
  opponent_multisig: {
    receivers: MVMMainnet.MVMMembers,
    threshold: MVMMainnet.MVMThreshold,
  }
};

const mvmClient = MVMApi(MVMApiTestURI);
mvmClient.payments(params).then(res => {
  console.log(`mixin://codes/${res.code_id}`);
});
```

3. 复杂的合约调用

uniswap 的 swap 合约方法调用(values 可以为一个数组或者对象)

```javascript
import { v4 as uuid } from 'uuid';
import { 
  MVMApi, 
  MVMApiTestURI, 
  getExtra, 
  MVMMainnet 
} from '@mixin.dev/mixin-node-sdk';

// 资产地址
const asset_id = "965e5c6e-434c-3fa9-b780-c50f43cd955c";
// 转账金额
const amount = "1";

const contract = {
  address: '0xe4aeAc26BCd161aFAEea468AC22F45FE5a35737F',
  method: 'swapExactTokensForTokens',
  types: ["uint256", "uint256", "address[]", "address", "uint256"],
  values: [
    100000000,
    12400948731547,
    [
      "0x001fB10b1bFede8505AB138c2Bb2E239CB3b50dC",
      "0x71c1C2D82b39C0e952751c9BEA39c28c70c47Ff4"
    ],
    "0xa192D5856A9a7c07731bc13559Da7489C7829C74",
    1652262893
  ]
}
const extra = getExtra([contract]);

// step 2: 发送请求
const params = {
  // 转账币种
  asset_id,
  // 转账金额
  amount,
  // 唯一标识
  trace_id: uuid(),
  // 备注
  memo: extra,
  // 多签
  opponent_multisig: {
    receivers: MVMMainnet.MVMMembers,
    threshold: MVMMainnet.MVMThreshold,
  },
};

const mvmClient = MVMApi(MVMApiTestURI);
mvmClient.payments(params).then(res => {
  console.log(`mixin://codes/${res.code_id}`);
});
```

4. 需要非 mixin 映射资产的调用.

uniswap 的移除流动性方法调用

```javascript
import { v4 as uuid } from 'uuid';
import { 
  MVMApi, 
  MVMApiTestURI, 
  getExtra, 
  MVMMainnet 
} from '@mixin.dev/mixin-node-sdk';

// 资产地址
const asset_id = "965e5c6e-434c-3fa9-b780-c50f43cd955c";
// 转账金额
const amount = "1";

const contract = {
  address: '0x774A9E576f14d81d7fB439efB1Eb14973a7144Fb',
  method: 'removeLiquidity',
  types: [
    "address",
    "address",
    "address",
    "address",
    "uint256",
    "uint256",
    "uint256"
  ],
  values: [
    "0x5EFDe32C3857fe54b152D3ffa7DCE31e28b83aC6",
    "0x001fB10b1bFede8505AB138c2Bb2E239CB3b50dC",
    "0x71c1C2D82b39C0e952751c9BEA39c28c70c47Ff4",
    "0xa192D5856A9a7c07731bc13559Da7489C7829C74",
    44,
    0,
    0
  ]
};
const extra = getExtra([contract]);

// step 2: 发送请求
const params = {
  // 转账币种
  asset_id,
  // 转账金额
  amount,
  // 唯一标识
  trace_id: uuid(),
  // 备注
  memo: extra,
  // 多签
  opponent_multisig: {
    receivers: MVMMainnet.MVMMembers,
    threshold: MVMMainnet.MVMThreshold,
  }
};

const mvmClient = MVMApi(MVMApiTestURI);
mvmClient.payments(params).then(res => {
  console.log(`mixin://codes/${res.code_id}`);
});
```
