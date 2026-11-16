# Telegraph Miner & Protocol Bounty Submissions

This document collects verified technical issues, schema mismatches, and miner bugs identified during our integration with the Telegraph live node (`http://13.237.89.59:7148`) and contract (`0x3624EB012B5E998BB57B6bE6C9Cfc9c4bc5eb99b`) on Ethereum Sepolia.

These reports are formatted with full receipts and ready to be filed on the official Telegraph bounties repository: [`github.com/telegraphprotocol/bounties`](https://github.com/telegraphprotocol/bounties).

---

## Bounty Issue 01: Miner 31005 (`fx-boc`) Incompatible Schema Rejection on Routed Asks

- **Target Intent:** `FX_NOW_EUR`
- **Miner ID:** `31005` (Name: `Bank of Canada FX Now`, Version: `20260904`)
- **Severity:** High (Causes unhandled 503 errors when using default unrouted `/engine/v1/ask`)

### Description
When an agent or consumer queries `/engine/v1/ask` for `FX_NOW_EUR` with standard parameters (`{ pair: "EUR/USD" }` or without query fields), the Telegraph node randomly or round-robin routes queries to miner `31005`.

Miner `31005` immediately crashes or returns:
```json
{
  "code": 503,
  "message": "miner 31005: cannot take this request's params: /query has no field for required param(s) currency"
}
```
Other miners for the same intent (such as `31002 - Open ER-API FX Now`) accept either general parameters or succeed. Because of this discrepancy, unrouted `/engine/v1/ask` calls fail intermittently depending on which miner is assigned.

### Evidence & Reproduction
```bash
curl -X POST http://13.237.89.59:7148/engine/v1/ask/31005 \
  -H "Content-Type: application/json" \
  -d '{
    "intent": "FX_NOW_EUR",
    "params": {}
  }'
```

### Proposed Resolution
1. Standardize input schemas across all miners registered for `FX_NOW_EUR` in the miner registry.
2. Update miner `31005` adapter to provide default fallback handling when `currency` is not explicitly provided in `/query`.

---

## Bounty Issue 02: x402 V2 Header Specification — Missing Field Rejection (`No matching payment requirements`)

- **Protocol Version:** x402 v2
- **Endpoint:** `/engine/v1/ask`
- **Severity:** Medium (Developer Experience & Interoperability)

### Description
During x402 HTTP 402 challenge negotiation, the node returns a base64-encoded `payment-required` header containing `resource` and `accepts` arrays.

When retrying with `payment-signature`, the node strictly requires that the client payload object echo both:
1. `resource: challenge.resource`
2. `accepted: challenge.accepts[0]`

If a client constructs an EIP-712 signature correctly but omits the redundant `resource` or `accepted` echo, the node rejects the request with HTTP 402 `"No matching payment requirements"` without explaining that the inner wrapper object was missing metadata.

### Working Reference Implementation
In `@half-life/telegraph/src/live.ts`, we resolved this by packing:
```typescript
const paymentSignaturePayload = {
  x402Version: 2,
  resource: challengeData.resource,
  accepted: acceptedOption,
  payload: {
    signature,
    authorization: {
      from: walletClient.account.address,
      to: acceptedOption.payTo,
      value: acceptedOption.maxAmountRequired,
      validAfter: 0,
      validBefore: validBeforeUnix,
      nonce,
    },
  },
};
```

### Proposed Resolution
Include a descriptive schema validation error in the HTTP 402 rejection body indicating which field in the `payment-signature` wrapper was missing or mismatched.

---

## Bounty Issue 03: Sepolia USDC Minting Accessibility & Verification

- **Token Contract:** `0xcc194e1a843B658526D0D5C431f670028582Ae17`
- **EIP-712 Domain:** `name: "USD Coin"`, `version: "2"`, `chainId: 11155111`
- **Verified Purchase TX:** [`0xbf283485aacb2e2964bf53fbd7eba05e080e710a77a756711a3f596a78989c1b`](https://sepolia.etherscan.io/tx/0xbf283485aacb2e2964bf53fbd7eba05e080e710a77a756711a3f596a78989c1b)

### Observation
The official Telegraph documentation occasionally points to old or alternate token addresses (e.g. `0x1c7D4B...`). Builders frequently fail to pay x402 challenges because of token mismatches.
Documenting the public `mint(address, uint256)` method on `0xcc194e1a843B658526D0D5C431f670028582Ae17` in the quickstart will save significant developer onboarding friction.
