import Link from "next/link";
import { createAgentAction } from "../actions";

export default function NewAgentPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="border-b border-[var(--border)] pb-4">
        <Link href="/app/agents" className="font-mono text-xs text-[var(--secondary)] hover:underline">
          &larr; Back to Agents
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Create Agent</h1>
        <p className="mt-1 text-sm text-[var(--secondary)]">
          Configure an agent with spending caps and select its intelligence acquisition mode.
        </p>
      </div>

      <form action={createAgentAction} className="mt-6 flex flex-col gap-6">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium">
            Agent Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue="Treasury FX Guard"
            className="rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[var(--border-strong)]"
          />
        </div>

        {/* Mode */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Governor Mode</label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex cursor-pointer flex-col gap-1 rounded border border-[var(--border)] bg-[var(--surface)] p-4 has-[:checked]:border-[var(--border-strong)]">
              <div className="flex items-center gap-2">
                <input type="radio" name="mode" value="halflife" defaultChecked className="accent-[var(--foreground)]" />
                <span className="font-semibold text-sm">Half-Life Mode</span>
              </div>
              <p className="mt-1 text-xs text-[var(--secondary)]">
                Buys only when expected stale loss &gt; price and expected drift &gt; miner noise floor.
              </p>
            </label>

            <label className="flex cursor-pointer flex-col gap-1 rounded border border-[var(--border)] bg-[var(--surface)] p-4 has-[:checked]:border-[var(--border-strong)]">
              <div className="flex items-center gap-2">
                <input type="radio" name="mode" value="naive" className="accent-[var(--foreground)]" />
                <span className="font-semibold text-sm">Naive Mode</span>
              </div>
              <p className="mt-1 text-xs text-[var(--secondary)]">
                Re-buys a fresh answer on every single request regardless of decay or price.
              </p>
            </label>
          </div>
        </div>

        {/* Allowed Intents */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Permitted Intents</label>
          <div className="flex flex-col gap-2 rounded border border-[var(--border)] bg-[var(--surface)] p-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="intents" value="FX_NOW" defaultChecked className="accent-[var(--foreground)]" />
              <span className="font-mono text-xs">FX_NOW</span>
              <span className="text-xs text-[var(--secondary)]">&bull; Real-time currency rates</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="intents" value="WEATHER_FORECAST_VERIFY" defaultChecked className="accent-[var(--foreground)]" />
              <span className="font-mono text-xs">WEATHER_FORECAST_VERIFY</span>
              <span className="text-xs text-[var(--secondary)]">&bull; Meteorological forecasts</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="intents" value="SANCTIONS_SCREENING_MATCH" defaultChecked className="accent-[var(--foreground)]" />
              <span className="font-mono text-xs">SANCTIONS_SCREENING_MATCH</span>
              <span className="text-xs text-[var(--secondary)]">&bull; Compliance screening</span>
            </label>
          </div>
        </div>

        {/* Spending Policy */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="perAskCapUsdc" className="text-sm font-medium">
              Per-Ask Cap ($)
            </label>
            <input
              id="perAskCapUsdc"
              name="perAskCapUsdc"
              type="number"
              step="0.001"
              min="0.001"
              defaultValue="0.050"
              required
              className="rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-mono focus-visible:outline-2 focus-visible:outline-[var(--border-strong)]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="dailyCapUsdc" className="text-sm font-medium">
              Daily Cap ($)
            </label>
            <input
              id="dailyCapUsdc"
              name="dailyCapUsdc"
              type="number"
              step="0.01"
              min="0.01"
              defaultValue="1.00"
              required
              className="rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-mono focus-visible:outline-2 focus-visible:outline-[var(--border-strong)]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="stakeDefault" className="text-sm font-medium">
              Default Stake ($)
            </label>
            <input
              id="stakeDefault"
              name="stakeDefault"
              type="number"
              step="1"
              min="1"
              defaultValue="100"
              required
              className="rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-mono focus-visible:outline-2 focus-visible:outline-[var(--border-strong)]"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] pt-4">
          <Link
            href="/app/agents"
            className="rounded border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--secondary)] hover:text-[var(--foreground)]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="rounded border border-[var(--border-strong)] bg-[var(--foreground)] px-6 py-2 text-sm font-medium text-[var(--background)] hover:opacity-90"
          >
            Create Agent
          </button>
        </div>
      </form>
    </div>
  );
}

