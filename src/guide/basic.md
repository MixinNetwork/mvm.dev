# MVM development procedure

Note that the EVM-compatible Ethereum built by Mixin is used here as an example.

Development Procedure:

1. To deploy EVM-compatible smart contracts, you can refer to the complete uniswap deployment example：https://github.com/MixinNetwork/mvmcontracts. This process is exactly the same as the steps for deploying smart contracts on EVM. 

2. The contract can be released, after getting the relevant contract address and transaction hash from the above.

```
mvm publish -m config/config.toml -k keystore.json \
  -a 0x2A4630550Ad909B90aAcD82b5f65E33afFA04323 \
  -e 0x1938e2332d7963eff041af4f67586572899c7c7d279c07ac29feb745f8d9b6d6
```

3. The above two steps has been completed the entire deployment of the application. This step is for the users to use the above application. The command lines are relatively complicated, and need the developer to do some auxiliary work to help with.

```
mvm invoke -m config/config.toml -k keystore.json \
  -p 60e17d47-fa70-3f3f-984d-716313fe838a \
  -asset c94ac88f-4671-3976-b60a-09064f1811e8 \
  -amount 0.00002 \
  -extra 7c15d0d2faa1b63862880bed982bd3020e1f1a9a56688700000000000000000000000000bd6efc2e2cb99aef928433209c0a3be09a34f11400000000000000000000000000000000000000000000000000000000000007d0
```

Next, we will specify in details what each step and parameter is.
