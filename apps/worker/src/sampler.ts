import type { Db } from "mongodb";
import crypto from "node:crypto";
import type { TelegraphClient } from "@half-life/telegraph";
import { reserveBudget, releaseBudget } from "./budget.js";
import type { AgentPolicy } from "@half-life/shared";
import { updateDecayEstimates } from "./decay-estimator.js";

export interface SamplerConfig {
  intents: string[];
  intervalMs: number;
  dailyCapUsdc: number;
}

export interface SampleDisagreement {
  intent: string;
  miner1Id: string;
  miner2Id: string;
  disagreement: number;
  ts: Date;
}

/**
 * Extracts a normalized numeric or string value from an intent's answer.
 * Returns null if the value is missing, invalid, or cannot be parsed.
 * Never returns 0 as a fallback default.
 */
export function normalizeAnswerValue(
  intent: string,
  answer: any
): { valueNorm: number | string | null; hash: string } {
  if (answer === null || answer === undefined) {
    return {
      valueNorm: null,
      hash: crypto.createHash("sha256").update("").digest("hex"),
    };
  }

  let val: number | string | null = null;

  if (intent.startsWith("FX_NOW")) {
    if (typeof answer.rate === "number" && !isNaN(answer.rate)) val = answer.rate;
    else if (typeof answer.rates?.USD === "number" && !isNaN(answer.rates.USD)) val = answer.rates.USD;
    else if (typeof answer.rates?.EUR === "number" && !isNaN(answer.rates.EUR)) val = answer.rates.EUR;
    else if (typeof answer.value === "number" && !isNaN(answer.value)) val = answer.value;
    else if (typeof answer === "number" && !isNaN(answer)) val = answer;
    else if (typeof answer === "string" && answer.trim()) val = answer.trim();
  } else if (intent.startsWith("WEATHER")) {
    if (typeof answer.temperatureC === "number" && !isNaN(answer.temperatureC)) val = answer.temperatureC;
    else if (typeof answer.temperature === "number" && !isNaN(answer.temperature)) val = answer.temperature;
    else if (typeof answer.temp === "number" && !isNaN(answer.temp)) val = answer.temp;
    else if (typeof answer.value === "number" && !isNaN(answer.value)) val = answer.value;
    else if (typeof answer === "string" && answer.trim()) val = answer.trim();
  } else if (intent.startsWith("SANCTIONS")) {
    if (typeof answer.matchScore === "number" && !isNaN(answer.matchScore)) val = answer.matchScore;
    else if (typeof answer.score === "number" && !isNaN(answer.score)) val = answer.score;
    else if (typeof answer.match === "boolean") val = answer.match ? 1 : 0;
    else if (typeof answer.value === "number" && !isNaN(answer.value)) val = answer.value;
    else if (typeof answer === "string" && answer.trim()) val = answer.trim();
  } else {
    if (typeof answer.value === "number" && !isNaN(answer.value)) val = answer.value;
    else if (typeof answer.value === "string" && answer.trim()) val = answer.trim();
    else if (typeof answer === "number" && !isNaN(answer)) val = answer;
    else if (typeof answer === "string" && answer.trim()) val = answer.trim();
    else if (typeof answer === "object" && answer !== null && Object.keys(answer).length > 0) {
      val = JSON.stringify(answer);
    }
  }

  const hash = crypto.createHash("sha256").update(JSON.stringify(answer ?? "")).digest("hex");
  return { valueNorm: val, hash };
}

/**
 * Executes a single sampling round for a given intent:
 * 1. Claims distributed lock in MongoDB to prevent concurrent worker runs.
 * 2. Pre-quotes to learn real price without hardcoded assumptions.
 * 3. Purchases from top 2 named miners concurrently to measure instantaneous disagreement.
 * 4. Records samples with source provenance, verification, and outcomeState.
 * 5. Updates empirical decay estimates in atlas_stats.
 */
export async function sampleIntent(
  db: Db,
  client: TelegraphClient,
  intent: string,
  systemAgentId: string,
  samplerPolicy: AgentPolicy
): Promise<{ samplesCount: number; noiseMeasurement?: SampleDisagreement }> {
  // 1. Acquire Distributed Lock with 2-minute TTL
  const lockKey = `sampler_${intent}`;
  const now = new Date();
  const lockExpire = new Date(now.getTime() + 2 * 60 * 1000);

  const lockRes = await db.collection("sampler_locks").findOneAndUpdate(
    {
      lockKey,
      $or: [{ lockedUntil: { $lt: now } }, { lockedUntil: { $exists: false } }],
    },
    {
      $set: { lockedUntil: lockExpire, lockedBy: process.pid.toString(), updatedAt: now },
    },
    { upsert: true, returnDocument: "after" }
  );

  if (!lockRes) {
    console.log(`[Sampler] Intent ${intent} is currently locked by another worker.`);
    return { samplesCount: 0 };
  }

  try {
    const miners = await client.listMiners(intent);
    if (miners.length === 0) {
      await db.collection("atlas_gaps").insertOne({
        intent,
        reason: "NO_MINERS_AVAILABLE",
        ts: now,
      });
      return { samplesCount: 0 };
    }

    // Determine query params per intent
    let params: Record<string, unknown> = {};
    if (intent.startsWith("FX_NOW")) params = { currency: "EUR", pair: "EUR/USD" };
    else if (intent.startsWith("WEATHER")) params = { location: "London" };
    else if (intent.startsWith("SANCTIONS")) params = { entity: "Acme International" };

    const minersToSample = miners.slice(0, 2);

    // 2. Sample named miners concurrently using client.quote() for price
    const samplePromises = minersToSample.map(async (miner) => {
      const requestId = `sample_${intent}_${miner.id}_${now.getTime()}`;

      let quote;
      try {
        quote = await client.quote({
          intent,
          params,
          minerId: miner.id,
          maxPriceUsdc: samplerPolicy.perAskCapUsdc,
          paymentMode: "x402",
          requestId,
        });
      } catch (quoteErr) {
        console.warn(`[Sampler] Quote failed for miner ${miner.id} (${intent}):`, quoteErr);
        return null;
      }

      const { period, reservedAmount } = await reserveBudget(
        db,
        systemAgentId,
        quote.priceUsdc,
        samplerPolicy
      );

      try {
        const receipt = await client.ask({
          intent,
          params,
          minerId: miner.id,
          maxPriceUsdc: samplerPolicy.perAskCapUsdc,
          paymentMode: "x402",
          requestId,
        });

        const { valueNorm, hash } = normalizeAnswerValue(intent, receipt.answer);
        let outcomeState = receipt.outcome || (receipt.txHash ? "paid" : "failed");

        if (valueNorm === null && outcomeState === "paid") {
          outcomeState = "unusable" as any;
        }

        const verification =
          receipt.verification ||
          (outcomeState === "paid" ? (receipt.txHash ? "unverified" : "failed") : "failed");

        // Never write failed/blocked/free rows into atlas_samples
        if (outcomeState !== "failed" && outcomeState !== "blocked" && !receipt.free) {
          await db.collection("atlas_samples").insertOne({
            ts: now,
            intent,
            paramsKey: JSON.stringify(params),
            minerId: miner.id,
            valueNorm,
            rawAnswerHash: hash,
            txHash: receipt.txHash,
            receiptHash: receipt.receiptHash,
            signalHash: receipt.signalHash,
            priceUsdc: receipt.priceUsdc,
            latencyMs: receipt.latencyMs,
            outcomeState,
            source: client.source,
            verification,
          });
        }

        return {
          minerId: miner.id,
          price: receipt.priceUsdc,
          answer: receipt.answer,
          valueNorm,
          txHash: receipt.txHash,
          receiptHash: receipt.receiptHash,
          signalHash: receipt.signalHash,
          outcomeState,
        };
      } catch (askErr) {
        await releaseBudget(db, systemAgentId, period, reservedAmount);
        console.error(`[Sampler] Failed to sample miner ${miner.id} for intent ${intent}:`, askErr);
        return null;
      }
    });

    const results = await Promise.all(samplePromises);

    // Only compute disagreement on valid usable answers (never against null / unusable)
    const collected = results.filter(
      (r): r is NonNullable<typeof r> =>
        r !== null && r.outcomeState === "paid" && r.valueNorm !== null
    );

    // 3. Compute instantaneous noise floor if 2 distinct miners succeeded with usable values
    let noiseMeasurement: SampleDisagreement | undefined;
    if (collected.length >= 2) {
      const v1 = collected[0].valueNorm;
      const v2 = collected[1].valueNorm;
      let disagreement = 0;
      if (typeof v1 === "number" && typeof v2 === "number") {
        const avg = (Math.abs(v1) + Math.abs(v2)) / 2 || 1;
        disagreement = Math.abs(v1 - v2) / avg;
      } else {
        disagreement = v1 === v2 ? 0 : 1;
      }

      noiseMeasurement = {
        intent,
        miner1Id: collected[0].minerId,
        miner2Id: collected[1].minerId,
        disagreement,
        ts: now,
      };

      await db.collection("atlas_noise_measurements").insertOne(noiseMeasurement);
    }

    // 4. Update empirical decay estimates in atlas_stats
    await updateDecayEstimates(db, intent).catch((err) => {
      console.warn(`[Sampler] Could not update decay estimates for ${intent}:`, err);
    });

    return { samplesCount: collected.length, noiseMeasurement };
  } finally {
    // Release Lock
    await db.collection("sampler_locks").deleteOne({ lockKey });
  }
}
