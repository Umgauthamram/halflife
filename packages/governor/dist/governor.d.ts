import type { AtlasStats, DecisionAction, DecisionInputs } from "@half-life/shared";
export interface DecisionRequest {
    intent: string;
    now: number;
    stake: number;
    confidenceThreshold?: number;
}
export interface CachedAnswer {
    id: string;
    purchaseId: string;
    answeredAt: number;
    confidence?: number;
}
export interface DecisionResult {
    action: DecisionAction;
    reason: string;
    inputs: DecisionInputs;
}
/**
 * Computes the expected drift from the monotonic drift curve for a given age in seconds.
 * Performs linear interpolation between buckets, capping at the maximum bucket.
 */
export declare function interpolateDrift(driftCurve: {
    ageSeconds: number;
    expectedDrift: number;
}[], ageSeconds: number): number;
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
export declare function decide(req: DecisionRequest, cached: CachedAnswer | null, stats: AtlasStats | null, priceUsdc: number): DecisionResult;
//# sourceMappingURL=governor.d.ts.map