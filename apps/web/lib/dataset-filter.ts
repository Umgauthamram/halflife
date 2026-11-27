export const PUBLIC_DATASET_FILTER = {
  source: "live",
  verification: "confirmed",
  valueNorm: { $ne: null },
  minerId: { $not: /^miner_/ },
} as const;

export interface DatasetSampleCandidate {
  source?: unknown;
  verification?: unknown;
  valueNorm?: unknown;
  minerId?: unknown;
}

/**
 * In-memory equivalent of PUBLIC_DATASET_FILTER for unit testing and row validation.
 */
export function filterPublicDatasetRows<T extends DatasetSampleCandidate>(rows: T[]): T[] {
  return rows.filter(
    (row) =>
      row.source === PUBLIC_DATASET_FILTER.source &&
      row.verification === PUBLIC_DATASET_FILTER.verification &&
      row.valueNorm !== null &&
      row.valueNorm !== undefined &&
      typeof row.minerId === "string" &&
      !PUBLIC_DATASET_FILTER.minerId.$not.test(row.minerId)
  );
}
