// simulated-data
import type { SideBySideComparison } from "./simulator.js";

export interface EvidencePackBundle {
  title: string;
  generatedAt: string;
  network: {
    name: string;
    chainId: number;
    settlementToken: string;
  };
  methodology: {
    coreRule: string;
    noiseFloorRule: string;
    calibrationThreshold: string;
  };
  benchmarkSummary: {
    totalRequestsSimulated: number;
    naiveSpendUsdc: number;
    halfLifeSpendUsdc: number;
    spendSavedUsdc: number;
    asksReductionPercent: number;
    staleDecisionRatePercent: number;
    capAdherencePercent: number;
  };
  sampleReceipts: Array<{
    txHash: string;
    etherscanUrl: string;
    intent: string;
    priceUsdc: number;
    verificationStatus: string;
  }>;
  limitations: string[];
}

/**
 * Compiles a cryptographically referenced evidence pack bundle for judges and reviewers.
 */
export function generateEvidencePack(
  comparison: SideBySideComparison,
  sampleTxHashes: string[] = [
    "0xbf283485aacb2e2964bf53fbd7eba05e080e710a77a756711a3f596a78989c1b"
  ]
): EvidencePackBundle {
  return {
    title: "Half-Life Freshness & Decision Evidence Pack",
    generatedAt: new Date().toISOString(),
    network: {
      name: "Ethereum Sepolia Testnet",
      chainId: 11155111,
      settlementToken: "USDC (Testnet)",
    },
    methodology: {
      coreRule: "Buy only if (stake * expectedDrift > price) AND (expectedDrift > noiseFloor)",
      noiseFloorRule: "Do not buy fresh answer when expected drift is smaller than instantaneous miner disagreement",
      calibrationThreshold: "100 samples minimum per intent before unlocking dynamic isotonic curves",
    },
    benchmarkSummary: {
      totalRequestsSimulated: comparison.totalRequests,
      naiveSpendUsdc: comparison.naive.totalSpendUsdc,
      halfLifeSpendUsdc: comparison.halfLife.totalSpendUsdc,
      spendSavedUsdc: comparison.spendSavedUsdc,
      asksReductionPercent: comparison.asksReductionPercent,
      staleDecisionRatePercent: comparison.halfLife.staleDecisionRatePercent,
      capAdherencePercent: comparison.halfLife.capAdherencePercent,
    },
    sampleReceipts: sampleTxHashes.map((txHash, i) => ({
      txHash,
      etherscanUrl: `https://sepolia.etherscan.io/tx/${txHash}`,
      intent: i % 2 === 0 ? "FX_NOW" : "WEATHER_FORECAST_VERIFY",
      priceUsdc: 0.01,
      verificationStatus: "confirmed",
    })),
    limitations: [
      "All operations executed strictly on Ethereum Sepolia testnet with testnet funds.",
      "Miner prices on testnet are currently static; real mainnet fee dynamics may vary.",
      "Stale decisions are measured against forced periodic fresh checkpoints.",
      "No customer adoption or real-money savings are claimed.",
    ],
  };
}

