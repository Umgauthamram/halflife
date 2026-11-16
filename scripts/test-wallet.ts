import { createPublicClient, http, formatEther, formatUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import * as dotenv from "dotenv";

dotenv.config();

const rawPk = process.env.metamask_private_key || "";
const pk = (rawPk.startsWith("0x") ? rawPk : `0x${rawPk}`) as `0x${string}`;

const account = privateKeyToAccount(pk);
console.log("Wallet Address:", account.address);

const rpcUrl = process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org";
const client = createPublicClient({
  chain: sepolia,
  transport: http(rpcUrl),
});

async function main() {
  const balance = await client.getBalance({ address: account.address });
  console.log("Sepolia ETH Balance:", formatEther(balance), "ETH");

  // Check USDC balance on 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238 and 0xcc194e1a843B658526D0D5C431f670028582Ae17
  const erc20Abi = [
    {
      name: "balanceOf",
      type: "function",
      stateMutability: "view",
      inputs: [{ name: "account", type: "address" }],
      outputs: [{ name: "balance", type: "uint256" }],
    },
  ] as const;

  for (const usdcAddr of [
    "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    "0xcc194e1a843B658526D0D5C431f670028582Ae17",
  ] as const) {
    try {
      const usdcBal = await client.readContract({
        address: usdcAddr,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [account.address],
      });
      console.log(`USDC (${usdcAddr}) Balance:`, formatUnits(usdcBal, 6), "USDC");
    } catch (e: any) {
      console.log(`USDC (${usdcAddr}) Error:`, e.message);
    }
  }
}

main().catch(console.error);
