import { createPublicClient, createWalletClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import * as dotenv from "dotenv";

dotenv.config();

const rawPk = process.env.metamask_private_key || "";
const pk = (rawPk.startsWith("0x") ? rawPk : `0x${rawPk}`) as `0x${string}`;
const account = privateKeyToAccount(pk);

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org"),
});

const walletClient = createWalletClient({
  account,
  chain: sepolia,
  transport: http(process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org"),
});

async function main() {
  console.log("Checking faucet/mint on 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238...");
  // Circle Sepolia USDC has a public test faucet or mint? Let's check functions
  for (const fn of [
    "function mint(address to, uint256 amount)",
    "function faucet()",
    "function drip()",
  ]) {
    try {
      await publicClient.simulateContract({
        address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
        abi: parseAbi([fn]),
        functionName: fn.split("(")[0].replace("function ", "") as any,
        args: fn.includes("address") ? [account.address, 100000000n] : ([] as any),
        account,
      });
      console.log(`Success on 0x1c7D: ${fn}`);
    } catch (e: any) {
      console.log(`0x1c7D ${fn} failed:`, e.shortMessage || e.message);
    }
  }

  console.log("Checking faucet/mint on 0xcc194e1a843B658526D0D5C431f670028582Ae17...");
  for (const fn of [
    "function mint(address to, uint256 amount)",
    "function faucet()",
    "function drip()",
  ]) {
    try {
      await publicClient.simulateContract({
        address: "0xcc194e1a843B658526D0D5C431f670028582Ae17",
        abi: parseAbi([fn]),
        functionName: fn.split("(")[0].replace("function ", "") as any,
        args: fn.includes("address") ? [account.address, 100000000n] : ([] as any),
        account,
      });
      console.log(`Success on 0xcc19: ${fn}`);
    } catch (e: any) {
      console.log(`0xcc19 ${fn} failed:`, e.shortMessage || e.message);
    }
  }
}

main().catch(console.error);
