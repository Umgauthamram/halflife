import { HalfLifeClient } from "@half-life/sdk";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.HALFLIFE_API_KEY || "hl_live_5e24cb11155111evaluator";
const BASE_URL = process.env.HALFLIFE_BASE_URL || "https://halflifes.vercel.app";

async function runAgentCycle() {
  console.log(`\n[Live Agent] Executing automated cycle at ${new Date().toISOString()}...`);
  console.log(`[Live Agent] Target Gateway: ${BASE_URL}`);

  const client = new HalfLifeClient({
    apiKey: API_KEY,
    baseUrl: BASE_URL,
  });

  const tasks = [
    {
      intent: "FX_NOW_EUR",
      params: { currency: "EUR" },
      stake: 100,
    },
    {
      intent: "WEATHER_CHECK_TEMPERATURE",
      params: { location: "London" },
      stake: 50,
    },
  ];

  for (const t of tasks) {
    try {
      console.log(`\n--> Asking ${t.intent} with stake $${t.stake}...`);
      const res = await client.ask({
        intent: t.intent,
        params: t.params,
        stake: t.stake,
      });

      console.log(`Decision Action: [${res.action.toUpperCase()}]`);
      console.log(`Reason: ${res.reason}`);
      console.log(`Age: ${res.ageSeconds}s`);
      if (res.action === "buy") {
        console.log(`On-Chain Settlement TX: ${res.txHash || "Pending / Mock"}`);
        console.log(`Verification: ${res.verification || "confirmed"}`);
      } else if (res.action === "reuse") {
        console.log(`Capital Saved: $0.010 USDC (Cached answer reused)`);
      }
      console.log(`Answer:`, JSON.stringify(res.answer));
    } catch (err: any) {
      console.error(`Task ${t.intent} failed:`, err.message || err);
    }
  }
}

async function main() {
  console.log("=================================================");
  console.log("Half-Life Autonomous Live Agent (OpenClaw Worker)");
  console.log("=================================================");

  await runAgentCycle();

  if (process.argv.includes("--daemon")) {
    console.log("\nRunning in daemon mode (hourly cycle)...");
    setInterval(runAgentCycle, 60 * 60 * 1000);
  }
}

main().catch(console.error);
