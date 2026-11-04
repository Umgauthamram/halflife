import { describe, expect, it } from "vitest";
import { MockTelegraphClient } from "./mock.js";
import { validateAnswerForIntent } from "./schemas.js";
describe("Telegraph Client & Schema Validation", () => {
    const client = new MockTelegraphClient();
    it("lists available intents", async () => {
        const intents = await client.listIntents();
        expect(intents).toContain("FX_NOW");
        expect(intents).toContain("WEATHER_FORECAST_VERIFY");
        expect(intents).toContain("SANCTIONS_SCREENING_MATCH");
    });
    it("lists active miners for intent", async () => {
        const miners = await client.listMiners("FX_NOW");
        expect(miners.length).toBeGreaterThan(0);
        expect(miners[0].rank).toBe(1);
        expect(miners[0].priceUsdc).toBe(0.01);
    });
    it("executes ask and returns schema-validated receipt", async () => {
        const receipt = await client.ask({
            intent: "FX_NOW",
            params: { pair: "EUR/USD" },
            maxPriceUsdc: 0.05,
            paymentMode: "x402",
            requestId: "req_test_1",
        });
        expect(receipt.minerId).toBe("miner_1");
        expect(receipt.priceUsdc).toBe(0.01);
        expect(receipt.txHash).toMatch(/^0x[0-9a-f]{64}$/);
        expect(receipt.answer).toHaveProperty("rate");
        expect(receipt.answer).toHaveProperty("timestamp");
    });
    it("preserves idempotency on identical requestId", async () => {
        const r1 = await client.ask({
            intent: "FX_NOW",
            params: { pair: "EUR/USD" },
            maxPriceUsdc: 0.05,
            paymentMode: "x402",
            requestId: "req_idempotent_1",
        });
        const r2 = await client.ask({
            intent: "FX_NOW",
            params: { pair: "EUR/USD" },
            maxPriceUsdc: 0.05,
            paymentMode: "x402",
            requestId: "req_idempotent_1",
        });
        expect(r1.txHash).toBe(r2.txHash);
        expect(r1.signalHash).toBe(r2.signalHash);
    });
    it("rejects request if price exceeds maxPriceUsdc", async () => {
        await expect(client.ask({
            intent: "FX_NOW",
            params: { pair: "EUR/USD" },
            maxPriceUsdc: 0.005, // Below miner price of 0.01
            paymentMode: "x402",
            requestId: "req_expensive",
        })).rejects.toThrowError(/exceeds max allowed price/);
    });
    it("validates and rejects malformed answers", () => {
        expect(() => {
            validateAnswerForIntent("FX_NOW", { pair: "EUR/USD", rate: "not-a-number" });
        }).toThrow();
        expect(() => {
            validateAnswerForIntent("SANCTIONS_SCREENING_MATCH", { entity: "Test Corp", matchScore: 1.5 }); // > 1
        }).toThrow();
    });
});
//# sourceMappingURL=client.test.js.map