# Storage 合约原理及使用

在上一篇文章中，我们介绍了如何通过代理合约 [Registry](https://github.com/MixinNetwork/trusted-group/blob/master/mvm/quorum/contracts/registry.sol)，
来执行部署在 [Quorum](/zh/quorum/join) 上的其他合约。

目前 MVM 支持通过 [Registry](https://github.com/MixinNetwork/trusted-group/blob/master/mvm/quorum/contracts/registry.sol) 调用多个合约，
只需根据要调用的合约函数签名等信息生成 extra，并将其编码后作为 payments 的 memo 付款即可。
但 [mtg](https://github.com/MixinNetwork/trusted-group) 中对 extra 的长度有限制，当 extra 的长度超过 200 时，需对其进行额外的处理。

## Storage 合约实现
Storage 合约实现了两个函数，[read](https://github.com/MixinNetwork/mvm-contracts/blob/main/contracts/mixin/Storage.sol#L7) 和 [write](https://github.com/MixinNetwork/mvm-contracts/blob/main/contracts/mixin/Storage.sol#L11)。
write 函数会将一组键值对存在 mapping 类型的 state 变量中，且键必须是值的 keccak256 hash；read 函数可以通过传入的键在该变量中取相应的值。

### 源码
```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;

contract Storage {
    mapping(uint256 => bytes) internal values;

    function read(uint256 _key) public view returns (bytes memory) {
        return values[_key];
    }

    function write(uint256 _key, bytes memory raw) public {
        uint256 key = uint256(keccak256(raw));
        require(key == _key, "invalid key or raw");
        values[_key] = raw;
    }
}
```

## 处理 extra 过长问题
[mtg](https://github.com/MixinNetwork/trusted-group) 中对 extra 的长度有限制，当 extra 的长度超过 200 时，需对其进行额外的处理。

1. 调用 write 函数将 extra 保存在 [storage 合约](https://github.com/MixinNetwork/trusted-group/blob/master/mvm/quorum/contracts/storage.sol) 中。
   注意：此方法将会消耗一部分的 XIN，请确保使用的钱包有一定余额。

   代码示例：
  
   ```javascript
   const storageContract = '0xef241988D19892fE4efF4935256087F4fdc5ecAa'; // Storage 合约地址
   const uri = 'https://geth.mvm.dev'; // MVM 主网地址
   const key = ethers.utils.keccak256(extra);
   const privateKey = ''; // 钱包对应的私钥
   
   const provider = new StaticJsonRpcProvider(uri);
   const signer = new Wallet(privateKey, provider);
   const contract = new Contract(address, StorageABI, signer);
   
   contract.write(
     BigNumber.from(key),
     value
   );
   ```

2. 根据 extra 的 keccak256 hash 值构造一个新的 extra。新的 extra 由三部分构成：
   * Registry 合约对应的 PID（去掉 `-`）
   * Storage 合约的地址（去掉 `0x`）
   * keccak256 hash（去掉 `0x`）
   ```text
   bd67087276ce3263b9333aa337e212a4ef241988D19892fE4efF4935256087F4fdc5ecAa3179976b4babd610973b16996df33c1ecd13a3ddff436d4734d3c3862a2c3fe9

   bd67087276ce3263b9333aa337e212a4 为 Registry PID bd670872-76ce-3263-b933-3aa337e212a4 去掉 -
   ef241988D19892fE4efF4935256087F4fdc5ecAa 为 Storage 合约地址 0xef241988D19892fE4efF4935256087F4fdc5ecAa 去掉 0x
   3179976b4babd610973b16996df33c1ecd13a3ddff436d4734d3c3862a2c3fe9 为 keccak256 hash 去掉 0x
   ```

或者，使用 [官方 js sdk](https://github.com/MixinNetwork/bot-api-nodejs-client)：

```javascript
import { StorageContract, MVMMainnet, getExtraWithStorageKey, MixinApi } from '@mixin.dev/mixin-node-sdk';
import { keccak256 } from 'ethers/lib/utils';
import { v4 as uuid } from 'uuid';
import keystore from './keystore.json';

const client = MixinApi({ keystore })
const storage = new StorageContract({
  privateKey: '' // 钱包对应的私钥
});

const contractReadCount = {
   address: '0x2E8f70631208A2EcFC6FA47Baf3Fde649963baC7', // contract address
   method: 'count', // contract function
};
const contractAddAnyCount = {
   address: '0x2E8f70631208A2EcFC6FA47Baf3Fde649963baC7', // contract address
   method: 'addAny', // contract function
   types: ['uint256'], // function parameters type array
   values: [2], // function parameters value array
};
const contractAddOneCount = {
   address: '0x2E8f70631208A2EcFC6FA47Baf3Fde649963baC7', // contract address
   method: 'addOne', // contract function
};
const contracts = [
   contractReadCount,
   contractAddOneCount,
   contractReadCount,
   contractAddAnyCount,
   contractReadCount,
];

const extra = getExtra(contracts);
const finalExtra = extra;
if (extra.length > 200) {
  // 保存至 Storage 合约
  // 如果 Storage 中已存在 key 且 value 与 extra 相等，将不会消耗 XIN 再写入一次 
  const key = keccak256(extra);
  const { error } = storage.writeValue(finalExtra, key);
  if (error) throw new Error(error);
  // 获得新的 extra
  finalExtra = getExtraWithStorageKey(key, MVMMainnet.Registry.PID, MVMMainnet.Storage.Contract);
}

// 构造 post /payments 的请求参数
const transactionInput = {
   // 测试网用 CNB，asset_id: '965e5c6e-434c-3fa9-b780-c50f43cd955c'
   asset_id: 'c94ac88f-4671-3976-b60a-09064f1811e8', // XIN
   amount: '0.00000001',
   trace_id: uuid(),
   memo: finalExtra,
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

## 总结

本章介绍了 Storage 合约的原理，及如何利用 Storage 合约处理 extra 过长的问题。

下一节，我们将介绍如何会基于 MVM 部署一个完整的 [uniswap](/zh/guide/uniswap.html) 的合约。