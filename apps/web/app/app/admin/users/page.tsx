import Link from "next/link";
import { requireAdmin } from "../../../../lib/dal";
import { getDb } from "../../../../lib/mongodb";
import { changeUserRoleAction, toggleUserStatusAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const currentAdmin = await requireAdmin();
  const db = await getDb();

  const users = await db.collection("users").find({}).sort({ createdAt: -1 }).toArray();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/app" className="font-mono text-xs text-[var(--secondary)] hover:underline">
              &larr; Back to App
            </Link>
            <span className="text-xs text-[var(--secondary)]">&bull;</span>
            <span className="font-mono text-xs text-[var(--secondary)]">Admin Console</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">User Management</h1>
          <p className="mt-1 text-sm text-[var(--secondary)]">
            Manage member accounts, assign administrative privileges, and view security states.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/app/admin/sampler"
            className="rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-mono text-[var(--secondary)] hover:text-[var(--foreground)]"
          >
            Sampler Controls
          </Link>
          <Link
            href="/app/admin/audit"
            className="rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-mono text-[var(--secondary)] hover:text-[var(--foreground)]"
          >
            Audit Log
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto border border-[var(--border)] bg-[var(--surface)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--background)] font-mono text-xs text-[var(--secondary)]">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last Sign-In</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {users.map((u) => {
              const userId = u._id.toString();
              const isSelf = currentAdmin.id === userId;
              const isAdmin = u.role === "admin";
              const isSuspended = u.status === "suspended";

              return (
                <tr key={userId} className="hover:bg-[var(--background)]">
                  <td className="px-4 py-3">
                    <span className="font-medium">{u.email}</span>
                    {isSelf && (
                      <span className="ml-2 rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--secondary)]">
                        You
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-mono uppercase ${
                        isAdmin
                          ? "border border-purple-800 bg-purple-50 text-purple-800"
                          : "border border-gray-400 bg-gray-100 text-gray-700"
                      }`}
                    >
                      {u.role ?? "member"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-mono uppercase ${
                        !isSuspended
                          ? "text-[var(--success)]"
                          : "text-[var(--error)]"
                      }`}
                    >
                      {u.status ?? "active"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--secondary)]">
                    {u.lastSignInAt ? new Date(u.lastSignInAt).toISOString().slice(0, 16).replace("T", " ") : "Never"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!isSelf && (
                      <div className="flex items-center justify-end gap-2">
                        <form action={changeUserRoleAction.bind(null, userId, isAdmin ? "member" : "admin")}>
                          <button
                            type="submit"
                            className="rounded border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-mono text-[var(--secondary)] hover:text-[var(--foreground)]"
                          >
                            {isAdmin ? "Demote" : "Promote"}
                          </button>
                        </form>

                        <form action={toggleUserStatusAction.bind(null, userId, u.status ?? "active")}>
                          <button
                            type="submit"
                            className="rounded border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-mono text-[var(--secondary)] hover:text-[var(--foreground)]"
                          >
                            {isSuspended ? "Reactivate" : "Suspend"}
                          </button>
                        </form>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

