---
home: true
heroImage: https://v1.vuepress.vuejs.org/hero.png
tagline: Mixin Virtual Machine
actionText: Quick Start →
footer: Made by mixin.dev with ❤️
---

## MVM 主要是用来做什么

Mixin 的愿景是希望服务更多的用户跟开发者，由于 Mixin 采用的隐私程度相同, 但是更灵活 TIP 方案来存储私钥，使得像其它链（比如 evm, eos）的开发者不能方便的使用已经技术方案。MVM 的出现解决了这方面的问题。

MVM 可以让其它网络上的开发者（几乎）不需要做任何修改部署应用，来服务 Mixin 用户，达到共赢。

## 基于 MVM 的开发完整流程, 以 Ethereum 为例

注意，这里指的 Ethereum 并不是 Eth Mainnet, 面是指 mixin 自己搭建的 evm 兼容的 ethereum 网络。

后面会详细解释每一步及参数的作用

1. 部署 evm 兼容的智能合约, 完整的 uniswap 的部署示例可以参考： https://github.com/MixinNetwork/mvmcontracts , 这一过程跟 evm 上部署智能合约的步骤完全一致。
2. 从上面拿到相关的合约地址跟交易哈希之后, 就可以发布合约.
  ```
  mvm publish -m config/config.toml -k keystore.json \
    -a 0x2A4630550Ad909B90aAcD82b5f65E33afFA04323 \
    -e 0x1938e2332d7963eff041af4f67586572899c7c7d279c07ac29feb745f8d9b6d6
  ```
3. 上面两步，已经完成了整个应用的部署, 这一步是用户使用上面应用，用命令相对复杂，也需要开发者做一些辅助使用工作
  ```
  mvm invoke -m config/config.toml -k keystore.json \
      -p 60e17d47-fa70-3f3f-984d-716313fe838a \
      -asset c94ac88f-4671-3976-b60a-09064f1811e8 \
      -amount 0.00002 \
      -extra 7c15d0d2faa1b63862880bed982bd3020e1f1a9a56688700000000000000000000000000bd6efc2e2cb99aef928433209c0a3be09a34f11400000000000000000000000000000000000000000000000000000000000007d0
  ```

上面 3 步，包含一个 EVM （兼容）应用，基于 MVM 的完整的开发，使用流程

## Mixin 主网与 MVM 的交互原理

所有 Mixin 需要执行 MVM 的操作 (publish, invoke), 都是一笔多签转帐 (基于 MTG), memo 里会包含具体的操作, 所有的结果返回都是通过监听 MixinTransaction 获取

1. Mixin 调用 MVM 

```
  function mixin(bytes memory raw) public returns (bool) {
```

2. Mixin 获取 MVM 执行结果

```
  event MixinTransaction(bytes);
```

## MVM 的结构分析

MVM 开源代码地址：https://github.com/MixinNetwork/trusted-group/tree/master/mvm, 这里列出了主要的目录的实现功能:

1. MVM 主要通过 ./quorum, 与 Mixin 部署的 evm 兼容网络交互
2. ./eos 跟 1 类似, 与 eos 交互
3. ./machine, 处理 Mixin 通过多签发送的数据，处理 MVM 返回的数据，并返回给 Mixin
4. ./store，持久化用户, 资产信息，相关的调用事件

## registry.sol 是什么

## ABI 编码规范

https://docs.soliditylang.org/en/v0.8.12/abi-spec.html

## MVM 使用问题

#### 发布合约命令

```
  mvm publish -m config/config.toml -k keystore.json \
    -a 0x2A4630550Ad909B90aAcD82b5f65E33afFA04323 \
    -e 0x1938e2332d7963eff041af4f67586572899c7c7d279c07ac29feb745f8d9b6d6
```

#### 调用合约

```
  mvm invoke -m config/config.toml -k keystore.json \
      -p 60e17d47-fa70-3f3f-984d-716313fe838a \
      -asset c6d0c728-2624-429b-8e0d-d9d19b6592fa \
      -amount 0.00002 \
      -extra 7c15d0d2faa1b63862880bed982bd3020e1f1a9a5668870000000000000000000000000099cfc3d0c229d03c5a712b158a29ff186b294ab300000000000000000000000000000000000000000000000000000000000007d0
```

#### Mixin 资产如何跟 MVM 资产对应

#### Mixin 用户如何跟 MVM 帐号对应
