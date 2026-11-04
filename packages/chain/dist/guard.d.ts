export declare class ChainGuardError extends Error {
    code: string;
    constructor(code: string, message: string);
}
export declare const SEPOLIA_CHAIN_ID = 11155111;
export declare const MAX_UINT256: bigint;
export interface ChainGuardConfig {
    allowedChainId?: number;
    allowedDestinations: string[];
    allowedTokens: string[];
}
export interface GuardTransactionParams {
    chainId: number;
    to: string;
    value?: bigint;
    token?: string;
    tokenAmount?: bigint;
    requiredTokenAmount?: bigint;
}
/**
 * Validates that all criteria for signing a transaction are met before any key signs.
 * Enforces zero unlimited approvals and strict destination allowlists.
 */
export declare function guardTransaction(params: GuardTransactionParams, config: ChainGuardConfig): void;
//# sourceMappingURL=guard.d.ts.map