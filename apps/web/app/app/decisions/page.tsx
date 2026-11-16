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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Governor Decisions</h1>
          <p className="mt-1 text-sm text-[var(--secondary)]">
            Every buy-or-reuse decision with its mathematical rationale, age, and noise-floor comparison.
          </p>
        </div>
        <div className="rounded border border-blue-900/30 bg-blue-950/20 px-3 py-1 font-mono text-xs text-blue-300">
          Network: <strong>Ethereum Sepolia (Chain ID 11155111)</strong>
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
                <th className="px-4 py-3 text-right">Drift (Δ)</th>
                <th className="px-4 py-3 text-right">Noise Floor</th>
                <th className="px-4 py-3">Explain: Mathematical Rule</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {decisions.map((d) => {
                const id = d._id.toString();
                const time = new Date(d.createdAt).toISOString().replace("T", " ").slice(0, 19);
                const isBuy = d.action === "buy";
                const isReuse = d.action === "reuse";
                const stake = d.stake || 100;
                const drift = d.inputs?.drift ?? 0;
                const noiseFloor = d.inputs?.noiseFloor ?? 0.002;
                const price = d.inputs?.price ?? 0.01;
                const riskVal = stake * drift;

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
                      ${stake.toFixed(0)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {d.inputs?.ageSeconds !== undefined ? `${d.inputs.ageSeconds.toFixed(1)}s` : "0s"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {drift.toFixed(4)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {noiseFloor.toFixed(4)}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono">
                      {isReuse ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-green-500">
                            {drift <= noiseFloor
                              ? `Δ (${drift.toFixed(4)}) ≤ Noise (${noiseFloor.toFixed(4)}) → Zero new info`
                              : `Stake×Δ ($${riskVal.toFixed(3)}) ≤ Price ($${price.toFixed(3)}) → Risk < Cost`}
                          </span>
                          <span className="text-[10px] text-[var(--secondary)]">Saved $0.010 USDC</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-amber-500">
                            {d.reason.includes("No cached")
                              ? "Cold Start (No cached answer)"
                              : `Stake×Δ ($${riskVal.toFixed(3)}) > Price ($${price.toFixed(3)}) → Freshness justified`}
                          </span>
                          <span className="text-[10px] text-[var(--secondary)]">Purchased on-chain ($0.010)</span>
                        </div>
                      )}
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
