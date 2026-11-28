import { describe, expect, it } from "vitest";
import { decide, interpolateDrift, conservativeWindowSeconds } from "./governor.js";
import type { AtlasStats } from "@half-life/shared";

describe("interpolateDrift", () => {
  const curve = [
    { ageSeconds: 0, expectedDrift: 0 },
    { ageSeconds: 60, expectedDrift: 0.01 },
    { ageSeconds: 300, expectedDrift: 0.05 },
    { ageSeconds: 1800, expectedDrift: 0.20 },
  ];

  it("handles exact points and boundaries", () => {
    expect(interpolateDrift(curve, 0)).toBe(0);
    expect(interpolateDrift(curve, 60)).toBe(0.01);
    expect(interpolateDrift(curve, 3000)).toBe(0.20);
  });

  it("interpolates monotonically between points", () => {
    const d30 = interpolateDrift(curve, 30);
    expect(d30).toBeCloseTo(0.005);
    const d180 = interpolateDrift(curve, 180);
    expect(d180).toBeGreaterThan(0.01);
    expect(d180).toBeLessThan(0.05);
  });
});

describe("decide()", () => {
  const mockStats: AtlasStats = {
    intent: "FX_NOW",
    window: 86400,
    driftCurve: [
      { ageSeconds: 0, expectedDrift: 0.0001 },
      { ageSeconds: 60, expectedDrift: 0.001 },
      { ageSeconds: 300, expectedDrift: 0.01 },
      { ageSeconds: 3600, expectedDrift: 0.05 },
    ],
    noiseFloor: 0.002,
    sampleCount: 500,
    computedAt: new Date(),
    calibrated: true,
  };

  it("decides BUY when there is no cached answer", () => {
    const result = decide(
      { intent: "FX_NOW", now: 100000, stake: 500 },
      null,
      mockStats,
      0.01
    );
    expect(result.action).toBe("buy");
    expect(result.reason).toContain("No cached answer");
    expect(result.inputs.ageSeconds).toBe(0);
  });

  it("decides REUSE when expected drift is below miner noise floor", () => {
    // At age 60s, drift is 0.001, noise floor is 0.002
    const result = decide(
      { intent: "FX_NOW", now: 100000, stake: 10000 },
      { id: "c1", purchaseId: "p1", answeredAt: 100000 - 60 * 1000 },
      mockStats,
      0.01
    );
    expect(result.action).toBe("reuse");
    expect(result.reason).toContain("below miner noise floor");
    expect(result.inputs.drift).toBeLessThanOrEqual(mockStats.noiseFloor);
  });

  it("decides REUSE when stake * drift <= price", () => {
    // At age 300s, drift is 0.01 (> noise floor 0.002).
    // With stake $0.5, stale loss = 0.5 * 0.01 = $0.005 <= price $0.01
    const result = decide(
      { intent: "FX_NOW", now: 100000, stake: 0.5 },
      { id: "c1", purchaseId: "p1", answeredAt: 100000 - 300 * 1000 },
      mockStats,
      0.01
    );
    expect(result.action).toBe("reuse");
    expect(result.reason).toContain("less than answer price");
  });

  it("decides BUY when stale loss exceeds price and drift exceeds noise floor", () => {
    // At age 300s, drift is 0.01 (> noise 0.002).
    // With stake $100, stale loss = 100 * 0.01 = $1.00 > price $0.01
    const result = decide(
      { intent: "FX_NOW", now: 100000, stake: 100 },
      { id: "c1", purchaseId: "p1", answeredAt: 100000 - 300 * 1000 },
      mockStats,
      0.01
    );
    expect(result.action).toBe("buy");
    expect(result.reason).toContain("Expected stale loss");
  });

  it("uses conservative windows when uncalibrated", () => {
    const uncalibratedStats: AtlasStats = {
      ...mockStats,
      calibrated: false,
    };

    // FX_NOW default window is 300s
    // Age 200s -> reuse
    const resWithin = decide(
      { intent: "FX_NOW", now: 100000, stake: 100 },
      { id: "c1", purchaseId: "p1", answeredAt: 100000 - 200 * 1000 },
      uncalibratedStats,
      0.01
    );
    expect(resWithin.action).toBe("reuse");
    expect(resWithin.inputs.calibrated).toBe(false);

    // Age 400s -> buy
    const resExpired = decide(
      { intent: "FX_NOW", now: 100000, stake: 100 },
      { id: "c1", purchaseId: "p1", answeredAt: 100000 - 400 * 1000 },
      uncalibratedStats,
      0.01
    );
    expect(resExpired.action).toBe("buy");
    expect(resExpired.inputs.calibrated).toBe(false);
  });

  it("satisfies monotonicity: increasing age never turns a BUY into a REUSE", () => {
    const stake = 200;
    const price = 0.01;
    let hasBought = false;

    // Check ages from 0s to 4000s in 30s increments
    for (let age = 0; age <= 4000; age += 30) {
      const res = decide(
        { intent: "FX_NOW", now: 1000000, stake },
        { id: "c1", purchaseId: "p1", answeredAt: 1000000 - age * 1000 },
        mockStats,
        price
      );
      if (res.action === "buy") {
        hasBought = true;
      }
      if (hasBought) {
        expect(res.action).toBe("buy");
      }
    }
  });

  it("resolves conservative windows for real, legacy, _GENERAL-suffixed, and unknown intents", () => {
    const cases: Array<{ intent: string; expectedWindow: number }> = [
      { intent: "FX_NOW_EUR", expectedWindow: 300 },
      { intent: "WEATHER_CHECK_TEMPERATURE", expectedWindow: 3600 },
      { intent: "SANCTIONS_SCREENING_MATCH_GENERAL", expectedWindow: 86400 },
      { intent: "FX_NOW", expectedWindow: 300 },
      { intent: "WEATHER_FORECAST_VERIFY", expectedWindow: 3600 },
      { intent: "SANCTIONS_SCREENING_MATCH", expectedWindow: 86400 },
      { intent: "WEB_SEARCH_GENERAL", expectedWindow: 1800 },
      { intent: "COMPLETELY_UNKNOWN_INTENT", expectedWindow: 600 },
    ];

    for (const { intent, expectedWindow } of cases) {
      expect(conservativeWindowSeconds(intent)).toBe(expectedWindow);

      const now = 200_000_000;
      const justUnder = decide(
        { intent, now, stake: 100 },
        { id: "c1", purchaseId: "p1", answeredAt: now - (expectedWindow - 1) * 1000 },
        null,
        0.01
      );
      expect(justUnder.action).toBe("reuse");
      expect(justUnder.reason).toContain(`(${expectedWindow}s)`);

      const justOver = decide(
        { intent, now, stake: 100 },
        { id: "c1", purchaseId: "p1", answeredAt: now - (expectedWindow + 1) * 1000 },
        null,
        0.01
      );
      expect(justOver.action).toBe("buy");
      expect(justOver.reason).toContain(`(${expectedWindow}s)`);
    }
  });
});

