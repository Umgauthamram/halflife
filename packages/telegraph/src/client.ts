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

export interface TelegraphQuote {
  priceUsdc: number;
  payTo: string;
  asset: string;
  network: string;
  amountRaw: bigint;
  resource: string;
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
  latencyMs?: number;
  outcome: PurchaseOutcome;
  free?: boolean;
  source?: "live" | "mock";
  verification?: "confirmed" | "unverified" | "failed";
  signalVerification?: string;
  error?: string;
  payTo?: string;
  amountRaw?: bigint;
  asset?: string;
  payer?: string;
}

export interface TelegraphClient {
  readonly source: "live" | "mock";
  listIntents(): Promise<string[]>;
  listMiners(intent: string): Promise<Miner[]>;
  quote(request: AskRequest): Promise<TelegraphQuote>;
  ask(request: AskRequest): Promise<TelegraphReceipt>;
}
