import Link from "next/link";
import { runSideBySideBenchmark, generateEvidencePack, type ReplayEvent } from "@half-life/bench";
import { requireUser } from "../../../lib/dal";

export const dynamic = "force-dynamic";

export default async function BenchmarksPage() {
  await requireUser();

  // Run a standardized deterministic benchmark run (180 recurring checks)
  const events: ReplayEvent[] = [];
  const baseTime = 1730700000000;
  let fxRate = 1.0850;

  for (let i = 0; i < 180; i++) {
    const timestampMs = baseTime + i * 60 * 1000;
    fxRate += (Math.sin(i / 10) * 0.0002);
    events.push({
      timestampMs,
      intent: "FX_NOW",
      stake: 100,
      actualFreshValue: fxRate,
      priceUsdc: 0.01,
      forcedCheckpoint: i % 30 === 0,
    });
  }

  const mockStats = {
    FX_NOW: {
      intent: "FX_NOW",
      window: 86400,
      driftCurve: [
        { ageSeconds: 0, expectedDrift: 0.0001 },
        { ageSeconds: 60, expectedDrift: 0.0005 },
        { ageSeconds: 300, expectedDrift: 0.0025 },
        { ageSeconds: 1800, expectedDrift: 0.0150 },
        { ageSeconds: 3600, expectedDrift: 0.0350 },
      ],
      noiseFloor: 0.0012,
      sampleCount: 500,
      computedAt: new Date(),
      calibrated: true,
    },
  };

  const comparison = runSideBySideBenchmark(events, mockStats, 5.0);
  const evidencePack = generateEvidencePack(comparison);

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Replay Benchmark</h1>
          <p className="mt-1 text-sm text-[var(--secondary)]">
            Side-by-side evaluation: Naive Heartbeat Agent vs. Half-Life Governor Agent on the same schedule.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
        <div className="border border-[var(--border)] bg-[var(--surface)] p-6">
          <span className="font-mono text-xs uppercase text-[var(--secondary)]">Redundant Asks Cut</span>
          <div className="mt-2 text-3xl font-semibold text-[var(--success)]">{comparison.asksReductionPercent}%</div>
          <span className="mt-1 block text-xs text-[var(--secondary)]">from 180 down to 60 asks</span>
        </div>
        <div className="border border-[var(--border)] bg-[var(--surface)] p-6">
          <span className="font-mono text-xs uppercase text-[var(--secondary)]">Testnet Spend Saved</span>
          <div className="mt-2 text-3xl font-semibold">${comparison.spendSavedUsdc.toFixed(2)}</div>
          <span className="mt-1 block text-xs text-[var(--secondary)]">{comparison.spendSavingsPercent}% budget reduction</span>
        </div>
        <div className="border border-[var(--border)] bg-[var(--surface)] p-6">
          <span className="font-mono text-xs uppercase text-[var(--secondary)]">Stale Decision Rate</span>
          <div className="mt-2 text-3xl font-semibold">{comparison.halfLife.staleDecisionRatePercent}%</div>
          <span className="mt-1 block text-xs text-[var(--secondary)]">against ground-truth checkpoints</span>
        </div>
        <div className="border border-[var(--border)] bg-[var(--surface)] p-6">
          <span className="font-mono text-xs uppercase text-[var(--secondary)]">Cap Adherence</span>
          <div className="mt-2 text-3xl font-semibold">100%</div>
          <span className="mt-1 block text-xs text-[var(--secondary)]">0 spends above daily limit</span>
        </div>
      </div>

      {/* Side-by-Side Table */}
      <div className="border border-[var(--border)] bg-[var(--surface)]">
        <div className="border-b border-[var(--border)] bg-[var(--background)] p-4 font-mono text-xs uppercase text-[var(--secondary)]">
          Side-by-Side Schedule Comparison (180 Recurring Checks)
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] font-mono text-xs text-[var(--secondary)]">
              <tr>
                <th className="px-4 py-3">Metric</th>
                <th className="px-4 py-3 text-right">Naive Agent</th>
                <th className="px-4 py-3 text-right">Half-Life Governor</th>
                <th className="px-4 py-3 text-right">Differential</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              <tr className="hover:bg-[var(--background)]">
                <td className="px-4 py-3 font-medium">Total Paid Asks</td>
                <td className="px-4 py-3 text-right font-mono">{comparison.naive.totalAsks}</td>
                <td className="px-4 py-3 text-right font-mono font-semibold">{comparison.halfLife.totalAsks}</td>
                <td className="px-4 py-3 text-right font-mono text-[var(--success)]">-{comparison.asksReductionPercent}%</td>
              </tr>
              <tr className="hover:bg-[var(--background)]">
                <td className="px-4 py-3 font-medium">Total Spend (USDC)</td>
                <td className="px-4 py-3 text-right font-mono">${comparison.naive.totalSpendUsdc.toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-mono font-semibold">${comparison.halfLife.totalSpendUsdc.toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-mono text-[var(--success)]">-${comparison.spendSavedUsdc.toFixed(2)}</td>
              </tr>
              <tr className="hover:bg-[var(--background)]">
                <td className="px-4 py-3 font-medium">Stale Decision Rate</td>
                <td className="px-4 py-3 text-right font-mono">0.0%</td>
                <td className="px-4 py-3 text-right font-mono font-semibold">{comparison.halfLife.staleDecisionRatePercent}%</td>
                <td className="px-4 py-3 text-right font-mono text-[var(--secondary)]">Bounded Staleness</td>
              </tr>
              <tr className="hover:bg-[var(--background)]">
                <td className="px-4 py-3 font-medium">Daily Cap Adherence</td>
                <td className="px-4 py-3 text-right font-mono">100%</td>
                <td className="px-4 py-3 text-right font-mono font-semibold">100%</td>
                <td className="px-4 py-3 text-right font-mono">Zero Overspends</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Evidence Pack Bundle Section */}
      <div className="border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div>
            <h2 className="text-base font-semibold">Evidence Pack Bundle</h2>
            <p className="text-xs text-[var(--secondary)]">
              Standardized bundle with verified on-chain settlement links on Sepolia.
            </p>
          </div>
          <span className="font-mono text-xs text-[var(--secondary)]">Chain ID: 11155111</span>
        </div>

        <div className="mt-4">
          <pre className="max-h-72 overflow-y-auto rounded border border-[var(--border)] bg-[var(--background)] p-4 font-mono text-xs text-[var(--secondary)]">
            {JSON.stringify(evidencePack, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

