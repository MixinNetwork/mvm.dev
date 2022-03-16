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
