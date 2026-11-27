export interface LatencyPurchaseRecord {
  outcome?: string;
  latencyMs?: unknown;
}

/**
 * Computes median latencyMs strictly from real purchases with outcome === "paid".
 * Returns null if no valid paid latency records exist.
 */
export function computeMedianPaidLatencyMs(purchases: LatencyPurchaseRecord[]): number | null {
  const sortedLatencies = purchases
    .filter((p) => p.outcome === "paid" && typeof p.latencyMs === "number" && Number.isFinite(p.latencyMs) && p.latencyMs >= 0)
    .map((p) => p.latencyMs as number)
    .sort((a, b) => a - b);

  if (sortedLatencies.length === 0) {
    return null;
  }

  const mid = Math.floor(sortedLatencies.length / 2);
  return sortedLatencies.length % 2 === 1
    ? sortedLatencies[mid]
    : Math.round((sortedLatencies[mid - 1] + sortedLatencies[mid]) / 2);
}
