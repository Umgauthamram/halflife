import { MockTelegraphClient } from "./mock.js";
import { LiveTelegraphClient } from "./live.js";
import type { TelegraphClient } from "./client.js";

export function createTelegraphClient(): TelegraphClient {
  const mode = process.env.TELEGRAPH_MODE?.toLowerCase();

  if (mode === "mock") {
    return new MockTelegraphClient();
  }

  const rawPk = process.env.metamask_private_key || process.env.OPERATOR_PRIVATE_KEY || "";
  const pk = (rawPk.startsWith("0x") ? rawPk : `0x${rawPk}`) as `0x${string}`;

  if (!pk || pk === "0x") {
    // If running in an environment without wallet keys (e.g. CI or mock testing), fallback to Mock
    console.warn("[Telegraph] No private key provided; falling back to MockTelegraphClient");
    return new MockTelegraphClient();
  }

  return new LiveTelegraphClient({
    nodeUrl: process.env.TELEGRAPH_NODE_URL || "http://13.237.89.59:7148",
    privateKey: pk,
    rpcUrl: process.env.SEPOLIA_RPC_URL,
    telegraphContract: process.env.TELEGRAPH_CONTRACT,
    usdcContract: process.env.USDC_ADDRESS || "0xcc194e1a843B658526D0D5C431f670028582Ae17",
  });
}
