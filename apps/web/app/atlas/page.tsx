import Link from "next/link";
import { getDb } from "../../lib/mongodb";
import { getActiveAtlasIntents } from "../../lib/intents";

export const dynamic = "force-dynamic";

export default async function AtlasPage() {
  const db = await getDb();

  const totalLiveSamples = await db
    .collection("atlas_samples")
    .countDocuments({ source: "live", valueNorm: { $ne: null } });

  const intents = await getActiveAtlasIntents(db);

  const stats = await Promise.all(
    intents.map(async (intent) => {
      const [liveSampleCount, firstSample, latestSample, statsDoc, noiseDocs] = await Promise.all([
        db.collection("atlas_samples").countDocuments({ intent, source: "live", valueNorm: { $ne: null } }),
        db.collection("atlas_samples").findOne({ intent, source: "live", valueNorm: { $ne: null } }, { sort: { ts: 1 } }),
        db.collection("atlas_samples").findOne({ intent, source: "live", valueNorm: { $ne: null } }, { sort: { ts: -1 } }),
        db.collection("atlas_stats").findOne({ intent }),
        db.collection("atlas_noise_measurements").find({ intent }).sort({ ts: -1 }).limit(5).toArray(),
      ]);

      let timeSpanHours = 0;
      if (firstSample && latestSample) {
        timeSpanHours = Math.max(
          0,
          (new Date(latestSample.ts).getTime() - new Date(firstSample.ts).getTime()) / 3600000
        );
      }

      const isCalibrated = Boolean(statsDoc?.calibrated && liveSampleCount >= 30 && timeSpanHours >= 6.0);
      const label = isCalibrated
        ? `CALIBRATED (${liveSampleCount} samples over ${timeSpanHours.toFixed(1)}h)`
        : `PRIOR (not measured) - ${liveSampleCount} samples`;

      const noiseFloor: number | null =
        typeof statsDoc?.noiseFloor === "number" && (isCalibrated || noiseDocs.length > 0)
          ? statsDoc.noiseFloor
          : null;
      const driftCurve = isCalibrated && Array.isArray(statsDoc?.driftCurve) ? statsDoc.driftCurve : [];

      return {
        intent,
        liveSampleCount,
        timeSpanHours: Number(timeSpanHours.toFixed(1)),
        lastUpdated: latestSample?.ts
          ? new Date(latestSample.ts).toISOString().replace("T", " ").slice(0, 19) + " UTC"
          : "no data yet",
        noiseFloor,
        driftCurve,
        isCalibrated,
        label,
        disagreeingMiners: noiseDocs.map((d) => ({
          pair: `${d.miner1Id} vs ${d.miner2Id}`,
          disagreement: typeof d.disagreement === "number" ? d.disagreement.toFixed(4) : "0.0000",
          time: new Date(d.ts).toISOString().replace("T", " ").slice(0, 19),
        })),
      };
    })
  );

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] px-6 lg:px-12 py-12 text-[var(--foreground)] selection:bg-[var(--foreground)] selection:text-[var(--background)]">
      <div className="mx-auto w-full max-w-7xl">
        {/* Navigation Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-6">
          <div>
            <Link href="/" className="font-mono text-xs text-[var(--secondary)] hover:underline">
              &larr; Back to Home
            </Link>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Freshness Atlas</h1>
            <p className="mt-1 text-sm text-[var(--secondary)]">
              Public empirical decay curves and independent miner disagreement metrics on Ethereum Sepolia.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/api/public/status"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 font-mono text-xs hover:border-[var(--border-strong)]"
            >
              System Status &nearr;
            </a>
            <a
              href="/api/public/dataset"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 font-mono text-xs hover:border-[var(--border-strong)]"
            >
              Download Dataset (Merkle Root) &nearr;
            </a>
            <Link
              href="/login"
              className="rounded border border-[var(--border-strong)] bg-[var(--foreground)] px-4 py-1.5 text-xs font-medium text-[var(--background)] hover:opacity-90"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-6 flex items-center justify-between rounded border border-blue-900/30 bg-blue-950/20 px-4 py-2.5 font-mono text-xs text-blue-300">
          <span>Target Network: <strong>Ethereum Sepolia (Chain ID 11155111)</strong></span>
          <span>USDC Contract: <strong>0xcc19...Ae17</strong></span>
          <span>Telegraph Contract: <strong>0x3624...b99b</strong></span>
        </div>

        {/* Notice when 0 live samples */}
        {totalLiveSamples === 0 && (
          <div className="mt-6 rounded border border-amber-900/40 bg-amber-950/20 p-4 text-center font-mono">
            <div className="text-sm font-semibold text-amber-300">
              No live empirical measurements yet.
            </div>
            <p className="mt-1 text-xs text-amber-200/80 max-w-xl mx-auto leading-relaxed">
              Empirical decay curves and noise floors are calibrated only from real, cryptographically-confirmed
              live samples on Ethereum Sepolia (at least 30 samples spanning 6+ hours).
            </p>
          </div>
        )}

        {/* Intent Cards */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {stats.map((item) => (
            <div key={item.intent} className="border border-[var(--border)] bg-[var(--surface)] p-6">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <span className="font-mono text-base font-semibold">{item.intent}</span>
                <span
                  className={`rounded px-2.5 py-1 text-[11px] font-mono uppercase font-semibold ${
                    item.isCalibrated
                      ? "border border-green-800 bg-green-50 text-green-800"
                      : "border border-amber-800 bg-amber-50 text-amber-800"
                  }`}
                >
                  {item.label}
                </span>
              </div>

              {/* Stats Grid */}
              <div className="mt-4 grid grid-cols-2 gap-4 font-mono text-xs sm:grid-cols-4">
                <div className="flex flex-col border border-[var(--border)] bg-[var(--background)] p-3">
                  <span className="text-[var(--secondary)]">Live Samples</span>
                  <span className="mt-1 font-semibold text-sm">{item.liveSampleCount} samples</span>
                </div>
                <div className="flex flex-col border border-[var(--border)] bg-[var(--background)] p-3">
                  <span className="text-[var(--secondary)]">Noise Floor</span>
                  <span className="mt-1 font-semibold text-sm">
                    {item.noiseFloor !== null ? item.noiseFloor.toFixed(4) : "no data yet"}
                  </span>
                </div>
                <div className="flex flex-col border border-[var(--border)] bg-[var(--background)] p-3">
                  <span className="text-[var(--secondary)]">Time Window</span>
                  <span className="mt-1 font-semibold text-sm">{item.timeSpanHours}h</span>
                </div>
                <div className="flex flex-col border border-[var(--border)] bg-[var(--background)] p-3">
                  <span className="text-[var(--secondary)]">Last Sample</span>
                  <span className="mt-1 font-semibold text-xs truncate" title={item.lastUpdated}>
                    {item.lastUpdated}
                  </span>
                </div>
              </div>

              {/* Decay Curve Table */}
              {item.driftCurve.length > 0 && item.noiseFloor !== null ? (
                <div className="mt-6">
                  <div className="font-mono text-xs font-semibold text-[var(--secondary)] mb-2">
                    EMPIRICAL DECAY CURVE (Measured Drift)
                  </div>
                  <div className="overflow-x-auto border border-[var(--border)] bg-[var(--background)]">
                    <table className="w-full text-left font-mono text-xs">
                      <thead className="border-b border-[var(--border)] text-[var(--secondary)]">
                        <tr>
                          <th className="px-3 py-2">Age Bucket</th>
                          <th className="px-3 py-2 text-right">Expected Drift (Δ)</th>
                          <th className="px-3 py-2 text-right">vs. Noise Floor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {item.driftCurve.map((pt: { ageSeconds: number; expectedDrift: number }) => {
                          const exceedsNoise = pt.expectedDrift > item.noiseFloor!;
                          return (
                            <tr key={pt.ageSeconds}>
                              <td className="px-3 py-1.5">
                                {pt.ageSeconds}s (
                                {pt.ageSeconds >= 60 ? `${(pt.ageSeconds / 60).toFixed(0)}m` : `${pt.ageSeconds}s`})
                              </td>
                              <td className="px-3 py-1.5 text-right font-semibold">
                                {pt.expectedDrift.toFixed(4)}
                              </td>
                              <td className="px-3 py-1.5 text-right">
                                <span
                                  className={`text-[10px] ${
                                    exceedsNoise ? "text-amber-500" : "text-green-500"
                                  }`}
                                >
                                  {exceedsNoise ? "> Noise (Buy justified)" : "≤ Noise (Reuse justified)"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded border border-[var(--border)] bg-[var(--background)] p-3 font-mono text-xs text-[var(--secondary)]">
                  Empirical decay curve: no data yet
                </div>
              )}

                {/* Top Disagreeing Miners */}
                {item.disagreeingMiners.length > 0 && (
                  <div className="mt-6">
                    <div className="font-mono text-xs font-semibold text-[var(--secondary)] mb-2">
                      MEASURED MINER DISAGREEMENT EVENTS
                    </div>
                    <div className="border border-[var(--border)] bg-[var(--background)] p-3 text-xs font-mono">
                      {item.disagreeingMiners.map((m, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between py-1 border-b border-[var(--border)] last:border-b-0"
                        >
                          <span className="text-[var(--secondary)]">{m.pair}</span>
                          <span className="font-semibold text-amber-500">Δ = {m.disagreement}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

        {/* Explanatory Callout */}
        <div className="mt-12 rounded border border-[var(--border)] bg-[var(--surface)] p-6 text-xs leading-relaxed text-[var(--secondary)]">
          <h2 className="font-semibold text-sm text-[var(--foreground)]">Evidence-Honest Calibration Standard</h2>
          <p className="mt-2">
            Half-Life does not present theoretical models as measured reality. Uncalibrated curves are explicitly labeled
            &quot;prior (not measured)&quot;. A curve only becomes &quot;calibrated&quot; after 30+ empirical samples over a minimum of 6 hours
            have been settled on Ethereum Sepolia and recorded with cryptographic proof.
          </p>
        </div>
      </div>
    </div>
  );
}
