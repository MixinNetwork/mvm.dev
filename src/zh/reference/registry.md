# registry 合约原理及使用

在上一篇文章中 [refund](./refund) 合约部署中，我们介绍了如何在 MVM 部署并使用一个完整的合约，其中提到，合约开发者需要对原有的合约做一些修改，因此我们又进一步实现了 [registry.sol](#开源代码), 通过 [registry](#开源代码) 可以直接部署原有合约，直接在 MVM 中使用。

[registry](#开源代码) 是 MVM 代理合约, 原有的智能合约不需要做修改，在 [Quorum](/testnet/join) 上部署后，可以直接通过 [registry](#开源代码) 来执行。

## 如何使用 registry

1. 合约开发者部署 EVM 智能合约(过程与 [refund.sol](./refund.html##refund-sol-源码) 等其它合约部署类似)，部署完成后，拿到合约地址。

2. 用户调用合约时，需要使用开发者生成的一个支付链接。支付链接通过 POST /payments 生成。

    提示: 这个支付地址的生成没有限制，任何人只需知道合约地址都可以生成。
    相关文档：<https://developers.mixin.one/zh-CN/docs/api/transfer/payment>

    ```golang
    op := &encoding.Operation{
      Purpose: encoding.OperationPurposeGroupEvent, // 固定值 1
      Process: c.String("process"), // registry 合约的机器人的 client_id，TODO
      Extra:   extra, // 合约执行的内容
    }
    ```

    extra 分成三部分，示例：

    ```text
    7c15d0d2faa1b63862880bed982bd3020e1f1a9a56688700000000000000000000000000bd6efc2e2cb99aef928433209c0a3be09a34f11400000000000000000000000000000000000000000000000000000000000007d0
    ```

    1. 0x7c15d0D2faA1b63862880Bed982bd3020e1f1A9A 去掉 0x 后全部小写，是需要执行合约的地址
    2. 56688700 则是 addLiquidity(address,uint256) 的 KECCAK256 hash 值去掉 0x 的八位

        ```javascript
        // 使用 ethers 例子
        const method = "addLiquidity"
        const methodType = "address,uint256"
        const methodExtra = utils.id(`${method}(${methodType})`).slice(2, 10)
        ```

    3. 剩下的是参数内容，上面的例子中是 c6d0c728-2624-429b-8e0d-d9d19b6592fa 是 BTC 在 Mixin 网络里的资产 ID，通过 [registry.sol 中的对应关系获取](#messenger-用户-资产跟-mvm-合约中如何对应) 获取 contracts address，加上 amount 0.00002 的 ABI 编码，同样去除 0x

        ```javascript
        // 使用 ethers 例子
        const params = "0xBD6efC2e2cb99aef928433209c0a3BE09a34F114,2000"
        const abiCoder = new utils.AbiCoder()
        const paramsExtra = abiCoder.encode(methodType.split(","), params.split(",")).slice(2)
        ```

    编码格式参照：<https://docs.soliditylang.org/en/v0.8.12/abi-spec.html>

3. MVM 收到这个 output 后，解析 memo 成 Event
4. MVM 把 Event 按格式编码之后，发送给 [registry](#开源代码) 合约
5. [registry](#开源代码) 执行 `function mixin`, 并调用相关合约
6. 执行完成后，通过 `event MixinTransaction(bytes);`  返回给 MVM 相关 Event 信息
7. MVM 获取到结果后，如果需要转帐给用户，不需要则跳过

开发者，只需要在第 2 步，拿到 code_id, 生成 `https://mixin.one/codes/:id` 即可, 剩下的都是 MVM 的执行逻辑。 关于 Event 的编码，可以从[这篇文章](/guide/encoding.html#mtg-到-mvm-的编码格式)了解。

## function mixin 实现

`function mixin()` 是 MVM 调用智能合约的入口, 也是 registry 中的唯一入口，所有后续的合约操作都需要通过这个函数。

当 MVM 调用 mixin 这个函数，raw 会解析成相关的参数, 如下:

1. process (PID), uuid 验证部署的 process 跟调用的 process 是否一致
2. nonce, EVM 需要每次调用需要 nonce + 1
3. asset id, mixin 里资产的 id
4. amount, 需要操作的资产数量
5. extra, 包含着资产, 合约的一些信息
6. timestamp, 目前没有验证，合约可以根据自己的情况来决定是否使用
7. user, Mixin 用户 ID，也可能是多签帐号, 如果用户不存在会创建对应的 Quorum 帐号
8. 解析 5 里面的 extra 值, 如果 Quorum 对应资产不存在会创建资产
9. 验证签名
10. 给 Mixin 用户，对应的 MVM 帐号转入相应的资产
11. 调用合约, 执行完成后，销毁 MVM 帐号的资产
12. 返回调用结果 ( 通过调用 `emit MixinTransaction` )

具体的代码实现

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

## Messenger 用户，资产跟 MVM 合约中如何对应

Messenger 用户，资产都需要跟 MVM 里的帐号跟资产对应，对应方式都在以下三个公开的 map 里获取:

```solidity
mapping(address => bytes) public users;
mapping(address => uint128) public assets;
mapping(uint => address) public contracts;
```

## 开源代码

registry.sol 开源地址: <https://github.com/MixinNetwork/trusted-group/tree/master/mvm/quorum/contracts>

## 总结

相比于 [refund.sol](#开源代码) 合约开发者需要完成一些兼容工作( PID, `_work()` 的实现)，registry 辅助实现了，Mixin 用户与 [Quorum](/testnet/join) 帐户，mixin 资产与 [Quorum](/testnet/join) 资产的映射，合约调用，以及执行结果返回的工作。

EVM 合约也可以直接迁移不需要作修改。下一节，我们会介绍如何会基于 MVM 部署一个完整的 [uniswap](/guide/uniswap.html) 的合约。
