import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock dependencies
const mockDb = {
  collections: new Map<string, any[]>(),
  collection(name: string) {
    if (!this.collections.has(name)) {
      this.collections.set(name, []);
    }
    const docs = this.collections.get(name)!;
    return {
      findOne: vi.fn(async (query: any) => {
        return docs.find((d) => {
          for (const k in query) {
            if (k === "$or") {
              const matches = query[k].some((sub: any) => {
                for (const subK in sub) {
                  if (d[subK] !== sub[subK]) return false;
                }
                return true;
              });
              if (!matches) return false;
            } else if (d[k] !== query[k]) {
              return false;
            }
          }
          return true;
        }) || null;
      }),
      insertOne: vi.fn(async (doc: any) => {
        // Enforce unique (agentId, requestId) for decisions
        if (name === "decisions") {
          const duplicate = docs.find((d) => d.agentId === doc.agentId && d.requestId === doc.requestId);
          if (duplicate) {
            const err: any = new Error("Duplicate key");
            err.code = 11000;
            throw err;
          }
        }
        const inserted = { ...doc, _id: `id_${Date.now()}_${Math.random()}` };
        docs.push(inserted);
        return { insertedId: inserted._id };
      }),
      updateOne: vi.fn(async (filter: any, update: any, options: any = {}) => {
        let doc = docs.find((d) => {
          for (const k in filter) {
            if (k === "$or") {
              const matches = filter[k].some((sub: any) => {
                for (const subK in sub) {
                  if (d[subK] !== sub[subK]) return false;
                }
                return true;
              });
              if (!matches) return false;
            } else if (k === "spentUsdc" && filter[k]?.$lte !== undefined) {
              if (d.spentUsdc > filter[k].$lte) return false;
            } else if (d[k] !== filter[k]) {
              return false;
            }
          }
          return true;
        });

        if (!doc && options.upsert) {
          doc = { ...filter, ...update.$setOnInsert, spentUsdc: 0 };
          docs.push(doc);
        }

        if (doc) {
          if (update.$inc) {
            for (const k in update.$inc) {
              doc[k] = (doc[k] || 0) + update.$inc[k];
            }
          }
          if (update.$set) {
            Object.assign(doc, update.$set);
          }
          return { modifiedCount: 1, upsertedCount: options.upsert ? 1 : 0 };
        }
        return { modifiedCount: 0, upsertedCount: 0 };
      }),
      deleteOne: vi.fn(async (filter: any) => {
        const idx = docs.findIndex((d) => {
          for (const k in filter) {
            if (d[k] !== filter[k]) return false;
          }
          return true;
        });
        if (idx !== -1) {
          docs.splice(idx, 1);
          return { deletedCount: 1 };
        }
        return { deletedCount: 0 };
      }),
    };
  },
};

vi.mock("../lib/mongodb", () => ({
  getDb: vi.fn(async () => mockDb),
}));

vi.mock("../lib/api-key", () => ({
  authenticateApiKey: vi.fn(async () => ({
    agentId: "agent_123",
    ownerId: "user_123",
  })),
}));

let mockQuotePrice = 0.015;
let mockAskOutcome: "paid" | "failed" | "failed_paid" = "paid";
let mockClientSource: "live" | "mock" = "live";

vi.mock("@half-life/telegraph", () => ({
  createTelegraphClient: vi.fn(() => ({
    source: mockClientSource,
    quote: vi.fn(async () => ({
      priceUsdc: mockQuotePrice,
      payTo: "0x3624eb012b5e998bb57b6be6c9cfc9c4bc5eb99b",
      asset: "0xcc194e1a843b658526d0d5c431f670028582ae17",
      network: "eip155:11155111",
      amountRaw: BigInt(Math.round(mockQuotePrice * 1_000_000)),
      resource: "http://mock-node/engine/v1/ask",
    })),
    ask: vi.fn(async () => ({
      minerId: "miner_1",
      minerAddress: "0x3624eb012b5e998bb57b6be6c9cfc9c4bc5eb99b",
      minerRank: 1,
      priceUsdc: mockQuotePrice,
      txHash: "0xsettlement_hash_123",
      signalHash: "0xsignal_hash_123",
      answer: { pair: "EUR/USD", rate: 1.0854 },
      askedAt: new Date(),
      answeredAt: new Date(),
      outcome: mockAskOutcome,
      source: mockClientSource,
      verification: "unverified",
    })),
  })),
}));

vi.mock("@half-life/chain", () => ({
  createSepoliaClient: vi.fn(),
  verifySettlementTx: vi.fn(async () => ({
    verified: true,
    status: "confirmed",
    blockNumber: BigInt(7123456),
    detail: "Confirmed",
  })),
}));

import { POST } from "../app/api/v1/ask/route";

describe("POST /api/v1/ask Production Correctness", () => {
  beforeEach(() => {
    mockDb.collections.clear();
    mockQuotePrice = 0.015;
    mockAskOutcome = "paid";
    mockClientSource = "live";

    // Setup active agent
    mockDb.collection("agents").insertOne({
      id: "agent_123",
      ownerId: "user_123",
      name: "Test Agent",
      mode: "halflife",
      walletAddress: "0x1111111111111111111111111111111111111111",
      allowedIntents: ["FX_NOW"],
      policy: {
        perAskCapUsdc: 0.05,
        dailyCapUsdc: 1.0,
        stakeDefault: 100,
      },
      status: "active",
      createdAt: new Date(),
    });
  });

  it("1. feeds real pre-quote price to governor and reserves exact amount in budget", async () => {
    mockQuotePrice = 0.025; // 0.025 USDC quote
    const req = new NextRequest("http://localhost/api/v1/ask", {
      method: "POST",
      headers: { Authorization: "Bearer key_123", "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "FX_NOW",
        params: { pair: "EUR/USD" },
        requestId: "req_quote_test",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.action).toBe("buy");
    expect(data.inputs.price).toBe(0.025);

    // Verify budget counter incremented by exact quote price
    const counters = mockDb.collections.get("budget_counters")!;
    expect(counters.length).toBe(1);
    expect(counters[0].spentUsdc).toBeCloseTo(0.025);
  });

  it("2. releases reserved budget when ask outcome is failed (no money signed)", async () => {
    mockAskOutcome = "failed";
    const req = new NextRequest("http://localhost/api/v1/ask", {
      method: "POST",
      headers: { Authorization: "Bearer key_123", "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "FX_NOW",
        params: { pair: "EUR/USD" },
        requestId: "req_failed_release",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    // Reserved budget was incremented then decremented back to 0
    const counters = mockDb.collections.get("budget_counters")!;
    expect(counters[0].spentUsdc).toBe(0);
  });

  it("3. does NOT release reserved budget when ask outcome is failed_paid (funds spent)", async () => {
    mockAskOutcome = "failed_paid";
    mockQuotePrice = 0.01;

    const req = new NextRequest("http://localhost/api/v1/ask", {
      method: "POST",
      headers: { Authorization: "Bearer key_123", "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "FX_NOW",
        params: { pair: "EUR/USD" },
        requestId: "req_failed_paid_hold",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.action).toBe("failed_paid");

    // Funds were spent on-chain, so budget counter remains spent (0.01)
    const counters = mockDb.collections.get("budget_counters")!;
    expect(counters[0].spentUsdc).toBe(0.01);
  });

  it("4. handles duplicate requestId idempotently without running second purchase", async () => {
    const req1 = new NextRequest("http://localhost/api/v1/ask", {
      method: "POST",
      headers: { Authorization: "Bearer key_123", "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "FX_NOW",
        params: { pair: "EUR/USD" },
        requestId: "req_duplicate_test",
      }),
    });

    const res1 = await POST(req1);
    expect(res1.status).toBe(200);
    const data1 = await res1.json();

    // Second request with same requestId
    const req2 = new NextRequest("http://localhost/api/v1/ask", {
      method: "POST",
      headers: { Authorization: "Bearer key_123", "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "FX_NOW",
        params: { pair: "EUR/USD" },
        requestId: "req_duplicate_test",
      }),
    });

    const res2 = await POST(req2);
    expect(res2.status).toBe(200);
    const data2 = await res2.json();

    expect(data2.idempotent).toBe(true);
    expect(data2.purchaseId).toBe(data1.purchaseId);

    // Only one purchase document created in purchases collection
    const purchases = mockDb.collections.get("purchases")!;
    expect(purchases.length).toBe(1);
  });

  it("5. writes source: 'live' to purchase document when live client is used", async () => {
    mockClientSource = "live";

    const req = new NextRequest("http://localhost/api/v1/ask", {
      method: "POST",
      headers: { Authorization: "Bearer key_123", "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "FX_NOW",
        params: { pair: "EUR/USD" },
        requestId: "req_live_source",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const purchases = mockDb.collections.get("purchases")!;
    expect(purchases[0].source).toBe("live");
    expect(purchases[0].verification).toBe("confirmed");
  });

  it("6. does NOT write purchase document when outcome is failed", async () => {
    mockAskOutcome = "failed";
    const req = new NextRequest("http://localhost/api/v1/ask", {
      method: "POST",
      headers: { Authorization: "Bearer key_123", "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "FX_NOW",
        params: { pair: "EUR/USD" },
        requestId: "req_failed_no_purchase",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.action).toBe("failed");

    const purchases = mockDb.collections.get("purchases") || [];
    expect(purchases.length).toBe(0);
  });
});
