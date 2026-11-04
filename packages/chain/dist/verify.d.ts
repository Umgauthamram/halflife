import { type Hash, type PublicClient } from "viem";
export interface VerificationResult {
    verified: boolean;
    status: "confirmed" | "failed" | "pending";
    blockNumber?: bigint;
    actualTo?: string;
    detail: string;
}
export declare function createSepoliaClient(rpcUrl: string): PublicClient;
/**
 * Reads settlement transaction from Sepolia and confirms that:
 * 1. Transaction exists and has a receipt
 * 2. Receipt status is 'success'
 * 3. Destination matches expected contract address
 */
export declare function verifySettlementTx(client: PublicClient, txHash: Hash, expectedContractAddress: string): Promise<VerificationResult>;
//# sourceMappingURL=verify.d.ts.map