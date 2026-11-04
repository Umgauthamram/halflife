import Link from "next/link";
import { getDb } from "../../../lib/mongodb";
import { requireUser } from "../../../lib/dal";

export const dynamic = "force-dynamic";

export default async function LedgerPage() {
  const user = await requireUser();
  const db = await getDb();

  const purchases = await db
    .collection("purchases")
    .find({ ownerId: user.id })
    .sort({ askedAt: -1 })
    .limit(100)
    .toArray();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Purchase Ledger</h1>
          <p className="mt-1 text-sm text-[var(--secondary)]">
            Every transaction executed by your agents, settled on Ethereum Sepolia.
          </p>
        </div>
      </div>

      {purchases.length === 0 ? (
        <div className="border border-[var(--border)] bg-[var(--surface)] p-12 text-center">
          <p className="text-sm text-[var(--secondary)]">No purchases recorded yet.</p>
          <p className="mt-1 text-xs text-[var(--secondary)]">
            Purchases will appear here as your agents query Telegraph or when you test via SDK.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-[var(--border)] bg-[var(--surface)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] bg-[var(--background)] font-mono text-xs text-[var(--secondary)]">
              <tr>
                <th className="px-4 py-3">Time (UTC)</th>
                <th className="px-4 py-3">Intent</th>
                <th className="px-4 py-3">Miner (Rank)</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3">Settlement TX (Sepolia)</th>
                <th className="px-4 py-3">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {purchases.map((p) => {
                const id = p._id.toString();
                const time = new Date(p.askedAt).toISOString().replace("T", " ").slice(0, 19);
                const txShort = p.txHash ? `${p.txHash.slice(0, 10)}...${p.txHash.slice(-6)}` : "n/a";
                const isConfirmed = p.verification === "confirmed";

                return (
                  <tr key={id} className="hover:bg-[var(--background)]">
                    <td className="px-4 py-3 font-mono text-xs">{time}</td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold">{p.intent}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--secondary)]">
                      {p.minerId} (#{p.minerRank})
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-semibold">
                      ${p.priceUsdc?.toFixed(3) ?? "0.010"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {p.txHash ? (
                        <a
                          href={`https://sepolia.etherscan.io/tx/${p.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--foreground)] underline hover:opacity-80"
                        >
                          {txShort} &nearr;
                        </a>
                      ) : (
                        "n/a"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-mono uppercase ${
                          isConfirmed
                            ? "border border-green-800 bg-green-50 text-green-800"
                            : "border border-gray-400 bg-gray-100 text-gray-700"
                        }`}
                      >
                        {p.verification}
                      </span>
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

