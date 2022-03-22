# 完整的 MVM 合约开发示例 refund.sol

基本流程

1. 写一个 solidity 合约, 我们用 refund.sol 作用示例，其它的合约类似
2.  发布 MVM 合约
3.  使用合约

## solidity 合约实现

`refund.sol` 实现了用户通过转帐调用 MVM 会自动退款的功能。

1. `function _pid() internal pure override(MixinProcess) returns (uint128)`

    pid 是一个 Mixin 机器人（或者机器人用户的）user_id, 示例：
    
    机器人用户的  id: 27d0c319-a4e3-38b4-93ff-cb45da8adbe1, PID 0x27d0c319a4e338b493ffcb45da8adbe1，把 user id, 去掉 `-` 前面加 `0x`    
    
2. `function _work(Event memory evt) internal override(MixinProcess) returns (bool)`

    合约执行函数, 在这个函数中，会退会用户转给合约的 token。

3. 在 quorum 上部署合约, 示例：https://github.com/MixinNetwork/mvmcontracts

## 发布合约

发布合约是一个给 MTG 的多签转帐，在 memo 里会带有合约地址，PID 等信息。

1. 开发者给 MTG 转一笔金额 >= 1 的 CNB, memo 为 Operation 的编码
2.  MVM 收到 output 后，会解析 memo, 验证合约地址等一些基本信息，符合要求后，把这 process 这些信息保存下来
3.  合约执行工作，在下一步调用合约，详细描述

memo 是 Operation 的编码：

```
op := &encoding.Operation{
  Purpose:  encoding.OperationPurposeAddProcess, // 发布合约固定值 11
  Process:  key.ClientId, // 机器人 client_id
  Platform: c.String("platform"), // 如果是 EVM 合约，值是 quorum
  Address:  c.String("address"), // EVM 合约地址
  Extra:    []byte(c.String("extra")), // 可选项，如果需要自动创建资产，值是 META
}
```

POST /transactions 接口

API 接口文档：https://developers.mixin.one/zh-CN/docs/api/transfer/raw-transfer

命令行示例：

```
mvm publish -m config/config.toml \
  -k keystore.json \
  -a 0x2A4630550Ad909B90aAcD82b5f65E33afFA04323 \
  -e META
```

* -a: 是指合约的地址，需要区分大小写
* -e: 可选项 META, 是否带资产信息
* -m: 配置文件，示例地址：https://github.com/MixinNetwork/trusted-group/blob/master/mvm/config/config.example.toml, 这里只用到了 mtg.genesis 里 members, threshold 两个配置
members 是，mtg 里的多签节点的 id, 示例中的是真实的测试网的 mtg 节点, 可以直接使用
* -k: 合约需要跟一个 Mixin 的用户绑定, keystore.json 就是这个用户的私钥跟 pin 信息。

代码示例：https://github.com/MixinNetwork/trusted-group/blob/master/mvm/publish.go

## 调用合约

用户使用合约同样也是通过 MTG 的多签转帐。

1. 开发者生成一个 https://mixin.one/codes/:id，
	
   把 Operation encode 之后做为 memo, 调用 POST /payments 接口, 相关文档：
   https://developers.mixin.one/zh-CN/docs/api/transfer/payment

2. 用户支付，使用 mixin messenger 扫码（或者唤起）支付。

以下是 MVM 的内部实现原理简述：

1. 用户完成支付后，MVM 会收到 output，通过解析 output 的 memo, 拿到资产，金额，执行合约地址等相关信息，保存为 Event
2. MVM 把 Event 按格式编码之后，发送给 refund 合约
3. refund 反编码 Event, 只是做了简单的 timestamp， nonce 的验证
4. 执行完成后，通过 ` event MixinTransaction(bytes);`  返回给 MVM 退款信息
5. MVM 获取到结果后，把钱返还给用户

POST /transactions 接口，金额没有限制，币种需要是 Mixin 主网支持

Operation 结构
```
op := &encoding.Operation{
	Purpose: encoding.OperationPurposeGroupEvent, // 固定值 1
	Process: c.String("process"), // 机器人的 client_id
	Extra:   extra, // 合约执行的内容，refund 合约为空
}
```

代码示例：https://github.com/MixinNetwork/trusted-group/blob/master/mvm/invoke.go

## refund 源码 

源代码地址：https://github.com/MixinNetwork/trusted-group/blob/master/mvm/quorum/contracts

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

## 总结

refund 包含了通过 MVM 部署合约，及用户调用合约的整个流程，但是开发者不能直接使用，需要对原有的合约进行一些修改，为了方便开发者直接使用原有的合约，我们做了实现了 registry.sol ，通过 registry, 原有的合约可以直接使用，不需要任何的修改。
 
