import { createPublicClient, getAddress, http } from "viem";
import { sepolia } from "viem/chains";
export function createSepoliaClient(rpcUrl) {
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
export async function verifySettlementTx(client, txHash, expectedContractAddress) {
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
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
            verified: false,
            status: "failed",
            detail: `Verification check error: ${message}`,
        };
    }
}
//# sourceMappingURL=verify.js.map