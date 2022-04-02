### 1. 安装geth
[https://geth.ethereum.org/docs/install-and-build/installing-geth](https://geth.ethereum.org/docs/install-and-build/installing-geth)

### 2. 初始化 geth
```json
{
  "config": {
    "chainId": 83927,
    "homesteadBlock": 0,
    "eip150Block": 0,
    "eip155Block": 0,
    "eip158Block": 0,
    "byzantiumBlock": 0,
    "constantinopleBlock": 0,
    "petersburgBlock": 0,
    "clique": {
      "period": 1,
      "epoch": 30000
    }
  },
  "difficulty": "1",
  "gasLimit": "8000000",
  "extradata": "0x0000000000000000000000000000000000000000000000000000000000000000963236ecb4b85347cc544534aed3f0678e6573940000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "alloc": {
    "4f797d7dd0d5adcada1892f94ad6743f382c4fe8": { "balance": "10000000000000000000000000" },
    "963236ecb4b85347cc544534aed3f0678e657394": { "balance": "40000000000000000000000000" }
  }
}
```
以上必须直接复制粘贴, 可以检查一下文件 md5
```shell
md5sum genesis.json
1b4eed81832225c67f0384883348ca0f  genesis.json
```

确认没问题后.
```shell
geth init --datadir data genesis.json
```

### 3. 开始同步
```shell
geth \
    --networkid 83927 \
    --datadir data \
    --syncmode full \
    --maxpeers 10000000 \
    --port 30303 \
    --allow-insecure-unlock \
    --http \
    --http.addr '0.0.0.0' \
    --http.port 8545 \
    --http.corsdomain '*' \
    --http.api 'eth,net,web3,personal,admin,txpool,debug' \
    --http.vhosts '*' \
    --ws \
    --ws.api 'eth,net,web3,debug,txpool' \
    --ws.addr 0.0.0.0 \
    --ws.port 8546  \
    --bootnodes 'enode://dbd4fce8e212bc262777c5d040df097e24a6dbeed275095f0b188405f84bd7dcd9cb56c225bce812bc369b0eb45a0bca125b85b134dfe0db1c95257556b09758@104.197.245.214:30303','enode://8103c7294d5a7a5d400c79c7a07c00c5621757b3707fc054e4e8cd5942193cf3682e7ca4803e744d158a1440bb211c173de3d69463a5d1c1924233ebab1d524b@35.77.35.215:42104','enode://5d8156837d35d260c2c4a220bb8c16503d4ddc93e5d8b07ce758588c70f2760eea98d59d68f41d4de895dfa160a58c05d3e40948a2b4f20a3efeed0563ad9386@104.154.95.22:30303','enode://91db48054c4fe62561bfb4bc20832173a24b155cfe810a1270ffe6db73c7c78a264f09165e7fe011206b9104750be72ce6ecd898ca8b75fc4755931a954b96be@45.32.248.183:50030','enode://ce3005829a6b7f0777b6ddb5ca9b84c4814a6c97d05b943bd1fabaec9a38bfa2b4775f00e22010fdab721a78f34d5e08b520502c1261c935e292fe2ed647d62a@18.220.184.249:30303' \
    --gcmode=archive \
    --snapshot=false \
    --vmodule 'rpc=5'
```

### 4. 等待同步完成即可
> 可自行添加守护进程