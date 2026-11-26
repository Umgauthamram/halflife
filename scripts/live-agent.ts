import { HalfLifeClient } from "@half-life/sdk";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.HALFLIFE_API_KEY;
const BASE_URL = process.env.HALFLIFE_BASE_URL || "https://halflifes.vercel.app";
const AGENT_NAME = process.env.HALFLIFE_AGENT_NAME || "openclaw-worker";
const JSON_MODE = process.argv.includes("--json");

if (!API_KEY) {
  console.error("Error: HALFLIFE_API_KEY environment variable is required.");
  process.exit(1);
}

async function runAgentCycle() {
  if (!JSON_MODE) {
    console.log(`\n[Live Agent] Executing automated cycle at ${new Date().toISOString()}...`);
    console.log(`[Live Agent] Target Gateway: ${BASE_URL}`);
  }

  const client = new HalfLifeClient({
    apiKey: API_KEY!,
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
    const requestId = `${AGENT_NAME}_${t.intent}_${new Date().toISOString()}`;
    try {
      if (!JSON_MODE) {
        console.log(`\n--> Asking ${t.intent} with stake $${t.stake} (requestId: ${requestId})...`);
      }

      const start = performance.now();
      const res = await client.ask({
        intent: t.intent,
        params: t.params,
        stake: t.stake,
        requestId,
      });
      const elapsedMs = Math.round(performance.now() - start);
      const latencyMs = typeof res.latencyMs === "number" ? res.latencyMs : elapsedMs;

      if (JSON_MODE) {
        console.log(
          JSON.stringify({
            intent: t.intent,
            action: res.action,
            priceUsdc: res.priceUsdc ?? null,
            txHash: res.txHash ?? null,
            verification: res.verification ?? "unknown",
            latencyMs,
            requestId,
          })
        );
      } else {
        console.log(`Decision Action: [${res.action.toUpperCase()}]`);
        console.log(`Reason: ${res.reason}`);
        console.log(`Age: ${res.ageSeconds}s`);
        console.log(`Latency: ${latencyMs}ms`);
        if (res.action === "buy") {
          console.log(`On-Chain Settlement TX: ${res.txHash ?? "unknown"}`);
          console.log(`Verification: ${res.verification ?? "unknown"}`);
        } else if (res.action === "reuse") {
          const saved =
            typeof res.capitalSavedUsdc === "number"
              ? `$${res.capitalSavedUsdc.toFixed(3)} USDC`
              : "unknown";
          console.log(`Capital Saved: ${saved}`);
        }
        console.log(`Answer:`, JSON.stringify(res.answer));
      }
    } catch (err: any) {
      if (JSON_MODE) {
        console.log(
          JSON.stringify({
            intent: t.intent,
            action: "error",
            priceUsdc: null,
            txHash: null,
            verification: "unknown",
            latencyMs: null,
            requestId,
            error: err.message || String(err),
          })
        );
      } else {
        console.error(`Task ${t.intent} failed:`, err.message || err);
      }
    }
  }
}

async function main() {
  if (!JSON_MODE) {
    console.log("=================================================");
    console.log("Half-Life Autonomous Live Agent (OpenClaw Worker)");
    console.log("=================================================");
  }

  await runAgentCycle();

  if (process.argv.includes("--daemon")) {
    if (!JSON_MODE) {
      console.log("\nRunning in daemon mode (hourly cycle)...");
    }
    setInterval(runAgentCycle, 60 * 60 * 1000);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
