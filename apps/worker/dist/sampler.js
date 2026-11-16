import crypto from "node:crypto";
import { reserveBudget, releaseBudget } from "./budget.js";
import { updateDecayEstimates } from "./decay-estimator.js";
/**
 * Extracts a normalized numeric or string value from an intent's answer.
 */
export function normalizeAnswerValue(intent, answer) {
    let val = 0;
    if (!answer) {
        val = 0;
    }
    else if (intent.startsWith("FX_NOW")) {
        if (typeof answer.rate === "number")
            val = answer.rate;
        else if (typeof answer.rates?.USD === "number")
            val = answer.rates.USD;
        else if (typeof answer.rates?.EUR === "number")
            val = answer.rates.EUR;
        else if (typeof answer.value === "number")
            val = answer.value;
        else if (typeof answer === "number")
            val = answer;
        else
            val = JSON.stringify(answer);
    }
    else if (intent.startsWith("WEATHER")) {
        if (typeof answer.temperatureC === "number")
            val = answer.temperatureC;
        else if (typeof answer.temperature === "number")
            val = answer.temperature;
        else if (typeof answer.temp === "number")
            val = answer.temp;
        else if (typeof answer.value === "number")
            val = answer.value;
        else
            val = JSON.stringify(answer);
    }
    else if (intent.startsWith("SANCTIONS")) {
        if (typeof answer.matchScore === "number")
            val = answer.matchScore;
        else if (typeof answer.score === "number")
            val = answer.score;
        else if (typeof answer.match === "boolean")
            val = answer.match ? 1 : 0;
        else if (typeof answer.value === "number")
            val = answer.value;
        else
            val = JSON.stringify(answer);
    }
    else {
        if (typeof answer.value === "number" || typeof answer.value === "string")
            val = answer.value;
        else
            val = JSON.stringify(answer);
    }
    const hash = crypto.createHash("sha256").update(JSON.stringify(answer ?? "")).digest("hex");
    return { valueNorm: val, hash };
}
/**
 * Executes a single sampling round for a given intent:
 * 1. Claims distributed lock in MongoDB to prevent concurrent worker runs.
 * 2. Checks top miners available.
 * 3. Purchases from top 2 named miners concurrently to measure instantaneous disagreement (noise floor).
 * 4. Records samples and ledger purchases with verification and outcomeState.
 * 5. Updates empirical decay estimates in atlas_stats.
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
        if (intent.startsWith("FX_NOW"))
            params = { currency: "EUR" };
        else if (intent.startsWith("WEATHER"))
            params = { location: "London" };
        else if (intent.startsWith("SANCTIONS"))
            params = { entity: "Acme International" };
        const minersToSample = miners.slice(0, 2);
        // 2. Sample named miners concurrently
        const samplePromises = minersToSample.map(async (miner) => {
            const { period, reservedAmount } = await reserveBudget(db, systemAgentId, miner.priceUsdc, samplerPolicy);
            try {
                const requestId = `sample_${intent}_${miner.id}_${now.getTime()}`;
                const receipt = await client.ask({
                    intent,
                    params,
                    minerId: miner.id,
                    maxPriceUsdc: samplerPolicy.perAskCapUsdc,
                    paymentMode: "x402",
                    requestId,
                });
                const { valueNorm, hash } = normalizeAnswerValue(intent, receipt.answer);
                const outcomeState = receipt.outcome || (receipt.txHash ? "paid" : "failed");
                // Record in atlas_samples
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
                    outcomeState,
                });
                return {
                    minerId: miner.id,
                    price: receipt.priceUsdc,
                    answer: receipt.answer,
                    txHash: receipt.txHash,
                    receiptHash: receipt.receiptHash,
                    signalHash: receipt.signalHash,
                    outcomeState,
                };
            }
            catch (askErr) {
                // Release reservation on failure
                await releaseBudget(db, systemAgentId, period, reservedAmount);
                console.error(`[Sampler] Failed to sample miner ${miner.id} for intent ${intent}:`, askErr);
                return null;
            }
        });
        const results = await Promise.all(samplePromises);
        const collected = results.filter((r) => r !== null && r.outcomeState === "paid");
        // 3. Compute instantaneous noise floor if 2 distinct miners succeeded
        let noiseMeasurement;
        if (collected.length >= 2) {
            const v1 = normalizeAnswerValue(intent, collected[0].answer).valueNorm;
            const v2 = normalizeAnswerValue(intent, collected[1].answer).valueNorm;
            let disagreement = 0;
            if (typeof v1 === "number" && typeof v2 === "number") {
                const avg = (Math.abs(v1) + Math.abs(v2)) / 2 || 1;
                disagreement = Math.abs(v1 - v2) / avg;
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
        // 4. Update empirical decay estimates in atlas_stats
        await updateDecayEstimates(db, intent).catch((err) => {
            console.warn(`[Sampler] Could not update decay estimates for ${intent}:`, err);
        });
        return { samplesCount: collected.length, noiseMeasurement };
    }
    finally {
        // Release Lock
        await db.collection("sampler_locks").deleteOne({ lockKey });
    }
}
//# sourceMappingURL=sampler.js.map