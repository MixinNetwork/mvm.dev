### 1. Get user contract address by `user_id`

`GET /user_contract`

#### Parameters

| Parameter |  Type  | Required | Explain                   |
|:----------|:------:|:--------:|:--------------------------|
| user      | string |   true   | array of user_id          |
| threshold |  int   |  false   | multi-signature threshold |
| address   | string |  false   | Registry Contract address |

Fetch the user contract based on mixin `user_id`

#### Example

<https://api.test.mvm.dev/user_contract?user=e8e8cd79-cd40-4796-8c54-3a13cfe50115>

#### Response

```json
{ "user_contract": "0xa192D5856A9a7c07731bc13559Da7489C7829C74" }
```

### 2. Get asset contract address by `asset_id`

`GET /asset_contract`

#### Parameters

| Parameter |  Type  | Required | Explain                   |
|:----------|:------:|:--------:|:--------------------------|
| asset     | string |   true   | asset_id                  |
| address   | string |  false   | Registry Contract address |

#### Example

<https://api.test.mvm.dev/asset_contract?asset=965e5c6e-434c-3fa9-b780-c50f43cd955c>

#### Response

```json
{ "asset_contract": "0x001fB10b1bFede8505AB138c2Bb2E239CB3b50dC" }
```

### 3. Get `user_id` by user contract address

`GET /contract_user`

#### Parameters

| Parameter |  Type  | Required | Explain                   |
|:----------|:------:|:--------:|:--------------------------|
| contract  | string |   true   | user contract address     |
| address   | string |  false   | Registry Contract address |

#### Example

<https://api.test.mvm.dev/contract_user?contract=0xa192D5856A9a7c07731bc13559Da7489C7829C74>

#### Response

```json
{ "user_id": "e8e8cd79-cd40-4796-8c54-3a13cfe50115" }
```

### 4. Get `asset_id` by asset contract address

`GET /contract_asset`

#### Parameters

| Parameter |  Type  | Required | Explain                   |
|:----------|:------:|:--------:|:--------------------------|
| contract  | string |   true   | asset contract address    |
| address   | string |  false   | Registry Contract address |

#### Example

<https://api.test.mvm.dev/contract_asset?contract=0x001fB10b1bFede8505AB138c2Bb2E239CB3b50dC>

#### Response

```json
{ "asset_id": "965e5c6e-434c-3fa9-b780-c50f43cd955c" }
```
