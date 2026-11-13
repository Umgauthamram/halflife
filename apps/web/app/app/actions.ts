"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "../../lib/dal";
import { getDb } from "../../lib/mongodb";
import { ObjectId } from "mongodb";

export interface BlockApiKeyInput {
  keyId: string;
  reason: string;
  confirmationWord: string;
}

export async function blockApiKeyAction({
  keyId,
  reason,
  confirmationWord,
}: BlockApiKeyInput) {
  const user = await requireUser();

  if (confirmationWord?.trim().toUpperCase() !== "DELETE") {
    return {
      success: false,
      error: "Confirmation failed: You must type the word 'DELETE' to block this key.",
    };
  }

  const cleanReason = reason?.trim();
  if (!cleanReason) {
    return {
      success: false,
      error: "A valid reason is required to block an API key.",
    };
  }

  const db = await getDb();
  let queryId: string | ObjectId = keyId;
  try {
    queryId = new ObjectId(keyId);
  } catch {}

  const keyDoc = await db.collection("api_keys").findOne({
    _id: queryId as unknown as ObjectId,
    ownerId: user.id,
  });

  if (!keyDoc) {
    return {
      success: false,
      error: "API key not found or you do not have permission to modify it.",
    };
  }

  if (keyDoc.revokedAt) {
    return {
      success: false,
      error: "This API key has already been blocked and revoked.",
    };
  }

  const now = new Date();

  // 1. Mark key as revoked with reason
  await db.collection("api_keys").updateOne(
    { _id: keyDoc._id },
    {
      $set: {
        revokedAt: now,
        revocationReason: cleanReason,
        revokedBy: user.id,
      },
    }
  );

  // 2. Append immutable record to audit_log
  await db.collection("audit_log").insertOne({
    ts: now,
    actorType: "USER",
    actorId: user.id,
    action: "api_key.blocked",
    target: keyDoc.prefix || "hl_live_...",
    detail: {
      keyId: keyDoc._id.toString(),
      agentId: keyDoc.agentId,
      prefix: keyDoc.prefix,
      reason: cleanReason,
    },
  });

  revalidatePath("/app");
  revalidatePath("/app/agents");
  revalidatePath("/app/playground");

  return {
    success: true,
    message: `API Key ${keyDoc.prefix}... has been permanently blocked.`,
  };
}

