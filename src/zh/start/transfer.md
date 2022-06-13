## 三、转账合约

### 1. 思路

:::tip 提示
所有的标准 erc20 合约其实都是支持转账功能的.

所以这一节可以不发布合约, 直接通过现有的 erc20 合约来完成转账.
:::

我们来看一下 `erc20` 的 `transfer` 方法.

```sol
function transfer(address to, uint256 value) external returns (bool);
```

剩下的核心有两点

1. 如何知道 Mixin 内资产对应 Mvm 链上的资产合约地址.
2. 如何知道 Mixin 内用户对应 Mvm 链上的用户合约地址.

> Mvm 链上用户的地址也都是以合约的形式存在的.

:::danger
我们接着上一节的内容讲, 如果没有做完, 请先实现[上一节的内容](/zh/start/2.counter)
:::

### 2. 根据 Mixin 的 AssetID 如何获取 Mvm 上的资产 erc20 合约地址

> asset_id -> asset_contract

```js
const { Registry, MVMMainnet } = require('mixin-node-sdk');
const keystore = require('./keystore.json');

const registry = Registry({
  address: MVMMainnet.Registry.Address,
  uri: MVMMainnet.RPCUri,
  secret: keystore.privateKey,
});

// BTC address
const BTCAddress = await registry.fetchAssetContract('c6d0c728-2624-429b-8e0d-d9d19b6592fa');

// CNB address
const CNBAddress = await registry.fetchAssetContract('965e5c6e-434c-3fa9-b780-c50f43cd955c');
```

:::tip 注意

有可能你搜索的资产合约并不存在, 这个时候就需要手动注册资产合约.

:::

### 3. 手动注册资产合约

注册资产合约的方式也非常简单, 就是给 Mvm 转账一次该资产就注册完了.

> 注册资产不需要消耗任何费用. 注册完了转账的金额会退回.

```js
const { MixinApi, MVMMainnet } = require('mixin-node-sdk');
import { v4 as uuid } from 'uuid';
const keystore = require('./keystore.json');

const client = MixinApi({keystore});
const params = {
  asset_id: '965e5c6e-434c-3fa9-b780-c50f43cd955c', // 注册 CNB
  amount: '0.00000001',
  trace_id: uuid(),
  // 多签
  opponent_multisig: {
    receivers: MVMMainnet.MVMMenbers,
    threshold: MVMMainnet.MVMThreshold,
  },
  extra: '', // 这个时候并不需要调用任何的合约, 所以 extra 留空就行
};

client.transfer.toAddress(params); // 转账成功即完成注册.
// 或者使用 payment 的形式, 使用 Mixin Messenger 付款.
```

> 转账成功后, 稍等 30 秒 - 1 分钟, 再查询就得到资产合约地址了.

好了, 到这一步, 我们应该已经获取到了 `资产的合约地址` 了.

下一步, 如果我们拿到了用户的合约地址, 那么就可以完成使用 Mvm 给用户转账了.

### 4. 根据 Mixin 的 user_id 获取 Mvm 上的用户合约地址.

> user_id -> user_contract

```js
const { Registry, MVMMainnet } = require('mixin-node-sdk');
const keystore = require('./keystore.json');

const registry = Registry({
  address: MVMMainnet.Registry.Address,
  uri: MVMMainnet.RPCUri,
  secret: keystore.privateKey,
});

// 30265 address
const userContract = await registry.fetchUserContract('e8e8cd79-cd40-4796-8c54-3a13cfe50115');
```

这里可能还有问题, 就是如何通过 `Mixin ID(30265)` 获取到 `user_id(e8e8cd79-cd40-4796-8c54-3a13cfe50115)`

```js
const { MixinApi } = require('mixin-node-sdk');
const keystore = require('./keystore.json');

const client = MixinApi({ keystore });
const { user_id } = client.user.search('30265') // 返回的结果里有 user_id
```

:::tip 注意
有可能你搜索的用户合约并不存在, 这个时候就需要手动注册用户合约.
:::

### 5. 手动注册用户合约

其实之前的注册资产, 不仅是**注册了资产**, 同时还把**转账的用户也一同注册了**.

所以, 用户的注册, 其实就是让指定的用户, 完成一次跟 MVM 的交互.

```js
const { MixinApi } = require('mixin-node-sdk');
import { v4 as uuid } from 'uuid';
const keystore = require('./keystore.json');

const client = MixinApi({ keystore });
const params = {
  asset_id: '965e5c6e-434c-3fa9-b780-c50f43cd955c', // 注册 CNB
  amount: '0.00000001',
  trace_id: uuid(),
  // 多签
  opponent_multisig: {
    receivers: MVMMainnet.MVMMenbers,
    threshold: MVMMainnet.MVMThreshold,
  },
  extra: '', // 这个时候并不需要调用任何的合约, 所以 extra 留空就行
}

client.payment.request(params).then((payment) => {
  // 将这个 code 让指定的用户从 Mixin Messenger 里打开并完成支付.
  // 就完成了用户的注册, 转账的 CNB 也会一并退回.
  console.log(`mixin://codes/${payment.code_id}`);
})
```

> 到这里, 我们现在应该同时获取到了:
>
> 1. 要转账的 资产合约地址
> 2. 要转账的 用户合约地址

### 6. 开始调用合约进行转账

这里举的例子, 就直接用机器人给你的用户转账吧.

```js
const { MixinApi, Registry, MVMMainnet } = require('mixin-node-sdk');
import { v4 as uuid } from 'uuid';
const keystore = require('./keystore.json');

const client = MixinApi({ keystore });
const registry = Registry({
  address: MVMMainnet.Registry.Address,
  uri: MVMMainnet.RPCUri,
  secret: keystore.privateKey,
});
const UserID = 'e8e8cd79-cd40-4796-8c54-3a13cfe50115';
const CNBID = '965e5c6e-434c-3fa9-b780-c50f43cd955c';

async function main() {
  const userContract = await registry.fetchUserContract(UserID);
  const CNBContract = await registry.fetchAssetContract(CNBID);
  
  const methodName = 'transfer'; // 调用合约的方法名
  const transferAmount = '1'; // 要转账的金额
  const types = ['address', 'uint256']; // 调用合约方法的参数类型列表
  // 这里需要注意, 所有注册的资产合约的 decimal 都是 8
  // 所以, 如果要转账, 这里的金额就是转账金额乘以 1 亿
  const values = [userContract, String(Number(transferAmount) * 1e8)]; // 调用合约方法的参数值列表
  
  // 生成 extra
  const extra = getExtra(CNBContract, methodName);
  
  const params = {
    // 默认币种
    asset_id: CNBID,
    // 默认金额
    amount: transferAmount,
    // 唯一标识
    trace_id: uuid(),
    // 备注
    extra,
    // 多签
    opponent_multisig: {
      receivers: MVMMainnet.MVMMenbers,
      threshold: MVMMainnet.MVMThreshold,
    },
  };
  const txInput = await client.payment.request(params);
  client.transfer.toAddress(txInput); // 转账成功即完成转账.
}
```

:::tip
这里注意, 所有通过 MVM 注册的资产合约的 decimal 都是 8. 所以在进行转账参数构建的时候, 要乘以一亿 (100000000)
:::

> 好了, 到这里, 我们已经掌握了
>
> 1. 如何查询 Mvm 的资产以及用户的合约地址.
> 2. 如何通过 Mvm 给 Messenger 的用户转账.
