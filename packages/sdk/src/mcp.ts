import { HalfLifeClient, type AskResponse } from "./client.js";

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export const HALF_LIFE_MCP_TOOLS: McpToolDefinition[] = [
  {
    name: "halflife_ask",
    description:
      "Queries an intelligence intent through the Half-Life Governor. Decides buy vs. reuse dynamically based on empirical drift, miner noise floor, and stake at risk.",
    inputSchema: {
      type: "object",
      properties: {
        intent: {
          type: "string",
          description: "Target Telegraph intent, e.g. 'FX_NOW', 'WEATHER_FORECAST_VERIFY', 'SANCTIONS_SCREENING_MATCH'",
        },
        params: {
          type: "object",
          description: "Intent-specific parameters, e.g. { 'pair': 'EUR/USD' }",
        },
        stake: {
          type: "number",
          description: "Economic value at risk for this decision in USD (default: $100)",
        },
      },
      required: ["intent", "params"],
    },
  },
  {
    name: "halflife_explain_decision",
    description: "Returns the decay and noise floor rules that determine whether an answer is fresh or stale.",
    inputSchema: {
      type: "object",
      properties: {
        intent: { type: "string" },
      },
      required: ["intent"],
    },
  },
];

export class HalfLifeMcpHandler {
  private client: HalfLifeClient;

  constructor(apiKey: string, baseUrl?: string) {
    this.client = new HalfLifeClient({ apiKey, baseUrl });
  }

  getTools(): McpToolDefinition[] {
    return HALF_LIFE_MCP_TOOLS;
  }

  async handleCallTool(toolName: string, args: Record<string, any>): Promise<{ content: Array<{ type: string; text: string }> }> {
    if (toolName === "halflife_ask") {
      const result: AskResponse = await this.client.ask({
        intent: args.intent,
        params: args.params,
        stake: args.stake,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (toolName === "halflife_explain_decision") {
      return {
        content: [
          {
            type: "text",
            text: `Half-Life Governor evaluates: Buy only if (stake * expectedDrift > price) AND (expectedDrift > noiseFloor). For ${args.intent}, answers are reused if miner disagreement exceeds expected drift.`,
          },
        ],
      };
    }

    throw new Error(`Unknown MCP tool: ${toolName}`);
  }
}

