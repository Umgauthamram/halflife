# Telegraph Miner & Protocol Bounty Submissions

> **Status: DRAFT, not yet filed.**  
> This document collects technical issues, schema discrepancies, and miner behaviors identified during our integration with the Telegraph live node (`http://13.237.89.59:7148`) and contract (`0x3624EB012B5E998BB57B6bE6C9Cfc9c4bc5eb99b`) on Ethereum Sepolia (`Chain ID: 11155111`).
> 
> Before filing on [`github.com/telegraphprotocol/bounties`](https://github.com/telegraphprotocol/bounties), each item requires the specific evidence listed below.

---

## Bounty Issue 01: Miner 31005 (`fx-boc`) Incompatible Schema Rejection on Routed Asks

- **Target Intent:** `FX_NOW_EUR`
- **Miner ID:** `31005` (Name: `Bank of Canada FX Now`, Version: `20260904`)
- **Status:** DRAFT, not yet filed
- **Severity:** High (Causes unhandled 503 errors when using unrouted `/engine/v1/ask`)

### Description
When an agent queries `/engine/v1/ask` for `FX_NOW_EUR` without miner routing or with `{ pair: "EUR/USD" }`, the Telegraph node routes queries across available miners.
When routed to miner `31005`, the response returns:
```json
{
  "code": 503,
  "message": "miner 31005: cannot take this request's params: /query has no field for required param(s) currency"
}
```
Other miners for the same intent (such as `31002 - Open ER-API FX Now`) accept general parameters or default to EUR. Because of this discrepancy, unrouted `/engine/v1/ask` calls fail intermittently depending on which miner is assigned.

### Evidence & Reproduction
```bash
curl -X POST http://13.237.89.59:7148/engine/v1/ask/31005 \
  -H "Content-Type: application/json" \
  -d '{
    "intent": "FX_NOW_EUR",
    "params": {}
  }'
```

### Exact Evidence Required Before Filing
1. Full HTTP request and response trace with timestamps and node IP.
2. Comparative trace against miner `31002` demonstrating the schema divergence for the same intent.
3. Reproduction across at least 3 distinct invocation cycles.

---

## Bounty Issue 02: x402 V2 Header Specification — Missing Field Rejection (`No matching payment requirements`)

- **Protocol Version:** x402 v2
- **Endpoint:** `/engine/v1/ask`
- **Status:** DRAFT, not yet filed
- **Severity:** Medium (Developer Experience & Interoperability)

### Description
During x402 HTTP 402 challenge negotiation, the node returns a base64-encoded `payment-required` header containing `resource` and `accepts` arrays.

When retrying with `payment-signature`, the node strictly requires that the client payload object echo both:
1. `resource: challenge.resource`
2. `accepted: challenge.accepts[0]` (matching `network`, `scheme`, `payTo`, `asset`, `amount`)

If a client constructs an EIP-712 signature correctly but omits the redundant `resource` or `accepted` echo, the node rejects the request with HTTP 402 `"No matching payment requirements"` without explaining that the wrapper object was missing required structural fields.

### Reference Implementation in Half-Life
In `@half-life/telegraph/src/live.ts`:
```typescript
const paymentPayload = {
  x402Version: 2,
  resource: quote.resource,
  accepted: {
    network: quote.network,
    scheme: "exact",
    payTo: quote.payTo,
    asset: quote.asset,
    amount: quote.amountRaw.toString(),
  },
  payload: {
    signature,
    authorization: {
      from: this.account.address,
      to: quote.payTo,
      value: quote.amountRaw.toString(),
      validAfter: validAfter.toString(),
      validBefore: validBefore.toString(),
      nonce,
    },
  },
};

const paymentSignatureHeader = Buffer.from(JSON.stringify(paymentPayload)).toString("base64");
```

### Exact Evidence Required Before Filing
1. Minimal cURL or script reproduction sending a valid EIP-712 signature without `resource` / `accepted`.
2. Server response log showing `"No matching payment requirements"`.
3. Working counter-example demonstrating successful settlement when fields are echoed.

---

## Bounty Issue 03: Sepolia USDC Minting Accessibility & Verification Documentation

- **Token Contract:** `0xcc194e1a843B658526D0D5C431f670028582Ae17`
- **EIP-712 Domain:** `name: "USD Coin"`, `version: "2"`, `chainId: 11155111`
- **Status:** DRAFT, not yet filed
- **Severity:** Low (Documentation & Onboarding)
- **Verified Purchase TX:** [`0xbf283485aacb2e2964bf53fbd7eba05e080e710a77a756711a3f596a78989c1b`](https://sepolia.etherscan.io/tx/0xbf283485aacb2e2964bf53fbd7eba05e080e710a77a756711a3f596a78989c1b)

### Observation
Telegraph onboarding documentation occasionally references legacy or alternate token contracts (e.g. `0x1c7D4B...`). Live Sepolia miners strictly accept `0xcc194e1a843B658526D0D5C431f670028582Ae17`. Documenting the public `mint(address, uint256)` method on the active testnet USDC token will streamline developer onboarding.

### Exact Evidence Required Before Filing
1. Direct links to outdated token references in official Telegraph documentation or discord guides.
2. Verified transaction proof on Sepolia Etherscan confirming `0xcc194e1a843B658526D0D5C431f670028582Ae17` as the active asset for x402 challenges.
