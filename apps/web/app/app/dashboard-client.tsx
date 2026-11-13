"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { blockApiKeyAction } from "./actions";

export interface DashboardCallItem {
  id: string;
  timestamp: string;
  agentName: string;
  agentId: string;
  apiKeyPrefix: string;
  intent: string;
  action: "buy" | "reuse" | "refuse";
  priceUsdc: number;
  savingsUsdc: number;
  latencyMs: number | null;
  reason: string;
  txHash?: string | null;
  source: string;
}

export interface DashboardKeyItem {
  id: string;
  prefix: string;
  agentId: string;
  agentName: string;
  status: "active" | "blocked";
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  revocationReason?: string | null;
}

interface DashboardClientProps {
  calls: DashboardCallItem[];
  keys: DashboardKeyItem[];
  agentsCount: number;
  totalSpendUsdc: number;
  totalSavedUsdc: number;
}

const QUICK_REASONS = [
  "Suspected credential leak / security risk",
  "Agent testing completed / decommissioned",
  "Exceeded budget or unexpected loop",
  "Rotating to a fresh key",
];

export default function DashboardClient({
  calls,
  keys: initialKeys,
  agentsCount,
  totalSpendUsdc,
  totalSavedUsdc,
}: DashboardClientProps) {
  const [keysList, setKeysList] = useState<DashboardKeyItem[]>(initialKeys);
  const [selectedGraphView, setSelectedGraphView] = useState<"charges" | "cumulative">("charges");
  const [selectedIntentFilter, setSelectedIntentFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal State for Blocking Key
  const [targetBlockKey, setTargetBlockKey] = useState<DashboardKeyItem | null>(null);
  const [blockReason, setBlockReason] = useState<string>("");
  const [confirmDeleteText, setConfirmDeleteText] = useState<string>("");
  const [blockError, setBlockError] = useState<string | null>(null);
  const [blockSuccessMsg, setBlockSuccessMsg] = useState<string | null>(null);
  const [isBlocking, startBlocking] = useTransition();

  // Filtered Calls for Audit Table
  const filteredCalls = useMemo(() => {
    return calls.filter((c) => {
      const matchIntent = selectedIntentFilter === "ALL" || c.intent === selectedIntentFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.agentName.toLowerCase().includes(q) ||
        c.apiKeyPrefix.toLowerCase().includes(q) ||
        c.intent.toLowerCase().includes(q);
      return matchIntent && matchSearch;
    });
  }, [calls, selectedIntentFilter, searchQuery]);

  // Open Block Modal
  const handleOpenBlockModal = (k: DashboardKeyItem) => {
    setTargetBlockKey(k);
    setBlockReason("");
    setConfirmDeleteText("");
    setBlockError(null);
  };

  // Close Block Modal
  const handleCloseBlockModal = () => {
    setTargetBlockKey(null);
    setBlockReason("");
    setConfirmDeleteText("");
    setBlockError(null);
  };

  // Submit Block API Key
  const handleConfirmBlock = () => {
    if (!targetBlockKey) return;
    if (confirmDeleteText.trim().toUpperCase() !== "DELETE") {
      setBlockError("Please type 'DELETE' exactly to confirm blocking this key.");
      return;
    }
    if (!blockReason.trim()) {
      setBlockError("Please provide a reason for blocking this API key.");
      return;
    }

    startBlocking(async () => {
      setBlockError(null);
      const res = await blockApiKeyAction({
        keyId: targetBlockKey.id,
        reason: blockReason.trim(),
        confirmationWord: confirmDeleteText.trim(),
      });

      if (!res.success) {
        setBlockError(res.error || "Failed to block API key");
      } else {
        // Update local keys list
        setKeysList((prev) =>
          prev.map((k) =>
            k.id === targetBlockKey.id
              ? {
                  ...k,
                  status: "blocked",
                  revokedAt: new Date().toISOString(),
                  revocationReason: blockReason.trim(),
                }
              : k
          )
        );
        setBlockSuccessMsg(res.message || "API key has been blocked.");
        handleCloseBlockModal();
        setTimeout(() => setBlockSuccessMsg(null), 4000);
      }
    });
  };

  // Metrics for Overview
  const totalCallsCount = calls.length;
  const reuseCount = calls.filter((c) => c.action === "reuse").length;
  const reuseRate = totalCallsCount > 0 ? Math.round((reuseCount / totalCallsCount) * 100) : 0;
  const activeKeysCount = keysList.filter((k) => k.status === "active").length;

  // Recent 20 calls for graph visualization
  const graphCalls = useMemo(() => {
    return [...calls].reverse().slice(-20);
  }, [calls]);

  return (
    <div className="flex flex-col gap-8">
      {/* Top Banner Message */}
      {blockSuccessMsg && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 font-mono text-xs text-red-900 shadow-xs flex items-center justify-between">
          <span>{blockSuccessMsg}</span>
          <button
            onClick={() => setBlockSuccessMsg(null)}
            className="text-red-700 hover:text-red-950 font-bold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Page Title & Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard &bull; API Audit</h1>
          <p className="mt-1 text-sm text-[var(--secondary)]">
            Inspect real-time API call charges, audit governor decisions, and manage key access control.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/app/playground"
            className="rounded border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs font-mono font-medium hover:text-[var(--foreground)] transition"
          >
            Testing Studio
          </Link>
          <Link
            href="/app/agents/new"
            className="rounded border border-[var(--border-strong)] bg-[var(--foreground)] px-4 py-2 text-xs font-mono font-bold text-[var(--background)] hover:opacity-90 transition"
          >
            Create Agent
          </Link>
        </div>
      </div>

      {/* 4 High-Level Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--secondary)] font-semibold">
            Total API Calls
          </span>
          <div className="mt-2 text-3xl font-semibold">{totalCallsCount}</div>
          <p className="mt-1 text-xs text-[var(--secondary)] font-mono">
            {reuseRate}% served from cache ($0)
          </p>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--secondary)] font-semibold">
            Total Charges Paid
          </span>
          <div className="mt-2 text-3xl font-semibold text-amber-700">
            ${totalSpendUsdc.toFixed(3)} <span className="text-xs text-[var(--secondary)] font-normal font-mono">USDC</span>
          </div>
          <p className="mt-1 text-xs text-[var(--secondary)] font-mono">
            On-chain Sepolia miner fees
          </p>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--secondary)] font-semibold">
            Capital Saved
          </span>
          <div className="mt-2 text-3xl font-semibold text-emerald-700">
            ${totalSavedUsdc.toFixed(3)} <span className="text-xs text-[var(--secondary)] font-normal font-mono">USDC</span>
          </div>
          <p className="mt-1 text-xs text-[var(--secondary)] font-mono">
            Protected by Half-Life Governor
          </p>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--secondary)] font-semibold">
            Active API Keys
          </span>
          <div className="mt-2 text-3xl font-semibold">
            {activeKeysCount}{" "}
            <span className="text-xs text-[var(--secondary)] font-normal font-mono">
              / {keysList.length} total
            </span>
          </div>
          <p className="mt-1 text-xs text-[var(--secondary)] font-mono">
            Across {agentsCount} active agents
          </p>
        </div>
      </div>

      {/* SECTION 1: Interactive Charges & Volume Graph */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight">API Activity &amp; Charges per Call</h2>
            <p className="text-xs text-[var(--secondary)] font-mono mt-0.5">
              Visualizing the cost of each query: Green bars indicate $0.00 REUSE, Amber bars indicate $0.010 BUY.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedGraphView("charges")}
              className={`rounded px-3 py-1.5 text-xs font-mono font-medium transition ${
                selectedGraphView === "charges"
                  ? "bg-[var(--foreground)] text-[var(--background)] shadow-xs"
                  : "border border-[var(--border)] bg-[var(--background)] text-[var(--secondary)] hover:text-[var(--foreground)]"
              }`}
            >
              Cost per Call ($)
            </button>
            <button
              onClick={() => setSelectedGraphView("cumulative")}
              className={`rounded px-3 py-1.5 text-xs font-mono font-medium transition ${
                selectedGraphView === "cumulative"
                  ? "bg-[var(--foreground)] text-[var(--background)] shadow-xs"
                  : "border border-[var(--border)] bg-[var(--background)] text-[var(--secondary)] hover:text-[var(--foreground)]"
              }`}
            >
              Spend vs. Saved
            </button>
          </div>
        </div>

        {graphCalls.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-[var(--secondary)]">
            No API activity recorded yet. Run a scenario in the{" "}
            <Link href="/app/playground" className="underline hover:text-[var(--foreground)]">
              Testing Studio
            </Link>{" "}
            to see live call charges.
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            {/* Chart Legend */}
            <div className="flex items-center gap-6 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-xs bg-emerald-600 inline-block" />
                <span className="text-[var(--secondary)]">REUSE &bull; $0.000 (Saved $0.010)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-xs bg-amber-600 inline-block" />
                <span className="text-[var(--secondary)]">BUY &bull; $0.010 (Telegraph Miner Purchase)</span>
              </div>
            </div>

            {/* Responsive Visual Bar Chart */}
            <div className="mt-2 h-44 w-full flex items-end gap-2 border-b border-[var(--border)] pb-2 pt-6 px-2 overflow-x-auto">
              {graphCalls.map((call, idx) => {
                const isBuy = call.action === "buy";
                const isCumulative = selectedGraphView === "cumulative";
                // Height calculation:
                // If charges view: Buy is full height, Reuse is 15% height with zero charge label
                const barHeight = isBuy ? "100%" : "20%";
                const barColor = isBuy ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700";

                return (
                  <div
                    key={call.id || idx}
                    className="flex-1 min-w-[32px] max-w-[56px] h-full flex flex-col justify-end items-center group relative cursor-pointer"
                  >
                    {/* Tooltip on Hover */}
                    <div className="pointer-events-none absolute bottom-full mb-2 hidden group-hover:flex flex-col rounded border border-[var(--border)] bg-[#18181b] p-2.5 text-[11px] font-mono text-white shadow-lg z-20 whitespace-nowrap">
                      <span className="font-bold text-amber-300">{call.intent}</span>
                      <span className="text-gray-300">Agent: {call.agentName}</span>
                      <span className="text-gray-300">Action: {call.action.toUpperCase()}</span>
                      <span className="text-gray-300">Charge: ${call.priceUsdc.toFixed(3)}</span>
                      <span className="text-emerald-400">Saved: ${call.savingsUsdc.toFixed(3)}</span>
                      <span className="text-gray-400 text-[10px] mt-1">{new Date(call.timestamp).toLocaleTimeString()}</span>
                    </div>

                    {/* Bar */}
                    <div
                      style={{ height: barHeight }}
                      className={`w-full rounded-t transition-all duration-200 ${barColor}`}
                    />

                    {/* X-axis Label */}
                    <span className="mt-2 text-[10px] font-mono text-[var(--secondary)] truncate w-full text-center">
                      #{idx + 1}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-[var(--secondary)] pt-1">
              <span>Oldest call in window</span>
              <span>Latest call &rarr;</span>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: API Keys Management with Block Key Option */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight">API Key Access &amp; Kill-Switch</h2>
            <p className="text-xs text-[var(--secondary)] font-mono mt-0.5">
              Active credentials powering your AI agents. You can block any compromised key with a mandatory confirmation.
            </p>
          </div>
          <Link
            href="/app/agents"
            className="text-xs font-mono text-blue-600 hover:underline"
          >
            Manage Agents &rarr;
          </Link>
        </div>

        {keysList.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-[var(--secondary)]">
            No API keys found. Create an agent to generate your first key.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--border)] bg-[var(--background)] font-mono text-xs text-[var(--secondary)]">
                <tr>
                  <th className="px-4 py-3">API Key Prefix</th>
                  <th className="px-4 py-3">Assigned Agent</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Reason / Details</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] font-mono text-xs">
                {keysList.map((k) => {
                  const isActive = k.status === "active";
                  return (
                    <tr key={k.id} className="hover:bg-[var(--background)] transition">
                      <td className="px-4 py-3 font-semibold text-[var(--foreground)]">
                        {k.prefix}...
                      </td>
                      <td className="px-4 py-3 text-[var(--secondary)]">{k.agentName}</td>
                      <td className="px-4 py-3">
                        {isActive ? (
                          <span className="inline-block rounded border border-green-300 bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-800">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="inline-block rounded border border-red-300 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-800">
                            BLOCKED
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[var(--secondary)]">
                        {new Date(k.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-[var(--secondary)] max-w-xs truncate">
                        {k.revocationReason || (isActive ? "Ready for queries" : "Blocked by user")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isActive ? (
                          <button
                            type="button"
                            onClick={() => handleOpenBlockModal(k)}
                            className="rounded border border-red-300 bg-red-50 px-3 py-1 font-mono text-xs font-bold text-red-800 hover:bg-red-100 transition active:scale-98 cursor-pointer"
                          >
                            Block Key
                          </button>
                        ) : (
                          <span className="text-[11px] text-red-700 italic font-mono">
                            Revoked
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 3: Detailed API Call Audit Feed */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight">API Calls Audit Feed</h2>
            <p className="text-xs text-[var(--secondary)] font-mono mt-0.5">
              Immutable log of all incoming oracle queries, Governor evaluations, and charges made.
            </p>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <select
              value={selectedIntentFilter}
              onChange={(e) => setSelectedIntentFilter(e.target.value)}
              className="rounded border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 font-mono text-xs text-[var(--foreground)]"
            >
              <option value="ALL">All Intents</option>
              <option value="FX_NOW">FX_NOW</option>
              <option value="WEATHER_FORECAST_VERIFY">WEATHER_FORECAST_VERIFY</option>
              <option value="SANCTIONS_SCREENING_MATCH">SANCTIONS_SCREENING_MATCH</option>
            </select>

            <input
              type="text"
              placeholder="Filter by agent or key..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 font-mono text-xs text-[var(--foreground)] placeholder:text-[var(--secondary)]"
            />
          </div>
        </div>

        {filteredCalls.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-[var(--secondary)]">
            No API calls match your current filters.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--border)] bg-[var(--background)] font-mono text-xs text-[var(--secondary)]">
                <tr>
                  <th className="px-4 py-3">Timestamp (UTC)</th>
                  <th className="px-4 py-3">Agent &bull; Key</th>
                  <th className="px-4 py-3">Intent</th>
                  <th className="px-4 py-3">Governor Decision</th>
                  <th className="px-4 py-3">Charge Made</th>
                  <th className="px-4 py-3">Latency</th>
                  <th className="px-4 py-3">On-Chain Proof</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] font-mono text-xs">
                {filteredCalls.map((c) => {
                  const isBuy = c.action === "buy";
                  const isReuse = c.action === "reuse";

                  return (
                    <tr key={c.id} className="hover:bg-[var(--background)] transition">
                      <td className="px-4 py-3 whitespace-nowrap text-[var(--secondary)]">
                        {new Date(c.timestamp).toISOString().replace("T", " ").slice(0, 19)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-[var(--foreground)] block">{c.agentName}</span>
                        <span className="text-[10px] text-[var(--secondary)]">{c.apiKeyPrefix}...</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block rounded bg-[var(--background)] border border-[var(--border)] px-2 py-0.5 text-[10px]">
                          {c.intent}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {isReuse ? (
                          <span className="inline-block rounded border border-blue-300 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-900">
                            REUSE
                          </span>
                        ) : isBuy ? (
                          <span className="inline-block rounded border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
                            BUY
                          </span>
                        ) : (
                          <span className="inline-block rounded border border-red-300 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-900">
                            REFUSE
                          </span>
                        )}
                        <span className="block text-[10px] text-[var(--secondary)] mt-0.5 max-w-xs truncate">
                          {c.reason}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {isBuy ? (
                          <span className="text-amber-800">${c.priceUsdc.toFixed(3)}</span>
                        ) : isReuse ? (
                          <span className="text-emerald-700">
                            $0.000 <span className="text-[10px] font-normal">(Saved $0.010)</span>
                          </span>
                        ) : (
                          <span className="text-gray-500">$0.000</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[var(--secondary)]">
                        {c.latencyMs ? `${c.latencyMs}ms` : "<5ms"}
                      </td>
                      <td className="px-4 py-3 text-[var(--secondary)]">
                        {c.txHash ? (
                          <a
                            href={`https://sepolia.etherscan.io/tx/${c.txHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline"
                            title={c.txHash}
                          >
                            {c.txHash.slice(0, 10)}...
                          </a>
                        ) : isReuse ? (
                          <span className="text-emerald-700 text-[11px]">Cache Receipt</span>
                        ) : (
                          <span className="text-gray-400">Simulated</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Block API Key with Reason & "DELETE" Confirmation */}
      {targetBlockKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-lg border border-red-300 bg-[var(--surface)] p-6 shadow-2xl">
            {/* Header */}
            <div className="border-b border-[var(--border)] pb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-red-700 block">
                Security Action &bull; Block API Key
              </span>
              <h3 className="text-lg font-bold text-[var(--foreground)] mt-1">
                Revoke Key: {targetBlockKey.prefix}...
              </h3>
              <p className="text-xs text-[var(--secondary)] mt-1">
                Assigned to agent <span className="font-semibold text-[var(--foreground)]">{targetBlockKey.agentName}</span>.
                Blocking this key is immediate and permanent. Any automated agent querying with this key will be refused.
              </p>
            </div>

            {/* Error Message */}
            {blockError && (
              <div className="mt-3 rounded border border-red-300 bg-red-50 p-2.5 text-xs font-mono text-red-900">
                {blockError}
              </div>
            )}

            {/* Form Fields */}
            <div className="mt-4 flex flex-col gap-4 font-mono text-xs">
              {/* Reason Input */}
              <div>
                <label className="block text-[var(--secondary)] font-semibold uppercase mb-1">
                  1. Reason for Blocking (Required):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Suspected credential leak, testing complete..."
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs focus-visible:outline-2 focus-visible:outline-red-600"
                />

                {/* Quick Chips */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {QUICK_REASONS.map((qr) => (
                    <button
                      key={qr}
                      type="button"
                      onClick={() => setBlockReason(qr)}
                      className="rounded border border-[var(--border)] bg-[var(--background)] px-2 py-0.5 text-[10px] text-[var(--secondary)] hover:text-[var(--foreground)] transition cursor-pointer"
                    >
                      {qr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Confirmation Type DELETE */}
              <div className="rounded border border-red-200 bg-red-50/50 p-3">
                <label className="block text-red-900 font-bold mb-1">
                  2. Type <span className="underline">DELETE</span> to confirm:
                </label>
                <p className="text-[11px] text-[var(--secondary)] mb-2">
                  To prevent accidental revocations, type <code className="font-bold text-red-900">DELETE</code> in capital letters.
                </p>
                <input
                  type="text"
                  placeholder="DELETE"
                  value={confirmDeleteText}
                  onChange={(e) => setConfirmDeleteText(e.target.value)}
                  className="w-full rounded border border-red-300 bg-white px-3 py-2 font-mono text-xs text-red-900 focus-visible:outline-2 focus-visible:outline-red-700"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)] font-mono text-xs">
              <button
                type="button"
                onClick={handleCloseBlockModal}
                disabled={isBlocking}
                className="rounded border border-[var(--border)] bg-[var(--background)] px-4 py-2 font-medium text-[var(--secondary)] hover:text-[var(--foreground)] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBlock}
                disabled={
                  isBlocking ||
                  confirmDeleteText.trim().toUpperCase() !== "DELETE" ||
                  !blockReason.trim()
                }
                className="rounded border border-red-800 bg-red-700 px-4 py-2 font-bold text-white hover:bg-red-800 transition active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
              >
                {isBlocking ? "Blocking Key..." : "Confirm & Block Key"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
