# Registry 合约原理及使用

在上一篇文章中，我们介绍了如何在 MVM 部署并使用一个完整的合约，其中提到，合约开发者需要对原有的合约做一些修改，因此我们又进一步实现了 [Registry.sol](#开源代码)。

[Registry](#开源代码) 是 MVM 代理合约，原有的智能合约不需要做修改，在 [Quorum](/zh/quorum/join) 上部署后，可以直接通过 [Registry](#开源代码) 来执行。
另外，[Registry](#开源代码) 还支持批量执行多个合约。

## 如何使用 Registry 合约

1. 合约开发者部署 EVM 智能合约(过程与 [refund.sol](./refund.html##refund-sol-源码) 等其它合约部署类似)，部署完成后拿到合约地址。

2. 用户调用合约时，需要使用开发者生成的一个支付链接。`code_id` 通过 POST /payments 生成，支付链接为 `https://mixin.one/codes/:code_id`。

   提示: 这个支付地址的生成没有限制，任何人只需知道合约地址都可以生成，相关文档：<https://developers.mixin.one/zh-CN/docs/api/transfer/payment>。
   其中，memo 为 Operation 的 base64 编码

   Operation 结构
   ```golang
   op := &encoding.Operation{
     Purpose: encoding.OperationPurposeGroupEvent, // 固定值 1
     Process: c.String("process"), // Registry 合约的机器人的 client_id，TODO
     Extra: extra, // 合约执行的内容
   }
   ```

   其中，extra 由待执行的合约数量和每个代执行合约函数的 contract_extra 组合而成，[代码示例](https://github.com/MixinNetwork/mvm-contracts/blob/main/contracts/mixin/User.sol#L52)

   以下是合约调用示例（该合约的源码见 [Counter](/zh/start/counter)）：

   ```javascript
   const contract1 = {
     address: '0x2E8f70631208A2EcFC6FA47Baf3Fde649963baC7', // contract address
     method: 'addAny', // contract function
     types: ['uint256'], // function parameters type array
     values: [2], // function parameters value array
   };
   const contract2 = {
     address: '0x2E8f70631208A2EcFC6FA47Baf3Fde649963baC7', // contract address
     method: 'count', // contract function
   };
   ```
   这两个合约调用的 extra 为 
   ```text
   00022e8f70631208a2ecfc6fa47baf3fde649963bac7002477ad0aab00000000000000000000000000000000000000000000000000000000000000022e8f70631208a2ecfc6fa47baf3fde649963bac7000406661abd    
   ```

   1. 开头的 `0002` 表示待执行合约的数量的十六进制
   2. `2e8f70631208a2ecfc6fa47baf3fde649963bac7002477ad0aab0000000000000000000000000000000000000000000000000000000000000002` 为第一个合约的 contract_extra。
      由三部分组成：
      * `2e8f70631208a2ecfc6fa47baf3fde649963bac7` 为合约地址去掉 `0x` 后的小写
      * `0024` 为 函数输入部分的长度的十六进制
      * `77ad0aab0000000000000000000000000000000000000000000000000000000000000002` 为函数输入部分。其中，
        `77ad0aab` 为 `addAny(uint256)` 的 keccak256 hash 值去掉 `0x` 后的前 8 位，之后的部分为输入参数的 ABI 编码
        ```javascript
        // 使用 ethers 例子
        let contractExtra = contract1.address.slice(2);
        contractExtra += utils.id(`${contract1.method}(${contract1.types[0]})`).slice(2, 10)
        const abiCoder = new ethers.utils.AbiCoder();
        contractExtra += abiCoder.encode(types, values).slice(2);
        ```
   3. `2e8f70631208a2ecfc6fa47baf3fde649963bac7000406661abd` 为第二个合约的 contract_extra。
      由三部分组成：
      * `2e8f70631208a2ecfc6fa47baf3fde649963bac7` 为合约地址去掉 `0x` 后的小写
      * `0004` 为 函数输入部分的长度的十六进制
      * `06661abd` 为 `count()` 的 keccak256 hash 值去掉 `0x` 后的前 8 位，该函数没有行参所以没有输入参数的部分。
        ```javascript
        // 使用 ethers 例子
        let contractExtra = contract2.address.slice(2);
        contractExtra += utils.id(`${contract2.method}()`).slice(2, 10)
        ```

   通过 [官方 js sdk](https://github.com/MixinNetwork/bot-api-nodejs-client) 生成支付链接
   ```javascript
   import { MVMMainnet, getExtra, MixinApi } from '@mixin.dev/mixin-node-sdk';
   import { v4 as uuid } from 'uuid';
   import keystore from './keystore.json';

   const client = MixinApi({ keystore })
   
   const contracts = [contract1, contract2];
   const extra = getExtra(contracts);
   // 构造 post /payments 的请求参数
   const transactionInput = {
     // 测试网用 CNB，asset_id: '965e5c6e-434c-3fa9-b780-c50f43cd955c'
     asset_id: 'c94ac88f-4671-3976-b60a-09064f1811e8', // XIN asset_id
     amount: '0.00000001',
     trace_id: uuid(),
     memo: extra,
     opponent_multisig: {
       receivers: MVMMainnet.MVMMembers,
       threshold: MVMMainnet.MVMThreshold,
     },
   };
   // 函数内部将 extra 编码成 memo 格式
   const res = client.payment.request(transactionInput);
   // post /transactions 支付或使用下面的支付链接
   console.log(`mixin://codes/${res.code_id}`); 
   ```

4. MVM 收到这个 output 后，解析 memo 成 Event，[代码示例](https://github.com/MixinNetwork/trusted-group/blob/cf3fae2ecacf95e3db7e21c10b7729ab9c11474b/mvm/eos/utils.go#L46)
5. MVM 把 Event 按格式编码之后，发送给 [Registry](#开源代码) 合约
6. [Registry](#开源代码) 执行 `function mixin`，并调用相关合约
7. 执行完成后，通过 `event MixinTransaction(bytes)`  返回给 MVM 相关 Event 信息
8. MVM 获取到结果后，如果有需要则转帐给用户，不需要则跳过

开发者只需要在第 2 步，拿到 code_id, 生成支付链接 `https://mixin.one/codes/:code_id` 即可, 剩下的都是 MVM 的执行逻辑。 

关于 Event 的编码，可以从[这篇文章](/zh/guide/encoding.html#mtg-到-mvm-的编码格式)了解。

## function mixin 实现

`function mixin()` 是 MVM 调用智能合约的入口, 也是 Registry 中的唯一入口，所有后续的合约操作都需要通过这个函数。

当 MVM 调用 mixin 这个函数，raw 会解析成相关的参数, 步骤如下:

1. 验证部署的 process 跟调用的 process 是否一致
2. 验证 nonce，需要每次调用需要 nonce + 1
3. 解析 asset_id：mixin 里资产的 id
4. 解析 amount：需要操作的资产数量
5. 解析 extra：包含着资产、合约的一些信息
6. 解析 timestamp：目前没有验证，合约可以根据自己的情况来决定是否使用
7. 解析 user：Mixin 用户 ID，也可能是多签帐号, 如果用户不存在会创建对应的 Quorum 帐号
8. 解析 5 里面的 extra 值, 如果 Quorum 对应资产不存在会创建资产
9. 验证签名
10. 给 Mixin 用户，对应的 MVM 帐号转入相应的资产，[代码示例](https://github.com/MixinNetwork/mvm-contracts/blob/main/contracts/mixin/Asset.sol#L139)
11. 依次调用合约 [代码示例](https://github.com/MixinNetwork/mvm-contracts/blob/main/contracts/mixin/User.sol#L42)
12. 合约调用的结果通过 `ProcessCalled` 事件返回，[代码示例](https://github.com/MixinNetwork/mvm-contracts/blob/main/contracts/mixin/User.sol#L82)
13. 返回的结果可以在浏览器的 logs 中找到（主网和测试网浏览器的地址见 [Quorum](/zh/quorum/join)）。
    当 result 为 true 时调用成功，output 为 合约调用的返回；当 result 为 false 时合约调用失败，output 为提示，可以通过 xxd 命令解析。
    ```shell
    # result: false
    # output: 08c379a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000c6e6f742072656769737472790000000000000000000000000000000000000000
    
    echo 08c379a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000c6e6f742072656769737472790000000000000000000000000000000000000000 | xxd -r -p
    # �y� 
    #     not registry
    ```

具体的代码实现

```solidity
function mixin(bytes memory raw) public returns (bool) {
    require(!HALTED, "invalid state");
    require(raw.length >= 141, "event data too small");

    Event memory evt;
    uint256 offset = 0;

    uint128 id = raw.toUint128(offset);
    require(id == PID, "invalid process");
    offset = offset + 16;

    evt.nonce = raw.toUint64(offset);
    require(evt.nonce == INBOUND, "invalid nonce");
    INBOUND = INBOUND + 1;
    offset = offset + 8;

    (offset, id, evt.amount) = parseEventAsset(raw, offset);
    (offset, evt.extra, evt.timestamp) = parseEventExtra(raw, offset);
    (offset, evt.user) = parseEventUser(raw, offset);
    (evt.asset, evt.extra) = parseEventInput(id, evt.extra);

    offset = offset + 2;
    evt.sig = [raw.toUint256(offset), raw.toUint256(offset+32)];
    uint256[2] memory message = raw.slice(0, offset-2).concat(new bytes(2)).hashToPoint();
    require(evt.sig.verifySingle(GROUP, message), "invalid signature");

    offset = offset + 64;
    require(raw.length == offset, "malformed event encoding");

    uint256 balance = balances[assets[evt.asset]];
    if (balance == 0) {
        deposits.push(assets[evt.asset]);
        balance = BALANCE;
    }
    balances[assets[evt.asset]] = balance + evt.amount;

    emit MixinEvent(evt);
    MixinAsset(evt.asset).mint(evt.user, evt.amount);
    return MixinUser(evt.user).run(evt.asset, evt.amount, evt.extra);
}
```

## Messenger 用户、资产跟 MVM 合约中如何对应

Messenger 用户、资产都需要跟 MVM 里的帐号跟资产对应，对应方式都在以下三个公开的 map 里获取:

```solidity
mapping(address => bytes) public users;
mapping(address => uint128) public assets;
mapping(uint => address) public contracts;
```

## 开源代码

registry.sol 开源地址: <https://github.com/MixinNetwork/trusted-group/tree/master/mvm/quorum/contracts>

## 总结

Registry 合约辅助实现了：Mixin 用户与 [Quorum](/zh/quorum/join) 帐户的映射、mixin 资产与 [Quorum](/zh/quorum/join) 资产的映射、合约调用以及执行结果返回的工作。EVM 合约也可以直接迁移不需要作修改。

但是，由于 mtg 对 extra 的长度有限制，当 extra 的长度超过 200 时，需要进行额外的处理，我们将在下一节介绍 Storage 合约的原理和使用以解决这个问题。
