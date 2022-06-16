# How Messenger Users Use Contracts 

In the previous steps, we completely deployed a uniswap contract, and showed how to call the uniswap contract through the registry to add liquidity. In this article, we will explain in more detail what developers need to do, and what MVM does in this process.  

First of all, please note that the process of invoking the contract through MVM is actually the process of the user making transactions to MTG through a specific memo. 

## User Payment Link Generation

API Interface POST /payments, and take the BTC in the previous steps as an example: 

```json
{
  "asset_id": "c6d0c728-2624-429b-8e0d-d9d19b6592fa",
  "amount": "0.00002",
  "opponent_multisig": {
    "receivers": [
      "a15e0b6d-76ed-4443-b83f-ade9eca2681a",
      "b9126674-b07d-49b6-bf4f-48d965b2242b",
      "15141fe4-1cfd-40f8-9819-71e453054639",
      "3e72ca0c-1bab-49ad-aa0a-4d8471d375e7"
    ],
    "threshold": 3
  },
  "trace_id": "5a74b05c-55d3-4081-99d0-f98917079fdf",
  "memo": "7c15d0d2faa1b63862880bed982bd3020e1f1a9a5668870000000000000000000000000099cfc3d0c229d03c5a712b158a29ff186b294ab300000000000000000000000000000000000000000000000000000000000007d0",
}
```

1. asset_id is the id of the asset
2. amount is the amount of the transferred asset
3. 'opponent_multisig.receivers' is the id of the trusted node in MTG
4. 'opponent_multisig.receivers' is the 3 part in 3/4 signature requirement
5. trace_id is the unique id of the transfer, which needs to be regenerated every time 
6. memo is the core part of calling contract, which will be specified separately

Specific API Documentation: https://developers.mixin.one/zh-CN/docs/api/transfer/payment#post-payments

### Encoding Format of Memo

Let's take the uniswap contract as an example:

```text
7c15d0d2faa1b63862880bed982bd3020e1f1a9a5668870000000000000000000000000099cfc3d0c229d03c5a712b158a29ff186b294ab300000000000000000000000000000000000000000000000000000000000007d0
```

`0x7c15d0D2faA1b63862880Bed982bd3020e1f1A9A` after removing 0x and making all lowercase, we can get the address of UniswapMVVMRouter.

`566887` is the addLiquidity(address,uint256) abi encoding.

`0000000000000000000000000099cfc3d0c229d03c5a712b158a29ff186b294ab3` is the asset contract address in the registry corresponding to mixin BTC.
`00000000000000000000000000000000000000000000000000000000000007d0` is the abi code of the transfer amount, i.e. the code of "0.00002".

## User Payment

The generated link format is https://mixin.one/codes/:id. Users can evoke payment by scanning the code or through the messenger. 

## MVM Internal Call

1. After the user completes the payment, MVM will receive the output, and by parsing the memo of the output, the asset type, amount, execution contract address and other related information can be got and be saved as Event   
2. MVM encodes the Event according to the format, then send it to the registry contract 
3. Registry decodes Event, and then creates account and asset information as per need
4. After verification information is passed, execute the addLiquidity method of uniswap 
5. After the call is completed, return the relevant information to MVM through ` event MixinTransaction(bytes);`  
6. MVM will process after obtaining the results. Since adding liquidity does not require the return of results, this will be the end of the process. Users do not receive information such as refunds.
