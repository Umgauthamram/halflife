export const DEFAULT_SAMPLER_INTENTS = [
  "FX_NOW_EUR",
  "WEATHER_CHECK_TEMPERATURE",
  "SANCTIONS_SCREENING_MATCH_GENERAL",
] as const;

export const LEGACY_INTENT_MAP: Record<string, string> = {
  FX_NOW: "FX_NOW_EUR",
  WEATHER_FORECAST_VERIFY: "WEATHER_CHECK_TEMPERATURE",
  SANCTIONS_SCREENING_MATCH: "SANCTIONS_SCREENING_MATCH_GENERAL",
};

export const REVERSE_LEGACY_INTENT_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(LEGACY_INTENT_MAP).map(([legacy, current]) => [current, legacy])
);

export function parseSamplerIntents(raw?: string): string[] {
  if (!raw || typeof raw !== "string") {
    return [...DEFAULT_SAMPLER_INTENTS];
  }
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of raw.split(",")) {
    const trimmed = part.trim();
    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed);
      result.push(trimmed);
    }
  }
  return result.length > 0 ? result : [...DEFAULT_SAMPLER_INTENTS];
}

export function mergeIntents(...lists: string[][]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      if (typeof item !== "string") continue;
      const trimmed = item.trim();
      if (trimmed && !seen.has(trimmed)) {
        seen.add(trimmed);
        result.push(trimmed);
      }
    }
  }
  return result;
}
