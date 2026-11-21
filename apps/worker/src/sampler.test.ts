import { describe, expect, it } from "vitest";
import { normalizeAnswerValue } from "./sampler.js";
import { updateDecayEstimates } from "./decay-estimator.js";

describe("Atlas Sampler Normalization & Disagreement", () => {
  it("normalizes numeric rate for FX_NOW and generates hash", () => {
    const rawAnswer = { pair: "EUR/USD", rate: 1.0850, timestamp: 1730700000 };
    const { valueNorm, hash } = normalizeAnswerValue("FX_NOW", rawAnswer);

    expect(valueNorm).toBe(1.0850);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("normalizes temperature for WEATHER_FORECAST_VERIFY", () => {
    const rawAnswer = { location: "London", temperatureC: 15.2, condition: "Sunny", forecastTimestamp: 1730700000 };
    const { valueNorm } = normalizeAnswerValue("WEATHER_FORECAST_VERIFY", rawAnswer);

    expect(valueNorm).toBe(15.2);
  });

  it("normalizes matchScore for SANCTIONS_SCREENING_MATCH", () => {
    const rawAnswer = { entity: "Test Corp", matched: false, matchScore: 0.15 };
    const { valueNorm } = normalizeAnswerValue("SANCTIONS_SCREENING_MATCH", rawAnswer);

    expect(valueNorm).toBe(0.15);
  });

  it("returns null for null, empty or invalid answers and never defaults to 0", () => {
    expect(normalizeAnswerValue("FX_NOW", null).valueNorm).toBeNull();
    expect(normalizeAnswerValue("FX_NOW", undefined).valueNorm).toBeNull();
    expect(normalizeAnswerValue("FX_NOW", { corrupted: true }).valueNorm).toBeNull();
    expect(normalizeAnswerValue("WEATHER_CHECK", { invalid: "field" }).valueNorm).toBeNull();
    expect(normalizeAnswerValue("SANCTIONS_SCREENING_MATCH", { missing: 1 }).valueNorm).toBeNull();
  });
});

describe("Decay Estimator Calibration Rules", () => {
  it("marks curve as uncalibrated prior with confidence 0.0 when samples < 30", async () => {
    const fakeSamples = Array.from({ length: 15 }, (_, i) => ({
      intent: "FX_NOW",
      source: "live",
      valueNorm: 1.08 + i * 0.0001,
      minerId: "miner_1",
      ts: new Date(Date.now() - (15 - i) * 3600 * 1000),
    }));

    const mockDb: any = {
      collection: (name: string) => ({
        find: () => ({
          sort: () => ({
            limit: () => ({
              toArray: async () => (name === "atlas_samples" ? fakeSamples : []),
            }),
          }),
        }),
        updateOne: async () => {},
      }),
    };

    const stats = await updateDecayEstimates(mockDb, "FX_NOW");
    expect(stats).not.toBeNull();
    expect(stats!.calibrated).toBe(false);
    expect(stats!.confidence).toBe(0.0);
    expect(stats!.statusLabel).toBe("prior (not measured)");
  });

  it("marks curve calibrated when >= 30 live samples span >= 6 hours", async () => {
    const fakeSamples = Array.from({ length: 35 }, (_, i) => ({
      intent: "FX_NOW",
      source: "live",
      valueNorm: 1.08 + (i % 5) * 0.0001,
      minerId: "miner_1",
      ts: new Date(Date.now() - (35 - i) * 3600 * 1000), // spans 35 hours
    }));

    const mockDb: any = {
      collection: (name: string) => ({
        find: () => ({
          sort: () => ({
            limit: () => ({
              toArray: async () => (name === "atlas_samples" ? fakeSamples : []),
            }),
          }),
        }),
        updateOne: async () => {},
      }),
    };

    const stats = await updateDecayEstimates(mockDb, "FX_NOW");
    expect(stats).not.toBeNull();
    expect(stats!.calibrated).toBe(true);
    expect(stats!.confidence).toBeGreaterThan(0.0);
    expect(stats!.statusLabel).toBe("calibrated");
  });
});

