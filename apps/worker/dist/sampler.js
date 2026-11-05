import crypto from "node:crypto";
import { reserveBudget, releaseBudget } from "./budget.js";
/**
 * Extracts a normalized numeric or string value from an intent's answer.
 */
export function normalizeAnswerValue(intent, answer) {
    let val = 0;
    if (intent === "FX_NOW" && typeof answer?.rate === "number") {
        val = answer.rate;
    }
    else if (intent === "WEATHER_FORECAST_VERIFY" && typeof answer?.temperatureC === "number") {
        val = answer.temperatureC;
    }
    else if (intent === "SANCTIONS_SCREENING_MATCH" && typeof answer?.matchScore === "number") {
        val = answer.matchScore;
    }
    else {
        val = JSON.stringify(answer);
    }
    const hash = crypto.createHash("sha256").update(JSON.stringify(answer)).digest("hex");
    return { valueNorm: val, hash };
}
/**
 * Executes a single sampling round for a given intent:
 * 1. Claims distributed lock in MongoDB to prevent concurrent worker runs.
 * 2. Checks top miners available.
 * 3. Purchases from top 2 miners to measure instantaneous disagreement (noise floor).
 * 4. Records samples and ledger purchases.
 */
export async function sampleIntent(db, client, intent, systemAgentId, samplerPolicy) {
    // 1. Acquire Distributed Lock with 2-minute TTL
    const lockKey = `sampler_${intent}`;
    const now = new Date();
    const lockExpire = new Date(now.getTime() + 2 * 60 * 1000);
    const lockRes = await db.collection("sampler_locks").findOneAndUpdate({
        lockKey,
        $or: [{ lockedUntil: { $lt: now } }, { lockedUntil: { $exists: false } }],
    }, {
        $set: { lockedUntil: lockExpire, lockedBy: process.pid.toString(), updatedAt: now },
    }, { upsert: true, returnDocument: "after" });
    if (!lockRes) {
        console.log(`[Sampler] Intent ${intent} is currently locked by another worker.`);
        return { samplesCount: 0 };
    }
    try {
        const miners = await client.listMiners(intent);
        if (miners.length === 0) {
            // Record gap
            await db.collection("atlas_gaps").insertOne({
                intent,
                reason: "NO_MINERS_AVAILABLE",
                ts: now,
            });
            return { samplesCount: 0 };
        }
        // Determine query params per intent
        let params = {};
        if (intent === "FX_NOW")
            params = { pair: "EUR/USD" };
        else if (intent === "WEATHER_FORECAST_VERIFY")
            params = { location: "London" };
        else if (intent === "SANCTIONS_SCREENING_MATCH")
            params = { entity: "Acme International" };
        const minersToSample = miners.slice(0, 2);
        const collected = [];
        for (const miner of minersToSample) {
            // Reserve budget
            const { period, reservedAmount } = await reserveBudget(db, systemAgentId, miner.priceUsdc, samplerPolicy);
            try {
                const requestId = `sample_${intent}_${miner.id}_${now.getTime()}`;
                const receipt = await client.ask({
                    intent,
                    params,
                    maxPriceUsdc: samplerPolicy.perAskCapUsdc,
                    paymentMode: "x402",
                    requestId,
                });
                collected.push({
                    minerId: miner.id,
                    price: receipt.priceUsdc,
                    answer: receipt.answer,
                    txHash: receipt.txHash,
                });
                const { valueNorm, hash } = normalizeAnswerValue(intent, receipt.answer);
                // Record in atlas_samples
                await db.collection("atlas_samples").insertOne({
                    ts: now,
                    intent,
                    paramsKey: JSON.stringify(params),
                    minerId: miner.id,
                    valueNorm,
                    rawAnswerHash: hash,
                    txHash: receipt.txHash,
                    priceUsdc: receipt.priceUsdc,
                });
            }
            catch (askErr) {
                // Release reservation on failure
                await releaseBudget(db, systemAgentId, period, reservedAmount);
                console.error(`[Sampler] Failed to sample miner ${miner.id} for intent ${intent}:`, askErr);
            }
        }
        // If 2 distinct miners were sampled, calculate instantaneous disagreement
        let noiseMeasurement;
        if (collected.length >= 2) {
            const v1 = normalizeAnswerValue(intent, collected[0].answer).valueNorm;
            const v2 = normalizeAnswerValue(intent, collected[1].answer).valueNorm;
            let disagreement = 0;
            if (typeof v1 === "number" && typeof v2 === "number") {
                disagreement = Math.abs(v1 - v2);
            }
            else {
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
        return { samplesCount: collected.length, noiseMeasurement };
    }
    finally {
        // Release Lock
        await db.collection("sampler_locks").deleteOne({ lockKey });
    }
}
//# sourceMappingURL=sampler.js.map