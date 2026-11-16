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
  const usdcAddr = "0xcc194e1a843B658526D0D5C431f670028582Ae17";
  console.log(`Minting 100 USDC on ${usdcAddr} for ${account.address}...`);

  const txHash = await walletClient.writeContract({
    address: usdcAddr,
    abi: parseAbi(["function mint(address to, uint256 amount) returns (bool)"]),
    functionName: "mint",
    args: [account.address, 100_000_000n], // 100 USDC (6 decimals)
  });

  console.log("Mint Tx Hash:", txHash);
  console.log("Waiting for receipt...");
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  console.log("Status:", receipt.status, "Block:", receipt.blockNumber);
}

main().catch(console.error);
