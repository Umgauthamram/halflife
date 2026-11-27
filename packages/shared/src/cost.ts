export interface DailySpendEstimateInput {
  intents: number;
  minersPerIntent: number;
  intervalMs: number;
  priceUsdc: number | null;
}

/**
 * Estimates daily sampler spend in USDC given intents, miners per intent,
 * sampling interval (ms), and last known unit price (USDC).
 * Returns null if price is unknown/invalid or intervalMs <= 0.
 */
export function estimateDailySpendUsdc({
  intents,
  minersPerIntent,
  intervalMs,
  priceUsdc,
}: DailySpendEstimateInput): number | null {
  if (
    priceUsdc === null ||
    typeof priceUsdc !== "number" ||
    !Number.isFinite(priceUsdc) ||
    priceUsdc < 0
  ) {
    return null;
  }
  if (typeof intervalMs !== "number" || !Number.isFinite(intervalMs) || intervalMs <= 0) {
    return null;
  }
  if (
    typeof intents !== "number" ||
    !Number.isFinite(intents) ||
    intents < 0 ||
    typeof minersPerIntent !== "number" ||
    !Number.isFinite(minersPerIntent) ||
    minersPerIntent < 0
  ) {
    return null;
  }

  const roundsPerDay = 86_400_000 / intervalMs;
  return Number((intents * minersPerIntent * roundsPerDay * priceUsdc).toFixed(6));
}
