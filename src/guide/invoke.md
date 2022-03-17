# 调用合约

调用合约同样也是向 MVM 发送一笔多签的转帐交易, 这里需要开发者, 生成一个支付码, 用户支付完会直接调用智能合约。

调用合约示例

```
mvm invoke -m /path/to/config.toml \
  -k /path/to/keystore.json \
  -p 60e17d47-fa70-3f3f-984d-716313fe838a \
  -asset c94ac88f-4671-3976-b60a-09064f1811e8 \
  -amount 0.00002 \
  -extra 7c15d0d2faa1b63862880bed982bd3020e1f1a9a56688700000000000000000000000000bd6efc2e2cb99aef928433209c0a3be09a34f11400000000000000000000000000000000000000000000000000000000000007d0
```

* -asset: 指的是 Mixin 资产的 id
* -amount: 资产数量
* -m: config.toml 跟 publish 一样, 只用到了 mtg.genesis 里 members, threshold 两个配置
* -k: keystore.json 生成多签转帐的 code，需要用户验证，不需要 pin
* -p: registry.sol 的 process id, 正式网后会固定用一个, 具体会在 registry 里解释
* -extra: mvm 通过解析这个数据来执行具体的合约跟方法, extra 分成两部分:
  1. 0x7c15d0D2faA1b63862880Bed982bd3020e1f1A9A 去掉 0x 后全部小写, 是合约的地址
  2. 从 566887 开始则是 addLiquidity(address,uint256) 方法加详细参数的 ABI 值, 上面的例子中是 c6d0c728-2624-429b-8e0d-d9d19b6592fa 是 BTC 在 Mixin 网络里的资产 ID，跟 amount 0.00002 的 ABI 编码, 这个我们会单独的介绍，主要参照：https://docs.soliditylang.org/en/v0.8.12/abi-spec.html
