# The principle and usage of Registry

We will talk about the principle of Registry Contract in this chapter. 
Besides, we will show you how to deploy a contract in MVM and call it using Registry Contract.
Finally, some problems you may face in practice will be introduced.

## Introduction
The [Registry](#source-code) is the proxy contract in MVM. 
The original smart contract can be executed directly through Registry after being deployed on [Quorum](/quorum/join) without any modification.

### function mixin 

`function mixin(bytes memory raw) public returns (bool)` is the entry for MVM to call smart contracts,
and it is also the only entry in the registry. All subsequent contract operations need to go through this function.

When MVM calls the mixin function, raw will be parsed into relevant parameters as follows:

1. Process (PID), uuid verifies whether the deployed process is the same as the called process
2. Nonce, require nonce + 1 per call
3. Asset id, the id of asset in the mixin
4. Amount, the amount of assets that need to be manipulated
5. Extra, contains some information about assets and contracts
6. Timestamp, no verification currently, which is decided by the own situation of the contract whether to use it or not
7. User, Mixin user ID, or a multi-signature account, a corresponding Quorum account will be created, if the user does not exist
8. Parse the extra value in 5, if the asset corresponding to Quorum does not exist, the asset will be created
9. Signature verification
10. Expose parameters by MixinEvent event, you can check these parameters in browser(address in [Quorum](/quorum/join))
11. Transfer assets to MVM User contract, [code](https://github.com/MixinNetwork/mvm-contracts/blob/main/contracts/mixin/registry.sol#L204)
12. Run contracts in turn, [code](https://github.com/MixinNetwork/mvm-contracts/blob/main/contracts/mixin/User.sol#L42)
13. Result is returned by `ProcessCalled` event, [code](https://github.com/MixinNetwork/mvm-contracts/blob/main/contracts/mixin/User.sol#L82)

Specific code implementation:

```solidity
function mixin(bytes memory raw) public returns (bool) {
    require(!HALTED, "invalid state");
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

    uint256 balance = balances[assets[evt.asset]];
    if (balance == 0) {
        deposits.push(assets[evt.asset]);
        balance = BALANCE;
    }
    balances[assets[evt.asset]] = balance + evt.amount;

    emit MixinEvent(evt);
    MixinAsset(evt.asset).mint(evt.user, evt.amount);
    return MixinUser(evt.user).run(evt.asset, evt.amount, evt.extra);
}
```

### event ProcessCalled

[ProcessCalled event](https://github.com/MixinNetwork/mvm-contracts/blob/main/contracts/mixin/User.sol#L11) 
reveals the result of the contract called by Registry, each executed contract has a related `ProcessCalled` event.
`process` is the address of the contract, `input` is the function signature and encoded input parameters,
`result` tells whether the function executed successfully, `output` is the result.

Code：
```solidity
event ProcessCalled(
    address indexed process,
    bytes input,
    bool result,
    bytes output
);
```

## Source Code

registry.sol open source address: <https://github.com/MixinNetwork/trusted-group/tree/master/mvm/quorum/contracts>

## Summary

We introduced the principle of Registry Contract in this article. We will show you how to deploy a contract in [Quorum](/quorum/join),
and how to call a deployed contract by Registry Contract in the following chapters.
