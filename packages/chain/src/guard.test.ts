import { describe, expect, it } from "vitest";
import {
  ChainGuardError,
  guardTransaction,
  MAX_UINT256,
  SEPOLIA_CHAIN_ID,
  type ChainGuardConfig,
} from "./guard.js";

describe("Chain Guard Security Controls", () => {
  const allowedTelegraph = "0x3624EB012B5E998BB57B6bE6C9Cfc9c4bc5eb99b";
  const allowedUSDC = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

  const config: ChainGuardConfig = {
    allowedChainId: SEPOLIA_CHAIN_ID,
    allowedDestinations: [allowedTelegraph, allowedUSDC],
    allowedTokens: [allowedUSDC],
  };

  it("permits valid transaction parameters on Ethereum Sepolia", () => {
    expect(() => {
      guardTransaction(
        {
          chainId: SEPOLIA_CHAIN_ID,
          to: allowedTelegraph,
          token: allowedUSDC,
          tokenAmount: 10000n,
          requiredTokenAmount: 10000n,
        },
        config
      );
    }).not.toThrow();
  });

  it("strictly rejects unexpected chain IDs (e.g. Ethereum Mainnet)", () => {
    expect(() => {
      guardTransaction(
        {
          chainId: 1, // Mainnet
          to: allowedTelegraph,
        },
        config
      );
    }).toThrowError(/INVALID_CHAIN/);
  });

  it("rejects non-allowlisted destination addresses", () => {
    expect(() => {
      guardTransaction(
        {
          chainId: SEPOLIA_CHAIN_ID,
          to: "0x000000000000000000000000000000000000dead",
        },
        config
      );
    }).toThrowError(/DESTINATION_NOT_ALLOWLISTED/);
  });

  it("rejects unauthorized payment tokens", () => {
    expect(() => {
      guardTransaction(
        {
          chainId: SEPOLIA_CHAIN_ID,
          to: allowedTelegraph,
          token: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT
        },
        config
      );
    }).toThrowError(/TOKEN_NOT_ALLOWLISTED/);
  });

  it("strictly rejects unlimited ERC20 token approvals (MAX_UINT256)", () => {
    expect(() => {
      guardTransaction(
        {
          chainId: SEPOLIA_CHAIN_ID,
          to: allowedTelegraph,
          token: allowedUSDC,
          tokenAmount: MAX_UINT256,
          requiredTokenAmount: 10000n,
        },
        config
      );
    }).toThrowError(/UNLIMITED_APPROVAL_REJECTED/);
  });

  it("rejects token approval exceeding the exact required amount", () => {
    expect(() => {
      guardTransaction(
        {
          chainId: SEPOLIA_CHAIN_ID,
          to: allowedTelegraph,
          token: allowedUSDC,
          tokenAmount: 50000n,
          requiredTokenAmount: 10000n,
        },
        config
      );
    }).toThrowError(/EXCESS_APPROVAL_REJECTED/);
  });
});

