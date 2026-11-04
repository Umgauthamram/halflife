import type { KnownIntent, Miner } from "@half-life/shared";
export interface AskRequest {
    intent: KnownIntent | string;
    params: Record<string, unknown>;
    maxPriceUsdc: number;
    paymentMode: "x402" | "escrow";
    requestId: string;
}
export interface TelegraphReceipt {
    minerId: string;
    minerAddress: string;
    minerRank: number;
    priceUsdc: number;
    txHash: string;
    signalHash: string;
    answer: unknown;
    confidence?: number;
    askedAt: Date;
    answeredAt: Date;
}
export interface TelegraphClient {
    listIntents(): Promise<string[]>;
    listMiners(intent: string): Promise<Miner[]>;
    ask(request: AskRequest): Promise<TelegraphReceipt>;
}
//# sourceMappingURL=client.d.ts.map