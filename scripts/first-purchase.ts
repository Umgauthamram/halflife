import * as dotenv from "dotenv";
import { LiveTelegraphClient } from "../packages/telegraph/src/live";

dotenv.config();

const rawPk = process.env.metamask_private_key || "";
const pk = (rawPk.startsWith("0x") ? rawPk : `0x${rawPk}`) as `0x${string}`;

if (!pk || pk === "0x") {
  console.error("Missing metamask_private_key in .env");
  process.exit(1);
}

const client = new LiveTelegraphClient({
  nodeUrl: process.env.TELEGRAPH_NODE_URL || "http://13.237.89.59:7148",
  privateKey: pk,
  rpcUrl: process.env.SEPOLIA_RPC_URL,
  telegraphContract: process.env.TELEGRAPH_CONTRACT,
  usdcContract: process.env.USDC_ADDRESS || "0xcc194e1a843B658526D0D5C431f670028582Ae17",
});

async function main() {
  console.log("=================================================");
  console.log("Half-Life: Executing First Live Telegraph Purchase");
  console.log("=================================================");

  console.log("\n[1/3] Discovering live miners for FX_NOW_EUR...");
  const miners = await client.listMiners("FX_NOW_EUR");
  console.log(`Found ${miners.length} miners on live Telegraph node.`);
  const targetMiner = miners[0]?.id;
  console.log(`Target Miner ID: ${targetMiner || "auto-routed"}`);

  console.log("\n[2/3] Dispatching ask with x402 challenge & EIP-712 payment on Sepolia...");
  const receipt = await client.ask({
    intent: "FX_NOW_EUR",
    params: { currency: "EUR" },
    maxPriceUsdc: 0.05,
    paymentMode: "x402",
    requestId: `req_${Date.now()}`,
  });

  console.log("\n[3/3] Purchase Complete!");
  console.log("-------------------------------------------------");
  console.log("Intent:       ", "FX_NOW_EUR");
  console.log("Outcome:      ", receipt.outcome);
  console.log("Price (USDC): ", `$${receipt.priceUsdc.toFixed(3)}`);
  console.log("Miner:        ", `${receipt.minerName || "Miner"} (${receipt.minerId})`);
  console.log("TX Hash:      ", receipt.txHash);
  console.log("Receipt Hash: ", receipt.receiptHash);
  console.log("Signal Hash:  ", receipt.signalHash);
  console.log("Answer:       ", JSON.stringify(receipt.answer));
  console.log("Sepolia Link: ", `https://sepolia.etherscan.io/tx/${receipt.txHash}`);
  console.log("-------------------------------------------------");

  if (!receipt.txHash || !receipt.signalHash) {
    throw new Error("Missing txHash or signalHash in live receipt");
  }
}

main().catch((err) => {
  console.error("\nPurchase Failed:", err);
  process.exit(1);
});
