import { describe, expect, it, vi } from "vitest";
import { getActiveAtlasIntents } from "../lib/intents";

function makeFakeDb(distinctResult: unknown[]) {
  return {
    collection: vi.fn(() => ({
      distinct: vi.fn(async () => distinctResult),
    })),
  } as any;
}

describe("getActiveAtlasIntents", () => {
  it("returns default sampler intents when DB has no live samples", async () => {
    const db = makeFakeDb([]);
    const intents = await getActiveAtlasIntents(db, undefined);
    expect(intents).toEqual([
      "FX_NOW_EUR",
      "WEATHER_CHECK_TEMPERATURE",
      "SANCTIONS_SCREENING_MATCH_GENERAL",
    ]);
  });

  it("appends extra sampled live intents after configured defaults", async () => {
    const db = makeFakeDb(["CRYPTO_PRICE", "WEB_SEARCH"]);
    const intents = await getActiveAtlasIntents(db, undefined);
    expect(intents).toEqual([
      "FX_NOW_EUR",
      "WEATHER_CHECK_TEMPERATURE",
      "SANCTIONS_SCREENING_MATCH_GENERAL",
      "CRYPTO_PRICE",
      "WEB_SEARCH",
    ]);
  });

  it("deduplicates and ignores non-string or empty values", async () => {
    const db = makeFakeDb(["FX_NOW_EUR", "", "  ", null, 42, "CRYPTO_PRICE", "CRYPTO_PRICE"]);
    const intents = await getActiveAtlasIntents(db, "FX_NOW_EUR, CRYPTO_PRICE");
    expect(intents).toEqual(["FX_NOW_EUR", "CRYPTO_PRICE"]);
  });
});
