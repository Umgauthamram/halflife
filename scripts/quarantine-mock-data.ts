import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const isApply = process.argv.includes("--apply");
  console.log(`[Quarantine] Mode: ${isApply ? "APPLY (modifying database)" : "DRY RUN (read-only)"}`);

  const mongoUri = process.env.MONGODB_URI_WEB || process.env.MONGODB_URI_WORKER || "mongodb://localhost:27017";
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db(process.env.DB_NAME || "halflife");

    const atlasSamplesCol = db.collection("atlas_samples");
    const atlasQuarantineCol = db.collection("atlas_samples_quarantine");
    const purchasesCol = db.collection("purchases");
    const purchasesQuarantineCol = db.collection("purchases_quarantine");
    const atlasStatsCol = db.collection("atlas_stats");

    // Before counts
    const beforeAtlasSamples = await atlasSamplesCol.countDocuments({});
    const beforeAtlasQuarantine = await atlasQuarantineCol.countDocuments({}).catch(() => 0);
    const beforePurchases = await purchasesCol.countDocuments({});
    const beforePurchasesQuarantine = await purchasesQuarantineCol.countDocuments({}).catch(() => 0);
    const beforeAtlasStats = await atlasStatsCol.countDocuments({});

    console.log("\n--- BEFORE COUNTS ---");
    console.log(`atlas_samples:             ${beforeAtlasSamples}`);
    console.log(`atlas_samples_quarantine:  ${beforeAtlasQuarantine}`);
    console.log(`purchases:                 ${beforePurchases}`);
    console.log(`purchases_quarantine:      ${beforePurchasesQuarantine}`);
    console.log(`atlas_stats:               ${beforeAtlasStats}`);

    // Filter criteria
    const atlasMockFilter = {
      $or: [
        { source: { $exists: false } },
        { source: { $ne: "live" } },
        { minerId: /^miner_/ },
      ],
    };

    const purchasesMockFilter = {
      $or: [
        { source: { $exists: false } },
        { source: { $ne: "live" } },
      ],
    };

    const atlasToQuarantineCount = await atlasSamplesCol.countDocuments(atlasMockFilter);
    const purchasesToQuarantineCount = await purchasesCol.countDocuments(purchasesMockFilter);

    console.log("\n--- RECORDS IDENTIFIED FOR QUARANTINE ---");
    console.log(`atlas_samples to quarantine: ${atlasToQuarantineCount}`);
    console.log(`purchases to quarantine:     ${purchasesToQuarantineCount}`);
    console.log(`atlas_stats to delete:       ${beforeAtlasStats}`);

    if (!isApply) {
      console.log("\n[DRY RUN COMPLETE] No records were modified or deleted.");
      console.log("To apply these changes, run:");
      console.log("  pnpm exec tsx scripts/quarantine-mock-data.ts --apply\n");
      return;
    }

    // Apply mode: Copy then delete
    if (atlasToQuarantineCount > 0) {
      const atlasMockCursor = atlasSamplesCol.find(atlasMockFilter);
      const docs = await atlasMockCursor.toArray();
      if (docs.length > 0) {
        await atlasQuarantineCol.insertMany(docs);
        const delRes = await atlasSamplesCol.deleteMany(atlasMockFilter);
        console.log(`[Quarantine] Moved ${delRes.deletedCount} records from atlas_samples to atlas_samples_quarantine.`);
      }
    }

    if (purchasesToQuarantineCount > 0) {
      const purchasesMockCursor = purchasesCol.find(purchasesMockFilter);
      const docs = await purchasesMockCursor.toArray();
      if (docs.length > 0) {
        await purchasesQuarantineCol.insertMany(docs);
        const delRes = await purchasesCol.deleteMany(purchasesMockFilter);
        console.log(`[Quarantine] Moved ${delRes.deletedCount} records from purchases to purchases_quarantine.`);
      }
    }

    if (beforeAtlasStats > 0) {
      const statsDel = await atlasStatsCol.deleteMany({});
      console.log(`[Quarantine] Deleted ${statsDel.deletedCount} records from atlas_stats for fresh live calculation.`);
    }

    // After counts
    const afterAtlasSamples = await atlasSamplesCol.countDocuments({});
    const afterAtlasQuarantine = await atlasQuarantineCol.countDocuments({});
    const afterPurchases = await purchasesCol.countDocuments({});
    const afterPurchasesQuarantine = await purchasesQuarantineCol.countDocuments({});
    const afterAtlasStats = await atlasStatsCol.countDocuments({});

    console.log("\n--- AFTER COUNTS ---");
    console.log(`atlas_samples:             ${afterAtlasSamples}`);
    console.log(`atlas_samples_quarantine:  ${afterAtlasQuarantine}`);
    console.log(`purchases:                 ${afterPurchases}`);
    console.log(`purchases_quarantine:      ${afterPurchasesQuarantine}`);
    console.log(`atlas_stats:               ${afterAtlasStats}`);
    console.log("\n[APPLY COMPLETE] Mock data successfully quarantined.\n");
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error("[Quarantine] Fatal error:", err);
  process.exit(1);
});
