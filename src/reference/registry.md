# registry 合约原理及使用

在上一步 refund.sol 合约部署，我们介绍了如何在 MVM 开发一个完整的合约，这部分需要合约开发者对原有的合约做一些修改，为了减少合约开发的改动，我们又进一步实现了 registry.sol

registry 是 MVM 代理合约, 其它合约不需要做修改，可以把需要执行的合约函数跟参数编码后，通过 registry 来执行。

## 原理解析

1. 用户调用合约时，需要使用开发者生成的一个支付链接。支付链接通过 POST /payment 生成。

  相关文档：https://developers.mixin.one/zh-CN/docs/api/transfer/payment

  ```
  op := &encoding.Operation{
    Purpose: encoding.OperationPurposeGroupEvent, // 固定值 1
    Process: c.String("process"), // registry 合约的机器人的 client_id，TODO
    Extra:   extra, // 合约执行的内容
  }
  ```

  extra 示例：7c15d0d2faa1b63862880bed982bd3020e1f1a9a56688700000000000000000000000000bd6efc2e2cb99aef928433209c0a3be09a34f11400000000000000000000000000000000000000000000000000000000000007d0

   extra 分成两部分:
     a. 0x7c15d0D2faA1b63862880Bed982bd3020e1f1A9A 去掉 0x 后全部小写, 是需要执行合约的地址
     b. 从 566887 开始则是 addLiquidity(address,uint256) 方法加详细参数的 ABI 值, 上面的例子中是 c6d0c728-2624-429b-8e0d-d9d19b6592fa 是 BTC 在 Mixin 网络里的资产 ID，跟 amount 0.00002 的 ABI 编码, 这个我们会单独的介绍，主要参照：https://docs.soliditylang.org/en/v0.8.12/abi-spec.html

2. MVM 把 Event 按格式编码之后，发送给 registry 合约
3. registry 执行 `function mixin`, 并调用相关合约
4. 执行完成后，通过 ` event MixinTransaction(bytes);`  返回给 MVM 相关 event 信息
5. MVM 获取到结果后，如果需要转帐给用户

## function mixin 实现

`function mixin()` 是 MVM 调用智能合约的唯一路口，所有后续的合约操作都需要通过这个函数

当 MVM 调用合约时, 调用 mixin 这个函数，raw 会解析成相关的参数
1. process, uuid 验证部署的 process 跟调用的 process 是否一致
2. nonce, EVM 需要每次调用需要 nonce + 1
3. asset id, mixin 里资产的 id
4. amount, 需要操作的资产数量
5. extra, 包含着资产, 合约的一些信息
6. timestamp
7. user, mixin 里的用户，可能是多签帐号, 如果用户不存在会创建用户
8. 解析 5 里面的 extra 值, 如果资产不存在会创建资产
9. 验证签名
10. 给 mixin 用户，对应的 mvm 帐号转入相应的资产
11. 调用合约, 执行完成后，销毁 mvm 帐号的资产
12. 返回调用结果 `emit MixinTransaction`

```solidity
function mixin(bytes memory raw) public returns (bool) {
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

  emit MixinEvent(evt);
  MixinAsset(evt.asset).mint(evt.user, evt.amount);
  return MixinUser(evt.user).run(evt.asset, evt.amount, evt.extra);
}
```

## Messenger 用户，资产跟 MVM 合约中的对应

Messenger 用户，资产都需要跟 MVM 里的帐号跟资产对应，对应值可以从以下三个公开的 map 里获取:

```
mapping(address => bytes) public users;
mapping(address => uint128) public assets;
mapping(uint => address) public contracts;
```

## 开源代码

地址: https://github.com/MixinNetwork/trusted-group/tree/master/mvm/quorum/contracts
