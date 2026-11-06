import Link from "next/link";
import { getDb } from "../../lib/mongodb";

export const dynamic = "force-dynamic";

export default async function AtlasPage() {
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
    <div className="flex min-h-screen flex-col bg-[var(--background)] px-6 py-12 text-[var(--foreground)] selection:bg-[var(--foreground)] selection:text-[var(--background)]">
      <div className="mx-auto max-w-5xl w-full">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div>
            <Link href="/" className="font-mono text-xs text-[var(--secondary)] hover:underline">
              &larr; Back to Home
            </Link>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Freshness Atlas</h1>
            <p className="mt-1 text-sm text-[var(--secondary)]">
              Empirical answer decay and independent miner disagreement metrics on Telegraph.
            </p>
          </div>
          <Link
            href="/login"
            className="rounded border border-[var(--border-strong)] bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--background)] hover:opacity-90"
          >
            Sign In to Deploy Agent
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
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

        <div className="mt-12 rounded border border-[var(--border)] bg-[var(--surface)] p-6 text-xs leading-relaxed text-[var(--secondary)]">
          <h2 className="font-semibold text-sm text-[var(--foreground)]">Method &amp; Noise-Floor Rule</h2>
          <p className="mt-2">
            The noise floor represents the median absolute disagreement between two independent miners answering the exact same request at the same timestamp.
            When an old answer&apos;s expected drift is smaller than this disagreement, re-buying adds zero net intelligence.
          </p>
        </div>
      </div>
    </div>
  );
}

