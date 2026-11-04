import { getAddress, isAddress } from "viem";
export class ChainGuardError extends Error {
    code;
    constructor(code, message) {
        super(`[ChainGuard:${code}] ${message}`);
        this.code = code;
        this.name = "ChainGuardError";
    }
}
export const SEPOLIA_CHAIN_ID = 11155111;
export const MAX_UINT256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
/**
 * Validates that all criteria for signing a transaction are met before any key signs.
 * Enforces zero unlimited approvals and strict destination allowlists.
 */
export function guardTransaction(params, config) {
    const targetChainId = config.allowedChainId ?? SEPOLIA_CHAIN_ID;
    // 1. Chain ID check
    if (params.chainId !== targetChainId) {
        throw new ChainGuardError("INVALID_CHAIN", `Expected chain ID ${targetChainId} (Sepolia), got ${params.chainId}`);
    }
    // 2. Destination address check
    if (!isAddress(params.to)) {
        throw new ChainGuardError("MALFORMED_DESTINATION", `Invalid recipient address: ${params.to}`);
    }
    const normalizedTo = getAddress(params.to);
    const normalizedAllowed = config.allowedDestinations.map((d) => getAddress(d));
    if (!normalizedAllowed.includes(normalizedTo)) {
        throw new ChainGuardError("DESTINATION_NOT_ALLOWLISTED", `Destination address ${normalizedTo} is not in the allowlist`);
    }
    // 3. Token check (if applicable)
    if (params.token) {
        if (!isAddress(params.token)) {
            throw new ChainGuardError("MALFORMED_TOKEN", `Invalid token address: ${params.token}`);
        }
        const normalizedToken = getAddress(params.token);
        const normalizedTokens = config.allowedTokens.map((t) => getAddress(t));
        if (!normalizedTokens.includes(normalizedToken)) {
            throw new ChainGuardError("TOKEN_NOT_ALLOWLISTED", `Token address ${normalizedToken} is not an authorized payment token`);
        }
    }
    // 4. Exact-amount approval check (Rejects unlimited token approvals)
    if (params.tokenAmount !== undefined) {
        if (params.tokenAmount === MAX_UINT256) {
            throw new ChainGuardError("UNLIMITED_APPROVAL_REJECTED", "Unlimited ERC20 approval (MAX_UINT256) is strictly prohibited by security policy");
        }
        if (params.requiredTokenAmount !== undefined && params.tokenAmount > params.requiredTokenAmount) {
            throw new ChainGuardError("EXCESS_APPROVAL_REJECTED", `Approval amount (${params.tokenAmount.toString()}) exceeds required price (${params.requiredTokenAmount.toString()})`);
        }
    }
}
//# sourceMappingURL=guard.js.map