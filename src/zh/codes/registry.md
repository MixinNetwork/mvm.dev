# registry.sol 合约，以及用法

registry 是 MVM 代理, 其它合约都可以通过给它的 `function mixin(bytes memory raw)` 发送一定格式的数据来执行相关的合约。

开源代码地址: https://github.com/MixinNetwork/trusted-group/tree/master/mvm/quorum/contracts

开发者需要关注的主要包含:

1. 执行入口，`function mixin(bytes memory raw)
2. MixinUser, 将 mixin 里的用户跟 EVM 里的帐户进行关联
3. MixinAsset, mixin 里的资产跟 EVM 里的资产进行关联

如果需要获取对应关系可以从，这以下三个公开的 map 里获取:

```
mapping(address => bytes) public users;
mapping(address => uint128) public assets;
mapping(uint => address) public contracts;
```

### function mixin 解析

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
