import Link from "next/link";
import { getDb } from "../../../lib/mongodb";
import { requireUser } from "../../../lib/dal";

export const dynamic = "force-dynamic";

export default async function DecisionsPage() {
  const user = await requireUser();
  const db = await getDb();

  const decisions = await db
    .collection("decisions")
    .find({ ownerId: user.id })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Governor Decisions</h1>
          <p className="mt-1 text-sm text-[var(--secondary)]">
            Every buy-or-reuse decision with its mathematical rationale, age, and noise-floor comparison.
          </p>
        </div>
      </div>

      {decisions.length === 0 ? (
        <div className="border border-[var(--border)] bg-[var(--surface)] p-12 text-center">
          <p className="text-sm text-[var(--secondary)]">No decisions logged yet.</p>
          <p className="mt-1 text-xs text-[var(--secondary)]">
            Decisions will appear here when your agents execute checks via the Governor.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-[var(--border)] bg-[var(--surface)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] bg-[var(--background)] font-mono text-xs text-[var(--secondary)]">
              <tr>
                <th className="px-4 py-3">Time (UTC)</th>
                <th className="px-4 py-3">Intent</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3 text-right">Stake</th>
                <th className="px-4 py-3 text-right">Age</th>
                <th className="px-4 py-3 text-right">Drift</th>
                <th className="px-4 py-3 text-right">Noise Floor</th>
                <th className="px-4 py-3">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {decisions.map((d) => {
                const id = d._id.toString();
                const time = new Date(d.createdAt).toISOString().replace("T", " ").slice(0, 19);
                const isBuy = d.action === "buy";
                const isReuse = d.action === "reuse";

                return (
                  <tr key={id} className="hover:bg-[var(--background)]">
                    <td className="px-4 py-3 font-mono text-xs">{time}</td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold">{d.intent}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-mono uppercase ${
                          isBuy
                            ? "border border-amber-800 bg-amber-50 text-amber-800"
                            : isReuse
                            ? "border border-blue-800 bg-blue-50 text-blue-800"
                            : "border border-gray-400 bg-gray-100 text-gray-700"
                        }`}
                      >
                        {d.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      ${d.stake?.toFixed(0) ?? "100"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {d.inputs?.ageSeconds !== undefined ? `${d.inputs.ageSeconds.toFixed(1)}s` : "0s"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {d.inputs?.drift !== undefined ? d.inputs.drift.toFixed(4) : "0.0000"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {d.inputs?.noiseFloor !== undefined ? d.inputs.noiseFloor.toFixed(4) : "0.0020"}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--secondary)] max-w-xs truncate" title={d.reason}>
                      {d.reason}
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

