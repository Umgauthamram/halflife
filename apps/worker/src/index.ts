import { validateEnv } from "@half-life/shared";
import { MongoClient } from "mongodb";
import { createTelegraphClient } from "@half-life/telegraph";
import { sampleIntent } from "./sampler.js";
import http from "node:http";
import dotenv from "dotenv";

dotenv.config();

const DEFAULT_INTENTS = ["FX_NOW_EUR", "WEATHER_CHECK_TEMPERATURE", "SANCTIONS_SCREENING_MATCH_GENERAL"];
const MINERS_PER_INTENT = 2;

async function main() {
  console.log("==========================================");
  console.log("Starting Half-Life Worker Service...");
  console.log("==========================================");

  let env;
  try {
    env = validateEnv(process.env);
    console.log(`[Worker] Running in ${env.NODE_ENV} mode`);
    console.log(`[Worker] Target Chain ID: ${env.CHAIN_ID} (Ethereum Sepolia)`);
    console.log(`[Worker] Telegraph Contract: ${env.TELEGRAPH_CONTRACT}`);
    console.log(`[Worker] Sampler Daily Cap: $${env.SAMPLER_DAILY_CAP_USDC} USDC`);
  } catch (err: unknown) {
    console.error("[Worker] Startup validation failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  }

  const samplerIntervalMs = env.SAMPLER_INTERVAL_MS;

  // 1. Connect to MongoDB
  const mongoUri = env.MONGODB_URI_WORKER || env.MONGODB_URI_WEB;
  if (!mongoUri) {
    console.error("[Worker] Missing MONGODB_URI_WORKER / MONGODB_URI_WEB");
    process.exit(1);
  }

  const mongoClient = new MongoClient(mongoUri);
  await mongoClient.connect();
  const db = mongoClient.db(env.DB_NAME || "halflife");
  console.log(`[Worker] Connected to MongoDB database: ${db.databaseName}`);

  // 2. Initialize Telegraph Client & Enforce Fail-Fast on Mock
  const telegraphClient = createTelegraphClient();
  if (telegraphClient.source === "mock" && process.env.ALLOW_MOCK_SAMPLER !== "1") {
    console.error(
      "FATAL: Half-Life Sampler Worker cannot run with Mock client. Live node credentials required. Set ALLOW_MOCK_SAMPLER=1 only for explicit isolated testing."
    );
    process.exit(1);
  }

  // 3. Configure Intents & Validate against Node
  const rawIntents = process.env.SAMPLER_INTENTS
    ? process.env.SAMPLER_INTENTS.split(",").map((s) => s.trim()).filter(Boolean)
    : DEFAULT_INTENTS;
  const configuredIntents = rawIntents.length > 0 ? rawIntents : DEFAULT_INTENTS;

  try {
    const nodeIntents = await telegraphClient.listIntents();
    for (const intent of configuredIntents) {
      if (!nodeIntents.includes(intent)) {
        console.warn(`[Worker Warning] Intent '${intent}' is not listed by Telegraph node.`);
      }
    }
  } catch (err: any) {
    console.warn(`[Worker Warning] Could not list intents from Telegraph node: ${err.message || String(err)}`);
  }

  const samplerPolicy = {
    perAskCapUsdc: 0.05,
    dailyCapUsdc: env.SAMPLER_DAILY_CAP_USDC ?? 10.0,
    stakeDefault: 100,
  };

  // Startup Cost Control Log
  const lastPriceSample = await db
    .collection("atlas_samples")
    .findOne({ source: "live", priceUsdc: { $type: "number" } }, { sort: { ts: -1 } });
  const lastKnownPrice =
    typeof lastPriceSample?.priceUsdc === "number" ? lastPriceSample.priceUsdc : null;
  const estimatedDailySpend =
    lastKnownPrice !== null
      ? `$${(
          configuredIntents.length *
          MINERS_PER_INTENT *
          (86_400_000 / samplerIntervalMs) *
          lastKnownPrice
        ).toFixed(4)} USDC`
      : "unknown";

  console.log(`[Worker] Configured Intents (${configuredIntents.length}): ${configuredIntents.join(", ")}`);
  console.log(`[Worker] Miners per Intent: ${MINERS_PER_INTENT}`);
  console.log(`[Worker] Sampler Interval: ${samplerIntervalMs}ms (${Math.round(samplerIntervalMs / 1000)}s)`);
  console.log(`[Worker] Estimated Daily Spend: ${estimatedDailySpend}`);

  let isRunning = true;
  let consecutiveFailures = 0;
  let lastSuccessAt: Date | null = null;
  let lastError: string | null = null;

  // 4. Continuous Sampling Loop & Heartbeat Maintenance
  async function runSamplingRound() {
    if (!isRunning) return;
    const now = new Date();

    try {
      // Check Admin Kill-Switch / Pause status
      const controlDoc = await db.collection("sampler_control").findOne({ id: "platform_sampler" });
      if (controlDoc?.status === "paused") {
        console.log("[Worker] Sampler is PAUSED by administrator. Skipping sampling cycle.");
        await db.collection("sampler_heartbeat").updateOne(
          { id: "worker_heartbeat" },
          {
            $set: {
              lastLoopAt: now,
              paused: true,
              runningIntents: configuredIntents,
              updatedAt: now,
            },
          },
          { upsert: true }
        );
        return;
      }

      let anySuccess = false;
      let dailyCapReached = false;
      for (const intent of configuredIntents) {
        console.log(`[Worker] Sampling intent: ${intent}...`);
        const result = await sampleIntent(db, telegraphClient, intent, "system_sampler", samplerPolicy);
        if (result.dailyCapReached) {
          dailyCapReached = true;
          console.warn("[Worker] Daily cap reached. Pausing sampler.");
          break;
        }
        if (result.samplesCount > 0) {
          console.log(`[Worker] Collected ${result.samplesCount} samples for ${intent}`);
          anySuccess = true;
        }
      }

      if (anySuccess) {
        lastSuccessAt = new Date();
        consecutiveFailures = 0;
        lastError = null;
      }

      await db.collection("sampler_heartbeat").updateOne(
        { id: "worker_heartbeat" },
        {
          $set: {
            lastLoopAt: now,
            lastSuccessAt,
            consecutiveFailures,
            lastError,
            runningIntents: configuredIntents,
            samplerIntervalMs,
            paused: dailyCapReached,
            pauseReason: dailyCapReached ? "daily_cap_reached" : null,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );
    } catch (err: any) {
      consecutiveFailures += 1;
      lastError = err.message || String(err);
      console.error("[Worker] Error in sampling round:", err);

      await db.collection("sampler_heartbeat").updateOne(
        { id: "worker_heartbeat" },
        {
          $set: {
            lastLoopAt: now,
            consecutiveFailures,
            lastError,
            runningIntents: configuredIntents,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );
    }
  }

  // Initial immediate run, then recurring
  runSamplingRound();
  const intervalId = setInterval(runSamplingRound, samplerIntervalMs);

  // 5. Optional HTTP Health Server
  const port = process.env.PORT || 10000;
  const server = http.createServer((req, res) => {
    if (req.url === "/health" || req.url === "/") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "healthy",
          service: "half-life-worker",
          uptime: process.uptime(),
          consecutiveFailures,
          lastSuccessAt,
          timestamp: new Date().toISOString(),
        })
      );
    } else {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
    }
  });

  server.listen(port, () => {
    console.log(`[Worker] Health server listening on port ${port}`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log("\n[Worker] Received shutdown signal. Exiting gracefully...");
    isRunning = false;
    clearInterval(intervalId);
    server.close();
    await mongoClient.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("[Worker] Fatal error:", err);
  process.exit(1);
});
