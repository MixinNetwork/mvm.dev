# Complete MVM Contract Development Example refund.sol

In the previous part, we introduced the main functions implemented by MVM. In this article, we will show how to develop a complete contract based on MVM.  Including the following parts:

1. Implement the solidity contract. Here we use refund.sol as an example, while other contracts are in similar process. The open source code is at the end of the article. 
2. Deploy the refund contract on the quorum, with the same operation as the deployment of the EVM contract. 
3. Publish contracts on MVM
4. Mixin users use the contracts 

## Refund Contract Implementation

`refund.sol` implements a smart contract for user transfers and automatic refunds. For the development of smart contracts based on MVM, two functions `function _pid()` and `function _work(Event)` need to be implemented:   

1. `function _pid() internal pure override(MixinProcess) returns (uint128)`

    PID is needed for each contract, which is the client_id of Mixin bot (or bot user), for example:  
    
    Bot user id: 27d0c319-a4e3-38b4-93ff-cb45da8adbe1, by removing `-` and adding `0x` in front of user id, you can get PID: 0x27d0c319a4e338b493ffcb45da8adbe1

    The PID is bound to the contract address of the smart contract in MVM. 

    Note: The client_id of the bot can only be used once, that is to say, it can only be bound to one contract. 
    
2. `function _work(Event memory evt) internal override(MixinProcess) returns (bool)`

    This is contract execution function. By this function, the token that the user transfers to the contract will be returned. 

There is source code and open source address at the end of the article for this.

## Deploy the Contract on Quorum

Developers can choose the deployment method they are familiar with, such as remix, hardhat, etc.

Here is a deployment example for hardhat, https://github.com/MixinNetwork/mvmcontracts, which can be used directly if the quorum testnet has been configured.

TODO: To add refund deployment commands.

## Publish the Contract on MVM

After the smart contract is deployed on Quorum, it needs to be bound to the Mixin bot on the MVM (publish the contract). MVM will package the data based on the PID, send it to Quorum, and return the execution result in the Quorum to the Mixin user. 

Publishing a contract is a multi-signature transfer to MTG, which will contain contract address, PID, contract address and other information in the memo. 

1. The developer needs to transfer CNB with the amount >= 1 to MTG, with the code of Operation as the memo
2. After the MVM receives the output, it will parse the memo, verify some basic information such as the contract address etc., and save this process information if requirements are met.   
3. The contract execution work will be described in detail in the next step of calling the contract.  

memo is the encoding of Operation:

```
op := &encoding.Operation{
  Purpose:  encoding.OperationPurposeAddProcess, // fixed value of contract publish 11
  Process:  key.ClientId, // bot client_id, for example：27d0c319-a4e3-38b4-93ff-cb45da8adbe1 
  Platform: c.String("platform"), // if it is an EVM contract, the value is quorum
  Address:  c.String("address"), // EVM contract address
  Extra:    []byte(c.String("extra")), // optional, value is META if automatically create assets is needed 
}
```

1. POST /transactions interface

  Request parameters:

  ```
  {
    "asset_id":     "965e5c6e-434c-3fa9-b780-c50f43cd955c",
    "amount":       "1",
    "opponent_multisig":  {
      "receivers": [
        "a15e0b6d-76ed-4443-b83f-ade9eca2681a",
        "b9126674-b07d-49b6-bf4f-48d965b2242b",
        "15141fe4-1cfd-40f8-9819-71e453054639",
        "3e72ca0c-1bab-49ad-aa0a-4d8471d375e7"
      ],
      "threshold": 3
    },
    "trace_id":     "5a74b05c-55d3-4081-99d0-f98917079fdf",
    "memo":         "AAuNz4I9nrNNooc08KrVDA2mAAZxdW9ydW0AKjB4MkE0NjMwNTUwQWQ5MDlCOTBhQWNEODJiNWY2NUUzM2FmRkEwNDMyMwAETUVUQQ",
  }
  ```

  API interface documentation: https://developers.mixin.one/zh-CN/docs/api/transfer/raw-transfer#transfer-to-a-multi-signature-address


2. You can also refer to the Golang code example: https://github.com/MixinNetwork/trusted-group/blob/master/mvm/publish.go

  ```
  mvm publish -m config/config.toml \
    -k keystore.json \
    -a 0x2A4630550Ad909B90aAcD82b5f65E33afFA04323 \
    -e META
  ```

  * -a: refers to the address of the contract, which needs to be case sensitive
  * -e: optional META, with or without asset information
  * -m: configuration file, example address: https://github.com/MixinNetwork/trusted-group/blob/master/mvm/config/config.example.toml, only the two configurations of members and threshold in mtg.genesis are used here
  members is the id of the multi-signature node in MTG. The MTG nodes in the example are the real nodes in the testnet, which can be used directly  
  * -k: the contract needs to be bound to a Mixin user, and keystore.json is the user's private key and pin information 

3. It is recommended to use the contract bot 7000103716 to publish the contract.

All of the above three methods can be used to publish the bot with the same effect.

## How to Call the Contract

Mixin users use the contract through MTG's multi-signature transfer. Thus, the developer needs to generate a link for the user to do MTG multi-signature transaction. 

1. The developer generates a https://mixin.one/codes/:id，
	
   encode Operation and use it as memo, call POST /payments interface, here is related documentation:
   https://developers.mixin.one/zh-CN/docs/api/transfer/payment

   There is no limit on the amount but minimum 0.00000001, and the tokens should be the ones Mixin mainnet supported. 

2. 用户支付，使用 mixin messenger 扫码（或者唤起）支付。

Operation 结构

```
op := &encoding.Operation{
	Purpose: encoding.OperationPurposeGroupEvent, // 固定值 1
	Process: c.String("process"), // 机器人的 client_id
	Extra:   extra, // 合约执行的内容，refund 合约为空
}
```

以下是 MVM 的内部实现原理简述：

1. 用户完成支付后，MVM 会收到 output，通过解析 output 的 memo, 拿到资产，金额，执行合约地址等相关信息，保存为 Event
2. MVM 把 Event 按格式编码之后，发送给 refund 合约
3. refund 反编码 Event, 只是做了简单的 timestamp， nonce 的验证
4. 执行完成后，通过 ` event MixinTransaction(bytes);`  返回给 MVM 退款信息
   注意: `event MixinTransaction(bytes)` 只能在注册 publish 的那一个合约里用，其他合约用不了
5. MVM 接收到执行结果后，把 Token 返还给用户

代码示例：https://github.com/MixinNetwork/trusted-group/blob/master/mvm/invoke.go

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

开源地址：https://github.com/MixinNetwork/trusted-group/blob/master/mvm/quorum/contracts

## 总结

refund 包含了通过 MVM 部署合约，及用户调用合约的整个流程，但是开发者不能直接使用原有的智能合约，需要进行一些修改。

为了方便开发者直接使用原有的合约，我们实现了 registry.sol ，通过 registry, 原有的合约可以直接迁移，不需要任何的修改, 接下来我们介绍一下 registry 实现及原理。
