import { describe, expect, it } from "vitest";
import {
  DEFAULT_SAMPLER_INTENTS,
  LEGACY_INTENT_MAP,
  mergeIntents,
  parseSamplerIntents,
} from "./intents.js";

describe("intents shared helpers", () => {
  it("exposes expected DEFAULT_SAMPLER_INTENTS and LEGACY_INTENT_MAP", () => {
    expect(DEFAULT_SAMPLER_INTENTS).toEqual([
      "FX_NOW_EUR",
      "WEATHER_CHECK_TEMPERATURE",
      "SANCTIONS_SCREENING_MATCH_GENERAL",
    ]);
    expect(LEGACY_INTENT_MAP).toEqual({
      FX_NOW: "FX_NOW_EUR",
      WEATHER_FORECAST_VERIFY: "WEATHER_CHECK_TEMPERATURE",
      SANCTIONS_SCREENING_MATCH: "SANCTIONS_SCREENING_MATCH_GENERAL",
    });
  });

  it("parseSamplerIntents handles undefined, empty, whitespace, and duplicates", () => {
    expect(parseSamplerIntents(undefined)).toEqual([...DEFAULT_SAMPLER_INTENTS]);
    expect(parseSamplerIntents("")).toEqual([...DEFAULT_SAMPLER_INTENTS]);
    expect(parseSamplerIntents("  ,  , ")).toEqual([...DEFAULT_SAMPLER_INTENTS]);
    expect(parseSamplerIntents(" FX_NOW_EUR , CRYPTO_PRICE , FX_NOW_EUR , ")).toEqual([
      "FX_NOW_EUR",
      "CRYPTO_PRICE",
    ]);
  });

  it("parseSamplerIntents returns a fresh copy so mutating it does not change DEFAULT_SAMPLER_INTENTS", () => {
    const parsed = parseSamplerIntents(undefined);
    parsed.push("MUTATED_INTENT");
    expect(DEFAULT_SAMPLER_INTENTS).toEqual([
      "FX_NOW_EUR",
      "WEATHER_CHECK_TEMPERATURE",
      "SANCTIONS_SCREENING_MATCH_GENERAL",
    ]);
  });

  it("mergeIntents preserves first-appearance order, deduplicates, and ignores empty/non-string values", () => {
    const merged = mergeIntents(
      ["FX_NOW_EUR", "", "WEATHER_CHECK_TEMPERATURE"],
      ["WEATHER_CHECK_TEMPERATURE", "CRYPTO_PRICE", null as unknown as string, "  "],
      ["WEB_SEARCH", "FX_NOW_EUR"]
    );
    expect(merged).toEqual([
      "FX_NOW_EUR",
      "WEATHER_CHECK_TEMPERATURE",
      "CRYPTO_PRICE",
      "WEB_SEARCH",
    ]);
  });
});
