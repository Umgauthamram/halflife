import { describe, expect, it } from "vitest";
import { computeSamplerState, summarizeSampleVerifications } from "../lib/sampler-status";

describe("computeSamplerState", () => {
  const now = 1_700_000_000_000;
  const intervalMs = 600_000; // 10m

  it("no heartbeat -> not running and degraded", () => {
    expect(
      computeSamplerState({ now, heartbeat: null, intervalMs, paused: false })
    ).toEqual({ running: false, status: "degraded" });
  });

  it("fresh heartbeat -> running and operational", () => {
    expect(
      computeSamplerState({
        now,
        heartbeat: { lastLoopAt: new Date(now - 60_000), consecutiveFailures: 0 },
        intervalMs,
        paused: false,
      })
    ).toEqual({ running: true, status: "operational" });
  });

  it("heartbeat older than 3x interval -> not running and degraded", () => {
    expect(
      computeSamplerState({
        now,
        heartbeat: { lastLoopAt: new Date(now - 4 * intervalMs), consecutiveFailures: 0 },
        intervalMs,
        paused: false,
      })
    ).toEqual({ running: false, status: "degraded" });
  });

  it("paused -> not running and status paused", () => {
    expect(
      computeSamplerState({
        now,
        heartbeat: { lastLoopAt: new Date(now - 10_000), consecutiveFailures: 0 },
        intervalMs,
        paused: true,
      })
    ).toEqual({ running: false, status: "paused" });
  });

  it("3 consecutive failures -> running but status degraded", () => {
    expect(
      computeSamplerState({
        now,
        heartbeat: { lastLoopAt: new Date(now - 10_000), consecutiveFailures: 3 },
        intervalMs,
        paused: false,
      })
    ).toEqual({ running: true, status: "degraded" });
  });

  it("boundary: exactly 3x interval -> running; just over 3x interval -> not running", () => {
    expect(
      computeSamplerState({
        now,
        heartbeat: { lastLoopAt: now - 3 * intervalMs, consecutiveFailures: 0 },
        intervalMs,
        paused: false,
      })
    ).toEqual({ running: true, status: "operational" });

    expect(
      computeSamplerState({
        now,
        heartbeat: { lastLoopAt: now - (3 * intervalMs + 1), consecutiveFailures: 0 },
        intervalMs,
        paused: false,
      })
    ).toEqual({ running: false, status: "degraded" });
  });
});

describe("summarizeSampleVerifications", () => {
  it("counts mixed verification states, computes merkleRoot over confirmed dataset rows only, and selects newest confirmed txHash", () => {
    const t1 = new Date("2026-11-28T10:00:00Z");
    const t2 = new Date("2026-11-28T10:05:00Z");
    const t3 = new Date("2026-11-28T10:10:00Z");
    const t4 = new Date("2026-11-28T10:15:00Z");

    const samples = [
      {
        source: "live",
        verification: "confirmed",
        intent: "FX_NOW_EUR",
        minerId: "31001",
        valueNorm: 1.085,
        rawAnswerHash: "hash1",
        txHash: "0xconfirmed1",
        ts: t1,
      },
      {
        source: "live",
        verification: "unverified",
        intent: "FX_NOW_EUR",
        minerId: "31002",
        valueNorm: 1.086,
        rawAnswerHash: "hash2",
        txHash: "0xunverified_newer",
        ts: t3,
      },
      {
        source: "live",
        verification: "failed",
        intent: "FX_NOW_EUR",
        minerId: "31003",
        valueNorm: 1.087,
        rawAnswerHash: "hash3",
        txHash: "0xfailed_newest",
        ts: t4,
      },
      {
        source: "live",
        verification: "confirmed",
        intent: "WEATHER_CHECK_TEMPERATURE",
        minerId: "31004",
        valueNorm: 15.2,
        rawAnswerHash: "hash4",
        txHash: "0xconfirmed2",
        ts: t2,
      },
    ];

    const summary = summarizeSampleVerifications(samples, null);
    expect(summary.liveSamples).toBe(4);
    expect(summary.confirmedSamples).toBe(2);
    expect(summary.unverifiedSamples).toBe(1);
    expect(summary.failedSamples).toBe(1);
    expect(summary.merkleRoot).toMatch(/^[0-9a-f]{64}$/);
    // Merkle root must match computing ONLY on the 2 confirmed samples
    const onlyConfirmed = summarizeSampleVerifications([samples[0], samples[3]], null);
    expect(summary.merkleRoot).toBe(onlyConfirmed.merkleRoot);
    // lastVerifiedTx must ignore newer unverified/failed rows and pick newest confirmed sample
    expect(summary.lastVerifiedTx).toBe("0xconfirmed2");

    // If a confirmed purchase is newer than the newest confirmed sample, purchase txHash wins
    const withNewerPurchase = summarizeSampleVerifications(samples, {
      txHash: "0xpurchase_newer",
      verifiedAt: t4,
    });
    expect(withNewerPurchase.lastVerifiedTx).toBe("0xpurchase_newer");
  });

  it("returns zero counts, null merkleRoot, and null lastVerifiedTx on empty set or only unverified/failed rows", () => {
    expect(summarizeSampleVerifications([], null)).toEqual({
      liveSamples: 0,
      confirmedSamples: 0,
      unverifiedSamples: 0,
      failedSamples: 0,
      merkleRoot: null,
      lastVerifiedTx: null,
    });

    const onlyBad = summarizeSampleVerifications(
      [
        {
          source: "live",
          verification: "unverified",
          intent: "FX_NOW_EUR",
          minerId: "31001",
          valueNorm: 1.08,
          rawAnswerHash: "h1",
          txHash: "0x1",
          ts: new Date(),
        },
        {
          source: "live",
          verification: "failed",
          intent: "FX_NOW_EUR",
          minerId: "31002",
          valueNorm: 1.09,
          rawAnswerHash: "h2",
          txHash: "0x2",
          ts: new Date(),
        },
      ],
      null
    );
    expect(onlyBad).toEqual({
      liveSamples: 2,
      confirmedSamples: 0,
      unverifiedSamples: 1,
      failedSamples: 1,
      merkleRoot: null,
      lastVerifiedTx: null,
    });
  });
});
