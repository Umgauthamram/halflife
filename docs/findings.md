# Half-Life: Measured Findings & Empirical Decay Data

**Generated Date**: 2026-11-21T15:20:22.300Z  
**Network**: Ethereum Sepolia (`11155111`)  
**Telegraph Contract**: `0x3624EB012B5E998BB57B6bE6C9Cfc9c4bc5eb99b`  
**Telegraph USDC Contract**: `0xcc194e1a843B658526D0D5C431f670028582Ae17`  
**Dataset Integrity**: Cryptographically anchored with Merkle Root at `/api/public/dataset`  

---

## 1. Executive Summary & Live Measurements

Every metric below is derived strictly from live, on-chain confirmed database records on Ethereum Sepolia:

- **Live Confirmed On-Chain Purchases**: 0 settled transactions
- **Governor Reuse Decisions**: 0 redundant calls eliminated
- **Total Intelligence Invocations Processed**: 0 calls
- **Redundant Asks Cut**: **0.0%**
- **Net Capital Saved for Users**: **$0.000 USDC**
- **Latest Verified Settlement TX**: Pending active sampler run (reference live tx: [`0xbf2834...`](https://sepolia.etherscan.io/tx/0xbf283485aacb2e2964bf53fbd7eba05e080e710a77a756711a3f596a78989c1b))

---

## 2. Intent Calibration & Measured Noise Floors

The noise floor represents the median relative disagreement between two independent Telegraph miners answering the same query at the identical timestamp.
In accordance with our strict evidence-honesty policy:
- A decay curve is **calibrated** only after $\ge 30$ live confirmed samples spanning $\ge 6$ hours.
- Intents with fewer samples or shorter observation windows are marked **"prior (not measured)"** with zero confidence ($0.0$).

| Intent | Live Confirmed Samples | Observation Window | Measured Noise Floor | Calibration Status | Confidence |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `FX_NOW_EUR` | 0 | N/A | Collecting | prior (not measured) | 0% |
| `WEATHER_CHECK_TEMPERATURE` | 0 | N/A | Collecting | prior (not measured) | 0% |
| `SANCTIONS_SCREENING_MATCH_GENERAL` | 0 | N/A | Collecting | prior (not measured) | 0% |
| `FX_NOW` | 0 | N/A | `0` | prior (not measured) | 0% |

---

## 3. Empirical Decay Curves

Drift is computed as the normalized change in value over time: $\delta(t) = \frac{|v(t) - v(0)|}{|v(0)|}$.  
When expected drift $\le$ noise floor, querying a miner provides zero new information because the drift is smaller than the disagreement between miners.

### Intent: `FX_NOW_EUR`

> [!NOTE]
> **Status: prior (not measured)**. There is not enough live data yet to calibrate this intent. Half-Life requires at least 30 live samples across 6+ hours before publishing empirical curves. Currently: 0 live confirmed samples.

### Intent: `WEATHER_CHECK_TEMPERATURE`

> [!NOTE]
> **Status: prior (not measured)**. There is not enough live data yet to calibrate this intent. Half-Life requires at least 30 live samples across 6+ hours before publishing empirical curves. Currently: 0 live confirmed samples.

### Intent: `SANCTIONS_SCREENING_MATCH_GENERAL`

> [!NOTE]
> **Status: prior (not measured)**. There is not enough live data yet to calibrate this intent. Half-Life requires at least 30 live samples across 6+ hours before publishing empirical curves. Currently: 0 live confirmed samples.

### Intent: `FX_NOW`

> [!NOTE]
> **Status: prior (not measured)**. There is not enough live data yet to calibrate this intent. Half-Life requires at least 30 live samples across 6+ hours before publishing empirical curves. Currently: 0 live confirmed samples.


---

## 4. Ground-Truth Verification

All samples can be exported in raw format via `GET /api/public/dataset` (supporting JSON and CSV) or inspected in the live dashboard at `/atlas`. Every confirmed sample is verifiable against the Ethereum Sepolia blockchain and anchored in published Merkle roots.
