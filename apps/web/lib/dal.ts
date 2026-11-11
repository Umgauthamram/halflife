import { ObjectId } from "mongodb";
import { cache } from "react";
import { auth } from "../auth";
import { getDb } from "./mongodb";
import type { User, UserRole, UserStatus } from "@half-life/shared";

export class HttpError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = "HttpError";
  }
}

/**
 * Validates the caller's session and verifies active status from the database.
 * Memoized per request lifecycle using React cache() to prevent redundant DB calls across layout and pages.
 */
export const requireUser = cache(async (): Promise<User> => {
  const session = await auth();
  if (!session?.user?.id && !session?.user?.email) {
    throw new HttpError(401, "Authentication required");
  }

  const db = await getDb();
  const email = (session.user.email || "").toLowerCase();

  let queryId: string | ObjectId = session.user.id || "";
  try {
    if (session.user.id && ObjectId.isValid(session.user.id)) {
      queryId = new ObjectId(session.user.id);
    }
  } catch {
    // Keep as string if not a valid ObjectId
  }

  const queryConditions: Record<string, unknown>[] = [];
  if (session.user.id) {
    queryConditions.push({ id: session.user.id });
    if (ObjectId.isValid(session.user.id)) {
      queryConditions.push({ _id: queryId as unknown as ObjectId });
    }
  }
  if (email) {
    queryConditions.push({ email });
  }

  let userDoc = await db.collection("users").findOne({
    $or: queryConditions,
  });

  const adminList = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const role: UserRole = (userDoc?.role as UserRole) || (adminList.includes(email) ? "admin" : "member");
  const status: UserStatus = (userDoc?.status as UserStatus) || "active";

  if (status !== "active") {
    throw new HttpError(403, "Account is not active or has been suspended");
  }

  // Self-heal user document if newly created by adapter or missing role/status
  if (!userDoc || !userDoc.role || !userDoc.status) {
    await db.collection("users").updateOne(
      { email },
      {
        $set: {
          role,
          status,
          lastSignInAt: new Date(),
          updatedAt: new Date(),
        },
        $setOnInsert: {
          email,
          name: session.user.name ?? null,
          image: session.user.image ?? null,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    userDoc = await db.collection("users").findOne({ email });
  }

  return {
    id: userDoc?._id?.toString() || session.user.id || "",
    email: userDoc?.email || email,
    name: userDoc?.name ?? session.user.name ?? null,
    image: userDoc?.image ?? session.user.image ?? null,
    role,
    status,
    lastSignInAt: userDoc?.lastSignInAt || new Date(),
    createdAt: userDoc?.createdAt ?? new Date(),
  };
});

/**
 * Enforces admin role check fresh from the database (memoized per request).
 */
export const requireAdmin = cache(async (): Promise<User> => {
  const user = await requireUser();
  if (user.role !== "admin") {
    throw new HttpError(403, "Administrator privileges required");
  }
  return user;
});

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

