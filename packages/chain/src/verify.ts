import {
  createPublicClient,
  decodeEventLog,
  getAddress,
  http,
  parseAbiItem,
  type Hash,
  type PublicClient,
} from "viem";
import { sepolia } from "viem/chains";

export interface ExpectedSettlement {
  usdc: string;
  payer?: string;
  payTo: string;
  amountRaw: bigint;
}

export interface VerificationResult {
  verified: boolean;
  status: "confirmed" | "failed" | "unverified";
  blockNumber?: bigint;
  gasUsed?: bigint;
  effectiveGasPrice?: bigint;
  detail: string;
  reason?: string;
}

export function createSepoliaClient(rpcUrl: string): PublicClient {
  return createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl),
  });
}

const transferAbiItem = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)"
);
const authUsedAbiItem = parseAbiItem(
  "event AuthorizationUsed(address indexed authorizer, bytes32 indexed nonce)"
);

/**
 * Reads settlement transaction from Sepolia and confirms that:
 * 1. Transaction receipt exists with status 'success'
 * 2. USDC contract emitted Transfer(from=payer, to=payTo, value=amountRaw)
 * 3. USDC contract emitted AuthorizationUsed(authorizer=payer, nonce)
 *
 * Never throws; returns structured failure object instead.
 */
export async function verifySettlementTx(
  client: PublicClient,
  txHash: Hash,
  expected: ExpectedSettlement | string
): Promise<VerificationResult> {
  try {
    const expectedSettlement: ExpectedSettlement =
      typeof expected === "string"
        ? {
            usdc: "0xcc194e1a843B658526D0D5C431f670028582Ae17",
            payTo: expected,
            amountRaw: 10000n,
          }
        : expected;

    const receipt = await client.getTransactionReceipt({ hash: txHash });
    if (!receipt) {
      return {
        verified: false,
        status: "unverified",
        detail: "Transaction receipt not yet available",
        reason: "Receipt not found",
      };
    }

    if (receipt.status === "reverted") {
      return {
        verified: false,
        status: "failed",
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        effectiveGasPrice: receipt.effectiveGasPrice,
        detail: "Transaction was reverted on-chain",
        reason: "Transaction reverted",
      };
    }

    if (receipt.status !== "success") {
      return {
        verified: false,
        status: "failed",
        blockNumber: receipt.blockNumber,
        detail: `Transaction status is '${receipt.status}'`,
        reason: `Unexpected receipt status: ${receipt.status}`,
      };
    }

    const expectedUsdc = getAddress(expectedSettlement.usdc);
    const expectedPayTo = getAddress(expectedSettlement.payTo);
    const expectedPayer = expectedSettlement.payer
      ? getAddress(expectedSettlement.payer)
      : undefined;

    const usdcLogs = receipt.logs.filter(
      (log) => getAddress(log.address) === expectedUsdc
    );

    let matchedTransfer: { from: string; to: string; value: bigint } | null = null;
    let matchedAuthorizer: string | null = null;

    for (const log of usdcLogs) {
      try {
        const decoded = decodeEventLog({
          abi: [transferAbiItem, authUsedAbiItem],
          data: log.data,
          topics: log.topics,
        });

        if (decoded.eventName === "Transfer") {
          const from = getAddress(decoded.args.from);
          const to = getAddress(decoded.args.to);
          const value = decoded.args.value;

          if (to === expectedPayTo && value === expectedSettlement.amountRaw) {
            if (!expectedPayer || from === expectedPayer) {
              matchedTransfer = { from, to, value };
            }
          }
        } else if (decoded.eventName === "AuthorizationUsed") {
          const authorizer = getAddress(decoded.args.authorizer);
          if (!expectedPayer || authorizer === expectedPayer) {
            matchedAuthorizer = authorizer;
          }
        }
      } catch {
        // Ignore logs that don't match the ABI
      }
    }

    if (!matchedTransfer) {
      return {
        verified: false,
        status: "failed",
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        effectiveGasPrice: receipt.effectiveGasPrice,
        detail: `No matching Transfer event found on USDC (${expectedSettlement.usdc}) to ${expectedSettlement.payTo} for ${expectedSettlement.amountRaw}`,
        reason: "USDC Transfer event missing or mismatched",
      };
    }

    if (!matchedAuthorizer) {
      return {
        verified: false,
        status: "failed",
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        effectiveGasPrice: receipt.effectiveGasPrice,
        detail: "No matching AuthorizationUsed event found on USDC contract",
        reason: "USDC AuthorizationUsed event missing",
      };
    }

    return {
      verified: true,
      status: "confirmed",
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
      effectiveGasPrice: receipt.effectiveGasPrice,
      detail: `Settlement confirmed on Sepolia block ${receipt.blockNumber.toString()}`,
    };
  } catch (err: unknown) {
    const reason = err instanceof Error ? err.message : String(err);
    return {
      verified: false,
      status: "unverified",
      detail: `Verification check RPC error: ${reason}`,
      reason,
    };
  }
}
