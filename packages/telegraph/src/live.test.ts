import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LiveTelegraphClient } from "./live.js";

const TEST_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" as const;
const TELEGRAPH_CONTRACT = "0x3624eb012b5e998bb57b6be6c9cfc9c4bc5eb99b";
const USDC_CONTRACT = "0xcc194e1a843b658526d0d5c431f670028582ae17";

describe("LiveTelegraphClient x402 Security & Robustness", () => {
  let client: LiveTelegraphClient;

  beforeEach(() => {
    client = new LiveTelegraphClient({
      nodeUrl: "http://mock-node:7148",
      privateKey: TEST_PRIVATE_KEY,
      telegraphContract: TELEGRAPH_CONTRACT,
      usdcContract: USDC_CONTRACT,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("1. valid 402 flow -> success receipt", async () => {
    const fetchMock = vi.fn();
    // 1st call: quote (402)
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          x402Version: 2,
          resource: "http://mock-node:7148/engine/v1/ask",
          accepts: [
            {
              network: "eip155:11155111",
              scheme: "exact",
              payTo: TELEGRAPH_CONTRACT,
              asset: USDC_CONTRACT,
              amount: "10000",
            },
          ],
        }),
        { status: 402, headers: { "Content-Type": "application/json" } }
      )
    );
    // 2nd call: paid retry (200)
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          result: { pair: "EUR/USD", rate: 1.0854, timestamp: Date.now() },
          signal_hash: "0xabc123",
          miner_id: "miner_alpha",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "payment-response": Buffer.from(JSON.stringify({ transaction: "0xsettlement123" })).toString("base64"),
          },
        }
      )
    );
    // 3rd call: signal verification lookup (200)
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ status: "confirmed" }), { status: 200 })
    );

    global.fetch = fetchMock;

    const receipt = await client.ask({
      intent: "FX_NOW",
      params: { pair: "EUR/USD" },
      maxPriceUsdc: 0.05,
      paymentMode: "x402",
      requestId: "req_valid_1",
    });

    expect(receipt.outcome).toBe("paid");
    expect(receipt.priceUsdc).toBe(0.01);
    expect(receipt.txHash).toBe("0xsettlement123");
    expect(receipt.source).toBe("live");
    expect(receipt.signalVerification).toBe("confirmed");
  });

  it("2. 402 with wrong network -> rejects before signing", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          accepts: [
            {
              network: "eip155:1", // Mainnet instead of Sepolia
              scheme: "exact",
              payTo: TELEGRAPH_CONTRACT,
              asset: USDC_CONTRACT,
              amount: "10000",
            },
          ],
        }),
        { status: 402 }
      )
    );

    await expect(
      client.ask({
        intent: "FX_NOW",
        params: {},
        maxPriceUsdc: 0.05,
        paymentMode: "x402",
        requestId: "req_wrong_network",
      })
    ).rejects.toThrow(/No compatible exact payment option/);
  });

  it("3. 402 with wrong asset -> rejects before signing", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          accepts: [
            {
              network: "eip155:11155111",
              scheme: "exact",
              payTo: TELEGRAPH_CONTRACT,
              asset: "0x000000000000000000000000000000000000dead",
              amount: "10000",
            },
          ],
        }),
        { status: 402 }
      )
    );

    await expect(
      client.ask({
        intent: "FX_NOW",
        params: {},
        maxPriceUsdc: 0.05,
        paymentMode: "x402",
        requestId: "req_wrong_asset",
      })
    ).rejects.toThrow(/not configured USDC/);
  });

  it("4. 402 with payTo not in allowlist -> rejects before signing", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          accepts: [
            {
              network: "eip155:11155111",
              scheme: "exact",
              payTo: "0xdeadbeef00000000000000000000000000000001",
              asset: USDC_CONTRACT,
              amount: "10000",
            },
          ],
        }),
        { status: 402 }
      )
    );

    await expect(
      client.ask({
        intent: "FX_NOW",
        params: {},
        maxPriceUsdc: 0.05,
        paymentMode: "x402",
        requestId: "req_bad_dest",
      })
    ).rejects.toThrow(/not in allowlist/);
  });

  it("5. 402 with amount > per-ask cap -> rejects before signing", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          accepts: [
            {
              network: "eip155:11155111",
              scheme: "exact",
              payTo: TELEGRAPH_CONTRACT,
              asset: USDC_CONTRACT,
              amount: "100000", // 0.10 USDC
            },
          ],
        }),
        { status: 402 }
      )
    );

    await expect(
      client.ask({
        intent: "FX_NOW",
        params: {},
        maxPriceUsdc: 0.05, // Cap is 0.05 USDC = 50,000 micro-USDC
        paymentMode: "x402",
        requestId: "req_exceeds_cap",
      })
    ).rejects.toThrow(/exceeds per-ask cap/);
  });

  it("6. 402 missing amount -> rejects before signing", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          accepts: [
            {
              network: "eip155:11155111",
              scheme: "exact",
              payTo: TELEGRAPH_CONTRACT,
              asset: USDC_CONTRACT,
            },
          ],
        }),
        { status: 402 }
      )
    );

    await expect(
      client.ask({
        intent: "FX_NOW",
        params: {},
        maxPriceUsdc: 0.05,
        paymentMode: "x402",
        requestId: "req_missing_amount",
      })
    ).rejects.toThrow(/amount is missing/);
  });

  it("7. second 402 differs from quote -> aborts before re-signing", async () => {
    const fetchMock = vi.fn();
    // 1st call (quote)
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          accepts: [
            {
              network: "eip155:11155111",
              scheme: "exact",
              payTo: TELEGRAPH_CONTRACT,
              asset: USDC_CONTRACT,
              amount: "10000",
            },
          ],
        }),
        { status: 402 }
      )
    );
    // 2nd call (paid retry) returns different 402 challenge
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          accepts: [
            {
              network: "eip155:11155111",
              scheme: "exact",
              payTo: TELEGRAPH_CONTRACT,
              asset: USDC_CONTRACT,
              amount: "50000", // Price jumped!
            },
          ],
        }),
        { status: 402 }
      )
    );

    global.fetch = fetchMock;

    await expect(
      client.ask({
        intent: "FX_NOW",
        params: {},
        maxPriceUsdc: 0.1,
        paymentMode: "x402",
        requestId: "req_quote_mismatch",
      })
    ).rejects.toThrow(/Second 402 challenge differs from quoted terms/);
  });

  it("8. paid retry returns 500 -> returns failed_paid with signed amount", async () => {
    const fetchMock = vi.fn();
    // 1st call (quote)
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          accepts: [
            {
              network: "eip155:11155111",
              scheme: "exact",
              payTo: TELEGRAPH_CONTRACT,
              asset: USDC_CONTRACT,
              amount: "10000",
            },
          ],
        }),
        { status: 402 }
      )
    );
    // 2nd call returns 500
    fetchMock.mockResolvedValueOnce(
      new Response("Internal Server Error", { status: 500 })
    );

    global.fetch = fetchMock;

    const receipt = await client.ask({
      intent: "FX_NOW",
      params: {},
      maxPriceUsdc: 0.05,
      paymentMode: "x402",
      requestId: "req_500",
    });

    expect(receipt.outcome).toBe("failed_paid");
    expect(receipt.priceUsdc).toBe(0.01);
    expect(receipt.error).toMatch(/Payment submitted but ask failed \(500\)/);
  });

  it("9. node returns null answer -> failed_paid (paid but unusable)", async () => {
    const fetchMock = vi.fn();
    // 1st call (quote)
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          accepts: [
            {
              network: "eip155:11155111",
              scheme: "exact",
              payTo: TELEGRAPH_CONTRACT,
              asset: USDC_CONTRACT,
              amount: "10000",
            },
          ],
        }),
        { status: 402 }
      )
    );
    // 2nd call returns null answer
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ result: null, signal_hash: "0x123" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    // 3rd call for signal
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 404 }));

    global.fetch = fetchMock;

    const receipt = await client.ask({
      intent: "FX_NOW",
      params: {},
      maxPriceUsdc: 0.05,
      paymentMode: "x402",
      requestId: "req_null_answer",
    });

    expect(receipt.outcome).toBe("failed_paid");
    expect(receipt.priceUsdc).toBe(0.01);
  });

  it("10. timeout triggers abort", async () => {
    global.fetch = vi.fn().mockImplementation(() => {
      const err = new Error("The operation was aborted");
      err.name = "TimeoutError";
      return Promise.reject(err);
    });

    await expect(
      client.quote({
        intent: "FX_NOW",
        params: {},
        maxPriceUsdc: 0.05,
        paymentMode: "x402",
        requestId: "req_timeout",
      })
    ).rejects.toThrow(/aborted/);
  });
});
