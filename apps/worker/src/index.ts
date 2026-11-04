import { validateEnv } from "@half-life/shared";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("==========================================");
  console.log("Starting Half-Life Worker Service...");
  console.log("==========================================");

  try {
    const env = validateEnv(process.env);
    console.log(`[Worker] Running in ${env.NODE_ENV} mode`);
    console.log(`[Worker] Target Chain ID: ${env.CHAIN_ID} (Ethereum Sepolia)`);
    console.log(`[Worker] Telegraph Contract: ${env.TELEGRAPH_CONTRACT}`);
    console.log(`[Worker] Sampler Daily Cap: $${env.SAMPLER_DAILY_CAP_USDC} USDC`);
  } catch (err: unknown) {
    console.error("[Worker] Startup validation failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  }

  // Graceful shutdown
  const shutdown = () => {
    console.log("\n[Worker] Received shutdown signal. Exiting gracefully...");
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("[Worker] Fatal error:", err);
  process.exit(1);
});

