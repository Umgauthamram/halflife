import type { KnownIntent, Miner } from "@half-life/shared";

export type PurchaseOutcome = "paid" | "failed_paid" | "failed" | "blocked";

export interface AskRequest {
  intent: KnownIntent | string;
  params: Record<string, unknown>;
  maxPriceUsdc: number;
  paymentMode: "x402" | "escrow";
  requestId: string;
  minerId?: string; // named miner path for deterministic sampling
}

export interface TelegraphReceipt {
  minerId: string;
  minerName?: string;
  minerAddress: string;
  minerRank: number;
  priceUsdc: number;
  txHash: string;
  receiptHash?: string;
  signalHash: string;
  answer: unknown;
  confidence?: number;
  askedAt: Date;
  answeredAt: Date;
  outcome: PurchaseOutcome;
}

export interface TelegraphClient {
  listIntents(): Promise<string[]>;
  listMiners(intent: string): Promise<Miner[]>;
  ask(request: AskRequest): Promise<TelegraphReceipt>;
}
