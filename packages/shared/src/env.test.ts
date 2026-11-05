import { describe, expect, it } from "vitest";
import { validateEnv } from "./env.js";

describe("Strict Environment Boot Validation", () => {
  const validProductionEnv = {
    NODE_ENV: "production",
    AUTH_SECRET: "this_is_a_very_secure_random_32_byte_secret_key_12345",
    AUTH_URL: "https://halflife.app",
    AUTH_GOOGLE_ID: "google-client-id.apps.googleusercontent.com",
    AUTH_GOOGLE_SECRET: "google-client-secret-value",
    ADMIN_EMAILS: "admin@halflife.app",
    MONGODB_URI_WEB: "mongodb+srv://web:pass@cluster.mongodb.net/halflife",
    MONGODB_URI_WORKER: "mongodb+srv://worker:pass@cluster.mongodb.net/halflife",
    DB_NAME: "halflife",
    KEY_ENCRYPTION_KEY: "this_is_a_master_key_for_envelope_encryption_32b",
    CHAIN_ID: "11155111",
    SEPOLIA_RPC_URL: "https://rpc.sepolia.org",
    TELEGRAPH_CONTRACT: "0x3624EB012B5E998BB57B6bE6C9Cfc9c4bc5eb99b",
    TELEGRAPH_NODE_URL: "http://127.0.0.1:8000",
    USDC_ADDRESS: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    SAMPLER_DAILY_CAP_USDC: "10.0",
  };

  it("successfully passes validation with complete production environment", () => {
    const result = validateEnv(validProductionEnv);
    expect(result.NODE_ENV).toBe("production");
    expect(result.CHAIN_ID).toBe("11155111");
    expect(result.ADMIN_EMAILS).toContain("admin@halflife.app");
  });

  it("strictly throws and aborts boot in production when AUTH_SECRET is missing", () => {
    const invalidEnv = { ...validProductionEnv, AUTH_SECRET: undefined };
    expect(() => validateEnv(invalidEnv as any)).toThrowError(/Invalid environment configuration/);
  });

  it("strictly throws when AUTH_SECRET is shorter than 32 characters", () => {
    const invalidEnv = { ...validProductionEnv, AUTH_SECRET: "too_short" };
    expect(() => validateEnv(invalidEnv)).toThrowError(/AUTH_SECRET must be at least 32 characters/);
  });

  it("strictly throws when KEY_ENCRYPTION_KEY is missing in production", () => {
    const invalidEnv = { ...validProductionEnv, KEY_ENCRYPTION_KEY: "" };
    expect(() => validateEnv(invalidEnv)).toThrowError(/KEY_ENCRYPTION_KEY/);
  });

  it("strictly throws when MONGODB_URI_WEB does not start with mongodb", () => {
    const invalidEnv = { ...validProductionEnv, MONGODB_URI_WEB: "invalid_uri" };
    expect(() => validateEnv(invalidEnv)).toThrowError(/MONGODB_URI_WEB/);
  });
});

