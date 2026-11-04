import { describe, expect, it, vi } from "vitest";
import { HalfLifeClient } from "./client.js";
import { HalfLifeMcpHandler, HALF_LIFE_MCP_TOOLS } from "./mcp.js";

describe("Half-Life SDK & MCP Integration", () => {
  const validKey = "hl_live_0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

  it("throws if API key format is invalid", () => {
    expect(() => {
      new HalfLifeClient({ apiKey: "invalid_key_prefix" });
    }).toThrowError(/Invalid Half-Life API key format/);
  });

  it("instantiates client with valid key", () => {
    const client = new HalfLifeClient({ apiKey: validKey });
    expect(client).toBeDefined();
  });

  it("exposes standard MCP tool definitions", () => {
    const handler = new HalfLifeMcpHandler(validKey);
    const tools = handler.getTools();

    expect(tools.length).toBe(2);
    expect(tools.map((t) => t.name)).toContain("halflife_ask");
    expect(tools.map((t) => t.name)).toContain("halflife_explain_decision");
  });

  it("handles explain_decision MCP tool", async () => {
    const handler = new HalfLifeMcpHandler(validKey);
    const result = await handler.handleCallTool("halflife_explain_decision", { intent: "FX_NOW" });

    expect(result.content[0].text).toContain("Half-Life Governor evaluates");
    expect(result.content[0].text).toContain("FX_NOW");
  });
});

