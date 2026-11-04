import crypto from "node:crypto";

export interface HalfLifeClientConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface AskOptions {
  intent: string;
  params: Record<string, unknown>;
  stake?: number;
  requestId?: string;
}

export interface AskResponse<T = unknown> {
  action: "buy" | "reuse" | "refuse";
  reason: string;
  answer?: T;
  ageSeconds: number;
  purchaseId?: string;
  txHash?: string;
  verification?: string;
  error?: string;
}

export class HalfLifeClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: HalfLifeClientConfig) {
    if (!config.apiKey || !config.apiKey.startsWith("hl_live_")) {
      throw new Error("Invalid Half-Life API key format (expected 'hl_live_...')");
    }
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl || "http://localhost:3000").replace(/\/$/, "");
  }

  /**
   * Asks an intelligence intent through the Half-Life Governor.
   * Transparently handles buy vs. reuse evaluation, on-chain verification, and receipt logging.
   */
  async ask<T = unknown>(options: AskOptions): Promise<AskResponse<T>> {
    const requestId = options.requestId || `sdk_${crypto.randomUUID()}`;

    const res = await fetch(`${this.baseUrl}/api/v1/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        intent: options.intent,
        params: options.params,
        stake: options.stake,
        requestId,
      }),
    });

    const data = (await res.json().catch(() => ({}))) as Record<string, any>;
    if (!res.ok) {
      throw new Error(`[HalfLifeClient] Request failed (${res.status}): ${data.error || res.statusText}`);
    }

    return data as AskResponse<T>;
  }
}
