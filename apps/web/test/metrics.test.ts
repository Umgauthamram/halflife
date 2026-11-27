import { describe, it, expect } from "vitest";
import { computeMedianPaidLatencyMs } from "../lib/metrics";

describe("computeMedianPaidLatencyMs", () => {
  it("returns null when there are no paid purchases", () => {
    expect(computeMedianPaidLatencyMs([])).toBeNull();
    expect(
      computeMedianPaidLatencyMs([
        { outcome: "failed", latencyMs: 120 },
        { outcome: "failed_paid", latencyMs: 300 },
      ])
    ).toBeNull();
  });

  it("computes median strictly from outcome === 'paid' records", () => {
    expect(
      computeMedianPaidLatencyMs([
        { outcome: "failed", latencyMs: 5000 },
        { outcome: "paid", latencyMs: 100 },
        { outcome: "paid", latencyMs: 300 },
        { outcome: "paid", latencyMs: 200 },
      ])
    ).toBe(200);

    expect(
      computeMedianPaidLatencyMs([
        { outcome: "paid", latencyMs: 100 },
        { outcome: "paid", latencyMs: 200 },
      ])
    ).toBe(150);
  });
});
