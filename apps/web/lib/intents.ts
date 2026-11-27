import type { Db } from "mongodb";
import { mergeIntents, parseSamplerIntents } from "@half-life/shared";

/**
 * Returns the union of configured SAMPLER_INTENTS (or DEFAULT_SAMPLER_INTENTS)
 * and distinct live intents recorded in atlas_samples.
 */
export async function getActiveAtlasIntents(
  db: Db,
  samplerIntentsEnv: string | undefined = process.env.SAMPLER_INTENTS
): Promise<string[]> {
  const configured = parseSamplerIntents(samplerIntentsEnv);
  const rawDistinct = await db
    .collection("atlas_samples")
    .distinct("intent", { source: "live" });
  const dbIntents = Array.isArray(rawDistinct)
    ? rawDistinct.filter((v): v is string => typeof v === "string")
    : [];
  return mergeIntents(configured, dbIntents);
}
