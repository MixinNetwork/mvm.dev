# 发布合约

部署好的智能合约需要在 MVM 上注册才能使用, 实现原理是向 MVM 发送了一笔多签转帐，示例命令如下:

```
mvm publish -m /path/to/config.toml \
  -k /path/to/keystore.json \
  -a 0x2A4630550Ad909B90aAcD82b5f65E33afFA04323 \
  -e 0x1938e2332d7963eff041af4f67586572899c7c7d279c07ac29feb745f8d9b6d6
```

* -a: 是指合约的地址，需要区分大小写
* -e: 部署合约的 交易哈希
* -m: 配置文件，示例地址：https://github.com/MixinNetwork/trusted-group/blob/master/mvm/config/config.example.toml, 这里只用到了 mtg.genesis 里 members, threshold 两个配置
members 是，mtg 里的多签节点的 id, 示例中的是真实的测试网的 mtg 节点, 可以直接使用
* -k: 合约需要跟一个 Mixin 的用户绑定, keystore.json 就是这个用户的私钥跟 pin 信息。

发布合约也可以通过合约机器人发布, 搜索: 7000103716 能获取
