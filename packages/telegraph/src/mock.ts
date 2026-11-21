import type { Miner } from "@half-life/shared";
import type { AskRequest, TelegraphClient, TelegraphQuote, TelegraphReceipt } from "./client.js";
import { validateAnswerForIntent } from "./schemas.js";

export class MockTelegraphClient implements TelegraphClient {
  readonly source = "mock" as const;
  private requests = new Map<string, TelegraphReceipt>();

  constructor(
    private mockMiners: Record<string, Miner[]> = {
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
      WEB_SEARCH: [
        { id: "miner_web1", address: "0x5555555555555555555555555555555555555555", rank: 1, score: 97, priceUsdc: 0.01 },
      ],
      QUESTION_ANSWERING: [
        { id: "miner_qa1", address: "0x6666666666666666666666666666666666666666", rank: 1, score: 96, priceUsdc: 0.02 },
      ],
      WEATHER_CHECK: [
        { id: "miner_wc1", address: "0x7777777777777777777777777777777777777777", rank: 1, score: 95, priceUsdc: 0.01 },
      ],
      CRYPTO_PRICE: [
        { id: "miner_cp1", address: "0x8888888888888888888888888888888888888888", rank: 1, score: 98, priceUsdc: 0.01 },
      ],
      TASK_EXECUTION_QUALITY: [
        { id: "miner_teq1", address: "0x9999999999999999999999999999999999999999", rank: 1, score: 99, priceUsdc: 0.02 },
      ],
    }
  ) {}

  async listIntents(): Promise<string[]> {
    return Object.keys(this.mockMiners);
  }

  async listMiners(intent: string): Promise<Miner[]> {
    return this.mockMiners[intent] || [];
  }

  async quote(request: AskRequest): Promise<TelegraphQuote> {
    const miners = await this.listMiners(request.intent);
    const topMiner = miners[0];
    const price = typeof topMiner?.priceUsdc === "number" ? topMiner.priceUsdc : 0.01;
    return {
      priceUsdc: price,
      payTo: "0x3624EB012B5E998BB57B6bE6C9Cfc9c4bc5eb99b",
      asset: "0xcc194e1a843B658526D0D5C431f670028582Ae17",
      network: "ethereum-sepolia",
      amountRaw: BigInt(Math.round(price * 1_000_000)),
      resource: `http://localhost/mock/${request.intent}`,
    };
  }

  async ask(request: AskRequest): Promise<TelegraphReceipt> {
    // Idempotency: return existing receipt if already processed
    if (this.requests.has(request.requestId)) {
      return this.requests.get(request.requestId)!;
    }

    const miners = await this.listMiners(request.intent);
    if (miners.length === 0) {
      throw new Error(`No live miners available for intent ${request.intent}`);
    }

    const topMiner = miners[0];
    const price = typeof topMiner?.priceUsdc === "number" ? topMiner.priceUsdc : 0.01;
    if (price > request.maxPriceUsdc) {
      throw new Error(
        `Top miner price ($${price}) exceeds max allowed price ($${request.maxPriceUsdc})`
      );
    }

    // Mock answer generation
    let rawAnswer: unknown;
    if (request.intent === "FX_NOW") {
      rawAnswer = { pair: request.params.pair ?? "EUR/USD", rate: 1.0854, timestamp: Date.now() };
    } else if (request.intent === "WEATHER_FORECAST_VERIFY") {
      rawAnswer = {
        location: request.params.location ?? "London",
        temperatureC: 18.5,
        condition: "Clear",
        forecastTimestamp: Date.now() + 3600000,
      };
    } else if (request.intent === "SANCTIONS_SCREENING_MATCH") {
      rawAnswer = {
        entity: request.params.entity ?? "Unknown Entity",
        matched: false,
        matchScore: 0.0,
        listName: "OFAC-SDN",
      };
    } else if (request.intent === "WEB_SEARCH") {
      rawAnswer = {
        query: request.params.query ?? "Telegraph Protocol",
        snippets: ["Telegraph is an inference and oracle network on Ethereum Sepolia."],
        sources: ["https://anjoman.ai"],
      };
    } else if (request.intent === "QUESTION_ANSWERING") {
      rawAnswer = {
        answer: "Telegraph settles micro-inference on-chain with verifiable receipts.",
        confidence: 0.96,
        citations: ["telegraph://whitepaper#sec-2"],
      };
    } else if (request.intent === "WEATHER_CHECK") {
      rawAnswer = {
        location: request.params.location ?? "London",
        temperatureC: 19.2,
        condition: "Clear",
      };
    } else if (request.intent === "CRYPTO_PRICE") {
      rawAnswer = {
        symbol: request.params.symbol ?? "ETH",
        priceUsd: 2650.45,
        timestamp: Date.now(),
      };
    } else if (request.intent === "TASK_EXECUTION_QUALITY") {
      rawAnswer = {
        score: 95,
        passed: true,
        reasoning: "Task execution adheres to all schema bounds.",
      };
    } else {
      rawAnswer = { raw: true, ts: Date.now() };
    }

    // Validate answer schema
    const validatedAnswer = validateAnswerForIntent(request.intent, rawAnswer);

    const receipt: TelegraphReceipt = {
      minerId: topMiner.id,
      minerAddress: topMiner.address || "0x1111111111111111111111111111111111111111",
      minerRank: topMiner.rank || 1,
      priceUsdc: price,
      txHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
      signalHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
      answer: validatedAnswer,
      confidence: 0.95,
      askedAt: new Date(),
      answeredAt: new Date(),
      outcome: "paid",
      source: "mock",
      verification: "unverified",
    };

    this.requests.set(request.requestId, receipt);
    return receipt;
  }
}

