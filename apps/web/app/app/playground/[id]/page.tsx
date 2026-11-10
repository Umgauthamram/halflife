import { notFound } from "next/navigation";
import Link from "next/link";
import { getPlaygroundRunDetailsAction } from "../actions";

interface RunDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function PlaygroundRunDetailsPage({ params }: RunDetailsPageProps) {
  const { id } = await params;
  const run = await getPlaygroundRunDetailsAction(id);

  if (!run) {
    notFound();
  }

  const isReuse = run.action === "reuse";
  const isBuy = run.action === "buy";

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

      {/* Decision Summary Card */}
      <div
        className={`rounded-lg border p-5 ${
          isReuse
            ? "border-blue-200 bg-blue-50/50"
            : isBuy
            ? "border-emerald-200 bg-emerald-50/50"
            : "border-red-200 bg-red-50/50"
        }`}
      >
        <span className="text-xs font-mono uppercase tracking-wider font-semibold text-[var(--secondary)]">
          Governor Verdict
        </span>
        <h2 className="mt-1 text-base font-semibold text-[var(--foreground)]">
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
