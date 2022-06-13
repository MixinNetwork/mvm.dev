### API

`POST /payments`

### 参数

| 参数                |   类型   |  必填   | 说明      |
|:------------------|:------:|:-----:|:--------|
| asset_id          | string | true  | 转账币种    |
| amount            | string | true  | 转账金额    |
| trace_id          | string | true  | 转账的唯一标识 |
| extra             | string | true  | 转账备注    |
| opponent_multisig | object | true  | 详情见下文   |
| delegatecall      |  bool  | false |         |

> 1. `delegatecall` 主要是为了提供让用户调用 `mvm` 中未与 `mixin` 映射的资产.

payment 参数是跟多签相关的参数
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
import { getExtra, MVMMainnet } from 'mixin-node-sdk';

// 合约地址
const contractAddress = '0x4f31E2eAF25DCDD46651AcE019B61E3E750023E0';
// 合约方法名
const methodName = 'addOne';
// 参数类型列表
const types = [];
// 参数值列表
const value = [];
// 无需非 mixin 映射资产的调用
const delegatecall = false;

// step 1: 生成 extra 
// extra 由三部分构成
// * 去掉 '0x' 的合约地址
// * 合约方法声明 KECCAK256 哈希值去掉 '0x' 后的前八位
//   如 addLiquidity(address,uint256)，中间无空格
// * 合约方法参数的 ABI 编码
const extra = getExtra(contractAddress, methodName, types, values);

// step 2: 发送请求
const params = {
  // 默认币种
  asset_id: '965e5c6e-434c-3fa9-b780-c50f43cd955c',
  // 默认最小金额
  amount: '0.00000001',
  // 唯一标识
  trace_id: uuid(),
  // 备注
  extra,
  // 多签
  opponent_multisig: {
    receivers: MVMMainnet.MVMMenbers,
    threshold: MVMMainnet.MVMThreshold,  
  },
  delegatecall
};
axios.post('/payments', params);
```

跨链桥合约绑定地址方法调用

```javascript
import { v4 as uuid } from 'uuid';
import { getExtra, MVMMainnet } from 'mixin-node-sdk';

// 合约地址
const contractAddress = '0x96dC880Ed035CFdd2F334874379bb6A128aca788';
// 合约方法名
const methodName = 'bind';
// 参数类型列表
const types = ['address'];
// 参数值列表
const values = ['0x9A9EE13256416f41a2a499C0d4179663407269A8'];
// 无需非 mixin 映射资产的调用
const delegatecall = false;

// step 1: 生成 extra
// extra 由三部分构成
// * 去掉 '0x' 的合约地址
// * 合约方法声明 KECCAK256 哈希值去掉 '0x' 后的前八位
//   如 addLiquidity(address,uint256)，中间无空格
// * 合约方法参数的 ABI 编码
const extra = getExtra(contractAddress, methodName, types, values);

// step 2: 发送请求
const params = {
  // 默认币种
  asset_id: '965e5c6e-434c-3fa9-b780-c50f43cd955c',
  // 默认最小金额
  amount: '0.00000001',
  // 唯一标识
  trace_id: uuid(),
  // 备注
  extra,
  // 多签
  opponent_multisig: {
    receivers: MVMMainnet.MVMMembers,
    threshold: MVMMainnet.MVMThreshold,
  },
  delegatecall
};
axios.post('/payments', params);
```

2. 需要资产的合约调用

跨链桥合约转账方法调用

```javascript
import { v4 as uuid } from 'uuid';
import { getExtra, MVMMainnet } from 'mixin-node-sdk';

// 资产地址
const asset_id = "965e5c6e-434c-3fa9-b780-c50f43cd955c";
// 转账金额
const amount = "1";
// 合约地址
const contractAddress = '0x96dC880Ed035CFdd2F334874379bb6A128aca788';
// 合约方法名
const methodName = 'deposit';
// 参数类型列表
const types = ["address", "uint256"];
// 参数值列表
const value = ["0x001fB10b1bFede8505AB138c2Bb2E239CB3b50dC", "100000000"];
// 无需非 mixin 映射资产的调用
const delegatecall = false;

// step 1: 生成 extra
// extra 由三部分构成
// * 去掉 '0x' 的合约地址
// * 合约方法声明 KECCAK256 哈希值去掉 '0x' 后的前八位
//   如 addLiquidity(address,uint256)，中间无空格
// * 合约方法参数的 ABI 编码
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
  extra,
  // 多签
  opponent_multisig: {
    receivers: MVMMainnet.MVMMembers,
    threshold: MVMMainnet.MVMThreshold,
  },
  delegatecall
};
axios.post('/payments', params);
```

3. 复杂的合约调用

uniswap 的 swap 合约方法调用(values 可以为一个数组或者对象)

```javascript
import { v4 as uuid } from 'uuid';
import { getExtra, MVMMainnet } from 'mixin-node-sdk';

// 资产地址
const asset_id = "965e5c6e-434c-3fa9-b780-c50f43cd955c";
// 转账金额
const amount = "1";
// 合约地址
const contractAddress = '0xe4aeAc26BCd161aFAEea468AC22F45FE5a35737F';
// 合约方法名
const methodName = 'swapExactTokensForTokens';
// 参数类型列表
const types = ["uint256", "uint256", "address[]", "address", "uint256"];
// 参数值列表
const value = [
  100000000,
  12400948731547,
  [
    "0x001fB10b1bFede8505AB138c2Bb2E239CB3b50dC",
    "0x71c1C2D82b39C0e952751c9BEA39c28c70c47Ff4"
  ],
  "0xa192D5856A9a7c07731bc13559Da7489C7829C74",
  1652262893
];
// 无需非 mixin 映射资产的调用
const delegatecall = false;

// step 1: 生成 extra 
// extra 由三部分构成
// * 去掉 '0x' 的合约地址
// * 合约方法声明 KECCAK256 哈希值去掉 '0x' 后的前八位
//   如 addLiquidity(address,uint256)，中间无空格
// * 合约方法参数的 ABI 编码
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
  extra,
  // 多签
  opponent_multisig: {
    receivers: MVMMainnet.MVMMembers,
    threshold: MVMMainnet.MVMThreshold,
  },
  delegatecall
};
axios.post('/payments', params);

```

4. 需要非 mixin 映射资产的调用.

> 如 uniswap 合约, 当添加流动性的时候, 会生成一个 uniswap 的流动性凭证, 该凭证也是一个 erc20 的资产, 但不是 mixin 内的资产, 此时, 这个资产会到 mixin 映射的用户合约地址内. 并不会直接发送到 mixin. 当要花费这类资产时, 就需要使用 `delegatecall` 方法来调用.
>
> [delegatecall 相关信息可以查看]()

uniswap 的移除流动性方法调用

```javascript
import { v4 as uuid } from 'uuid';
import { getExtra, MVMMainnet } from 'mixin-node-sdk';

// 资产地址
const asset_id = "965e5c6e-434c-3fa9-b780-c50f43cd955c";
// 转账金额
const amount = "1";
// 合约地址
const contractAddress = '0x774A9E576f14d81d7fB439efB1Eb14973a7144Fb';
// 合约方法名
const methodName = 'removeLiquidity';
// 参数类型列表
const types = [
  "address",
  "address",
  "address",
  "address",
  "uint256",
  "uint256",
  "uint256"
];
// 参数值列表
const value = [
  "0x5EFDe32C3857fe54b152D3ffa7DCE31e28b83aC6", 
  "0x001fB10b1bFede8505AB138c2Bb2E239CB3b50dC",
  "0x71c1C2D82b39C0e952751c9BEA39c28c70c47Ff4",
  "0xa192D5856A9a7c07731bc13559Da7489C7829C74",
  44,
  0,
  0
];
// 需要非 mixin 映射资产的调用
const delegatecall = true;

// step 1: 生成 extra
// extra 由三部分构成
// * 去掉 '0x' 的合约地址
// * 合约方法声明 KECCAK256 哈希值去掉 '0x' 后的前八位
//   如 addLiquidity(address,uint256)，中间无空格
// * 合约方法参数的 ABI 编码
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
  extra,
  // 多签
  opponent_multisig: {
    receivers: MVMMainnet.MVMMembers,
    threshold: MVMMainnet.MVMThreshold,
  },
  delegatecall
};
axios.post('/payments', params);
```
