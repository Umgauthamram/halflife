import Link from "next/link";
import { requireAdmin } from "../../../../lib/dal";
import { getDb } from "../../../../lib/mongodb";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  await requireAdmin();
  const db = await getDb();

  const logs = await db.collection("audit_log").find({}).sort({ ts: -1 }).limit(100).toArray();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/app/admin/users" className="font-mono text-xs text-[var(--secondary)] hover:underline">
              &larr; Admin Users
            </Link>
            <span className="text-xs text-[var(--secondary)]">&bull;</span>
            <span className="font-mono text-xs text-[var(--secondary)]">Security Audit Trail</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">System Audit Log</h1>
          <p className="mt-1 text-sm text-[var(--secondary)]">
            Immutable, append-only security log of all administrative actions and authorization events.
          </p>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="border border-[var(--border)] bg-[var(--surface)] p-12 text-center text-sm text-[var(--secondary)]">
          No audit events recorded yet.
        </div>
      ) : (
        <div className="overflow-x-auto border border-[var(--border)] bg-[var(--surface)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] bg-[var(--background)] font-mono text-xs text-[var(--secondary)]">
              <tr>
                <th className="px-4 py-3">Timestamp (UTC)</th>
                <th className="px-4 py-3">Actor Type</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {logs.map((log) => {
                const id = log._id.toString();
                const time = new Date(log.ts).toISOString().slice(0, 19).replace("T", " ");

                return (
                  <tr key={id} className="hover:bg-[var(--background)]">
                    <td className="px-4 py-3 font-mono text-xs">{time}</td>
                    <td className="px-4 py-3 font-mono text-xs uppercase text-[var(--secondary)]">
                      {log.actorType ?? "system"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-[var(--foreground)]">
                      {log.action}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--secondary)]">
                      {log.target ?? "n/a"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--secondary)]">
                      {log.detail ? JSON.stringify(log.detail) : "{}"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

