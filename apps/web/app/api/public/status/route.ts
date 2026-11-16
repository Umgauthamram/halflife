import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/mongodb";
import { buildMerkleTree, hashLeaf } from "@half-life/shared";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDb();

    // 1. Fetch Sampler Control & State
    const controlDoc = await db.collection("sampler_control").findOne({ id: "platform_sampler" });
    const isPaused = controlDoc?.status === "paused";

    // 2. Fetch Latest Sample
    const latestSample = await db.collection("atlas_samples").findOne({}, { sort: { ts: -1 } });
    const totalSamples = await db.collection("atlas_samples").countDocuments({});

    // 3. Compute Daily Spend (today UTC)
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const todaySamples = await db
      .collection("atlas_samples")
      .find({ ts: { $gte: todayStart } })
      .toArray();

    const dailySpendUsdc = todaySamples.reduce(
      (sum, s) => sum + (typeof s.priceUsdc === "number" ? s.priceUsdc : 0),
      0
    );

    // 4. Compute Merkle Root for Latest Samples
    const recentSamples = await db
      .collection("atlas_samples")
      .find({})
      .sort({ ts: -1 })
      .limit(50)
      .toArray();

    const leafHashes = recentSamples.map((s) =>
      hashLeaf(`${s.intent}:${s.minerId}:${s.valueNorm}:${s.rawAnswerHash}:${s.txHash}`)
    );
    const { root: merkleRoot } = buildMerkleTree(leafHashes);

    return NextResponse.json(
      {
        service: "half-life-atlas",
        status: isPaused ? "paused" : "operational",
        network: "Ethereum Sepolia (Chain ID: 11155111)",
        contract: process.env.TELEGRAPH_CONTRACT || "0x3624EB012B5E998BB57B6bE6C9Cfc9c4bc5eb99b",
        sampler: {
          running: !isPaused,
          lastSampleAt: latestSample?.ts ? new Date(latestSample.ts).toISOString() : null,
          totalSamples,
          dailySpendUsdc: Number(dailySpendUsdc.toFixed(4)),
          dailyCapUsdc: 10.0,
        },
        merkleRoot,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
