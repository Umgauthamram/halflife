import type { AtlasStats, DecisionAction, DecisionInputs } from "@half-life/shared";

export interface DecisionRequest {
  intent: string;
  now: number; // unix epoch timestamp in milliseconds
  stake: number; // economic value at risk in USDC
  confidenceThreshold?: number;
}

export interface CachedAnswer {
  id: string;
  purchaseId: string;
  answeredAt: number; // unix epoch timestamp in milliseconds
  confidence?: number;
}

export interface DecisionResult {
  action: DecisionAction;
  reason: string;
  inputs: DecisionInputs;
}

/**
 * Default conservative TTL windows (in seconds) for uncalibrated intents.
 */
const DEFAULT_CONSERVATIVE_WINDOWS: Record<string, number> = {
  FX_NOW: 300, // 5 minutes
  WEATHER_FORECAST_VERIFY: 3600, // 1 hour
  SANCTIONS_SCREENING_MATCH: 86400, // 24 hours
};

/**
 * Computes the expected drift from the monotonic drift curve for a given age in seconds.
 * Performs linear interpolation between buckets, capping at the maximum bucket.
 */
export function interpolateDrift(driftCurve: { ageSeconds: number; expectedDrift: number }[], ageSeconds: number): number {
  if (driftCurve.length === 0) return 0;
  if (ageSeconds <= driftCurve[0].ageSeconds) return driftCurve[0].expectedDrift;
  
  for (let i = 0; i < driftCurve.length - 1; i++) {
    const p1 = driftCurve[i];
    const p2 = driftCurve[i + 1];
    if (ageSeconds >= p1.ageSeconds && ageSeconds <= p2.ageSeconds) {
      if (p2.ageSeconds === p1.ageSeconds) return p1.expectedDrift;
      const t = (ageSeconds - p1.ageSeconds) / (p2.ageSeconds - p1.ageSeconds);
      return p1.expectedDrift + t * (p2.expectedDrift - p1.expectedDrift);
    }
  }

  return driftCurve[driftCurve.length - 1].expectedDrift;
}

/**
 * Pure Governor decision engine.
 * Decides whether an agent should buy a fresh answer or reuse a cached answer.
 *
 * Rules:
 * 1. If no cached answer: BUY
 * 2. If stats uncalibrated: use conservative fixed window
 * 3. If drift <= noise floor: REUSE (fresh buy adds no information beyond miner disagreement)
 * 4. If stake * drift <= price: REUSE (cost of freshness > risk of stale answer)
 * 5. If confidence-triggered escalation justified: ESCALATE
 * 6. Else: BUY
 */
export function decide(
  req: DecisionRequest,
  cached: CachedAnswer | null,
  stats: AtlasStats | null,
  priceUsdc: number
): DecisionResult {
  if (!cached) {
    return {
      action: "buy",
      reason: "No cached answer available",
      inputs: {
        ageSeconds: 0,
        drift: 0,
        noiseFloor: stats?.noiseFloor ?? 0,
        price: priceUsdc,
        calibrated: stats?.calibrated ?? false,
      },
    };
  }

  const ageMs = Math.max(0, req.now - cached.answeredAt);
  const ageSeconds = ageMs / 1000;

  // Cold-start fallback if stats do not exist or are not calibrated
  if (!stats || !stats.calibrated) {
    const defaultWindow = DEFAULT_CONSERVATIVE_WINDOWS[req.intent] ?? 600;
    const isExpired = ageSeconds > defaultWindow;
    return {
      action: isExpired ? "buy" : "reuse",
      reason: isExpired
        ? `Uncalibrated fallback: age ${ageSeconds.toFixed(1)}s exceeds conservative window (${defaultWindow}s)`
        : `Uncalibrated fallback: age ${ageSeconds.toFixed(1)}s within conservative window (${defaultWindow}s)`,
      inputs: {
        ageSeconds,
        drift: 0,
        noiseFloor: stats?.noiseFloor ?? 0,
        price: priceUsdc,
        calibrated: false,
      },
    };
  }

  const drift = interpolateDrift(stats.driftCurve, ageSeconds);
  const noiseFloor = stats.noiseFloor;
  const staleLoss = req.stake * drift;

  const inputs: DecisionInputs = {
    ageSeconds,
    drift,
    noiseFloor,
    price: priceUsdc,
    calibrated: true,
  };

  // Rule: If drift is below the noise floor, independent miners disagree more than the expected change
  if (drift <= noiseFloor) {
    return {
      action: "reuse",
      reason: `Expected drift (${drift.toFixed(4)}) is below miner noise floor (${noiseFloor.toFixed(4)})`,
      inputs,
    };
  }

  // Rule: Economic comparison - stale risk vs purchase cost
  if (staleLoss <= priceUsdc) {
    return {
      action: "reuse",
      reason: `Expected stale loss ($${staleLoss.toFixed(4)}) is less than answer price ($${priceUsdc.toFixed(4)})`,
      inputs,
    };
  }

  // Escalation: high stake and low miner confidence (F-34)
  if (cached.confidence !== undefined && cached.confidence < 0.7 && req.stake * (1 - cached.confidence) > priceUsdc * 2) {
    return {
      action: "escalate",
      reason: `Confidence (${cached.confidence.toFixed(2)}) is low and stake warrants second opinion`,
      inputs,
    };
  }

  return {
    action: "buy",
    reason: `Expected stale loss ($${staleLoss.toFixed(4)}) exceeds price ($${priceUsdc.toFixed(4)}) and drift exceeds noise floor`,
    inputs,
  };
}

