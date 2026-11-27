import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const INTENT_MAP: Record<string, string> = {
  FX_NOW: "FX_NOW_EUR",
  WEATHER_FORECAST_VERIFY: "WEATHER_CHECK_TEMPERATURE",
  SANCTIONS_SCREENING_MATCH: "SANCTIONS_SCREENING_MATCH_GENERAL",
};

async function main() {
  const apply = process.argv.includes("--apply");
  console.log(`[Migrate Agent Intents] Mode: ${apply ? "APPLY (writing changes)" : "DRY RUN (read-only)"}`);

  const mongoUri = process.env.MONGODB_URI_WEB || process.env.MONGODB_URI_WORKER || "mongodb://localhost:27017";
  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db(process.env.DB_NAME || "halflife");

  const agents = await db.collection("agents").find({}).toArray();
  let agentsToUpdate = 0;

  for (const agent of agents) {
    const current: string[] = Array.isArray(agent.allowedIntents) ? agent.allowedIntents : [];
    const mapped = Array.from(new Set(current.map((i) => INTENT_MAP[i] || i)));
    const changed =
      mapped.length !== current.length || mapped.some((val, idx) => val !== current[idx]);

    if (changed) {
      agentsToUpdate += 1;
      console.log(`  Agent ${agent._id} (${agent.name}): ${JSON.stringify(current)} -> ${JSON.stringify(mapped)}`);
      if (apply) {
        await db.collection("agents").updateOne(
          { _id: agent._id },
          { $set: { allowedIntents: mapped, updatedAt: new Date() } }
        );
      }
    }
  }

  console.log(`\nTotal agents inspected: ${agents.length}`);
  console.log(`Agents requiring migration: ${agentsToUpdate}`);

  if (!apply) {
    console.log("\n[DRY RUN COMPLETE] No records were modified.");
    console.log("To apply these changes, run:");
    console.log("  pnpm exec tsx scripts/migrate-agent-intents.ts --apply");
  } else {
    console.log(`\n[APPLY COMPLETE] Updated ${agentsToUpdate} agent(s).`);
  }

  await client.close();
}

main().catch((err) => {
  console.error("[Migrate Agent Intents] Failed:", err);
  process.exit(1);
});
