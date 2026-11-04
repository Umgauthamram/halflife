import { validateAnswerForIntent } from "./schemas.js";
export class MockTelegraphClient {
    mockMiners;
    requests = new Map();
    constructor(mockMiners = {
        FX_NOW: [
            { id: "miner_1", address: "0x1111111111111111111111111111111111111111", rank: 1, score: 98, priceUsdc: 0.01 },
            { id: "miner_2", address: "0x2222222222222222222222222222222222222222", rank: 2, score: 94, priceUsdc: 0.01 },
        ],
        WEATHER_FORECAST_VERIFY: [
            { id: "miner_w1", address: "0x3333333333333333333333333333333333333333", rank: 1, score: 95, priceUsdc: 0.01 },
        ],
        SANCTIONS_SCREENING_MATCH: [
            { id: "miner_s1", address: "0x4444444444444444444444444444444444444444", rank: 1, score: 99, priceUsdc: 0.05 },
        ],
    }) {
        this.mockMiners = mockMiners;
    }
    async listIntents() {
        return Object.keys(this.mockMiners);
    }
    async listMiners(intent) {
        return this.mockMiners[intent] || [];
    }
    async ask(request) {
        // Idempotency: return existing receipt if already processed
        if (this.requests.has(request.requestId)) {
            return this.requests.get(request.requestId);
        }
        const miners = await this.listMiners(request.intent);
        if (miners.length === 0) {
            throw new Error(`No live miners available for intent ${request.intent}`);
        }
        const topMiner = miners[0];
        if (topMiner.priceUsdc > request.maxPriceUsdc) {
            throw new Error(`Top miner price ($${topMiner.priceUsdc}) exceeds max allowed price ($${request.maxPriceUsdc})`);
        }
        // Mock answer generation
        let rawAnswer;
        if (request.intent === "FX_NOW") {
            rawAnswer = { pair: request.params.pair ?? "EUR/USD", rate: 1.0854, timestamp: Date.now() };
        }
        else if (request.intent === "WEATHER_FORECAST_VERIFY") {
            rawAnswer = {
                location: request.params.location ?? "London",
                temperatureC: 18.5,
                condition: "Clear",
                forecastTimestamp: Date.now() + 3600000,
            };
        }
        else if (request.intent === "SANCTIONS_SCREENING_MATCH") {
            rawAnswer = {
                entity: request.params.entity ?? "Unknown Entity",
                matched: false,
                matchScore: 0.0,
                listName: "OFAC-SDN",
            };
        }
        else {
            rawAnswer = { raw: true, ts: Date.now() };
        }
        // Validate answer schema
        const validatedAnswer = validateAnswerForIntent(request.intent, rawAnswer);
        const receipt = {
            minerId: topMiner.id,
            minerAddress: topMiner.address,
            minerRank: topMiner.rank,
            priceUsdc: topMiner.priceUsdc,
            txHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
            signalHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
            answer: validatedAnswer,
            confidence: 0.95,
            askedAt: new Date(),
            answeredAt: new Date(),
        };
        this.requests.set(request.requestId, receipt);
        return receipt;
    }
}
//# sourceMappingURL=mock.js.map