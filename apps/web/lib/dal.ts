import { ObjectId } from "mongodb";
import { auth } from "../auth";
import { getDb } from "./mongodb";
import type { User, UserRole } from "@half-life/shared";

export class HttpError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = "HttpError";
  }
}

/**
 * Validates the caller's session and verifies active status from the database.
 * Never trusts client session alone.
 */
export async function requireUser(): Promise<User> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new HttpError(401, "Authentication required");
  }

  const db = await getDb();
  let queryId: string | ObjectId = session.user.id;
  try {
    queryId = new ObjectId(session.user.id);
  } catch {
    // Keep as string if not a valid ObjectId
  }

  const userDoc = await db.collection("users").findOne({
    $or: [{ _id: queryId as unknown as ObjectId }, { id: session.user.id }],
  });

  if (!userDoc || userDoc.status !== "active") {
    throw new HttpError(403, "Account is not active or has been suspended");
  }

  return {
    id: userDoc._id.toString(),
    email: userDoc.email,
    name: userDoc.name ?? null,
    image: userDoc.image ?? null,
    role: (userDoc.role as UserRole) || "member",
    status: userDoc.status,
    lastSignInAt: userDoc.lastSignInAt,
    createdAt: userDoc.createdAt ?? new Date(),
  };
}

/**
 * Enforces admin role check fresh from the database.
 */
export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "admin") {
    throw new HttpError(403, "Administrator privileges required");
  }
  return user;
}

/**
 * Enforces resource ownership scoped to the authenticated member.
 * Foreign or non-existent resources always return null to prevent ID enumeration.
 */
export async function getOwnedAgent(ownerId: string, agentId: string) {
  const db = await getDb();
  let queryId: string | ObjectId = agentId;
  try {
    queryId = new ObjectId(agentId);
  } catch {
    // string ID
  }

  return db.collection("agents").findOne({
    _id: queryId as unknown as ObjectId,
    ownerId,
  });
}

/**
 * Guard preventing removal of the last administrator.
 */
export async function assertNotLastAdmin(targetUserId: string, newRole: UserRole): Promise<void> {
  if (newRole === "admin") return;

  const db = await getDb();
  const adminCount = await db.collection("users").countDocuments({
    role: "admin",
    status: "active",
  });

  let queryId: string | ObjectId = targetUserId;
  try {
    queryId = new ObjectId(targetUserId);
  } catch {}

  const targetUser = await db.collection("users").findOne({
    $or: [{ _id: queryId as unknown as ObjectId }, { id: targetUserId }],
  });

  if (targetUser?.role === "admin" && adminCount <= 1) {
    throw new HttpError(400, "Cannot demote or deactivate the last active administrator");
  }
}

/**
 * Guard preventing users from modifying their own administrative status.
 */
export function assertNotSelfModification(currentUserId: string, targetUserId: string): void {
  if (currentUserId === targetUserId) {
    throw new HttpError(400, "Administrators cannot modify their own roles or active status");
  }
}

