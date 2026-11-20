import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { createTelegraphClient } from "./factory.js";
import { MockTelegraphClient } from "./mock.js";

describe("createTelegraphClient factory", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns MockTelegraphClient when TELEGRAPH_MODE=mock and NODE_ENV!=production", () => {
    process.env.TELEGRAPH_MODE = "mock";
    process.env.NODE_ENV = "development";
    const client = createTelegraphClient();
    expect(client).toBeInstanceOf(MockTelegraphClient);
  });

  it("strictly throws when TELEGRAPH_MODE=mock and NODE_ENV=production", () => {
    process.env.TELEGRAPH_MODE = "mock";
    process.env.NODE_ENV = "production";
    expect(() => createTelegraphClient()).toThrow(/strictly forbidden in production/);
  });

  it("throws when in live mode but no operator private key is configured", () => {
    delete process.env.TELEGRAPH_MODE;
    delete process.env.metamask_private_key;
    delete process.env.OPERATOR_PRIVATE_KEY;
    expect(() => createTelegraphClient()).toThrow(/Missing operator private key/);
  });
});
