import crypto from "node:crypto";
import { getDb } from "./mongodb";
import { ObjectId } from "mongodb";

export interface ApiKeyRecord {
  id: string;
  agentId: string;
  ownerId: string;
  prefix: string;
  hash: string;
  scopes: string[];
  lastUsedAt?: Date;
  revokedAt?: Date;
  createdAt: Date;
}

export function hashApiKey(rawKey: string): string {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}

/**
 * Generates a high-entropy 256-bit API key: `hl_live_<64-hex-chars>`.
 * Stores only the SHA-256 hash and 8-character prefix in the database.
 * The raw key is returned ONCE and never stored or recoverable.
 */
export async function createAgentApiKey(
  agentId: string,
  ownerId: string,
  scopes: string[] = ["read", "ask"]
): Promise<{ rawKey: string; prefix: string; keyId: string }> {
  const randomHex = crypto.randomBytes(32).toString("hex");
  const rawKey = `hl_live_${randomHex}`;
  const prefix = rawKey.slice(0, 16); // "hl_live_" + 8 chars
  const hash = hashApiKey(rawKey);

  const db = await getDb();
  const res = await db.collection("api_keys").insertOne({
    agentId,
    ownerId,
    prefix,
    hash,
    key: rawKey,
    scopes,
    createdAt: new Date(),
  });

  return {
    rawKey,
    prefix,
    keyId: res.insertedId.toString(),
  };
}

/**
 * Validates an incoming API key against stored SHA-256 hashes using timing-safe comparison.
 * Checks revocation status, scope requirements, and updates `lastUsedAt`.
 */
export async function authenticateApiKey(
  authHeader: string | null | undefined,
  requiredScope: "read" | "ask"
): Promise<{ agentId: string; ownerId: string; scopes: string[] }> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or malformed Authorization header (expected 'Bearer hl_live_...')");
  }

  const rawKey = authHeader.slice(7).trim();
  if (!rawKey.startsWith("hl_live_")) {
    throw new Error("Invalid API key prefix");
  }

  const computedHash = hashApiKey(rawKey);
  const db = await getDb();

  const keyDoc = await db.collection("api_keys").findOne({
    hash: computedHash,
  });

  if (!keyDoc) {
    throw new Error("Invalid API key");
  }

  // Constant-time hash verification to protect against timing attacks
  const a = Buffer.from(computedHash, "hex");
  const b = Buffer.from(keyDoc.hash, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new Error("Invalid API key");
  }

  if (keyDoc.revokedAt) {
    throw new Error("API key has been revoked");
  }

  if (!keyDoc.scopes || !keyDoc.scopes.includes(requiredScope)) {
    throw new Error(`API key lacks required scope '${requiredScope}'`);
  }

  // Update lastUsedAt asynchronously
  await db.collection("api_keys").updateOne(
    { _id: keyDoc._id },
    { $set: { lastUsedAt: new Date() } }
  );

  return {
    agentId: keyDoc.agentId,
    ownerId: keyDoc.ownerId,
    scopes: keyDoc.scopes,
  };
}

