import { describe, expect, it } from "vitest";
import { PUBLIC_DATASET_FILTER, filterPublicDatasetRows } from "../lib/dataset-filter";

describe("PUBLIC_DATASET_FILTER", () => {
  it("defines the exact strict filter object", () => {
    expect(PUBLIC_DATASET_FILTER).toEqual({
      source: "live",
      verification: "confirmed",
      valueNorm: { $ne: null },
      minerId: { $not: /^miner_/ },
    });
  });

  it("excludes mock, unverified, null-value, and miner_-prefixed rows while keeping live+confirmed", () => {
    const rows = [
      { id: "1", source: "mock", verification: "confirmed", valueNorm: 1.08, minerId: "31002" },
      { id: "2", source: "live", verification: "unverified", valueNorm: 1.08, minerId: "31002" },
      { id: "3", source: "live", verification: "confirmed", valueNorm: null, minerId: "31002" },
      { id: "4", source: "live", verification: "confirmed", valueNorm: 1.08, minerId: "miner_alpha" },
      { id: "5", source: "live", verification: "confirmed", valueNorm: 1.085, minerId: "31002" },
    ];

    const filtered = filterPublicDatasetRows(rows);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("5");
  });
});
