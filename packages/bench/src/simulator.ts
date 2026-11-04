import { decide, type CachedAnswer } from "@half-life/governor";
import type { AtlasStats } from "@half-life/shared";

export interface ReplayEvent {
  timestampMs: number;
  intent: string;
  stake: number;
  actualFreshValue: number;
  priceUsdc: number;
  forcedCheckpoint?: boolean; // Forced ground truth verification
}

export interface BenchmarkAgentResult {
  totalAsks: number;
  totalReuses: number;
  totalSpendUsdc: number;
  staleDecisionsCount: number;
  staleDecisionRatePercent: number;
  capAdherencePercent: number;
  decisions: Array<{
    timestampMs: number;
    intent: string;
    action: "buy" | "reuse";
    reason: string;
    valueUsed: number;
    driftFromGroundTruth: number;
  }>;
}

export interface SideBySideComparison {
  totalRequests: number;
  naive: BenchmarkAgentResult;
  halfLife: BenchmarkAgentResult;
  asksReductionPercent: number;
  spendSavedUsdc: number;
  spendSavingsPercent: number;
}

/**
 * Executes a side-by-side benchmark comparing a Naive Agent (buys on every heartbeat)
 * against a Half-Life Agent (governed by empirical drift and miner noise floor).
 */
export function runSideBySideBenchmark(
  events: ReplayEvent[],
  statsMap: Record<string, AtlasStats>,
  dailyCapUsdc: number = 10.0
): SideBySideComparison {
  // 1. Run Naive Agent Simulation
  let naiveSpend = 0;
  let naiveAsks = 0;
  const naiveDecisions: BenchmarkAgentResult["decisions"] = [];

  for (const event of events) {
    if (naiveSpend + event.priceUsdc <= dailyCapUsdc) {
      naiveSpend += event.priceUsdc;
      naiveAsks++;
      naiveDecisions.push({
        timestampMs: event.timestampMs,
        intent: event.intent,
        action: "buy",
        reason: "Naive agent policy: buy on every request",
        valueUsed: event.actualFreshValue,
        driftFromGroundTruth: 0,
      });
    }
  }

  const naiveResult: BenchmarkAgentResult = {
    totalAsks: naiveAsks,
    totalReuses: 0,
    totalSpendUsdc: Number(naiveSpend.toFixed(4)),
    staleDecisionsCount: 0,
    staleDecisionRatePercent: 0,
    capAdherencePercent: 100,
    decisions: naiveDecisions,
  };

  // 2. Run Half-Life Agent Simulation
  let halfLifeSpend = 0;
  let halfLifeAsks = 0;
  let halfLifeReuses = 0;
  let staleDecisionsCount = 0;
  const halfLifeDecisions: BenchmarkAgentResult["decisions"] = [];

  const cacheByIntent: Record<string, { value: number; answeredAt: number; purchaseId: string }> = {};

  for (const event of events) {
    const stats = statsMap[event.intent] ?? null;
    const cachedEntry = cacheByIntent[event.intent];

    let cached: CachedAnswer | null = null;
    if (cachedEntry) {
      cached = {
        id: "cache_" + event.intent,
        purchaseId: cachedEntry.purchaseId,
        answeredAt: cachedEntry.answeredAt,
      };
    }

    const decision = decide(
      { intent: event.intent, now: event.timestampMs, stake: event.stake },
      cached,
      stats,
      event.priceUsdc
    );

    if (decision.action === "buy" || !cachedEntry) {
      if (halfLifeSpend + event.priceUsdc <= dailyCapUsdc) {
        halfLifeSpend += event.priceUsdc;
        halfLifeAsks++;
        cacheByIntent[event.intent] = {
          value: event.actualFreshValue,
          answeredAt: event.timestampMs,
          purchaseId: `p_${event.timestampMs}`,
        };

        halfLifeDecisions.push({
          timestampMs: event.timestampMs,
          intent: event.intent,
          action: "buy",
          reason: decision.reason,
          valueUsed: event.actualFreshValue,
          driftFromGroundTruth: 0,
        });
      }
    } else {
      // Reused cached answer
      halfLifeReuses++;
      const usedValue = cachedEntry.value;
      const errorFromFresh = Math.abs(usedValue - event.actualFreshValue) / (event.actualFreshValue || 1);

      // Check if stale: if error exceeds acceptable drift tolerance (> 2%)
      if (errorFromFresh > 0.02) {
        staleDecisionsCount++;
      }

      halfLifeDecisions.push({
        timestampMs: event.timestampMs,
        intent: event.intent,
        action: "reuse",
        reason: decision.reason,
        valueUsed: usedValue,
        driftFromGroundTruth: errorFromFresh,
      });
    }
  }

  const totalDecisions = halfLifeAsks + halfLifeReuses;
  const staleDecisionRate = totalDecisions > 0 ? (staleDecisionsCount / totalDecisions) * 100 : 0;

  const halfLifeResult: BenchmarkAgentResult = {
    totalAsks: halfLifeAsks,
    totalReuses: halfLifeReuses,
    totalSpendUsdc: Number(halfLifeSpend.toFixed(4)),
    staleDecisionsCount,
    staleDecisionRatePercent: Number(staleDecisionRate.toFixed(2)),
    capAdherencePercent: 100,
    decisions: halfLifeDecisions,
  };

  const spendSaved = naiveResult.totalSpendUsdc - halfLifeResult.totalSpendUsdc;
  const spendSavingsPct = naiveResult.totalSpendUsdc > 0 ? (spendSaved / naiveResult.totalSpendUsdc) * 100 : 0;
  const asksReducedPct = naiveResult.totalAsks > 0 ? ((naiveResult.totalAsks - halfLifeResult.totalAsks) / naiveResult.totalAsks) * 100 : 0;

  return {
    totalRequests: events.length,
    naive: naiveResult,
    halfLife: halfLifeResult,
    asksReductionPercent: Number(asksReducedPct.toFixed(1)),
    spendSavedUsdc: Number(spendSaved.toFixed(4)),
    spendSavingsPercent: Number(spendSavingsPct.toFixed(1)),
  };
}

