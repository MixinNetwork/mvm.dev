---
home: true
heroImage: https://v1.vuepress.vuejs.org/hero.png
tagline: Mixin Virtual Machine
actionText: Quick Start →
footer: Made by mixin.dev with ❤️
---


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
