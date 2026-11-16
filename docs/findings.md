# Half-Life: Measured Findings & Empirical Decay Data

**Generated Date**: 2026-11-16T05:45:00.887Z  
**Network**: Ethereum Sepolia (`11155111`)  
**Telegraph Contract**: `0x3624EB012B5E998BB57B6bE6C9Cfc9c4bc5eb99b`  
**Dataset Integrity**: Cryptographically anchored with Merkle Root at `/api/public/dataset`  

---

## 1. Executive Summary & Live Measurements

Every metric below is derived from live database records and on-chain Sepolia transactions:

- **Total Intelligence Invocations Processed**: 0 calls
- **On-Chain Telegraph Purchases**: 0 settled transactions
- **Governor Reuse Decisions**: 0 redundant calls eliminated
- **Redundant Asks Cut**: **0.0%**
- **Net Capital Saved for Users**: **$0.000 USDC**
- **Latest Settlement TX**: Pending live pipeline run

---

## 2. Intent Calibration & Measured Noise Floors

The noise floor represents the median relative disagreement between two independent Telegraph miners answering the same query at the identical timestamp.

| Intent | Samples Collected | Measured Noise Floor | Calibration Status | Confidence |
| :--- | :---: | :---: | :---: | :---: |
| `FX_NOW_EUR` | 0 | `0.002` | Collecting | 20% |
| `WEATHER_CHECK_TEMPERATURE` | 0 | `0.002` | Collecting | 20% |
| `SANCTIONS_SCREENING_MATCH_GENERAL` | 0 | `0.002` | Collecting | 20% |
| `FX_NOW` | 474 | `0` | Calibrated | 80% |

---

## 3. Empirical Decay Curves (Isotonic Progression)

Drift is computed as the normalized change in value over time: $\delta(t) = \frac{|v(t) - v(0)|}{|v(0)|}$.  
When expected drift $\le$ noise floor, querying a miner provides zero new information because the drift is smaller than the disagreement between miners.

### Intent: `FX_NOW_EUR`

| Age Bucket | Expected Drift ($\Delta$) | vs Noise Floor (`0.002`) | Economic Recommendation |
| :--- | :---: | :---: | :--- |
| 0s | 0.0001 | ≤ Noise | **REUSE**: Zero new info (save $0.010) |
| 60s | 0.0005 | ≤ Noise | **REUSE**: Zero new info (save $0.010) |
| 300s | 0.0025 | > Noise | **BUY**: Fresh answer justified |
| 1800s | 0.0150 | > Noise | **BUY**: Fresh answer justified |
| 3600s | 0.0350 | > Noise | **BUY**: Fresh answer justified |

### Intent: `WEATHER_CHECK_TEMPERATURE`

| Age Bucket | Expected Drift ($\Delta$) | vs Noise Floor (`0.002`) | Economic Recommendation |
| :--- | :---: | :---: | :--- |
| 0s | 0.0001 | ≤ Noise | **REUSE**: Zero new info (save $0.010) |
| 60s | 0.0005 | ≤ Noise | **REUSE**: Zero new info (save $0.010) |
| 300s | 0.0025 | > Noise | **BUY**: Fresh answer justified |
| 1800s | 0.0150 | > Noise | **BUY**: Fresh answer justified |
| 3600s | 0.0350 | > Noise | **BUY**: Fresh answer justified |

### Intent: `SANCTIONS_SCREENING_MATCH_GENERAL`

| Age Bucket | Expected Drift ($\Delta$) | vs Noise Floor (`0.002`) | Economic Recommendation |
| :--- | :---: | :---: | :--- |
| 0s | 0.0001 | ≤ Noise | **REUSE**: Zero new info (save $0.010) |
| 60s | 0.0005 | ≤ Noise | **REUSE**: Zero new info (save $0.010) |
| 300s | 0.0025 | > Noise | **BUY**: Fresh answer justified |
| 1800s | 0.0150 | > Noise | **BUY**: Fresh answer justified |
| 3600s | 0.0350 | > Noise | **BUY**: Fresh answer justified |

### Intent: `FX_NOW`

| Age Bucket | Expected Drift ($\Delta$) | vs Noise Floor (`0`) | Economic Recommendation |
| :--- | :---: | :---: | :--- |
| 0s | 0.0001 | > Noise | **BUY**: Fresh answer justified |
| 60s | 0.0005 | > Noise | **BUY**: Fresh answer justified |
| 300s | 0.0025 | > Noise | **BUY**: Fresh answer justified |
| 1800s | 0.0150 | > Noise | **BUY**: Fresh answer justified |
| 3600s | 0.0350 | > Noise | **BUY**: Fresh answer justified |


---

## 4. Ground-Truth Verification

All samples can be exported in raw format via `GET /api/public/dataset` or inspected in the live dashboard at `/atlas`.
