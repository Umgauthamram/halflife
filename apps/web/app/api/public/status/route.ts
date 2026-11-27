import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/mongodb";
import { buildMerkleTree, hashLeaf } from "@half-life/shared";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDb();
    const nowMs = Date.now();

    // 1. Fetch Sampler Heartbeat & Status
    const heartbeatDoc = await db.collection("sampler_heartbeat").findOne({ id: "worker_heartbeat" });
    const lastLoopAt = heartbeatDoc?.lastLoopAt ? new Date(heartbeatDoc.lastLoopAt) : null;
    const lastSuccessAt = heartbeatDoc?.lastSuccessAt ? new Date(heartbeatDoc.lastSuccessAt) : null;

    const envIntervalMs = parseInt(process.env.SAMPLER_INTERVAL_MS || "600000", 10);
    const samplerIntervalMs =
      typeof heartbeatDoc?.samplerIntervalMs === "number"
        ? heartbeatDoc.samplerIntervalMs
        : !isNaN(envIntervalMs) && envIntervalMs >= 30000
        ? envIntervalMs
        : 600000;
    const samplerIntervalSeconds = Math.round(samplerIntervalMs / 1000);

    // Heartbeat considered healthy if last loop was within 3x interval (min 180s)
    const freshThresholdMs = Math.max(180_000, samplerIntervalMs * 3);
    const isFresh = lastLoopAt ? nowMs - lastLoopAt.getTime() < freshThresholdMs : false;
    const isRunning = Boolean(isFresh && heartbeatDoc?.paused !== true);

    // 2. Sample Counts (Live vs Quarantine)
    const liveSamplesCount = await db
      .collection("atlas_samples")
      .countDocuments({ source: "live" });

    const quarantinedSamplesCount = await db
      .collection("atlas_samples_quarantine")
      .countDocuments({})
      .catch(() => 0);

    const latestLiveSample = await db
      .collection("atlas_samples")
      .findOne({ source: "live" }, { sort: { ts: -1 } });

    const lastSampleAt = latestLiveSample?.ts ? new Date(latestLiveSample.ts).toISOString() : null;
    const secondsSinceLastSample = latestLiveSample?.ts
      ? Math.floor((nowMs - new Date(latestLiveSample.ts).getTime()) / 1000)
      : null;

    // 3. Last Verified Settlement Transaction
    const latestConfirmedPurchase = await db.collection("purchases").findOne(
      { verification: "confirmed", source: "live" },
      { sort: { verifiedAt: -1, createdAt: -1 } }
    );

    const lastVerifiedTx = latestConfirmedPurchase
      ? {
          txHash: latestConfirmedPurchase.txHash,
          blockNumber: latestConfirmedPurchase.verifyDetail || undefined,
          verifiedAt: latestConfirmedPurchase.verifiedAt,
        }
      : null;

    // 4. Calibrated Intents
    const calibratedDocs = await db
      .collection("atlas_stats")
      .find({ calibrated: true })
      .toArray();
    const calibratedIntents = calibratedDocs.map((d) => d.intent);

    // 5. Compute Daily Spend (today UTC)
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const todaySamples = await db
      .collection("atlas_samples")
      .find({ ts: { $gte: todayStart }, source: "live" })
      .toArray();

    const dailySpendUsdc = todaySamples.reduce(
      (sum, s) => sum + (typeof s.priceUsdc === "number" ? s.priceUsdc : 0),
      0
    );

    // 6. Compute Merkle Root for Live Samples
    const recentLiveSamples = await db
      .collection("atlas_samples")
      .find({ source: "live" })
      .sort({ ts: -1 })
      .limit(50)
      .toArray();

    const leafHashes = recentLiveSamples.map((s) =>
      hashLeaf(`${s.intent}:${s.minerId}:${s.valueNorm}:${s.rawAnswerHash}:${s.txHash}`)
    );
    const { root: merkleRoot } = buildMerkleTree(leafHashes);

    const dailyCapUsdc = parseFloat(process.env.SAMPLER_DAILY_CAP_USDC || "10.0");

    return NextResponse.json(
      {
        service: "half-life-atlas",
        status: isRunning ? "operational" : "degraded",
        network: "Ethereum Sepolia (Chain ID: 11155111)",
        contract: process.env.TELEGRAPH_CONTRACT || "0x3624EB012B5E998BB57B6bE6C9Cfc9c4bc5eb99b",
        sampler: {
          running: isRunning,
          paused: Boolean(heartbeatDoc?.paused),
          pauseReason: heartbeatDoc?.pauseReason || null,
          samplerIntervalSeconds,
          lastLoopAt: lastLoopAt?.toISOString() || null,
          lastSuccessAt: lastSuccessAt?.toISOString() || null,
          lastSampleAt,
          secondsSinceLastSample,
          consecutiveFailures: heartbeatDoc?.consecutiveFailures ?? 0,
          liveSamples: liveSamplesCount,
          quarantinedSamples: quarantinedSamplesCount,
          spentTodayUsdc: Number(dailySpendUsdc.toFixed(4)),
          dailySpendUsdc: Number(dailySpendUsdc.toFixed(4)),
          dailyCapUsdc,
        },
        calibratedIntents,
        lastVerifiedTx,
        merkleRoot: liveSamplesCount > 0 ? merkleRoot : null,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
