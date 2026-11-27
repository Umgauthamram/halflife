import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import * as dotenv from "dotenv";

dotenv.config();

const client = createPublicClient({
  chain: sepolia,
  transport: http(process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org"),
});

async function main() {
  for (const addr of [
    "0xcc194e1a843B658526D0D5C431f670028582Ae17",
    "0xcc194e1a843B658526D0D5C431f670028582Ae17",
  ] as const) {
    try {
      const code = await client.getBytecode({ address: addr });
      console.log(`${addr} has code:`, Boolean(code && code.length > 2));
    } catch (e: any) {
      console.log(e.message);
    }
  }
}

main().catch(console.error);
