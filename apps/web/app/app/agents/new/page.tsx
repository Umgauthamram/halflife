import Link from "next/link";
import { createAgentAction } from "../actions";

export default function NewAgentPage() {
  return (
    <div className="w-full">
      <div className="border-b border-[var(--border)] pb-4">
        <Link href="/app/agents" className="font-mono text-xs text-[var(--secondary)] hover:underline">
          &larr; Back to Agents
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Create Agent</h1>
        <p className="mt-1 text-sm text-[var(--secondary)]">
          Configure an agent with spending caps and select its intelligence acquisition mode.
        </p>
      </div>

      <form action={createAgentAction} className="mt-8 flex flex-col gap-8">
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
            className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-[var(--border-strong)]"
          />
        </div>

        {/* Mode */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Governor Mode</label>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <label className="flex cursor-pointer flex-col gap-1 rounded border border-[var(--border)] bg-[var(--surface)] p-6 transition-colors hover:border-[var(--border-strong)] has-[:checked]:border-[var(--border-strong)] has-[:checked]:bg-[var(--surface)]">
              <div className="flex items-center gap-2">
                <input type="radio" name="mode" value="halflife" defaultChecked className="accent-[var(--foreground)]" />
                <span className="font-semibold text-base">Half-Life Mode</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[var(--secondary)]">
                Buys only when expected stale loss &gt; price and expected drift &gt; miner noise floor. Reduces redundant queries by up to 67%.
              </p>
            </label>

            <label className="flex cursor-pointer flex-col gap-1 rounded border border-[var(--border)] bg-[var(--surface)] p-6 transition-colors hover:border-[var(--border-strong)] has-[:checked]:border-[var(--border-strong)] has-[:checked]:bg-[var(--surface)]">
              <div className="flex items-center gap-2">
                <input type="radio" name="mode" value="naive" className="accent-[var(--foreground)]" />
                <span className="font-semibold text-base">Naive Mode</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[var(--secondary)]">
                Re-buys a fresh answer on every single request regardless of decay or price. Constant heartbeat polling.
              </p>
            </label>
          </div>
        </div>

        {/* Allowed Intents */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Permitted Intents</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 rounded border border-[var(--border)] bg-[var(--surface)] p-6">
            <label className="flex items-center gap-2.5 text-sm cursor-pointer">
              <input type="checkbox" name="intents" value="FX_NOW" defaultChecked className="accent-[var(--foreground)]" />
              <div>
                <span className="font-mono text-xs font-semibold">FX_NOW</span>
                <span className="block text-xs text-[var(--secondary)]">Real-time foreign exchange</span>
              </div>
            </label>
            <label className="flex items-center gap-2.5 text-sm cursor-pointer">
              <input type="checkbox" name="intents" value="WEATHER_FORECAST_VERIFY" defaultChecked className="accent-[var(--foreground)]" />
              <div>
                <span className="font-mono text-xs font-semibold">WEATHER_FORECAST_VERIFY</span>
                <span className="block text-xs text-[var(--secondary)]">Meteorological forecasts</span>
              </div>
            </label>
            <label className="flex items-center gap-2.5 text-sm cursor-pointer">
              <input type="checkbox" name="intents" value="SANCTIONS_SCREENING_MATCH" defaultChecked className="accent-[var(--foreground)]" />
              <div>
                <span className="font-mono text-xs font-semibold">SANCTIONS_SCREENING_MATCH</span>
                <span className="block text-xs text-[var(--secondary)]">Compliance screening</span>
              </div>
            </label>
            <label className="flex items-center gap-2.5 text-sm cursor-pointer">
              <input type="checkbox" name="intents" value="CRYPTO_PRICE" defaultChecked className="accent-[var(--foreground)]" />
              <div>
                <span className="font-mono text-xs font-semibold">CRYPTO_PRICE</span>
                <span className="block text-xs text-[var(--secondary)]">Crypto asset pricing</span>
              </div>
            </label>
            <label className="flex items-center gap-2.5 text-sm cursor-pointer">
              <input type="checkbox" name="intents" value="WEB_SEARCH" defaultChecked className="accent-[var(--foreground)]" />
              <div>
                <span className="font-mono text-xs font-semibold">WEB_SEARCH</span>
                <span className="block text-xs text-[var(--secondary)]">Live search with citations</span>
              </div>
            </label>
            <label className="flex items-center gap-2.5 text-sm cursor-pointer">
              <input type="checkbox" name="intents" value="QUESTION_ANSWERING" defaultChecked className="accent-[var(--foreground)]" />
              <div>
                <span className="font-mono text-xs font-semibold">QUESTION_ANSWERING</span>
                <span className="block text-xs text-[var(--secondary)]">Open-domain QA</span>
              </div>
            </label>
          </div>
        </div>

        {/* Spending Policy */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
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
              className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-mono focus-visible:outline-2 focus-visible:outline-[var(--border-strong)]"
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
              className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-mono focus-visible:outline-2 focus-visible:outline-[var(--border-strong)]"
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
              className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-mono focus-visible:outline-2 focus-visible:outline-[var(--border-strong)]"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4 border-t border-[var(--border)] pt-6">
          <Link
            href="/app/agents"
            className="rounded border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 text-sm font-medium text-[var(--secondary)] hover:text-[var(--foreground)]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="rounded border border-[var(--border-strong)] bg-[var(--foreground)] px-6 py-2.5 text-sm font-medium text-[var(--background)] hover:opacity-90"
          >
            Create Agent
          </button>
        </div>
      </form>
    </div>
  );
}

