# registry.sol resolution

The registry is the proxy of MVM. Other contracts can execute related contracts by sending data in a certain format through `function mixin(bytes memory raw)`.

Address of open source code: https://github.com/MixinNetwork/trusted-group/tree/master/mvm/quorum/contracts

Mainly include:

1. Execute entry, `function mixin(bytes memory raw)
2. MixinUser, associate users in Mixin with related accounts in EVM 
3. MixinAsset, associate the assets in Mixin with the assets in EVM 

Get the correspondence from the following three public maps if needed:

```
mapping(address => bytes) public users;
mapping(address => uint128) public assets;
mapping(uint => address) public contracts;
```

### function mixin resolution

`function mixin()` is the only way for MVM to call smart contracts, and all subsequent contract operations need to go through this function. 

When MVM calls the contract, calling the function of mixin, relevant parameters will be parsed via raw 

1. process, uuid verifies whether the deployed process is the same as the called process
2. nonce, EVM requires nonce + 1 per call
3. asset id, the id of the asset in the mixin
4. amount, the amount of assets that need to be manipulated
5. extra, some information about assets and contracts
6. timestamp
7. user, the user in the mixin, which may be a multi-signature account. New user will be created, if the user does not exist.
8. Parse the value of extra in 5. Asset will be created, if the asset does not exist.
9. signature verification
10. transfer the corresponding assets to the corresponding mvm account of mixin users
11.call the contract, and after the execution is completed, destroy the assets in the mvm account 
12. return the call result `emit MixinTransaction`

```solidity
function mixin(bytes memory raw) public returns (bool) {
  require(raw.length >= 141, "event data too small");

  Event memory evt;
  uint256 offset = 0;

  uint128 id = raw.toUint128(offset);
  require(id == PID, "invalid process");
  offset = offset + 16;

  evt.nonce = raw.toUint64(offset);
  require(evt.nonce == INBOUND, "invalid nonce");
  INBOUND = INBOUND + 1;
  offset = offset + 8;

  (offset, id, evt.amount) = parseEventAsset(raw, offset);
  (offset, evt.extra, evt.timestamp) = parseEventExtra(raw, offset);
  (offset, evt.user) = parseEventUser(raw, offset);
  (evt.asset, evt.extra) = parseEventInput(id, evt.extra);

  offset = offset + 2;
  evt.sig = [raw.toUint256(offset), raw.toUint256(offset+32)];
  uint256[2] memory message = raw.slice(0, offset-2).concat(new bytes(2)).hashToPoint();
  require(evt.sig.verifySingle(GROUP, message), "invalid signature");

  offset = offset + 64;
  require(raw.length == offset, "malformed event encoding");

  emit MixinEvent(evt);
  MixinAsset(evt.asset).mint(evt.user, evt.amount);
  return MixinUser(evt.user).run(evt.asset, evt.amount, evt.extra);
}
```
