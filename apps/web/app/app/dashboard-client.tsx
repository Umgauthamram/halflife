"use client";

import { useEffect, useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { blockApiKeyAction } from "./actions";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

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

function RechartsCustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isBuy = data.action === "BUY";
    const isReuse = data.action === "REUSE";

    return (
      <div className="rounded-lg border border-[var(--border)] bg-[#18181b] p-3 text-xs font-mono text-white shadow-2xl min-w-[240px]">
        <div className="flex items-center justify-between border-b border-gray-700 pb-1.5 mb-2">
          <span className="font-bold text-amber-300">
            {data.name} &bull; {data.intent}
          </span>
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
              isReuse
                ? "bg-blue-900 text-blue-200"
                : isBuy
                ? "bg-amber-900 text-amber-200"
                : "bg-red-900 text-red-200"
            }`}
          >
            {data.action}
          </span>
        </div>
        <div className="flex flex-col gap-1 text-[11px] text-gray-300">
          <div className="flex justify-between">
            <span className="text-gray-400">Agent:</span>
            <span className="font-semibold text-white truncate max-w-[140px]">{data.agentName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Query Charge:</span>
            <span className={isBuy ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>
              ${data.charge.toFixed(3)} USDC
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Capital Saved:</span>
            <span className="text-emerald-400 font-bold">${data.saved.toFixed(3)} USDC</span>
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 pt-1.5 border-t border-gray-800 mt-1">
            <span>{data.timestamp} UTC</span>
            <span>{data.latencyMs ? `${data.latencyMs}ms` : "<5ms"}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export default function DashboardClient({
  calls,
  keys: initialKeys,
  agentsCount,
  totalSpendUsdc,
  totalSavedUsdc,
}: DashboardClientProps) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  // Selected or hovered point on the line graph
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Active call for detail inspector (defaults to latest call in window)
  const activeCall = useMemo(() => {
    if (graphCalls.length === 0) return null;
    const idx =
      hoveredPointIndex !== null && hoveredPointIndex >= 0 && hoveredPointIndex < graphCalls.length
        ? hoveredPointIndex
        : graphCalls.length - 1;
    return { call: graphCalls[idx], index: idx };
  }, [graphCalls, hoveredPointIndex]);

  // Format dataset for Recharts
  const rechartsData = useMemo(() => {
    let accSpend = 0;
    let accSaved = 0;

    return graphCalls.map((c, i) => {
      accSpend += c.priceUsdc;
      accSaved += c.savingsUsdc;

      return {
        index: i,
        name: `#${i + 1}`,
        charge: Number(c.priceUsdc.toFixed(3)),
        saved: Number(c.savingsUsdc.toFixed(3)),
        cumSpend: Number(accSpend.toFixed(3)),
        cumSaved: Number(accSaved.toFixed(3)),
        intent: c.intent,
        action: c.action.toUpperCase(),
        agentName: c.agentName,
        apiKeyPrefix: c.apiKeyPrefix,
        timestamp: new Date(c.timestamp).toISOString().replace("T", " ").slice(0, 19),
        latencyMs: c.latencyMs,
        call: c,
      };
    });
  }, [graphCalls]);

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

      {/* SECTION 1: Interactive Line Graph & Inspector */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight">API Activity &amp; Charges Line Graph</h2>
            <p className="text-xs text-[var(--secondary)] font-mono mt-0.5">
              Continuous trend line of query charges and cumulative savings. Click or hover any data point to inspect details.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedGraphView("charges")}
              className={`rounded px-3 py-1.5 text-xs font-mono font-medium transition ${
                selectedGraphView === "charges"
                  ? "bg-[var(--foreground)] text-[var(--background)] shadow-xs"
                  : "border border-[var(--border)] bg-[var(--background)] text-[var(--secondary)] hover:text-[var(--foreground)] cursor-pointer"
              }`}
            >
              Cost per Call ($)
            </button>
            <button
              onClick={() => setSelectedGraphView("cumulative")}
              className={`rounded px-3 py-1.5 text-xs font-mono font-medium transition ${
                selectedGraphView === "cumulative"
                  ? "bg-[var(--foreground)] text-[var(--background)] shadow-xs"
                  : "border border-[var(--border)] bg-[var(--background)] text-[var(--secondary)] hover:text-[var(--foreground)] cursor-pointer"
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
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
              <div className="flex items-center gap-6">
                {selectedGraphView === "charges" ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block ring-2 ring-amber-200" />
                      <span className="text-[var(--secondary)]">BUY &bull; $0.010 (Miner Purchase)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block ring-2 ring-emerald-200" />
                      <span className="text-[var(--secondary)]">REUSE &bull; $0.000 (Saved $0.010)</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-5 rounded-xs bg-amber-500 inline-block" />
                      <span className="text-[var(--secondary)]">Cumulative Spend ($ USDC)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-5 rounded-xs bg-emerald-600 inline-block" />
                      <span className="text-[var(--secondary)]">Cumulative Saved ($ USDC)</span>
                    </div>
                  </>
                )}
              </div>

              <span className="text-[11px] text-[var(--secondary)]">
                Showing {graphCalls.length} call{graphCalls.length === 1 ? "" : "s"} &bull; Click or hover any point
              </span>
            </div>

            {/* Recharts Responsive Container */}
            <div className="w-full h-72 sm:h-80 rounded-lg border border-[var(--border)] bg-[var(--background)] p-4 flex flex-col justify-center">
              {!isMounted ? (
                <div className="w-full h-full flex items-center justify-center font-mono text-xs text-[var(--secondary)]">
                  Loading chart engine...
                </div>
              ) : selectedGraphView === "charges" ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={rechartsData}
                    margin={{ top: 12, right: 20, left: 10, bottom: 4 }}
                    onMouseMove={(e: any) => {
                      if (e && e.activeTooltipIndex !== undefined && e.activeTooltipIndex !== null) {
                        setHoveredPointIndex(Number(e.activeTooltipIndex));
                      }
                    }}
                    onClick={(e: any) => {
                      if (e && e.activeTooltipIndex !== undefined && e.activeTooltipIndex !== null) {
                        setHoveredPointIndex(Number(e.activeTooltipIndex));
                      }
                    }}
                  >
                    <defs>
                      <linearGradient id="chargeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="var(--secondary)"
                      tick={{ fill: "var(--secondary)", fontSize: 11, fontFamily: "monospace" }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 0.012]}
                      ticks={[0, 0.005, 0.01]}
                      tickFormatter={(v: number) => `$${v.toFixed(3)}`}
                      stroke="var(--secondary)"
                      tick={{ fill: "var(--secondary)", fontSize: 11, fontFamily: "monospace" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<RechartsCustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="charge"
                      name="Query Cost"
                      stroke="#d97706"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#chargeGradient)"
                      activeDot={{
                        r: 6,
                        stroke: "#f59e0b",
                        strokeWidth: 2,
                        fill: "#18181b",
                      }}
                      dot={(props: any) => {
                        const { cx, cy, payload } = props;
                        if (cx == null || cy == null) return null;
                        const isBuy = payload.action === "BUY";
                        const isSelected = activeCall?.index === payload.index;
                        return (
                          <circle
                            key={`charge-dot-${payload.index}`}
                            cx={cx}
                            cy={cy}
                            r={isSelected ? 6 : 4}
                            fill={isBuy ? "#d97706" : "#059669"}
                            stroke={isSelected ? "#ffffff" : "var(--background)"}
                            strokeWidth={2}
                            className="cursor-pointer transition-all"
                            onClick={() => setHoveredPointIndex(payload.index)}
                          />
                        );
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={rechartsData}
                    margin={{ top: 12, right: 20, left: 10, bottom: 4 }}
                    onMouseMove={(e: any) => {
                      if (e && e.activeTooltipIndex !== undefined && e.activeTooltipIndex !== null) {
                        setHoveredPointIndex(Number(e.activeTooltipIndex));
                      }
                    }}
                    onClick={(e: any) => {
                      if (e && e.activeTooltipIndex !== undefined && e.activeTooltipIndex !== null) {
                        setHoveredPointIndex(Number(e.activeTooltipIndex));
                      }
                    }}
                  >
                    <defs>
                      <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d97706" stopOpacity={0.30} />
                        <stop offset="95%" stopColor="#d97706" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="savedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.30} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="var(--secondary)"
                      tick={{ fill: "var(--secondary)", fontSize: 11, fontFamily: "monospace" }}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(v: number) => `$${v.toFixed(3)}`}
                      stroke="var(--secondary)"
                      tick={{ fill: "var(--secondary)", fontSize: 11, fontFamily: "monospace" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<RechartsCustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="cumSaved"
                      name="Cumulative Saved"
                      stroke="#059669"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#savedGradient)"
                      activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2, fill: "#18181b" }}
                      dot={(props: any) => {
                        const { cx, cy, payload } = props;
                        if (cx == null || cy == null) return null;
                        const isSelected = activeCall?.index === payload.index;
                        return (
                          <circle
                            key={`saved-dot-${payload.index}`}
                            cx={cx}
                            cy={cy}
                            r={isSelected ? 5.5 : 3.5}
                            fill="#059669"
                            stroke={isSelected ? "#ffffff" : "var(--background)"}
                            strokeWidth={1.5}
                            className="cursor-pointer"
                            onClick={() => setHoveredPointIndex(payload.index)}
                          />
                        );
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="cumSpend"
                      name="Cumulative Spend"
                      stroke="#d97706"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#spendGradient)"
                      activeDot={{ r: 6, stroke: "#f59e0b", strokeWidth: 2, fill: "#18181b" }}
                      dot={(props: any) => {
                        const { cx, cy, payload } = props;
                        if (cx == null || cy == null) return null;
                        const isSelected = activeCall?.index === payload.index;
                        return (
                          <circle
                            key={`spend-dot-${payload.index}`}
                            cx={cx}
                            cy={cy}
                            r={isSelected ? 5.5 : 3.5}
                            fill="#d97706"
                            stroke={isSelected ? "#ffffff" : "var(--background)"}
                            strokeWidth={1.5}
                            className="cursor-pointer"
                            onClick={() => setHoveredPointIndex(payload.index)}
                          />
                        );
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Interactive Call Inspector Card (Directly below the graph for 100% clarity) */}
            {activeCall && (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 font-mono text-xs">
                <div className="flex items-center gap-3">
                  <span className="rounded bg-[var(--surface)] border border-[var(--border)] px-2.5 py-1 text-xs font-bold text-[var(--foreground)] shrink-0">
                    Point #{activeCall.index + 1} of {graphCalls.length}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[var(--foreground)]">
                        {activeCall.call.agentName}
                      </span>
                      <span className="text-[11px] text-[var(--secondary)]">
                        ({activeCall.call.apiKeyPrefix}...)
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--secondary)] mt-0.5">
                      {new Date(activeCall.call.timestamp).toISOString().replace("T", " ").slice(0, 19)} UTC
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-6 border-t lg:border-t-0 border-[var(--border)] pt-3 lg:pt-0">
                  <div>
                    <span className="text-[10px] uppercase text-[var(--secondary)] block">Intent</span>
                    <span className="font-semibold text-[var(--foreground)]">{activeCall.call.intent}</span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase text-[var(--secondary)] block">Decision</span>
                    {activeCall.call.action === "reuse" ? (
                      <span className="inline-block rounded border border-blue-300 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-900">
                        REUSE (Free)
                      </span>
                    ) : activeCall.call.action === "buy" ? (
                      <span className="inline-block rounded border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                        BUY ($0.010)
                      </span>
                    ) : (
                      <span className="inline-block rounded border border-red-300 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-900">
                        REFUSE
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] uppercase text-[var(--secondary)] block">Charge Made</span>
                    <span className={`font-bold ${activeCall.call.priceUsdc > 0 ? "text-amber-800" : "text-emerald-700"}`}>
                      ${activeCall.call.priceUsdc.toFixed(3)} USDC
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase text-[var(--secondary)] block">Capital Saved</span>
                    <span className="font-bold text-emerald-700">
                      ${activeCall.call.savingsUsdc.toFixed(3)} USDC
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase text-[var(--secondary)] block">Latency</span>
                    <span className="text-[var(--secondary)]">
                      {activeCall.call.latencyMs ? `${activeCall.call.latencyMs}ms` : "<5ms"}
                    </span>
                  </div>
                </div>
              </div>
            )}
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

