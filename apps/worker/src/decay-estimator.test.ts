import { describe, expect, it } from "vitest";
import { updateDecayEstimates } from "./decay-estimator.js";

function makeMockDb(samples: any[]) {
  return {
    collection: (name: string) => ({
      find: () => ({
        sort: () => ({
          limit: () => ({
            toArray: async () => (name === "atlas_samples" ? samples : []),
          }),
        }),
      }),
      updateOne: async () => ({ modifiedCount: 1 }),
    }),
  } as any;
}

function makeLiveSamples(count: number, spanHours: number) {
  const now = Date.now();
  const start = now - spanHours * 3600 * 1000;
  const stepMs = count > 1 ? (now - start) / (count - 1) : 0;

  return Array.from({ length: count }, (_, i) => ({
    intent: "FX_NOW_EUR",
    source: "live",
    valueNorm: 1.08 + i * 0.0001,
    minerId: "31002",
    ts: new Date(now - i * stepMs), // sorted descending like MongoDB .sort({ ts: -1 })
  }));
}

describe("updateDecayEstimates calibration boundaries", () => {
  it("29 samples over 10h -> not calibrated", async () => {
    const db = makeMockDb(makeLiveSamples(29, 10));
    const res = await updateDecayEstimates(db, "FX_NOW_EUR");
    expect(res).not.toBeNull();
    expect(res!.calibrated).toBe(false);
    expect(res!.confidence).toBe(0.0);
    expect(res!.statusLabel).toBe("prior (not measured)");
  });

  it("30 samples over 5.9h -> not calibrated", async () => {
    const db = makeMockDb(makeLiveSamples(30, 5.9));
    const res = await updateDecayEstimates(db, "FX_NOW_EUR");
    expect(res).not.toBeNull();
    expect(res!.calibrated).toBe(false);
    expect(res!.confidence).toBe(0.0);
    expect(res!.statusLabel).toBe("prior (not measured)");
  });

  it("30 samples over 6.0h -> calibrated", async () => {
    const db = makeMockDb(makeLiveSamples(30, 6.0));
    const res = await updateDecayEstimates(db, "FX_NOW_EUR");
    expect(res).not.toBeNull();
    expect(res!.calibrated).toBe(true);
    expect(res!.confidence).toBeGreaterThan(0);
    expect(res!.statusLabel).toBe("calibrated");
  });

  it("0 samples -> not calibrated and labeled prior (not measured)", async () => {
    const db = makeMockDb([]);
    const res = await updateDecayEstimates(db, "FX_NOW_EUR");
    expect(res).not.toBeNull();
    expect(res!.sampleCount).toBe(0);
    expect(res!.calibrated).toBe(false);
    expect(res!.confidence).toBe(0.0);
    expect(res!.statusLabel).toBe("prior (not measured)");
  });
});
