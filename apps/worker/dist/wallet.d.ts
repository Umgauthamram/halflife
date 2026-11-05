import { privateKeyToAccount } from "viem/accounts";
import { type Db } from "mongodb";
import { type GuardTransactionParams, type ChainGuardConfig } from "@half-life/chain";
export interface GeneratedWallet {
    address: `0x${string}`;
    keyRef: string;
}
/**
 * Generates an Ethereum keypair on Sepolia, encrypts it with envelope encryption,
 * stores the ciphertext in `wallet_keys`, and returns only the public address and key reference.
 */
export declare function createAgentWallet(db: Db, agentId: string, masterKeyBase64: string): Promise<GeneratedWallet>;
/**
 * Retrieves the encrypted wallet key, performs safety chain guard checks,
 * decrypts the key in the worker's secure memory boundary, and signs the payload.
 */
export declare function signWithAgentWallet(db: Db, agentId: string, guardParams: GuardTransactionParams, guardConfig: ChainGuardConfig, masterKeyBase64: string): Promise<{
    account: ReturnType<typeof privateKeyToAccount>;
}>;
//# sourceMappingURL=wallet.d.ts.map