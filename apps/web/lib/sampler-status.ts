export interface SamplerHeartbeatInput {
  lastLoopAt?: Date | string | number | null;
  consecutiveFailures?: number;
  paused?: boolean;
}

export interface ComputeSamplerStateInput {
  now: number;
  heartbeat: SamplerHeartbeatInput | null | undefined;
  intervalMs: number;
  paused?: boolean;
}

export interface SamplerStateResult {
  running: boolean;
  status: "operational" | "paused" | "degraded";
}

/**
 * Pure computation of sampler running & overall status:
 * - running = true iff heartbeat.lastLoopAt exists AND now - lastLoopAt <= 3 * intervalMs AND !paused
 * - status = "paused" if paused; else "operational" iff running && consecutiveFailures < 3; else "degraded"
 */
export function computeSamplerState({
  now,
  heartbeat,
  intervalMs,
  paused,
}: ComputeSamplerStateInput): SamplerStateResult {
  const isPaused = Boolean(paused ?? heartbeat?.paused);

  let lastLoopMs: number | null = null;
  if (heartbeat?.lastLoopAt !== undefined && heartbeat?.lastLoopAt !== null) {
    const parsed =
      heartbeat.lastLoopAt instanceof Date
        ? heartbeat.lastLoopAt.getTime()
        : typeof heartbeat.lastLoopAt === "number"
        ? heartbeat.lastLoopAt
        : new Date(heartbeat.lastLoopAt).getTime();
    if (Number.isFinite(parsed)) {
      lastLoopMs = parsed;
    }
  }

  const isFresh = lastLoopMs !== null && now - lastLoopMs <= 3 * intervalMs;
  const running = Boolean(lastLoopMs !== null && isFresh && !isPaused);

  const consecutiveFailures =
    typeof heartbeat?.consecutiveFailures === "number" ? heartbeat.consecutiveFailures : 0;

  let status: "operational" | "paused" | "degraded";
  if (isPaused) {
    status = "paused";
  } else if (running && consecutiveFailures < 3) {
    status = "operational";
  } else {
    status = "degraded";
  }

  return { running, status };
}
