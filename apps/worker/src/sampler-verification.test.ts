import { describe, expect, it } from "vitest";
import { sampleIntent, reverifyPendingSamples, type SettlementVerifier } from "./sampler.js";
import { updateDecayEstimates } from "./decay-estimator.js";
import type { TelegraphClient } from "@half-life/telegraph";

function makeInMemoryDb(initial: Record<string, any[]> = {}) {
  const store: Record<string, any[]> = {
    atlas_samples: [...(initial.atlas_samples || [])],
    atlas_noise_measurements: [...(initial.atlas_noise_measurements || [])],
    atlas_stats: [...(initial.atlas_stats || [])],
    atlas_gaps: [...(initial.atlas_gaps || [])],
    sampler_locks: [...(initial.sampler_locks || [])],
    budget_counters: [...(initial.budget_counters || [])],
  };

  return {
    store,
    collection(name: string) {
      if (!store[name]) store[name] = [];
      const rows = store[name];
      return {
        async findOne(filter: any = {}) {
          return (
            rows.find((r) =>
              Object.entries(filter).every(([k, v]) => r[k] === v)
            ) || null
          );
        },
        async findOneAndUpdate(_filter: any, update: any) {
          const doc = { _id: `${name}_lock`, ...(update?.$set || {}) };
          rows.push(doc);
          return doc;
        },
        async deleteOne() {
          return { deletedCount: 1 };
        },
        async insertOne(doc: any) {
          const inserted = { _id: `${name}_${rows.length + 1}`, ...doc };
          rows.push(inserted);
          return { insertedId: inserted._id };
        },
        async updateOne(filter: any, update: any) {
          if (name === "budget_counters" && update?.$inc) {
            rows.push({ ...filter, ...update.$inc });
            return { modifiedCount: 1, upsertedCount: 0 };
          }
          const target = rows.find((r) => (filter._id ? r._id === filter._id : true));
          if (target && update?.$set) {
            Object.assign(target, update.$set);
            return { modifiedCount: 1, upsertedCount: 0 };
          }
          return { modifiedCount: 0, upsertedCount: 0 };
        },
        async countDocuments(filter: any = {}) {
          return rows.filter((r) =>
            Object.entries(filter).every(([k, v]) => r[k] === v)
          ).length;
        },
        find(filter: any = {}) {
          const filtered = rows.filter((r) => {
            if (filter.intent && r.intent !== filter.intent) return false;
            if (filter.source && r.source !== filter.source) return false;
            if (filter.verification && r.verification !== filter.verification) return false;
            return true;
          });
          return {
            sort: () => ({
              limit: (n: number) => ({
                toArray: async () => filtered.slice(0, n),
              }),
            }),
          };
        },
      };
    },
  } as any;
}

function makeStubClient(askImpl: (req: any) => Promise<any>): TelegraphClient {
  return {
    source: "live",
    async listIntents() {
      return ["FX_NOW_EUR"];
    },
    async listMiners() {
      return [
        { id: "31001", name: "miner-1", address: "0x1111111111111111111111111111111111111111", rank: 1 },
        { id: "31002", name: "miner-2", address: "0x2222222222222222222222222222222222222222", rank: 2 },
      ];
    },
    async quote() {
      return {
        priceUsdc: 0.01,
        payTo: "0x3624EB012B5E998BB57B6bE6C9Cfc9c4bc5eb99b",
        asset: "0xcc194e1a843B658526D0D5C431f670028582Ae17",
        network: "eip155:11155111",
        amountRaw: 10000n,
        resource: "https://node.example/ask",
      };
    },
    ask: askImpl,
  };
}

const DEFAULT_POLICY = { perAskCapUsdc: 0.05, dailyCapUsdc: 10, stakeDefault: 100 };

describe("Sampler on-chain verification & re-verification", () => {
  it("verified tx marks sample confirmed and records noise measurement", async () => {
    const db = makeInMemoryDb();
    const client = makeStubClient(async (req) => ({
      minerId: req.minerId,
      minerAddress: "0x3624EB012B5E998BB57B6bE6C9Cfc9c4bc5eb99b",
      minerRank: 1,
      priceUsdc: 0.01,
      txHash: `0x${req.minerId.padEnd(64, "a")}`,
      signalHash: "0xsig",
      answer: { pair: "EUR/USD", rate: req.minerId === "31001" ? 1.08 : 1.09, timestamp: 1730700000 },
      askedAt: new Date(),
      answeredAt: new Date(),
      latencyMs: 120,
      outcome: "paid",
      source: "live",
      // Even if receipt omits or lies about verification, verifier controls it
      payTo: "0x3624EB012B5E998BB57B6bE6C9Cfc9c4bc5eb99b",
      amountRaw: 10000n,
      asset: "0xcc194e1a843B658526D0D5C431f670028582Ae17",
      payer: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    }));

    const verifyTx: SettlementVerifier = async () => ({
      verified: true,
      status: "confirmed",
      detail: "Confirmed on Sepolia",
    });

    const res = await sampleIntent(db, client, "FX_NOW_EUR", "system_sampler", DEFAULT_POLICY, {
      verifyTx,
      now: () => new Date("2026-11-28T00:00:00Z"),
    });

    expect(res.samplesCount).toBe(2);
    expect(db.store.atlas_samples).toHaveLength(2);
    expect(db.store.atlas_samples[0].verification).toBe("confirmed");
    expect(db.store.atlas_samples[1].verification).toBe("confirmed");
    expect(db.store.atlas_noise_measurements).toHaveLength(1);
  });

  it("mismatch marks sample failed and excludes from noise floor", async () => {
    const db = makeInMemoryDb();
    const client = makeStubClient(async (req) => ({
      minerId: req.minerId,
      minerAddress: "0x3624EB012B5E998BB57B6bE6C9Cfc9c4bc5eb99b",
      minerRank: 1,
      priceUsdc: 0.01,
      txHash: "0x" + "b".repeat(64),
      signalHash: "0xsig",
      answer: { pair: "EUR/USD", rate: 1.085, timestamp: 1730700000 },
      askedAt: new Date(),
      answeredAt: new Date(),
      outcome: "paid",
      source: "live",
    }));

    const verifyTx: SettlementVerifier = async () => ({
      verified: false,
      status: "failed",
      detail: "Transfer amount mismatch",
    });

    const res = await sampleIntent(db, client, "FX_NOW_EUR", "system_sampler", DEFAULT_POLICY, {
      verifyTx,
    });

    expect(res.samplesCount).toBe(0);
    expect(db.store.atlas_samples).toHaveLength(2);
    expect(db.store.atlas_samples[0].verification).toBe("failed");
    expect(db.store.atlas_noise_measurements).toHaveLength(0);
  });

  it("RPC error marks sample unverified and excludes from noise floor", async () => {
    const db = makeInMemoryDb();
    const client = makeStubClient(async (req) => ({
      minerId: req.minerId,
      minerAddress: "0x3624EB012B5E998BB57B6bE6C9Cfc9c4bc5eb99b",
      minerRank: 1,
      priceUsdc: 0.01,
      txHash: "0x" + "c".repeat(64),
      signalHash: "0xsig",
      answer: { pair: "EUR/USD", rate: 1.085, timestamp: 1730700000 },
      askedAt: new Date(),
      answeredAt: new Date(),
      outcome: "paid",
      source: "live",
      // Must NOT trust receipt.verification="confirmed" without verifier succeeding
      verification: "confirmed",
    }));

    const verifyTx: SettlementVerifier = async () => {
      throw new Error("Sepolia RPC timeout");
    };

    const res = await sampleIntent(db, client, "FX_NOW_EUR", "system_sampler", DEFAULT_POLICY, {
      verifyTx,
    });

    expect(res.samplesCount).toBe(0);
    expect(db.store.atlas_samples).toHaveLength(2);
    expect(db.store.atlas_samples[0].verification).toBe("unverified");
    expect(db.store.atlas_noise_measurements).toHaveLength(0);
  });

  it("reverifyPendingSamples promotes old unverified sample and skips too-new samples", async () => {
    const now = new Date("2026-11-28T12:00:00Z");
    const db = makeInMemoryDb({
      atlas_samples: [
        {
          _id: "old_unverified",
          source: "live",
          verification: "unverified",
          txHash: "0x" + "1".repeat(64),
          ts: new Date(now.getTime() - 5 * 60 * 1000), // 5 min old
          priceUsdc: 0.01,
        },
        {
          _id: "new_unverified",
          source: "live",
          verification: "unverified",
          txHash: "0x" + "2".repeat(64),
          ts: new Date(now.getTime() - 30 * 1000), // 30s old (< 2 min)
          priceUsdc: 0.01,
        },
      ],
    });

    const seenHashes: string[] = [];
    const verifyTx: SettlementVerifier = async (txHash) => {
      seenHashes.push(txHash);
      return { verified: true, status: "confirmed", detail: "Confirmed" };
    };

    const res = await reverifyPendingSamples(db, { verifyTx, now: () => now });
    expect(res.checked).toBe(1);
    expect(res.confirmed).toBe(1);
    expect(seenHashes).toEqual(["0x" + "1".repeat(64)]);
    expect(db.store.atlas_samples[0].verification).toBe("confirmed");
    expect(db.store.atlas_samples[1].verification).toBe("unverified");
  });

  it("does not write unusable, failed, blocked, or free outcomes to atlas_samples", async () => {
    const db = makeInMemoryDb();
    let callIdx = 0;
    const client = makeStubClient(async (req) => {
      callIdx += 1;
      if (req.minerId === "31001") {
        // Unusable answer (null rate) even if outcome paid
        return {
          minerId: req.minerId,
          minerAddress: "0x3624EB012B5E998BB57B6bE6C9Cfc9c4bc5eb99b",
          minerRank: 1,
          priceUsdc: 0.01,
          txHash: "0x" + "d".repeat(64),
          signalHash: "0xsig",
          answer: { invalid: true },
          askedAt: new Date(),
          answeredAt: new Date(),
          outcome: "paid",
          source: "live",
        };
      }
      // Failed / free / blocked outcomes
      const modes = [
        { outcome: "failed", free: false, answer: { pair: "EUR/USD", rate: 1.08 } },
        { outcome: "blocked", free: false, answer: { pair: "EUR/USD", rate: 1.08 } },
        { outcome: "paid", free: true, answer: { pair: "EUR/USD", rate: 1.08 } },
      ];
      const chosen = modes[(callIdx - 2) % modes.length];
      return {
        minerId: req.minerId,
        minerAddress: "0x3624EB012B5E998BB57B6bE6C9Cfc9c4bc5eb99b",
        minerRank: 2,
        priceUsdc: chosen.free ? 0 : 0.01,
        txHash: "",
        signalHash: "",
        askedAt: new Date(),
        answeredAt: new Date(),
        source: "live",
        ...chosen,
      };
    });

    const verifyTx: SettlementVerifier = async () => ({
      verified: true,
      status: "confirmed",
      detail: "ok",
    });

    // Run 3 rounds to cover unusable + failed + blocked + free
    await sampleIntent(db, client, "FX_NOW_EUR", "system_sampler", DEFAULT_POLICY, { verifyTx });
    await sampleIntent(db, client, "FX_NOW_EUR", "system_sampler", DEFAULT_POLICY, { verifyTx });
    await sampleIntent(db, client, "FX_NOW_EUR", "system_sampler", DEFAULT_POLICY, { verifyTx });

    expect(db.store.atlas_samples).toHaveLength(0);
  });

  it("decay estimator ignores unverified and failed rows", async () => {
    const now = Date.now();
    const unverifiedAndFailed = [
      ...Array.from({ length: 35 }, (_, i) => ({
        intent: "FX_NOW_EUR",
        source: "live",
        verification: i % 2 === 0 ? "unverified" : "failed",
        valueNorm: 1.08 + i * 0.001,
        minerId: "31001",
        ts: new Date(now - i * 3600 * 1000),
      })),
    ];

    // Mock DB returning unverified/failed rows to verify JS-level filtering too
    const mockDb: any = {
      collection: (name: string) => ({
        find: () => ({
          sort: () => ({
            limit: () => ({
              toArray: async () => (name === "atlas_samples" ? unverifiedAndFailed : []),
            }),
          }),
        }),
        updateOne: async () => ({ modifiedCount: 1 }),
      }),
    };

    const stats = await updateDecayEstimates(mockDb, "FX_NOW_EUR");
    expect(stats).not.toBeNull();
    expect(stats!.sampleCount).toBe(0);
    expect(stats!.calibrated).toBe(false);
    expect(stats!.statusLabel).toBe("prior (not measured)");
  });
});
