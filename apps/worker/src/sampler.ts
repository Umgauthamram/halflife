import type { Db } from "mongodb";
import type { TelegraphClient } from "@half-life/telegraph";
import {
  verifySettlementTx,
  createSepoliaClient,
  type ExpectedSettlement,
  type VerificationResult,
} from "@half-life/chain";
import type { Hash } from "viem";
import { reserveBudget, releaseBudget, BudgetCapError } from "./budget.js";
import { normalizeAnswerValue, type AgentPolicy } from "@half-life/shared";
import { updateDecayEstimates } from "./decay-estimator.js";

export { normalizeAnswerValue };

const DEFAULT_USDC_ADDRESS = "0xcc194e1a843B658526D0D5C431f670028582Ae17";
const DEFAULT_TELEGRAPH_CONTRACT = "0x3624EB012B5E998BB57B6bE6C9Cfc9c4bc5eb99b";

export type SettlementVerifier = (
  txHash: Hash,
  expected: ExpectedSettlement
) => Promise<VerificationResult>;

export interface SamplerDependencies {
  verifyTx?: SettlementVerifier;
  now?: () => Date;
}

export function createDefaultSettlementVerifier(): SettlementVerifier {
  const rpcUrl = process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org";
  const client = createSepoliaClient(rpcUrl);
  return (txHash: Hash, expected: ExpectedSettlement) =>
    verifySettlementTx(client, txHash, expected);
}

export async function verifySampleSettlement(
  txHash: string | undefined,
  expected: ExpectedSettlement,
  verifyTx: SettlementVerifier
): Promise<{ verification: "confirmed" | "failed" | "unverified"; verifiedAt?: Date; verifyDetail?: string }> {
  if (!txHash || !txHash.startsWith("0x")) {
    return { verification: "unverified" };
  }
  try {
    const res = await verifyTx(txHash as Hash, expected);
    if (res.verified) {
      return {
        verification: "confirmed",
        verifiedAt: new Date(),
        verifyDetail: res.detail,
      };
    }
    if (res.status === "failed") {
      return {
        verification: "failed",
        verifiedAt: new Date(),
        verifyDetail: res.detail,
      };
    }
    return {
      verification: "unverified",
      verifyDetail: res.detail,
    };
  } catch {
    return { verification: "unverified" };
  }
}

/**
 * Re-verifies up to 20 unverified live samples whose txHash is present and ts is older than 2 minutes.
 */
export async function reverifyPendingSamples(
  db: Db,
  deps: SamplerDependencies = {}
): Promise<{ checked: number; confirmed: number; failed: number; stillUnverified: number }> {
  const now = deps.now ? deps.now() : new Date();
  const cutoff = new Date(now.getTime() - 2 * 60 * 1000);
  const verifyTx = deps.verifyTx ?? createDefaultSettlementVerifier();

  const rawCandidates = await db
    .collection("atlas_samples")
    .find({
      source: "live",
      verification: "unverified",
      txHash: { $exists: true, $ne: "" },
      ts: { $lt: cutoff },
    })
    .sort({ ts: 1 })
    .limit(20)
    .toArray();

  // Defense-in-depth JS filter so in-memory test DBs behave identically to MongoDB
  const candidates = rawCandidates
    .filter(
      (s) =>
        s.source === "live" &&
        s.verification === "unverified" &&
        typeof s.txHash === "string" &&
        s.txHash.startsWith("0x") &&
        new Date(s.ts).getTime() < cutoff.getTime()
    )
    .slice(0, 20);

  let confirmed = 0;
  let failed = 0;
  let stillUnverified = 0;

  for (const sample of candidates) {
    const expected: ExpectedSettlement = {
      usdc: sample.asset || process.env.USDC_ADDRESS || DEFAULT_USDC_ADDRESS,
      payer: sample.payer,
      payTo: sample.payTo || process.env.TELEGRAPH_CONTRACT || DEFAULT_TELEGRAPH_CONTRACT,
      amountRaw:
        sample.amountRaw !== undefined && sample.amountRaw !== null
          ? BigInt(sample.amountRaw)
          : BigInt(Math.round((Number(sample.priceUsdc) || 0) * 1e6)),
    };

    const result = await verifySampleSettlement(sample.txHash, expected, verifyTx);
    if (result.verification === "confirmed") {
      confirmed += 1;
      await db.collection("atlas_samples").updateOne(
        { _id: sample._id },
        {
          $set: {
            verification: "confirmed",
            verifiedAt: result.verifiedAt || now,
            verifyDetail: result.verifyDetail,
          },
        }
      );
    } else if (result.verification === "failed") {
      failed += 1;
      await db.collection("atlas_samples").updateOne(
        { _id: sample._id },
        {
          $set: {
            verification: "failed",
            verifiedAt: result.verifiedAt || now,
            verifyDetail: result.verifyDetail,
          },
        }
      );
    } else {
      stillUnverified += 1;
    }
  }

  return { checked: candidates.length, confirmed, failed, stillUnverified };
}

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
  samplerPolicy: AgentPolicy,
  deps: SamplerDependencies = {}
): Promise<{ samplesCount: number; noiseMeasurement?: SampleDisagreement; dailyCapReached?: boolean }> {
  // 1. Acquire Distributed Lock with 2-minute TTL
  const lockKey = `sampler_${intent}`;
  const now = deps.now ? deps.now() : new Date();
  const verifyTx = deps.verifyTx ?? createDefaultSettlementVerifier();
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
    if (/^FX_NOW/i.test(intent)) params = { currency: "EUR", pair: "EUR/USD" };
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

      let reserved: { period: string; reservedAmount: number };
      try {
        reserved = await reserveBudget(
          db,
          systemAgentId,
          quote.priceUsdc,
          samplerPolicy
        );
      } catch (budgetErr) {
        if (budgetErr instanceof BudgetCapError && budgetErr.code === "DAILY_CAP_EXCEEDED") {
          return { dailyCapReached: true } as any;
        }
        throw budgetErr;
      }
      const { period, reservedAmount } = reserved;

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
        let outcomeState: string = receipt.outcome || (receipt.txHash ? "paid" : "failed");

        if (valueNorm === null && outcomeState === "paid") {
          outcomeState = "unusable";
        }

        let verification: "confirmed" | "failed" | "unverified" = "failed";
        let verifiedAt: Date | undefined;
        let verifyDetail: string | undefined;

        const expectedUsdc =
          receipt.asset || quote.asset || process.env.USDC_ADDRESS || DEFAULT_USDC_ADDRESS;
        const expectedPayTo =
          receipt.payTo || quote.payTo || process.env.TELEGRAPH_CONTRACT || DEFAULT_TELEGRAPH_CONTRACT;
        const expectedAmountRaw = receipt.amountRaw ?? quote.amountRaw;

        // Never write unusable/failed/blocked/free rows into atlas_samples,
        // and never write "confirmed" without an on-chain verifier call.
        if (
          outcomeState !== "failed" &&
          outcomeState !== "blocked" &&
          outcomeState !== "unusable" &&
          !receipt.free
        ) {
          if (receipt.txHash && receipt.txHash.startsWith("0x")) {
            const vRes = await verifySampleSettlement(
              receipt.txHash,
              {
                usdc: expectedUsdc,
                payer: receipt.payer,
                payTo: expectedPayTo,
                amountRaw: expectedAmountRaw,
              },
              verifyTx
            );
            verification = vRes.verification;
            verifiedAt = vRes.verifiedAt;
            verifyDetail = vRes.verifyDetail;
          } else {
            verification = "unverified";
          }

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
            verifiedAt,
            verifyDetail,
            payTo: expectedPayTo,
            asset: expectedUsdc,
            amountRaw: expectedAmountRaw?.toString(),
            payer: receipt.payer,
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
          verification,
        };
      } catch (askErr) {
        await releaseBudget(db, systemAgentId, period, reservedAmount);
        console.error(`[Sampler] Failed to sample miner ${miner.id} for intent ${intent}:`, askErr);
        return null;
      }
    });

    const results = await Promise.all(samplePromises);
    const dailyCapReached = results.some((r: any) => r?.dailyCapReached === true);

    // Only compute disagreement on confirmed, valid usable answers
    const collected = results.filter(
      (r): r is NonNullable<typeof r> =>
        r !== null &&
        !("dailyCapReached" in r) &&
        r.outcomeState === "paid" &&
        r.valueNorm !== null &&
        r.verification === "confirmed"
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

    return { samplesCount: collected.length, noiseMeasurement, dailyCapReached };
  } finally {
    // Release Lock
    await db.collection("sampler_locks").deleteOne({ lockKey });
  }
}
