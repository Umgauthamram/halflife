import { notFound } from "next/navigation";
import Link from "next/link";
import { getPlaygroundRunDetailsAction } from "../actions";

interface RunDetailsPageProps {
  params: Promise<{ id: string }>;
}

function getTestAnalysis(run: {
  intent: string;
  stake: number;
  action: string;
  priceUsdc: number;
  savingsUsdc: number;
  latencyMs: number;
  reason?: string;
  params: Record<string, unknown>;
}) {
  const isBuy = run.action === "buy";
  const isReuse = run.action === "reuse";
  const stakeFormatted = "$" + run.stake.toLocaleString();

  if (run.intent === "FX_NOW") {
    return {
      why: `To test whether the Governor can measure financial rate volatility and prevent paying redundant oracle fees when exchange rate drift is still within the miner disagreement floor.`,
      useCase: `Automated cross-border payments, corporate treasury rebalancing, or DeFi arbitrage liquidity swaps with ${stakeFormatted} capital at risk where currency fluctuations impact profitability.`,
      outcome: isBuy
        ? `The Governor triggered a BUY order ($${run.priceUsdc.toFixed(3)} USDC) from Telegraph miners because either no valid cached tick was found or expected market drift exceeded the miner noise floor.`
        : `The Governor executed a REUSE order ($0.00 USDC, saving $${run.savingsUsdc.toFixed(3)} in ${run.latencyMs}ms). The elapsed duration was short enough that expected drift remained below the noise floor.`,
      proves: `Proves that high-frequency agents don't need to burn capital polling miners every second. When expected drift d(Δt) ≤ η, re-buying yields zero net intelligence, allowing 100% cost savings with zero added transaction risk.`,
    };
  }

  if (run.intent === "WEATHER_FORECAST_VERIFY") {
    return {
      why: `To verify that physical atmospheric conditions have significantly slower decay curves than financial feeds, allowing the Governor to safely reuse certified observations across multiple contract triggers.`,
      useCase: `Parametric crop insurance and automated weather claims with ${stakeFormatted} in automated payout exposure dependent on verified localized temperature.`,
      outcome: isBuy
        ? `Purchased a certified weather observation from Telegraph miners ($${run.priceUsdc.toFixed(3)} USDC) and committed the ground truth reading to local cache.`
        : `Reused the verified temperature reading ($0.00 USDC, saving $${run.savingsUsdc.toFixed(3)}). Because weather observations have a longer half-life, buying again would add no new information.`,
      proves: `Proves that slower-decay domains achieve near-100% reuse rates, allowing automated smart contracts to continuously evaluate conditions at near-zero marginal oracle expense.`,
    };
  }

  if (run.intent === "SANCTIONS_SCREENING_MATCH") {
    return {
      why: `To test compliance auditing where regulatory decision loss is severe (${stakeFormatted} compliance exposure), but government OFAC/AML watchlists update on discrete daily cycles.`,
      useCase: `Counterparty compliance screening before clearing transfers or executing transactions against OFAC Specially Designated Nationals (SDN) watchlists.`,
      outcome: isBuy
        ? `Executed a certified compliance query against Telegraph miners ($${run.priceUsdc.toFixed(3)} USDC) and anchored the verification receipt.`
        : `Reused the certified sanctions compliance check ($0.00 USDC). Within the daily list update cycle, the cached result provides full cryptographic proof with zero duplicate cost.`,
      proves: `Proves that audit-grade compliance checks can achieve sub-5ms latency and 100% fee savings for recurring entity checks without violating regulatory integrity or compliance mandates.`,
    };
  }

  return {
    why: `To test the Governor's real-time decay curve evaluation for the "${run.intent}" intent under a ${stakeFormatted} risk stake.`,
    useCase: `Autonomous agent decision-making where data freshness must be economically balanced against query costs.`,
    outcome: isBuy
      ? `Governor triggered a BUY order ($${run.priceUsdc.toFixed(3)} USDC) to fetch fresh miner data from the Telegraph network.`
      : `Governor triggered a REUSE order ($0.00 USDC, saving $${run.savingsUsdc.toFixed(3)}) by serving the verified cached answer in ${run.latencyMs}ms.`,
    proves: `Proves that Half-Life dynamic calibration prevents wasteful query spend when information value has not yet decayed.`,
  };
}

export default async function PlaygroundRunDetailsPage({ params }: RunDetailsPageProps) {
  const { id } = await params;
  const run = await getPlaygroundRunDetailsAction(id);

  if (!run) {
    notFound();
  }

  const isReuse = run.action === "reuse";
  const isBuy = run.action === "buy";
  const analysis = getTestAnalysis(run);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header with Back Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-4">
        <div>
          <Link
            href="/app/playground"
            className="text-xs font-mono text-[var(--secondary)] hover:text-[var(--foreground)] transition mb-2 inline-flex items-center gap-1.5"
          >
            &larr; Back to Playground Studio
          </Link>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-xl font-bold text-purple-900">{run.runId}</span>
            <span
              className={`rounded px-2 py-0.5 text-xs uppercase font-bold tracking-wider ${
                isReuse
                  ? "bg-blue-100 text-blue-900 border border-blue-200"
                  : isBuy
                  ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                  : "bg-red-100 text-red-900 border border-red-200"
              }`}
            >
              {run.action}
            </span>
          </div>
          <p className="mt-1 text-xs text-[var(--secondary)]">
            Recorded at {run.createdAt.slice(0, 19).replace("T", " ")} UTC &bull; Agent:{" "}
            <span className="font-semibold text-[var(--foreground)]">{run.agentName}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-right font-mono text-xs">
            <div className="text-[10px] uppercase text-[var(--secondary)]">Miner Spend</div>
            <div className="font-bold text-sm">${run.priceUsdc.toFixed(3)}</div>
          </div>
          <div className="rounded border border-green-200 bg-green-50/70 px-3 py-1.5 text-right font-mono text-xs text-green-950">
            <div className="text-[10px] uppercase text-green-700 font-semibold">Capital Saved</div>
            <div className="font-bold text-sm text-green-700">${run.savingsUsdc.toFixed(3)}</div>
          </div>
        </div>
      </div>

      {/* 2-Column Section: Governor Verdict (Left) & Test Summary (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Governor Decision Verdict Card */}
        <div
          className={`rounded-lg border p-5 flex flex-col justify-between ${
            isReuse
              ? "border-blue-200 bg-blue-50/50"
              : isBuy
              ? "border-emerald-200 bg-emerald-50/50"
              : "border-red-200 bg-red-50/50"
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider font-semibold text-[var(--secondary)]">
                Governor Verdict
              </span>
              <span
                className={`rounded px-2 py-0.5 text-[11px] uppercase font-bold tracking-wider ${
                  isReuse
                    ? "bg-blue-700 text-white"
                    : isBuy
                    ? "bg-emerald-700 text-white"
                    : "bg-red-700 text-white"
                }`}
              >
                {run.action}
              </span>
            </div>

            <h2 className="mt-3 text-lg font-semibold text-[var(--foreground)]">
              {isReuse
                ? "Zero-Cost Cache Reuse ($0.00)"
                : isBuy
                ? "Fresh Telegraph Miner Purchase"
                : "Request Refused"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--foreground)]">
              {run.reason}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-[var(--border)] grid grid-cols-2 gap-3 text-xs font-mono">
            <div>
              <span className="text-[var(--secondary)] text-[10px] uppercase block">Miner Spend:</span>
              <span className="text-base font-bold text-[var(--foreground)]">${run.priceUsdc.toFixed(3)}</span>
            </div>
            <div>
              <span className="text-green-700 text-[10px] uppercase block font-semibold">Capital Saved:</span>
              <span className="text-base font-bold text-green-700">${run.savingsUsdc.toFixed(3)}</span>
            </div>
          </div>
        </div>

        {/* Right: Test Analysis & Case Summary Card */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <span className="text-xs font-mono uppercase tracking-wider font-semibold text-[var(--secondary)]">
                Test Analysis &amp; Case Summary
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--background)] border border-[var(--border)] text-[var(--secondary)]">
                Evaluation
              </span>
            </div>

            <div className="mt-4 flex flex-col gap-3.5 text-xs leading-relaxed">
              <div>
                <span className="font-mono font-semibold uppercase text-[11px] text-[var(--foreground)] block mb-1">
                  Why We Have Done This Test:
                </span>
                <p className="text-[var(--secondary)]">{analysis.why}</p>
              </div>

              <div>
                <span className="font-mono font-semibold uppercase text-[11px] text-[var(--foreground)] block mb-1">
                  Use Case of This Test:
                </span>
                <p className="text-[var(--secondary)]">{analysis.useCase}</p>
              </div>

              <div>
                <span className="font-mono font-semibold uppercase text-[11px] text-[var(--foreground)] block mb-1">
                  Outcome of This Test:
                </span>
                <p className="text-[var(--secondary)]">{analysis.outcome}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded border border-purple-200 bg-purple-50/60 p-3 text-purple-950">
            <span className="font-mono font-semibold uppercase text-[11px] text-purple-900 block mb-1">
              What We Are Trying to Prove From This Test:
            </span>
            <p className="text-purple-900/90 text-xs leading-relaxed">{analysis.proves}</p>
          </div>
        </div>
      </div>

      {/* Mathematical Governor Inputs & Statistical Proof */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <span className="text-xs font-mono uppercase tracking-wider text-[var(--secondary)] font-semibold">
            Mathematical Governor Calibration
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--background)] border border-[var(--border)] text-[var(--secondary)]">
            Decay Proof
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="border border-[var(--border)] bg-[var(--background)] p-3 rounded">
            <span className="text-[10px] uppercase text-[var(--secondary)] block mb-1">Expected Drift d(Δt)</span>
            <span className="text-base font-semibold text-[var(--foreground)]">
              {run.inputs?.drift != null ? Number(run.inputs.drift).toFixed(5) : "0.00000"}
            </span>
          </div>

          <div className="border border-[var(--border)] bg-[var(--background)] p-3 rounded">
            <span className="text-[10px] uppercase text-[var(--secondary)] block mb-1">Miner Noise Floor η</span>
            <span className="text-base font-semibold text-[var(--foreground)]">
              {run.inputs?.noiseFloor != null ? Number(run.inputs.noiseFloor).toFixed(4) : "0.0000"}
            </span>
          </div>

          <div className="border border-[var(--border)] bg-[var(--background)] p-3 rounded">
            <span className="text-[10px] uppercase text-[var(--secondary)] block mb-1">Execution Latency</span>
            <span className="text-base font-semibold text-green-700">
              {run.latencyMs}ms
            </span>
          </div>

          <div className="border border-[var(--border)] bg-[var(--background)] p-3 rounded">
            <span className="text-[10px] uppercase text-[var(--secondary)] block mb-1">Atlas Calibrated</span>
            <span className="text-base font-semibold text-[var(--foreground)]">
              {run.inputs?.calibrated ? "True (Dynamic Curve)" : "Sampling Phase"}
            </span>
          </div>
        </div>

        <div className="mt-4 text-xs text-[var(--secondary)] leading-relaxed border-t border-[var(--border)] pt-3">
          <strong>Decision Rule:</strong> If expected drift is below the miner noise floor (<code>d(Δt) &le; η</code>), re-purchasing data adds zero net intelligence. The Governor saves 100% of the query cost by serving the answer from cache in under 5ms.
        </div>
      </div>

      {/* Query Request & Answer Payload Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Request Parameters */}
        <div className="flex flex-col rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <div className="border-b border-[var(--border)] bg-[var(--background)] px-4 py-2.5">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--secondary)] font-semibold">
              Query Request Context
            </span>
          </div>

          <div className="p-4 flex flex-col gap-3 text-xs font-mono">
            <div>
              <span className="text-[var(--secondary)] block text-[10px] uppercase">Intent Name:</span>
              <span className="font-semibold text-sm">{run.intent}</span>
            </div>

            <div>
              <span className="text-[var(--secondary)] block text-[10px] uppercase">Financial Stake at Risk:</span>
              <span className="font-semibold text-sm">${run.stake.toLocaleString()}</span>
            </div>

            <div>
              <span className="text-[var(--secondary)] block text-[10px] uppercase">Request ID:</span>
              <span className="text-[var(--secondary)]">{run.requestId}</span>
            </div>

            <div>
              <span className="text-[var(--secondary)] block text-[10px] uppercase mb-1">Parameters:</span>
              <pre className="rounded border border-[var(--border)] bg-[var(--background)] p-3 text-xs overflow-x-auto text-[var(--foreground)]">
                {JSON.stringify(run.params, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Right: Answer Payload */}
        <div className="flex flex-col rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <div className="border-b border-[var(--border)] bg-[var(--background)] px-4 py-2.5">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--secondary)] font-semibold">
              Answer Payload
            </span>
          </div>

          <div className="p-4 flex-1 flex flex-col justify-between text-xs font-mono">
            <div>
              <span className="text-[var(--secondary)] block text-[10px] uppercase mb-1">Payload:</span>
              <pre className="rounded border border-[var(--border)] bg-[#121214] p-3 text-xs text-green-400 overflow-x-auto">
                {JSON.stringify(run.answer, null, 2)}
              </pre>
            </div>

            {run.txHash && (
              <div className="mt-4 pt-3 border-t border-[var(--border)]">
                <span className="text-[var(--secondary)] block text-[10px] uppercase mb-1">
                  Sepolia Cryptographic Proof:
                </span>
                <span className="text-[11px] font-mono break-all text-purple-900 font-semibold">
                  {run.txHash}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
