import { createPublicClient, getAddress, http, type Hash, type PublicClient } from "viem";
import { sepolia } from "viem/chains";

export interface VerificationResult {
  verified: boolean;
  status: "confirmed" | "failed" | "pending";
  blockNumber?: bigint;
  actualTo?: string;
  detail: string;
}

export function createSepoliaClient(rpcUrl: string): PublicClient {
  return createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl),
  });
}

/**
 * Reads settlement transaction from Sepolia and confirms that:
 * 1. Transaction exists and has a receipt
 * 2. Receipt status is 'success'
 * 3. Destination matches expected contract address
 */
export async function verifySettlementTx(
  client: PublicClient,
  txHash: Hash,
  expectedContractAddress: string
): Promise<VerificationResult> {
  try {
    const tx = await client.getTransaction({ hash: txHash });
    if (!tx) {
      return {
        verified: false,
        status: "pending",
        detail: "Transaction not yet indexed in mempool or block",
      };
    }

    const receipt = await client.getTransactionReceipt({ hash: txHash });
    if (!receipt) {
      return {
        verified: false,
        status: "pending",
        detail: "Transaction mined or pending, receipt not yet available",
      };
    }

    if (receipt.status === "reverted") {
      return {
        verified: false,
        status: "failed",
        blockNumber: receipt.blockNumber,
        detail: "Transaction was reverted on-chain",
      };
    }

    const expectedTo = getAddress(expectedContractAddress);
    const actualTo = tx.to ? getAddress(tx.to) : undefined;

    if (actualTo !== expectedTo) {
      return {
        verified: false,
        status: "failed",
        blockNumber: receipt.blockNumber,
        actualTo,
        detail: `Recipient mismatch: expected ${expectedTo}, got ${actualTo}`,
      };
    }

    return {
      verified: true,
      status: "confirmed",
      blockNumber: receipt.blockNumber,
      actualTo,
      detail: `Verified on Sepolia block ${receipt.blockNumber.toString()}`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      verified: false,
      status: "failed",
      detail: `Verification check error: ${message}`,
    };
  }
}

