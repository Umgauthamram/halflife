import { describe, expect, it } from "vitest";
import { hashApiKey } from "../lib/api-key";

describe("API Key Security Utilities", () => {
  it("computes deterministic SHA-256 hash in hex format", () => {
    const rawKey = "hl_live_0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    const hash1 = hashApiKey(rawKey);
    const hash2 = hashApiKey(rawKey);

    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[0-9a-f]{64}$/);
    expect(hash1).not.toBe(rawKey);
  });
});

