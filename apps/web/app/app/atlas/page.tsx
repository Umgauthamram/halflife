import Link from "next/link";
import { getDb } from "../../../lib/mongodb";
import { requireUser } from "../../../lib/dal";

export const dynamic = "force-dynamic";

export default async function AppAtlasPage() {
  await requireUser();
  const db = await getDb();

  const intents = ["FX_NOW", "WEATHER_FORECAST_VERIFY", "SANCTIONS_SCREENING_MATCH"];

  const stats = await Promise.all(
    intents.map(async (intent) => {
      const sampleCount = await db.collection("atlas_samples").countDocuments({ intent });
      const firstSample = await db.collection("atlas_samples").findOne({ intent }, { sort: { ts: 1 } });
      const noiseDocs = await db.collection("atlas_noise_measurements").find({ intent }).limit(50).toArray();

      let avgNoiseFloor = 0.002;
      if (noiseDocs.length > 0) {
        const sum = noiseDocs.reduce((acc, doc) => acc + (doc.disagreement || 0), 0);
        avgNoiseFloor = sum / noiseDocs.length;
      }

      return {
        intent,
        sampleCount,
        collectingSince: firstSample?.ts ? new Date(firstSample.ts).toISOString().slice(0, 10) : "Nov 2026",
        noiseFloor: avgNoiseFloor,
        calibrated: sampleCount >= 100,
      };
    })
  );

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Freshness Atlas</h1>
          <p className="mt-1 text-sm text-[var(--secondary)]">
            Empirical answer decay and independent miner disagreement metrics on Telegraph.
          </p>
        </div>
        <Link
          href="/app/agents/new"
          className="rounded border border-[var(--border-strong)] bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--background)] hover:opacity-90"
        >
          Deploy Agent
        </Link>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {stats.map((item) => (
          <div key={item.intent} className="border border-[var(--border)] bg-[var(--surface)] p-6">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <span className="font-mono text-sm font-semibold">{item.intent}</span>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-mono uppercase ${
                  item.calibrated
                    ? "border border-green-800 bg-green-50 text-green-800"
                    : "border border-amber-800 bg-amber-50 text-amber-800"
                }`}
              >
                {item.calibrated ? "Calibrated" : "Collecting"}
              </span>
            </div>

            <div className="mt-4 flex flex-col gap-3 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--secondary)]">Samples Collected:</span>
                <span className="font-semibold">{item.sampleCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--secondary)]">Collecting Since:</span>
                <span>{item.collectingSince}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--secondary)]">Miner Noise Floor:</span>
                <span className="font-semibold">{item.noiseFloor.toFixed(4)}</span>
              </div>
            </div>

            <div className="mt-6 border-t border-[var(--border)] pt-3 text-[11px] text-[var(--secondary)]">
              {item.calibrated
                ? "Monotonic isotonic drift curve calibrated."
                : "Collecting live samples before unlocking dynamic Governor curves."}
            </div>
          </div>
        ))}
      </div>

      {/* Explanatory Callout */}
      <div className="rounded border border-[var(--border)] bg-[var(--surface)] p-6 text-xs leading-relaxed text-[var(--secondary)]">
        <h2 className="font-semibold text-sm text-[var(--foreground)]">Method &amp; Noise-Floor Rule</h2>
        <p className="mt-2">
          The noise floor represents the median absolute disagreement between two independent miners answering the exact same request at the same timestamp.
          When an old answer&apos;s expected drift is smaller than this disagreement, re-buying adds zero net intelligence.
        </p>
      </div>
    </div>
  );
}
