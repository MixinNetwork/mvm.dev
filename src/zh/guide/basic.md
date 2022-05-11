# MVM 开发流程

> 注意这里以 Mixin 搭建的 EVM 兼容的 Ethereum 为例

开发流程:

1. 部署 evm 兼容的智能合约, 完整的 uniswap 的部署示例可以参考： <https://github.com/MixinNetwork/mvmcontracts> , 这一过程跟 evm 上部署智能合约的步骤完全一致。

2. 从上面拿到相关的合约地址跟交易哈希之后, 就可以发布合约.

    ```shell
    mvm publish -m config/config.toml -k keystore.json \
      -a 0x2A4630550Ad909B90aAcD82b5f65E33afFA04323 \
      -e 0x1938e2332d7963eff041af4f67586572899c7c7d279c07ac29feb745f8d9b6d6
    ```

3. 上面两步，已经完成了整个应用的部署, 这一步是用户使用上面应用，用命令相对复杂，也需要开发者做一些辅助使用工作

```shell
mvm invoke -m config/config.toml -k keystore.json \
  -p 60e17d47-fa70-3f3f-984d-716313fe838a \
  -asset c94ac88f-4671-3976-b60a-09064f1811e8 \
  -amount 0.00002 \
  -extra 7c15d0d2faa1b63862880bed982bd3020e1f1a9a56688700000000000000000000000000bd6efc2e2cb99aef928433209c0a3be09a34f11400000000000000000000000000000000000000000000000000000000000007d0
```

接下来我们会具体解释每一步及参数都是做了什么
