# 完整的 MVM 合约开发示例 refund.sol

在上简介中，我们介绍了 MVM 实现的主要功能，这篇文章我们基于 MVM 开发一个完整的合约。分为以下几部分:

1. 实现 [solidity](https://docs.soliditylang.org/en/v0.8.13/) 合约, 这里我们用 [refund.sol](#refund-sol-源码) 作为示例，其它的合约类似。
2. 在 [Quorum](/testnet/join) 上部署 [refund](#refund-sol-源码) 合约，这部分跟 EVM 合约的部署一致。
3. 在 MVM 上发布合约
4. Mixin 用户使用合约

## refund 合约实现

[refund.sol](#refund-sol-源码) 实现了用户转帐并自动退款的智能合约。基于 MVM 的智能合约开发, 都需要实现 `function _pid()` 跟 `function _work(Event)` 两个函数:

1. `function _pid() internal pure override(MixinProcess) returns (uint128)`

    每个合约都需要有一个 PID, PID 是一个 Mixin 机器人（或者机器人用户的）client_id, 示例：

    ```text
    机器人用户的 ID: 27d0c319-a4e3-38b4-93ff-cb45da8adbe1
    // 把 user id, 去掉 `-` 前面加 `0x`
    PID: 0x27d0c319a4e338b493ffcb45da8adbe1
    ```

    PID 是 MVM 里跟智能合约的合约地址进行绑定的。

    > 注意：这个机器人的 client_id, 只能使用一次，也就是跟一个合约绑定。

2. `function _work(Event memory evt) internal override(MixinProcess) returns (bool)`

    合约执行函数, 在这个函数中，会退会用户转给合约的 token。

## 在 Quorum 上部署合约

开发者可以选择自己熟悉的部署方式，[remix](https://remix-project.org/), [hardhat](https://hardhat.org/) 等。

这里是 [hardhat](https://hardhat.org/) 的部署示例，<https://github.com/MixinNetwork/mvmcontracts>, 已经配置好 [Quorum](/testnet/join) 测试网，可以直接使用。

配置步骤:

1. 修改 [refund.sol](#refund-sol-源码) 中的 [PID](#refund-合约实现)

2. 执行以下命令：

    ```shell
    PRIVATE_KEY=privateKey yarn hardhat run --network quorum scripts/refund.ts
    ```

    > 你可以在 [https://faucet.mvmscan.com/](https://faucet.mvmscan.com/) 领取测试币

## 在 MVM 发布合约

智能合约在 [Quorum](/testnet/join) 部署完成后，需要在 MVM 与 Mixin 机器人绑定 (发布合约)，MVM 会基于 [PID](#refund-合约实现) 来打包数据，并发送到 [Quorum](/testnet/join)，生成一个给 MTG 的多签转帐，在 memo 中包含 [PID](#refund-合约实现)、合约地址等信息。

1. 开发者需要给 MTG 转一笔金额 >= 1 的 CNB，memo 为 Operation 的编码

   Operation 结构：
   ```golang
   op := &encoding.Operation{
   Purpose:  encoding.OperationPurposeAddProcess, // 发布合约固定值 11
   Process:  key.ClientId, // 机器人 client_id, 例如：27d0c319-a4e3-38b4-93ff-cb45da8adbe1
   Platform: c.String("platform"), // 如果是 EVM 合约，值是 quorum
   Address:  c.String("address"), // EVM 合约地址
   Extra:    []byte(c.String("extra")), // 可选项，如果需要自动创建资产，值是 META
   }
   ```
2. MVM 收到 output 后，会解析 memo、验证合约地址等一些基本信息。符合要求后，把这 process 这些信息保存下来，[代码示例](https://github.com/MixinNetwork/mvm-contracts/blob/main/contracts/mixin/registry.sol#L242)
3. 合约执行工作，在下一节[调用合约](/zh/reference/refund.html#调用合约)中详细描述

### 发布合约的三种方式（效果相同）：

1. 通过合约机器人发布合约。

   推荐通过合约机器人 **7000103716** 来发布合约。命令：`publish 机器人ID:合约地址`

   例子:

    ```text
    publish 72f3b2ba-775d-3b8a-a1a9-c407deab4df6:0x3EC07990be4d38b22a8910d0CB0d2bE1E9F573c3 
    ```

2. POST /transactions 接口发布合约

   相关文档：<https://developers.mixin.one/zh-CN/docs/api/transfer/payment>

   请求参数：

    ```json
    {
      "asset_id": "965e5c6e-434c-3fa9-b780-c50f43cd955c",
      "amount": "1",
      "opponent_multisig": {
        "receivers": [
          "a15e0b6d-76ed-4443-b83f-ade9eca2681a",
          "b9126674-b07d-49b6-bf4f-48d965b2242b",
          "15141fe4-1cfd-40f8-9819-71e453054639",
          "3e72ca0c-1bab-49ad-aa0a-4d8471d375e7"
        ],
        "threshold": 3
      },
      "trace_id": "5a74b05c-55d3-4081-99d0-f98917079fdf",
      "memo": "AAuNz4I9nrNNooc08KrVDA2mAAZxdW9ydW0AKjB4MkE0NjMwNTUwQWQ5MDlCOTBhQWNEODJiNWY2NUUzM2FmRkEwNDMyMwAETUVUQQ"
    }
    ```

    API 接口文档：<https://developers.mixin.one/zh-CN/docs/api/transfer/raw-transfer#transfer-to-a-multi-signature-address>

3. 通过 MTG 发布合约

   Golang 代码参考：<https://github.com/MixinNetwork/trusted-group/blob/master/mvm/publish.go>

    ```shell
    mvm publish -m config/config.toml \
    -k keystore.json \
    -a 0x2A4630550Ad909B90aAcD82b5f65E33afFA04323 \
    -e META
    ```

    * -a: 是指合约的地址，需要区分大小写
    * -e: 可选项 META，表示自动创建资产
    * -m: 配置文件，示例地址：<https://github.com/MixinNetwork/trusted-group/blob/master/mvm/config/config.example.toml>, 这里只用到了 mtg.genesis 里 members, threshold 两个配置。
      members 是 mtg 里的多签节点的 id, 示例中的是真实的测试网的 mtg 节点, 可以直接使用
    * -k: 合约需要跟一个 Mixin 的用户绑定，keystore.json 就是这个用户的私钥跟 pin 信息。

## 调用合约

Mixin 用户使用合约同样也是通过 MTG 的多签转帐。需要开发者生成一个用户对 MTG 多签转帐的链接。

1. 开发者生成一个多签转账的支付链接，例如：`https://mixin.one/codes/:code_id`

   把 Operation base64 encode 之后作为 memo，调用 POST /payments 接口获取 code_id，相关文档：
   <https://developers.mixin.one/zh-CN/docs/api/transfer/payment>

   金额没有限制, 最小 0.00000001，币种需要 Mixin 主网支持

   Operation 结构
   ```golang
   op := &encoding.Operation{
    Purpose: encoding.OperationPurposeGroupEvent, // 固定值 1
    Process: c.String("process"), // 机器人的 client_id
    Extra:   extra, // 合约执行的内容，refund 合约为空
   }
   ```

2. 用户支付，使用 mixin messenger 扫码（或者唤起）支付。


## MVM 内部原理：

1. 用户完成支付后，MVM 会收到 output，通过解析 output 的 memo，拿到资产、金额、执行合约地址等相关信息并保存为 Event
2. MVM 把 Event 按格式编码之后，发送给 refund 合约
3. refund 反编码 Event, 进行简单的 timestamp、nonce 的验证，[代码示例](https://github.com/MixinNetwork/mvm-contracts/blob/main/contracts/mixin/refund.sol#L17)
4. refund 合约执行完成后，通过 `event MixinTransaction(bytes)` 返回给 MVM 退款信息，[代码示例](https://github.com/MixinNetwork/mvm-contracts/blob/main/contracts/mixin/refund.sol#L21)。
   > 注意：`event MixinTransaction(bytes)` 只能在注册 publish 的那一个合约里用，其他合约用不了
5. MVM 接收到执行结果后，把 Token 返还给用户

代码示例：<https://github.com/MixinNetwork/trusted-group/blob/master/mvm/invoke.go>

## refund.sol 源码

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.4 <0.9.0;

import {MixinProcess} from './mixin.sol';

// a simple contract to refund everything
contract RefundWorker is MixinProcess {
  // PID is a UUID of Mixin Messenger user, e.g. 27d0c319-a4e3-38b4-93ff-cb45da8adbe1
  uint128 public constant PID = 0x27d0c319a4e338b493ffcb45da8adbe1;

  function _pid() internal pure override(MixinProcess) returns (uint128) {
    return PID;
  }

  // just refund everything
  function _work(Event memory evt) internal override(MixinProcess) returns (bool) {
    require(evt.timestamp > 0, "invalid timestamp");
    require(evt.nonce % 2 == 1, "not an odd nonce");

    bytes memory log = buildMixinTransaction(evt.nonce, evt.asset, evt.amount, evt.extra, evt.members);
    emit MixinTransaction(log);

    return true;
  }
}
```

开源地址：<https://github.com/MixinNetwork/trusted-group/blob/master/mvm/quorum/contracts/refund.sol>

## 总结

[refund](#refund-sol-源码) 包含了通过 MVM 部署合约，及用户调用合约的整个流程，但是开发者不能直接使用原有的智能合约，需要进行一些修改。

为了方便开发者直接使用原有的合约，我们实现了 [registry.sol](./registry)。通过 [registry](./registry)，原有的合约可以直接迁移，不需要任何的修改，接下来我们介绍一下 [registry](./registry) 的实现及原理。
