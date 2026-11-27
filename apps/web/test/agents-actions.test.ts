import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const collections = new Map<string, any[]>();
let nextIdCounter = 1;

const mockDb = {
  collection(name: string) {
    if (!collections.has(name)) collections.set(name, []);
    const docs = collections.get(name)!;
    return {
      findOne: vi.fn(async (query: any) => {
        return (
          docs.find((d) => {
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
          }) || null
        );
      }),
      insertOne: vi.fn(async (doc: any) => {
        const inserted = { ...doc, _id: `agent_${nextIdCounter++}` };
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
            for (const k in update.$inc) doc[k] = (doc[k] || 0) + update.$inc[k];
          }
          if (update.$set) Object.assign(doc, update.$set);
          return { modifiedCount: 1, upsertedCount: options.upsert ? 1 : 0 };
        }
        return { modifiedCount: 0, upsertedCount: 0 };
      }),
      deleteOne: vi.fn(async () => ({ deletedCount: 1 })),
    };
  },
};

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    const err: any = new Error(`NEXT_REDIRECT:${url}`);
    err.digest = "NEXT_REDIRECT";
    throw err;
  }),
}));
vi.mock("../lib/mongodb", () => ({ getDb: vi.fn(async () => mockDb) }));
vi.mock("../lib/dal", () => ({
  requireUser: vi.fn(async () => ({ id: "user_1", email: "u@example.com", role: "member" })),
  getOwnedAgent: vi.fn(),
}));
vi.mock("../lib/api-key", () => ({
  createAgentApiKey: vi.fn(async () => ({ rawKey: "hl_live_testkey", prefix: "hl_live_test", keyId: "k1" })),
  authenticateApiKey: vi.fn(async () => ({ agentId: "agent_1", ownerId: "user_1" })),
}));
vi.mock("@half-life/telegraph", () => ({
  createTelegraphClient: vi.fn(() => ({
    source: "live",
    quote: vi.fn(async () => ({
      priceUsdc: 0.01,
      payTo: "0x3624eb012b5e998bb57b6be6c9cfc9c4bc5eb99b",
      asset: "0xcc194e1a843b658526d0d5c431f670028582ae17",
      network: "eip155:11155111",
      amountRaw: BigInt(10000),
      resource: "http://mock-node/engine/v1/ask",
    })),
    ask: vi.fn(async () => ({
      minerId: "31002",
      minerAddress: "0x3624eb012b5e998bb57b6be6c9cfc9c4bc5eb99b",
      minerRank: 1,
      priceUsdc: 0.01,
      txHash: "0xtx123",
      signalHash: "0xsig123",
      answer: { rate: 1.085 },
      askedAt: new Date(),
      answeredAt: new Date(),
      latencyMs: 10,
      outcome: "paid",
      source: "live",
      verification: "unverified",
    })),
  })),
}));
vi.mock("@half-life/chain", () => ({
  createSepoliaClient: vi.fn(),
  verifySettlementTx: vi.fn(async () => ({ verified: true, status: "confirmed", detail: "OK" })),
}));

import { createAgentAction } from "../app/app/agents/actions";
import { POST } from "../app/api/v1/ask/route";

describe("createAgentAction & policy persistence", () => {
  beforeEach(() => {
    collections.clear();
    nextIdCounter = 1;
  });

  it("defaults allowedIntents to ['FX_NOW_EUR'], crossCheck false, and omits blank tolerance", async () => {
    const formData = new FormData();
    formData.set("name", "Default Agent");
    formData.set("mode", "halflife");
    formData.set("perAskCapUsdc", "0.05");
    formData.set("dailyCapUsdc", "1.00");
    formData.set("stakeDefault", "100");
    formData.set("crossCheckTolerance", "");

    await expect(createAgentAction(formData)).rejects.toThrow(/NEXT_REDIRECT/);

    const agent = collections.get("agents")![0];
    expect(agent.allowedIntents).toEqual(["FX_NOW_EUR"]);
    expect(agent.policy.crossCheck).toBe(false);
    expect("crossCheckTolerance" in agent.policy).toBe(false);
  });

  it("stores checked intents verbatim, crossCheck true, and valid numeric tolerance", async () => {
    const formData = new FormData();
    formData.set("name", "Checked Agent");
    formData.append("intents", "FX_NOW_EUR");
    formData.append("intents", "CRYPTO_PRICE");
    formData.set("crossCheck", "on");
    formData.set("crossCheckTolerance", "0.01");

    await expect(createAgentAction(formData)).rejects.toThrow(/NEXT_REDIRECT/);

    const agent = collections.get("agents")![0];
    expect(agent.allowedIntents).toEqual(["FX_NOW_EUR", "CRYPTO_PRICE"]);
    expect(agent.policy.crossCheck).toBe(true);
    expect(agent.policy.crossCheckTolerance).toBe(0.01);
  });

  it("ignores invalid tolerances ('abc', negative)", async () => {
    for (const badVal of ["abc", "-0.5"]) {
      collections.clear();
      const formData = new FormData();
      formData.set("name", "Bad Tol Agent");
      formData.set("crossCheck", "on");
      formData.set("crossCheckTolerance", badVal);

      await expect(createAgentAction(formData)).rejects.toThrow(/NEXT_REDIRECT/);

      const agent = collections.get("agents")![0];
      expect(agent.policy.crossCheck).toBe(true);
      expect("crossCheckTolerance" in agent.policy).toBe(false);
    }
  });

  it("allows FX_NOW_EUR on ask route and refuses unlisted intent with 403", async () => {
    const formData = new FormData();
    formData.set("name", "Ask Test Agent");

    await expect(createAgentAction(formData)).rejects.toThrow(/NEXT_REDIRECT/);

    const okReq = new NextRequest("http://localhost/api/v1/ask", {
      method: "POST",
      headers: { Authorization: "Bearer hl_live_testkey", "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "FX_NOW_EUR",
        params: { currency: "EUR" },
        requestId: "req_allowed_1",
      }),
    });
    const okRes = await POST(okReq);
    expect(okRes.status).toBe(200);

    const deniedReq = new NextRequest("http://localhost/api/v1/ask", {
      method: "POST",
      headers: { Authorization: "Bearer hl_live_testkey", "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "UNLISTED_INTENT",
        params: {},
        requestId: "req_denied_1",
      }),
    });
    const deniedRes = await POST(deniedReq);
    expect(deniedRes.status).toBe(403);
    const deniedData = await deniedRes.json();
    expect(deniedData.action).toBe("refuse");
  });
});
