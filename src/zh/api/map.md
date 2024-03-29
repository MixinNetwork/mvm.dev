### 1. 根据 `user_id` 获取 `用户合约地址`

`GET /user_contract`

#### 参数

| 参数        |   类型   |  必填   | 说明           |
|:----------| :------: |:-----:|:-------------|
| user     | string | true  | 用户数组         |
| threshold |   int    | false | 多签数量         |
| address   |  string  | false | registry 的地址 |

查询普通用户的合约地址

#### 示例

<https://api.mvm.dev/user_contract?user=e8e8cd79-cd40-4796-8c54-3a13cfe50115>

#### 返回值

```json
{ "user_contract": "0xa192D5856A9a7c07731bc13559Da7489C7829C74" }
```

### 2. 根据 `asset_id` 获取 `资产合约地址`

`GET /asset_contract`

#### 参数

| 参数    |  类型  | 必填  | 说明            |
| :------ | :----: | :---: | :-------------- |
| asset   | string | true  | 用户的 user_id  |
| address | string | false | registry 的地址 |

#### 示例

<https://api.mvm.dev/asset_contract?asset=965e5c6e-434c-3fa9-b780-c50f43cd955c>

#### 返回值

```json
{ "asset_contract": "0x001fB10b1bFede8505AB138c2Bb2E239CB3b50dC" }
```

``

### 3. 根据 `用户合约地址` 获取 `user_id`

`GET /contract_user`

#### 参数

| 参数     |  类型  | 必填  | 说明            |
| :------- | :----: | :---: | :-------------- |
| contract | string | true  | 用户的合约地址  |
| address  | string | false | registry 的地址 |

#### 示例

<https://api.mvm.dev/contract_user?contract=0x082549B51D2Fc4a6f60e8fE1714AE6cd97e06A6f>

#### 返回值

```json
{ "user_id": "e8e8cd79-cd40-4796-8c54-3a13cfe50115" }
```

### 4. 根据 `资产合约地址` 获取 `asset_id`

`GET /contract_asset`

#### 参数

| 参数     |  类型  | 必填  | 说明            |
| :------- | :----: | :---: | :-------------- |
| contract | string | true  | 资产的合约地址  |
| address  | string | false | registry 的地址 |

#### 示例

<https://api.mvm.dev/contract_asset?contract=0x910Fb1751B946C7D691905349eC5dD250EFBF40a>

#### 返回值

```json
{ "asset_id": "965e5c6e-434c-3fa9-b780-c50f43cd955c" }
```
