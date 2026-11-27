import { describe, expect, it } from "vitest";
import { estimateDailySpendUsdc } from "./cost.js";

describe("estimateDailySpendUsdc", () => {
  it("computes expected daily spend for known values", () => {
    // 3 intents * 2 miners * (86400000 / 600000 = 144 rounds) * 0.01 = 8.64
    expect(
      estimateDailySpendUsdc({
        intents: 3,
        minersPerIntent: 2,
        intervalMs: 600_000,
        priceUsdc: 0.01,
      })
    ).toBe(8.64);
  });

  it("returns null when priceUsdc is null, NaN, or negative", () => {
    expect(
      estimateDailySpendUsdc({
        intents: 3,
        minersPerIntent: 2,
        intervalMs: 600_000,
        priceUsdc: null,
      })
    ).toBeNull();
    expect(
      estimateDailySpendUsdc({
        intents: 3,
        minersPerIntent: 2,
        intervalMs: 600_000,
        priceUsdc: Number.NaN,
      })
    ).toBeNull();
    expect(
      estimateDailySpendUsdc({
        intents: 3,
        minersPerIntent: 2,
        intervalMs: 600_000,
        priceUsdc: -0.01,
      })
    ).toBeNull();
  });

  it("returns null when intervalMs is zero or negative", () => {
    expect(
      estimateDailySpendUsdc({
        intents: 3,
        minersPerIntent: 2,
        intervalMs: 0,
        priceUsdc: 0.01,
      })
    ).toBeNull();
    expect(
      estimateDailySpendUsdc({
        intents: 3,
        minersPerIntent: 2,
        intervalMs: -1000,
        priceUsdc: 0.01,
      })
    ).toBeNull();
  });

  it("returns 0 when priceUsdc is 0", () => {
    expect(
      estimateDailySpendUsdc({
        intents: 3,
        minersPerIntent: 2,
        intervalMs: 600_000,
        priceUsdc: 0,
      })
    ).toBe(0);
  });
});
