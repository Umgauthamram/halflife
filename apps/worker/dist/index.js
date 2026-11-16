import { validateEnv } from "@half-life/shared";
import { MongoClient } from "mongodb";
import { createTelegraphClient } from "@half-life/telegraph";
import { sampleIntent } from "./sampler.js";
import http from "node:http";
import dotenv from "dotenv";
dotenv.config();
const INTENTS = ["FX_NOW_EUR", "WEATHER_CHECK_TEMPERATURE", "SANCTIONS_SCREENING_MATCH_GENERAL"];
const SAMPLER_INTERVAL_MS = 60 * 1000; // 60 seconds
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
    }
    catch (err) {
        console.error("[Worker] Startup validation failed:", err instanceof Error ? err.message : err);
        process.exit(1);
    }
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
    const telegraphClient = createTelegraphClient();
    const samplerPolicy = {
        perAskCapUsdc: 0.05,
        dailyCapUsdc: env.SAMPLER_DAILY_CAP_USDC ?? 10.0,
        stakeDefault: 100,
    };
    let isRunning = true;
    // 2. Continuous Sampling Loop
    async function runSamplingRound() {
        if (!isRunning)
            return;
        try {
            // Check Admin Kill-Switch / Pause status
            const controlDoc = await db.collection("sampler_control").findOne({ id: "platform_sampler" });
            if (controlDoc?.status === "paused") {
                console.log("[Worker] Sampler is PAUSED by administrator. Skipping sampling cycle.");
                return;
            }
            for (const intent of INTENTS) {
                console.log(`[Worker] Sampling intent: ${intent}...`);
                const result = await sampleIntent(db, telegraphClient, intent, "system_sampler", samplerPolicy);
                if (result.samplesCount > 0) {
                    console.log(`[Worker] Collected ${result.samplesCount} samples for ${intent}`);
                }
            }
        }
        catch (err) {
            console.error("[Worker] Error in sampling round:", err);
        }
    }
    // Initial immediate run, then recurring
    runSamplingRound();
    const intervalId = setInterval(runSamplingRound, SAMPLER_INTERVAL_MS);
    // 3. Optional HTTP Health Server (Allows deployment as Free Web Service or Worker on Render)
    const port = process.env.PORT || 10000;
    const server = http.createServer((req, res) => {
        if (req.url === "/health" || req.url === "/") {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
                status: "healthy",
                service: "half-life-worker",
                uptime: process.uptime(),
                timestamp: new Date().toISOString(),
            }));
        }
        else {
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
//# sourceMappingURL=index.js.map