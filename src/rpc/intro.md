# MVM RPC List

MVM provides some API interfaces for information fetching, which are implemented for MVM nodes.

## getmtgkeys

MVM is implemented based on MTG, the content sent to smart contract must be signed by MTG to keep veritable and effective.
Contract must verify the content with public key so that the public key of mtg is required when contract deployment.

This interface returns the public key of MTG for verification.

Request example：

```
curl  -X POST -H "Content-Type: application/json" http://127.0.0.1:9000 \n
--data '{"method": "getmtgkeys","params":[],"id":"1"}'
```

## Source code

<https://github.com/MixinNetwork/trusted-group/tree/master/mvm/rpc>
