# Registry 合约原理及使用

我们将在本章介绍 Registry 合约的原理，展示如何在 MVM 中部署合约并通过 Registry 调用部署合约。我们还会介绍如何解决调用合约中遇到的问题。

## 介绍
[Registry](#开源代码) 是 MVM 代理合约，原有的智能合约不需要做修改，在 [Quorum](/zh/quorum/join) 上部署后，
可以直接通过 Registry 来执行。

### function mixin 

`function mixin(bytes memory raw) public returns (bool)` 是 MVM 调用智能合约的入口，也是 Registry 中的唯一入口，
所有后续的合约操作都需要通过这个函数。

当 MVM 调用 mixin 这个函数，raw 会解析成相关的参数, 步骤如下:

1. 验证部署的 process 跟调用的 process 是否一致
2. 验证 nonce，需要每次调用需要 nonce + 1
3. 解析 asset_id：mixin 里资产的 id
4. 解析 amount：需要操作的资产数量
5. 解析 extra：包含着资产、合约调用的一些信息
6. 解析 timestamp：目前没有验证，合约可以根据自己的情况来决定是否使用
7. 解析 user：Mixin 用户 ID，也可能是多签帐号, 如果用户不存在会创建对应的 Quorum 帐号
8. 解析 5 里面的 extra 值, 如果 Quorum 对应资产不存在会创建资产
9. 验证签名
10. 通过 MixinEvent 事件暴露接受到到参数，开发者可以在浏览器中的 logs 检查参数，（主网和测试网浏览器的地址见 [Quorum](/zh/quorum/join)）
11. 给 Mixin 用户，对应的 MVM 帐号转入相应的资产，[代码示例](https://github.com/MixinNetwork/mvm-contracts/blob/main/contracts/mixin/registry.sol#L204)
12. 依次调用合约，[代码示例](https://github.com/MixinNetwork/mvm-contracts/blob/main/contracts/mixin/User.sol#L42)
13. 合约调用的结果通过 `ProcessCalled` 事件返回，[代码示例](https://github.com/MixinNetwork/mvm-contracts/blob/main/contracts/mixin/User.sol#L82)
，开发者可以在浏览器的 logs 中的找到。

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

### event ProcessCalled

[ProcessCalled 事件](https://github.com/MixinNetwork/mvm-contracts/blob/main/contracts/mixin/User.sol#L11) 
显示 MVM 中通过 Registry 合约调用其他合约的结果，每个合约调用都会有一个对应的 `ProcessCalled` 事件。其中 `process` 是要调用合约的地址，`input` 是调用合约的函数签名及参数，
`result` 表示调用是否成功，`output` 为返回结果

具体示例：

```solidity
event ProcessCalled(
    address indexed process,
    bytes input,
    bool result,
    bytes output
);
```

## 开源代码

registry.sol 开源地址: <https://github.com/MixinNetwork/trusted-group/tree/master/mvm/quorum/contracts>

## 总结

本节我们介绍了 Registry 合约的原理，我们将在下一节介绍如何在 [Quorum](/zh/quorum/join) 中部署一个合约，并在之后讲解如何通过 Registry 合约来调用部署的合约。
