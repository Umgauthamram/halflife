import {
  REVERSE_LEGACY_INTENT_MAP,
  type AtlasStats,
  type DecisionAction,
  type DecisionInputs,
} from "@half-life/shared";

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
  FX_NOW_EUR: 300, // 5 minutes
  WEATHER_CHECK_TEMPERATURE: 3600, // 1 hour
  SANCTIONS_SCREENING_MATCH_GENERAL: 86400, // 24 hours
  FX_NOW: 300, // 5 minutes // legacy-alias
  WEATHER_FORECAST_VERIFY: 3600, // 1 hour // legacy-alias
  SANCTIONS_SCREENING_MATCH: 86400, // 24 hours // legacy-alias
  // Mission 09 Personal Agent Intents
  WEB_SEARCH: 1800, // 30 minutes
  QUESTION_ANSWERING: 3600, // 1 hour
  WEATHER_CHECK: 3600, // 1 hour // legacy-alias
  CRYPTO_PRICE: 60, // 1 minute
  TASK_EXECUTION_QUALITY: 86400, // 24 hours
  CONTENT_EXTRACTION: 86400, // 24 hours
  URL_SAFE: 43200, // 12 hours
  CODE_GENERATION: 86400, // 24 hours
  TEXT_SUMMARIZATION: 86400, // 24 hours
  AGENT_TASK: 3600, // 1 hour
  LLM_OUTPUT_EVALUATION: 86400, // 24 hours
  LIVE_SHELF_PRICE: 3600, // 1 hour
  VENDOR_VERIFY: 604800, // 7 days
  CARRIER_SERVICEABILITY: 86400, // 24 hours
  SHIP_RATE_ETA: 7200, // 2 hours
  CLOUD_RESOURCE_USAGE: 300, // 5 minutes
};

/**
 * Resolves the conservative fallback TTL window (in seconds) for an uncalibrated intent:
 * 1. Exact match in DEFAULT_CONSERVATIVE_WINDOWS
 * 2. Reversed LEGACY_INTENT_MAP lookup
 * 3. Strip trailing `_GENERAL` suffix and retry
 * 4. Default 600s
 */
export function conservativeWindowSeconds(intent: string): number {
  if (intent in DEFAULT_CONSERVATIVE_WINDOWS) {
    return DEFAULT_CONSERVATIVE_WINDOWS[intent];
  }
  const legacyKey = REVERSE_LEGACY_INTENT_MAP[intent];
  if (legacyKey && legacyKey in DEFAULT_CONSERVATIVE_WINDOWS) {
    return DEFAULT_CONSERVATIVE_WINDOWS[legacyKey];
  }
  if (intent.endsWith("_GENERAL")) {
    const stripped = intent.slice(0, -"_GENERAL".length);
    if (stripped in DEFAULT_CONSERVATIVE_WINDOWS) {
      return DEFAULT_CONSERVATIVE_WINDOWS[stripped];
    }
  }
  return 600;
}

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
    const defaultWindow = conservativeWindowSeconds(req.intent);
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

