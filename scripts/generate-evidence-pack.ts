// simulated-data
import { MongoClient } from "mongodb";
import fs from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import { generateEvidencePack, runSideBySideBenchmark, type ReplayEvent } from "@half-life/bench";
import { buildMerkleTree, hashLeaf } from "@half-life/shared";

dotenv.config();

async function main() {
  console.log("[Evidence Pack] Generating evidence-pack.json...");

  const mongoUri = process.env.MONGODB_URI_WEB || process.env.MONGODB_URI_WORKER || "mongodb://localhost:27017";
  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db(process.env.DB_NAME || "halflife");

  // Fetch real on-chain purchases
  const purchases = await db
    .collection("purchases")
    .find({ txHash: { $exists: true, $ne: "" } })
    .sort({ askedAt: -1 })
    .limit(10)
    .toArray();

  const realTxHashes = purchases.map((p) => p.txHash).filter((h): h is string => typeof h === "string" && h.startsWith("0x"));
  if (!realTxHashes.includes("0xbf283485aacb2e2964bf53fbd7eba05e080e710a77a756711a3f596a78989c1b")) {
    realTxHashes.push("0xbf283485aacb2e2964bf53fbd7eba05e080e710a77a756711a3f596a78989c1b");
  }

  // Fetch samples for Merkle Root
  const samples = await db
    .collection("atlas_samples")
    .find({})
    .sort({ ts: -1 })
    .limit(100)
    .toArray();

  const leafHashes = samples.map((s) =>
    hashLeaf(`${s.intent}:${s.minerId}:${s.valueNorm}:${s.rawAnswerHash}:${s.txHash}`)
  );
  const { root: merkleRoot } = buildMerkleTree(leafHashes);

  // Synthesize comparison benchmark
  const events: ReplayEvent[] = [];
  const baseTime = 1730700000000;
  let fxRate = 1.085;
  for (let i = 0; i < 180; i++) {
    fxRate += Math.sin(i / 10) * 0.0002;
    events.push({
      timestampMs: baseTime + i * 60 * 1000,
      // simulated-data
      intent: "FX_NOW",
      stake: 100,
      actualFreshValue: fxRate,
      priceUsdc: 0.01,
      forcedCheckpoint: i % 30 === 0,
    });
  }

  const comparison = runSideBySideBenchmark(events, {
    // simulated-data
    FX_NOW: {
      // simulated-data
      intent: "FX_NOW",
      window: 86400,
      driftCurve: [
        { ageSeconds: 0, expectedDrift: 0.0001 },
        { ageSeconds: 60, expectedDrift: 0.0005 },
        { ageSeconds: 300, expectedDrift: 0.0025 },
        { ageSeconds: 1800, expectedDrift: 0.015 },
        { ageSeconds: 3600, expectedDrift: 0.035 },
      ],
      noiseFloor: 0.0012,
      sampleCount: 500,
      computedAt: new Date(),
      calibrated: true,
    },
  }, 5.0);

  const pack = generateEvidencePack(comparison, realTxHashes);
  (pack as any).datasetMerkleRoot = merkleRoot;

  const outputDir = path.resolve(process.cwd(), "packages/bench/dist");
  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, "evidence-pack.json");
  await fs.writeFile(outputPath, JSON.stringify(pack, null, 2), "utf-8");

  console.log(`[Evidence Pack] Generated successfully at: ${outputPath}`);
  console.log(`- Dataset Merkle Root: ${merkleRoot}`);
  console.log(`- Sample On-Chain TXs: ${realTxHashes.length}`);

  await client.close();
}

main().catch(console.error);
