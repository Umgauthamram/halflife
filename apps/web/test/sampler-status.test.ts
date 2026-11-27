import { describe, expect, it } from "vitest";
import { computeSamplerState } from "../lib/sampler-status";

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
