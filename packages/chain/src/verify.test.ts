import { describe, it, expect, vi } from "vitest";
import { verifySettlementTx } from "./verify.js";
import { encodeEventTopics, parseAbiItem, type PublicClient } from "viem";

const REAL_TX = "0xbf283485aacb2e2964bf53fbd7eba05e080e710a77a756711a3f596a78989c1b";
const USDC = "0xcc194e1a843B658526D0D5C431f670028582Ae17";
const TELEGRAPH_PAY_TO = "0x3624EB012B5E998BB57B6bE6C9Cfc9c4bc5eb99b";
const PAYER = "0x1111111111111111111111111111111111111111";

const transferAbiItem = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)"
);
const authUsedAbiItem = parseAbiItem(
  "event AuthorizationUsed(address indexed authorizer, bytes32 indexed nonce)"
);

function makeReceipt(overrides: Record<string, any> = {}) {
  const transferTopics = encodeEventTopics({
    abi: [transferAbiItem],
    eventName: "Transfer",
    args: {
      from: PAYER,
      to: TELEGRAPH_PAY_TO,
    },
  });

  const authUsedTopics = encodeEventTopics({
    abi: [authUsedAbiItem],
    eventName: "AuthorizationUsed",
    args: {
      authorizer: PAYER,
      nonce: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" as const,
    },
  });

  return {
    status: "success",
    blockNumber: 7123456n,
    gasUsed: 84210n,
    effectiveGasPrice: 1500000000n,
    logs: [
      {
        address: USDC,
        topics: transferTopics,
        data: "0x0000000000000000000000000000000000000000000000000000000000002710", // 10000n = 0.01 USDC
      },
      {
        address: USDC,
        topics: authUsedTopics,
        data: "0x",
      },
    ],
    ...overrides,
  };
}

describe("verifySettlementTx", () => {
  it("verifies genuine Sepolia settlement transaction with Transfer and AuthorizationUsed logs", async () => {
    const mockClient = {
      getTransactionReceipt: vi.fn().mockResolvedValue(makeReceipt()),
    } as unknown as PublicClient;

    const result = await verifySettlementTx(mockClient, REAL_TX, {
      usdc: USDC,
      payer: PAYER,
      payTo: TELEGRAPH_PAY_TO,
      amountRaw: 10000n,
    });

    expect(result.verified).toBe(true);
    expect(result.status).toBe("confirmed");
    expect(result.blockNumber).toBe(7123456n);
    expect(result.gasUsed).toBe(84210n);
    expect(result.detail).toContain("7123456");
  });

  it("fails verification if payTo destination does not match expected", async () => {
    const mockClient = {
      getTransactionReceipt: vi.fn().mockResolvedValue(makeReceipt()),
    } as unknown as PublicClient;

    const result = await verifySettlementTx(mockClient, REAL_TX, {
      usdc: USDC,
      payer: PAYER,
      payTo: "0xdeadbeef00000000000000000000000000000001",
      amountRaw: 10000n,
    });

    expect(result.verified).toBe(false);
    expect(result.status).toBe("failed");
    expect(result.reason).toContain("Transfer event missing or mismatched");
  });

  it("fails verification if amount does not match expected", async () => {
    const mockClient = {
      getTransactionReceipt: vi.fn().mockResolvedValue(makeReceipt()),
    } as unknown as PublicClient;

    const result = await verifySettlementTx(mockClient, REAL_TX, {
      usdc: USDC,
      payer: PAYER,
      payTo: TELEGRAPH_PAY_TO,
      amountRaw: 20000n, // Expected 0.02 USDC, but tx was 0.01 USDC
    });

    expect(result.verified).toBe(false);
    expect(result.status).toBe("failed");
    expect(result.reason).toContain("Transfer event missing or mismatched");
  });

  it("fails verification if token address does not match expected USDC", async () => {
    const mockClient = {
      getTransactionReceipt: vi.fn().mockResolvedValue(makeReceipt()),
    } as unknown as PublicClient;

    const result = await verifySettlementTx(mockClient, REAL_TX, {
      usdc: "0x000000000000000000000000000000000000dead",
      payer: PAYER,
      payTo: TELEGRAPH_PAY_TO,
      amountRaw: 10000n,
    });

    expect(result.verified).toBe(false);
    expect(result.status).toBe("failed");
    expect(result.reason).toContain("Transfer event missing or mismatched");
  });

  it("fails verification if transaction was reverted on-chain", async () => {
    const mockClient = {
      getTransactionReceipt: vi.fn().mockResolvedValue(makeReceipt({ status: "reverted" })),
    } as unknown as PublicClient;

    const result = await verifySettlementTx(mockClient, REAL_TX, {
      usdc: USDC,
      payer: PAYER,
      payTo: TELEGRAPH_PAY_TO,
      amountRaw: 10000n,
    });

    expect(result.verified).toBe(false);
    expect(result.status).toBe("failed");
    expect(result.reason).toBe("Transaction reverted");
  });

  it("fails verification if AuthorizationUsed log is missing", async () => {
    const receiptWithoutAuth = makeReceipt();
    receiptWithoutAuth.logs = [receiptWithoutAuth.logs[0]]; // Keep Transfer only

    const mockClient = {
      getTransactionReceipt: vi.fn().mockResolvedValue(receiptWithoutAuth),
    } as unknown as PublicClient;

    const result = await verifySettlementTx(mockClient, REAL_TX, {
      usdc: USDC,
      payer: PAYER,
      payTo: TELEGRAPH_PAY_TO,
      amountRaw: 10000n,
    });

    expect(result.verified).toBe(false);
    expect(result.status).toBe("failed");
    expect(result.reason).toContain("AuthorizationUsed event missing");
  });

  it("returns unverified if transaction receipt is not yet indexed", async () => {
    const mockClient = {
      getTransactionReceipt: vi.fn().mockResolvedValue(null),
    } as unknown as PublicClient;

    const result = await verifySettlementTx(mockClient, REAL_TX, {
      usdc: USDC,
      payer: PAYER,
      payTo: TELEGRAPH_PAY_TO,
      amountRaw: 10000n,
    });

    expect(result.verified).toBe(false);
    expect(result.status).toBe("unverified");
    expect(result.reason).toBe("Receipt not found");
  });

  it("returns unverified when getTransactionReceipt throws an RPC error", async () => {
    const mockClient = {
      getTransactionReceipt: vi.fn().mockRejectedValue(new Error("RPC timeout 504")),
    } as unknown as PublicClient;

    const result = await verifySettlementTx(mockClient, REAL_TX, {
      usdc: USDC,
      payer: PAYER,
      payTo: TELEGRAPH_PAY_TO,
      amountRaw: 10000n,
    });

    expect(result.verified).toBe(false);
    expect(result.status).toBe("unverified");
    expect(result.reason).toContain("RPC timeout 504");
  });
});
