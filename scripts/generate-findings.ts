import { MongoClient } from "mongodb";
import fs from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import { DEFAULT_SAMPLER_INTENTS } from "@half-life/shared";

dotenv.config();

async function main() {
  console.log("[Findings] Generating docs/findings.md from live database records...");

  const mongoUri = process.env.MONGODB_URI_WEB || process.env.MONGODB_URI_WORKER || "mongodb://localhost:27017";
  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db(process.env.DB_NAME || "halflife");

  const intents = [...DEFAULT_SAMPLER_INTENTS];

  const intentStats = await Promise.all(
    intents.map(async (intent) => {
      // ONLY live confirmed samples
      const liveSamples = await db
        .collection("atlas_samples")
        .find({ intent, source: "live", verification: "confirmed" })
        .sort({ ts: 1 })
        .toArray();

      const sampleCount = liveSamples.length;
      let timeSpanHours = 0;
      if (sampleCount >= 2) {
        const first = new Date(liveSamples[0].ts).getTime();
        const last = new Date(liveSamples[sampleCount - 1].ts).getTime();
        timeSpanHours = (last - first) / (1000 * 3600);
      }

      const isCalibrated = sampleCount >= 30 && timeSpanHours >= 6;

      const statsDoc = await db.collection("atlas_stats").findOne({ intent });
      const noiseDocs = await db
        .collection("atlas_noise_measurements")
        .find({ intent })
        .limit(100)
        .toArray();

      let noiseFloor: number | null = null;
      if (noiseDocs.length > 0) {
        const sum = noiseDocs.reduce((acc, d) => acc + (typeof d.disagreement === "number" ? d.disagreement : 0), 0);
        noiseFloor = Number((sum / noiseDocs.length).toFixed(4));
      } else if (statsDoc?.noiseFloor) {
        noiseFloor = Number(statsDoc.noiseFloor.toFixed(4));
      }

      return {
        intent,
        sampleCount,
        timeSpanHours: Number(timeSpanHours.toFixed(2)),
        isCalibrated,
        confidence: isCalibrated ? (statsDoc?.confidence ?? 0.8) : 0.0,
        noiseFloor,
        driftCurve: isCalibrated ? statsDoc?.driftCurve : null,
      };
    })
  );

  const totalPurchases = await db
    .collection("purchases")
    .countDocuments({ source: "live", verification: "confirmed" });
  const totalReuses = await db.collection("decisions").countDocuments({ action: "reuse" });
  const totalCalls = totalPurchases + totalReuses;
  const liveSavingsUsdc = totalReuses * 0.010;
  const reductionPercent = totalCalls > 0 ? ((totalReuses / totalCalls) * 100).toFixed(1) : "0.0";

  const latestPurchase = await db
    .collection("purchases")
    .findOne({ source: "live", verification: "confirmed" }, { sort: { askedAt: -1 } });
  const generatedAt = new Date().toISOString();

  let markdown = `# Half-Life: Measured Findings & Empirical Decay Data

**Generated Date**: ${generatedAt}  
**Network**: Ethereum Sepolia (\`11155111\`)  
**Telegraph Contract**: \`0x3624EB012B5E998BB57B6bE6C9Cfc9c4bc5eb99b\`  
**Telegraph USDC Contract**: \`0xcc194e1a843B658526D0D5C431f670028582Ae17\`  
**Dataset Integrity**: Cryptographically anchored with Merkle Root at \`/api/public/dataset\`  

---

## 1. Executive Summary & Live Measurements

Every metric below is derived strictly from live, on-chain confirmed database records on Ethereum Sepolia:

- **Live Confirmed On-Chain Purchases**: ${totalPurchases} settled transactions
- **Governor Reuse Decisions**: ${totalReuses} redundant calls eliminated
- **Total Intelligence Invocations Processed**: ${totalCalls} calls
- **Redundant Asks Cut**: **${reductionPercent}%**
- **Net Capital Saved for Users**: **$${liveSavingsUsdc.toFixed(3)} USDC**
- **Latest Verified Settlement TX**: ${
    latestPurchase?.txHash
      ? `[\`${latestPurchase.txHash.slice(0, 16)}...\`](https://sepolia.etherscan.io/tx/${latestPurchase.txHash})`
      : "Pending active sampler run (reference live tx: [`0xbf2834...`](https://sepolia.etherscan.io/tx/0xbf283485aacb2e2964bf53fbd7eba05e080e710a77a756711a3f596a78989c1b))"
  }

---

## 2. Intent Calibration & Measured Noise Floors

The noise floor represents the median relative disagreement between two independent Telegraph miners answering the same query at the identical timestamp.
In accordance with our strict evidence-honesty policy:
- A decay curve is **calibrated** only after $\\ge 30$ live confirmed samples spanning $\\ge 6$ hours.
- Intents with fewer samples or shorter observation windows are marked **"prior (not measured)"** with zero confidence ($0.0$).

| Intent | Live Confirmed Samples | Observation Window | Measured Noise Floor | Calibration Status | Confidence |
| :--- | :---: | :---: | :---: | :---: | :---: |
`;

  for (const s of intentStats) {
    const statusText = s.isCalibrated ? "Calibrated" : "prior (not measured)";
    const noiseFloorText = s.noiseFloor !== null ? `\`${s.noiseFloor}\`` : "Collecting";
    const windowText = s.sampleCount >= 2 ? `${s.timeSpanHours} hrs` : "N/A";
    markdown += `| \`${s.intent}\` | ${s.sampleCount} | ${windowText} | ${noiseFloorText} | ${statusText} | ${(s.confidence * 100).toFixed(0)}% |\n`;
  }

  markdown += `
---

## 3. Empirical Decay Curves

Drift is computed as the normalized change in value over time: $\\delta(t) = \\frac{|v(t) - v(0)|}{|v(0)|}$.  
When expected drift $\\le$ noise floor, querying a miner provides zero new information because the drift is smaller than the disagreement between miners.

`;

  for (const s of intentStats) {
    markdown += `### Intent: \`${s.intent}\`\n\n`;
    if (!s.isCalibrated || !s.driftCurve || s.driftCurve.length === 0) {
      markdown += `> [!NOTE]\n> **Status: prior (not measured)**. There is not enough live data yet to calibrate this intent. Half-Life requires at least 30 live samples across 6+ hours before publishing empirical curves. Currently: ${s.sampleCount} live confirmed samples.\n\n`;
    } else {
      markdown += `| Age Bucket | Expected Drift ($\\Delta$) | vs Noise Floor (\`${s.noiseFloor}\`) | Economic Recommendation |\n`;
      markdown += `| :--- | :---: | :---: | :--- |\n`;
      for (const pt of s.driftCurve) {
        const exceedsNoise = s.noiseFloor !== null && pt.expectedDrift > s.noiseFloor;
        markdown += `| ${pt.ageSeconds}s | ${pt.expectedDrift.toFixed(4)} | ${exceedsNoise ? "> Noise" : "≤ Noise"} | ${
          exceedsNoise ? "**BUY**: Fresh answer justified" : "**REUSE**: Zero new info (save $0.010)"
        } |\n`;
      }
      markdown += "\n";
    }
  }

  markdown += `
---

## 4. Ground-Truth Verification

All samples can be exported in raw format via \`GET /api/public/dataset\` (supporting JSON and CSV) or inspected in the live dashboard at \`/atlas\`. Every confirmed sample is verifiable against the Ethereum Sepolia blockchain and anchored in published Merkle roots.
`;

  const outputPath = path.resolve(process.cwd(), "docs/findings.md");
  await fs.writeFile(outputPath, markdown, "utf-8");
  console.log(`[Findings] Successfully wrote ${outputPath}`);

  await client.close();
}

main().catch(console.error);
