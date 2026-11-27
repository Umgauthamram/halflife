import { HalfLifeClient, type AskOptions, type AskResponse, type HalfLifeClientConfig } from "./client.js";

export interface OpenClawAgentContext {
  agentId: string;
  agentName: string;
  walletAddress: string;
  stakeUsdc?: number;
  localMemory?: Record<string, unknown>;
}

export interface ClawHubHeartbeatResult {
  agentId: string;
  intent: string;
  action: "BUY_FRESH" | "REUSE_CACHE" | "CIRCUIT_BREAKER";
  answer: unknown;
  costUsdc: number;
  txHash?: string;
  timestamp: number;
  reason: string;
}

/**
 * ClawHub Skill: Half-Life Freshness Governor for OpenClaw.
 * Wires Telegraph into an OpenClaw instance's heartbeat loop,
 * ensuring 24/7 self-hosted agents purchase fresh verified answers
 * only when mathematical answer decay warrants it.
 */
export class OpenClawHeartbeatHook {
  private client: HalfLifeClient;
  private totalSpendUsdc = 0;
  private receipts: string[] = [];

  constructor(config: HalfLifeClientConfig) {
    this.client = new HalfLifeClient(config);
  }

  /**
   * Heartbeat cycle trigger for OpenClaw.
   * Called on every heartbeat interval (e.g. every 60s).
   */
  async onHeartbeat(
    ctx: OpenClawAgentContext,
    intent: "WEB_SEARCH" | "QUESTION_ANSWERING" | "WEATHER_CHECK_TEMPERATURE" | "CRYPTO_PRICE" | string,
    params: Record<string, unknown>
  ): Promise<ClawHubHeartbeatResult> {
    const askOptions: AskOptions = {
      intent,
      params,
      stake: ctx.stakeUsdc ?? 10.0,
    };

    const response: AskResponse = await this.client.ask(askOptions);

    if (response.action === "buy") {
      this.totalSpendUsdc += 0.01;
      if (response.txHash) {
        this.receipts.push(response.txHash);
      }
    }

    return {
      agentId: ctx.agentId,
      intent,
      action: response.action === "buy" ? "BUY_FRESH" : "REUSE_CACHE",
      answer: response.answer,
      costUsdc: response.action === "buy" ? 0.01 : 0,
      txHash: response.txHash,
      timestamp: Date.now(),
      reason: response.reason,
    };
  }

  getMetrics() {
    return {
      totalSpendUsdc: this.totalSpendUsdc,
      receiptsCount: this.receipts.length,
      recentReceipts: [...this.receipts].reverse().slice(0, 10),
    };
  }
}
