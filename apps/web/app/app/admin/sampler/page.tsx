import Link from "next/link";
import { requireAdmin } from "../../../../lib/dal";
import { getDb } from "../../../../lib/mongodb";
import { toggleSamplerAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminSamplerPage() {
  await requireAdmin();
  const db = await getDb();

  const controlDoc = await db.collection("sampler_control").findOne({ id: "platform_sampler" });
  const samplerStatus = controlDoc?.status ?? "active";
  const isPaused = samplerStatus === "paused";

  const intents = ["FX_NOW", "WEATHER_FORECAST_VERIFY", "SANCTIONS_SCREENING_MATCH"];
  const intentStats = await Promise.all(
    intents.map(async (intent) => {
      const lastSample = await db.collection("atlas_samples").findOne({ intent }, { sort: { ts: -1 } });
      const totalCount = await db.collection("atlas_samples").countDocuments({ intent });
      const gapsCount = await db.collection("atlas_gaps").countDocuments({ intent });

      return {
        intent,
        totalCount,
        gapsCount,
        lastSampleAt: lastSample?.ts ? new Date(lastSample.ts).toISOString().slice(0, 19).replace("T", " ") : "Never",
      };
    })
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/app/admin/users" className="font-mono text-xs text-[var(--secondary)] hover:underline">
              &larr; Admin Users
            </Link>
            <span className="text-xs text-[var(--secondary)]">&bull;</span>
            <span className="font-mono text-xs text-[var(--secondary)]">Platform Sampler</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Sampler Operations</h1>
          <p className="mt-1 text-sm text-[var(--secondary)]">
            Monitor background collection health, intent intervals, and emergency pause controls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/app/admin/users"
            className="rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-mono text-[var(--secondary)] hover:text-[var(--foreground)]"
          >
            Users
          </Link>
          <Link
            href="/app/admin/audit"
            className="rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-mono text-[var(--secondary)] hover:text-[var(--foreground)]"
          >
            Audit Log
          </Link>
          <form action={toggleSamplerAction.bind(null, samplerStatus)}>
            <button
              type="submit"
              className={`rounded px-4 py-1.5 text-xs font-mono font-medium ${
                isPaused
                  ? "border border-green-800 bg-green-50 text-green-800 hover:bg-green-100"
                  : "border border-red-800 bg-red-50 text-red-800 hover:bg-red-100"
              }`}
            >
              {isPaused ? "Resume Platform Sampler" : "Emergency Pause Sampler"}
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="border border-[var(--border)] bg-[var(--surface)] p-6">
          <span className="font-mono text-xs uppercase text-[var(--secondary)]">Sampler Status</span>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${isPaused ? "bg-[var(--error)]" : "bg-[var(--success)]"}`}
            ></span>
            <span className="text-xl font-semibold uppercase font-mono">{samplerStatus}</span>
          </div>
        </div>
        <div className="border border-[var(--border)] bg-[var(--surface)] p-6">
          <span className="font-mono text-xs uppercase text-[var(--secondary)]">Target Network</span>
          <div className="mt-2 text-xl font-semibold">Telegraph Network</div>
          <span className="text-xs font-mono text-[var(--secondary)]">Settlement Layer</span>
        </div>
        <div className="border border-[var(--border)] bg-[var(--surface)] p-6">
          <span className="font-mono text-xs uppercase text-[var(--secondary)]">Daily Cap Limit</span>
          <div className="mt-2 text-xl font-semibold">$10.00 USDC</div>
          <span className="text-xs font-mono text-[var(--secondary)]">Automatic kill switch</span>
        </div>
      </div>

      <div className="overflow-x-auto border border-[var(--border)] bg-[var(--surface)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--background)] font-mono text-xs text-[var(--secondary)]">
            <tr>
              <th className="px-4 py-3">Intent Name</th>
              <th className="px-4 py-3 text-right">Samples Collected</th>
              <th className="px-4 py-3 text-right">Recorded Gaps</th>
              <th className="px-4 py-3">Last Successful Sample (UTC)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {intentStats.map((stat) => (
              <tr key={stat.intent} className="hover:bg-[var(--background)]">
                <td className="px-4 py-3 font-mono text-xs font-semibold">{stat.intent}</td>
                <td className="px-4 py-3 text-right font-mono text-xs">{stat.totalCount}</td>
                <td className="px-4 py-3 text-right font-mono text-xs text-amber-700">{stat.gapsCount}</td>
                <td className="px-4 py-3 font-mono text-xs text-[var(--secondary)]">{stat.lastSampleAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

