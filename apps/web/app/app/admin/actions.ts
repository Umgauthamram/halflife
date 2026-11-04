"use server";

import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { requireAdmin, assertNotLastAdmin, assertNotSelfModification } from "../../../lib/dal";
import { getDb } from "../../../lib/mongodb";
import type { UserRole, UserStatus } from "@half-life/shared";

export async function changeUserRoleAction(targetUserId: string, newRole: UserRole) {
  const admin = await requireAdmin();
  assertNotSelfModification(admin.id, targetUserId);
  await assertNotLastAdmin(targetUserId, newRole);

  const db = await getDb();
  let queryId: string | ObjectId = targetUserId;
  try {
    queryId = new ObjectId(targetUserId);
  } catch {}

  await db.collection("users").updateOne(
    { $or: [{ _id: queryId as unknown as ObjectId }, { id: targetUserId }] },
    { $set: { role: newRole } }
  );

  // Write append-only audit log
  await db.collection("audit_log").insertOne({
    ts: new Date(),
    actorType: "admin",
    actorId: admin.id,
    action: "user.role_change",
    target: targetUserId,
    detail: { newRole },
  });

  revalidatePath("/app/admin/users");
}

export async function toggleUserStatusAction(targetUserId: string, currentStatus: string) {
  const admin = await requireAdmin();
  assertNotSelfModification(admin.id, targetUserId);

  const newStatus: UserStatus = currentStatus === "active" ? "suspended" : "active";
  const db = await getDb();

  let queryId: string | ObjectId = targetUserId;
  try {
    queryId = new ObjectId(targetUserId);
  } catch {}

  await db.collection("users").updateOne(
    { $or: [{ _id: queryId as unknown as ObjectId }, { id: targetUserId }] },
    { $set: { status: newStatus } }
  );

  // Write append-only audit log
  await db.collection("audit_log").insertOne({
    ts: new Date(),
    actorType: "admin",
    actorId: admin.id,
    action: "user.status_change",
    target: targetUserId,
    detail: { newStatus },
  });

  revalidatePath("/app/admin/users");
}

export async function toggleSamplerAction(currentStatus: string) {
  const admin = await requireAdmin();
  const newStatus = currentStatus === "active" ? "paused" : "active";
  const db = await getDb();

  await db.collection("sampler_control").updateOne(
    { id: "platform_sampler" },
    { $set: { status: newStatus, updatedBy: admin.id, updatedAt: new Date() } },
    { upsert: true }
  );

  // Write append-only audit log
  await db.collection("audit_log").insertOne({
    ts: new Date(),
    actorType: "admin",
    actorId: admin.id,
    action: "sampler.status_change",
    target: "platform_sampler",
    detail: { newStatus },
  });

  revalidatePath("/app/admin/sampler");
}

