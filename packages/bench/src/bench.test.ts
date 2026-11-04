import { describe, expect, it } from "vitest";
import { runSideBySideBenchmark, type ReplayEvent } from "./simulator.js";
import { generateEvidencePack } from "./evidence-pack.js";
import type { AtlasStats } from "@half-life/shared";

describe("Benchmark Simulator & Evidence Pack Exporter", () => {
  const mockStats: AtlasStats = {
    intent: "FX_NOW",
    window: 86400,
    driftCurve: [
      { ageSeconds: 0, expectedDrift: 0.0001 },
      { ageSeconds: 60, expectedDrift: 0.0005 },
      { ageSeconds: 300, expectedDrift: 0.0020 },
      { ageSeconds: 3600, expectedDrift: 0.0200 },
    ],
    noiseFloor: 0.0010,
    sampleCount: 500,
    computedAt: new Date(),
    calibrated: true,
  };

  const sampleEvents: ReplayEvent[] = [
    { timestampMs: 1000, intent: "FX_NOW", stake: 100, actualFreshValue: 1.0850, priceUsdc: 0.01 },
    { timestampMs: 2000, intent: "FX_NOW", stake: 100, actualFreshValue: 1.08501, priceUsdc: 0.01 }, // 1s later: drift ~ 0.0001 <= noise
    { timestampMs: 3000, intent: "FX_NOW", stake: 100, actualFreshValue: 1.08502, priceUsdc: 0.01 }, // 2s later
    { timestampMs: 4000, intent: "FX_NOW", stake: 100, actualFreshValue: 1.08503, priceUsdc: 0.01 }, // 3s later
    { timestampMs: 5000, intent: "FX_NOW", stake: 100, actualFreshValue: 1.08504, priceUsdc: 0.01 }, // 4s later
  ];

  it("cuts redundant purchases for Half-Life agent while Naive agent buys every time", () => {
    const comparison = runSideBySideBenchmark(sampleEvents, { FX_NOW: mockStats }, 1.0);

    // Naive buys on every request (5 asks)
    expect(comparison.naive.totalAsks).toBe(5);
    expect(comparison.naive.totalSpendUsdc).toBe(0.05);

    // Half-Life buys first, then reuses because drift < noise floor
    expect(comparison.halfLife.totalAsks).toBe(1);
    expect(comparison.halfLife.totalReuses).toBe(4);
    expect(comparison.halfLife.totalSpendUsdc).toBe(0.01);

    expect(comparison.asksReductionPercent).toBe(80.0);
    expect(comparison.spendSavedUsdc).toBe(0.04);
    expect(comparison.spendSavingsPercent).toBe(80.0);
  });

  it("generates a complete evidence pack with Sepolia links and limitations", () => {
    const comparison = runSideBySideBenchmark(sampleEvents, { FX_NOW: mockStats }, 1.0);
    const pack = generateEvidencePack(comparison, [
      "0x1111111111111111111111111111111111111111111111111111111111111111",
    ]);

    expect(pack.network.chainId).toBe(11155111);
    expect(pack.network.name).toContain("Sepolia");
    expect(pack.sampleReceipts[0].etherscanUrl).toContain("sepolia.etherscan.io/tx/0x1111");
    expect(pack.methodology.coreRule).toBeDefined();
    expect(pack.limitations.length).toBeGreaterThan(0);
    expect(pack.benchmarkSummary.totalRequestsSimulated).toBe(5);
  });
});

