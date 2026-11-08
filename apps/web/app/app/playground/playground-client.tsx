"use client";

import { useState, useTransition } from "react";
import {
  generateAiCodeAction,
  executeTestAskAction,
  getPlaygroundAnalyticsAction,
  type AiCodeGenerationResult,
} from "./actions";

interface AgentSummary {
  id: string;
  name: string;
  prefix?: string;
}

interface PlaygroundClientProps {
  userAgents: AgentSummary[];
  defaultApiKey?: string;
  hasGeminiKey: boolean;
}

const TEMPLATES = [
  {
    id: "fx-treasury",
    title: "FX Cross-Border Treasury",
    intent: "FX_NOW",
    stake: 500,
    params: { pair: "EURUSD" },
    tag: "Treasury",
    prompt: "Check EUR/USD rate before settling a $500 cross-border supplier payment",
    badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
  },
  {
    id: "defi-arbitrage",
    title: "DeFi Arbitrage Monitor",
    intent: "FX_NOW",
    stake: 2500,
    params: { pair: "GBPUSD" },
    tag: "High Stake",
    prompt: "Monitor GBP/USD exchange rate for a high-value $2,500 liquidity swap",
    badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
  },
  {
    id: "weather-risk",
    title: "Parametric Weather Payout",
    intent: "WEATHER_FORECAST_VERIFY",
    stake: 1200,
    params: { location: "London" },
    tag: "Insurance",
    prompt: "Verify current London temperature for automated agricultural parametric claims",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  {
    id: "sanctions-compliance",
    title: "OFAC Sanctions Screener",
    intent: "SANCTIONS_SCREENING_MATCH",
    stake: 10000,
    params: { entity: "Acme International" },
    tag: "Compliance",
    prompt: "Screen entity Acme International against OFAC sanctions database before clearing $10,000 transfer",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
  },
  {
    id: "rapid-heartbeat",
    title: "High-Frequency Heartbeat",
    intent: "FX_NOW",
    stake: 50,
    params: { pair: "EURUSD" },
    tag: "Test Reuse",
    prompt: "Run continuous heartbeat check. Observe first query BUY, subsequent immediate query REUSE at $0.00",
    badgeColor: "bg-indigo-50 text-indigo-800 border-indigo-200",
  },
];

export default function PlaygroundClient({
  userAgents,
  defaultApiKey = "",
  hasGeminiKey,
}: PlaygroundClientProps) {
  const [activeTab, setActiveTab] = useState<"studio" | "analytics">("studio");
  const [apiKey, setApiKey] = useState(defaultApiKey);

  // Studio State
  const [prompt, setPrompt] = useState(TEMPLATES[0].prompt);
  const [selectedTemplateId, setSelectedTemplateId] = useState(TEMPLATES[0].id);
  const [activeLanguage, setActiveLanguage] = useState<"curl" | "ts" | "py">("curl");
  const [codeResult, setCodeResult] = useState<AiCodeGenerationResult | null>(null);

  // Execution & Live Results
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [executionLatency, setExecutionLatency] = useState<number | null>(null);

  // Analytics State
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  const [isGenerating, startGenerating] = useTransition();
  const [isExecuting, startExecuting] = useTransition();
  const [isLoadingAnalytics, startLoadingAnalytics] = useTransition();
  const [copiedCode, setCopiedCode] = useState(false);

  // Apply template
  const handleSelectTemplate = (tmpl: typeof TEMPLATES[0]) => {
    setSelectedTemplateId(tmpl.id);
    setPrompt(tmpl.prompt);
    // Instant code preview for template
    setCodeResult({
      intent: tmpl.intent,
      stake: tmpl.stake,
      params: tmpl.params,
      explanation: tmpl.prompt,
      isAiGenerated: false,
      curlCode: `curl -X POST https://halflifes.vercel.app/api/v1/ask \\\n  -H "Authorization: Bearer ${apiKey || "hl_live_YOUR_KEY"}" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify({ intent: tmpl.intent, stake: tmpl.stake, requestId: "req_" + Date.now(), params: tmpl.params })}'`,
      typeScriptCode: `import { HalfLifeClient } from "@half-life/sdk";\n\nconst client = new HalfLifeClient({\n  apiKey: "${apiKey || "hl_live_YOUR_KEY"}",\n  baseUrl: "https://halflifes.vercel.app",\n});\n\nconst decision = await client.ask({\n  intent: "${tmpl.intent}",\n  stake: ${tmpl.stake},\n  params: ${JSON.stringify(tmpl.params)},\n});\nconsole.log(decision.action); // 'buy' or 'reuse'`,
      pythonCode: `import requests\n\nresponse = requests.post(\n    "https://halflifes.vercel.app/api/v1/ask",\n    headers={"Authorization": "Bearer ${apiKey || "hl_live_YOUR_KEY"}"},\n    json={\n        "intent": "${tmpl.intent}",\n        "stake": ${tmpl.stake},\n        "requestId": "agent_req_01",\n        "params": ${JSON.stringify(tmpl.params)}\n    }\n)\nprint(response.json())`,
    });
  };

  // Run Gemini Code Generation
  const handleGenerateCode = () => {
    startGenerating(async () => {
      setExecutionError(null);
      const res = await generateAiCodeAction(prompt, apiKey || "hl_live_YOUR_KEY");
      setCodeResult(res);
    });
  };

  // Run Live Ask Request
  const handleExecuteAsk = () => {
    if (!apiKey.trim()) {
      setExecutionError("Please provide an Agent API Key first (copy from /app/agents).");
      return;
    }

    startExecuting(async () => {
      setExecutionError(null);
      const payload = {
        intent: codeResult?.intent || "FX_NOW",
        stake: codeResult?.stake || 100,
        params: codeResult?.params || { pair: "EURUSD" },
        requestId: `test_req_${Date.now()}`,
      };

      const res = await executeTestAskAction(apiKey, payload);
      if (!res.success) {
        setExecutionError(res.error || "Failed to execute ask");
        setExecutionResult(null);
      } else {
        setExecutionResult(res.result);
        setExecutionLatency(res.latencyMs ?? null);
      }
    });
  };

  // Switch to Analytics
  const handleOpenAnalytics = () => {
    setActiveTab("analytics");
    startLoadingAnalytics(async () => {
      const data = await getPlaygroundAnalyticsAction();
      setAnalyticsData(data);
    });
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {}
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Top Header & Mode Toggle */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-mono font-bold uppercase tracking-wider text-amber-900">
              Interactive Sandbox
            </span>
            {hasGeminiKey ? (
              <span className="rounded border border-purple-200 bg-purple-50 px-2 py-0.5 text-[11px] font-mono text-purple-700">
                ✨ Gemini 2.5 Flash Connected
              </span>
            ) : (
              <span className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-mono text-[var(--secondary)]">
                Template Mode (Add GEMINI_API_KEY in .env)
              </span>
            )}
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Agent Testing Studio &amp; AI Generator</h1>
          <p className="mt-1 text-sm text-[var(--secondary)]">
            Write queries with Gemini AI, test live Governor decisions, and inspect execution analytics.
          </p>
        </div>

        {/* Tab Toggle Buttons */}
        <div className="flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1">
          <button
            onClick={() => setActiveTab("studio")}
            className={`rounded px-3.5 py-1.5 text-xs font-mono font-medium transition ${
              activeTab === "studio"
                ? "bg-[var(--foreground)] text-[var(--background)] shadow-xs"
                : "text-[var(--secondary)] hover:text-[var(--foreground)]"
            }`}
          >
            Testing Studio
          </button>
          <button
            onClick={handleOpenAnalytics}
            className={`flex items-center gap-1.5 rounded px-3.5 py-1.5 text-xs font-mono font-medium transition ${
              activeTab === "analytics"
                ? "bg-[var(--foreground)] text-[var(--background)] shadow-xs"
                : "text-[var(--secondary)] hover:text-[var(--foreground)]"
            }`}
          >
            <span>📊 Analytics &amp; History</span>
          </button>
        </div>
      </div>

      {activeTab === "studio" ? (
        <div className="flex flex-col gap-8">
          {/* API Key Virtual Environment Bar */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-[var(--secondary)] font-semibold">
                  Virtual Environment &bull; Agent API Key
                </label>
                <p className="text-xs text-[var(--secondary)] mt-0.5">
                  Injected into code snippets and passed in <code className="font-mono">Authorization: Bearer hl_live_...</code>
                </p>
              </div>

              {userAgents.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[var(--secondary)]">Auto-fill:</span>
                  {userAgents.map((ag) => (
                    <button
                      key={ag.id}
                      type="button"
                      onClick={() => setApiKey(ag.prefix ? `${ag.prefix}...` : defaultApiKey)}
                      className="rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs font-mono hover:border-[var(--border-strong)] transition"
                    >
                      {ag.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-3 flex gap-2">
              <input
                type="text"
                placeholder="hl_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-3.5 py-2 font-mono text-xs focus-visible:outline-2 focus-visible:outline-[var(--border-strong)]"
              />
            </div>
          </div>

          {/* 5 Pre-Built Scenarios */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--secondary)] font-semibold">
                Or Select from 5 Pre-Built Scenarios
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
              {TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tmpl)}
                  className={`flex flex-col justify-between text-left rounded-lg border p-3.5 transition ${
                    selectedTemplateId === tmpl.id
                      ? "border-[var(--border-strong)] bg-amber-50/50 shadow-xs"
                      : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  <div>
                    <span className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-mono font-medium ${tmpl.badgeColor}`}>
                      {tmpl.tag}
                    </span>
                    <h3 className="mt-2 text-xs font-semibold text-[var(--foreground)] line-clamp-1">{tmpl.title}</h3>
                    <p className="mt-1 text-[11px] text-[var(--secondary)] line-clamp-2 leading-relaxed">{tmpl.prompt}</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[var(--border)] flex items-center justify-between font-mono text-[10px] text-[var(--secondary)]">
                    <span>{tmpl.intent}</span>
                    <span className="font-semibold">${tmpl.stake}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Natural Language Prompt & AI Generator */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
            <label className="text-xs font-mono uppercase tracking-wider text-[var(--secondary)] font-semibold">
              Natural Language Scenario / Prompt
            </label>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <textarea
                rows={2}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your query scenario (e.g. Check EUR/USD rate before settling a $500 cross-border supplier payment)..."
                className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-[var(--border-strong)]"
              />
              <button
                type="button"
                onClick={handleGenerateCode}
                disabled={isGenerating}
                className="whitespace-nowrap rounded border border-purple-800 bg-purple-900 px-5 py-2 text-xs font-mono font-bold text-white hover:bg-purple-950 transition active:scale-98 disabled:opacity-50"
              >
                {isGenerating ? "Generating..." : "✨ Generate Code"}
              </button>
            </div>
          </div>

          {/* Generated Code & Live Runner Section */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Left: Code Box with Tabs */}
            <div className="flex flex-col rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
              <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--background)] px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[var(--secondary)] font-semibold uppercase">Snippet:</span>
                  <div className="flex rounded border border-[var(--border)] bg-[var(--surface)] p-0.5">
                    <button
                      onClick={() => setActiveLanguage("curl")}
                      className={`rounded px-2.5 py-0.5 text-[11px] font-mono ${
                        activeLanguage === "curl" ? "bg-[var(--foreground)] text-[var(--background)]" : "text-[var(--secondary)]"
                      }`}
                    >
                      cURL
                    </button>
                    <button
                      onClick={() => setActiveLanguage("ts")}
                      className={`rounded px-2.5 py-0.5 text-[11px] font-mono ${
                        activeLanguage === "ts" ? "bg-[var(--foreground)] text-[var(--background)]" : "text-[var(--secondary)]"
                      }`}
                    >
                      TypeScript
                    </button>
                    <button
                      onClick={() => setActiveLanguage("py")}
                      className={`rounded px-2.5 py-0.5 text-[11px] font-mono ${
                        activeLanguage === "py" ? "bg-[var(--foreground)] text-[var(--background)]" : "text-[var(--secondary)]"
                      }`}
                    >
                      Python
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const code =
                      activeLanguage === "curl"
                        ? codeResult?.curlCode || ""
                        : activeLanguage === "ts"
                        ? codeResult?.typeScriptCode || ""
                        : codeResult?.pythonCode || "";
                    handleCopyCode(code);
                  }}
                  className="text-xs font-mono text-[var(--secondary)] hover:text-[var(--foreground)]"
                >
                  {copiedCode ? "✓ Copied" : "Copy"}
                </button>
              </div>

              <div className="p-4 flex-1 bg-[#121214] text-gray-200 font-mono text-xs overflow-x-auto leading-relaxed">
                <pre>
                  {activeLanguage === "curl"
                    ? codeResult?.curlCode || "// Click 'Generate Code' or select a template above"
                    : activeLanguage === "ts"
                    ? codeResult?.typeScriptCode || "// Click 'Generate Code' or select a template above"
                    : codeResult?.pythonCode || "# Click 'Generate Code' or select a template above"}
                </pre>
              </div>

              <div className="border-t border-[var(--border)] p-3 bg-[var(--background)] flex items-center justify-between">
                <span className="text-[11px] font-mono text-[var(--secondary)]">
                  {codeResult?.explanation || "Ready to execute against Telegraph Governor."}
                </span>
                <button
                  type="button"
                  onClick={handleExecuteAsk}
                  disabled={isExecuting}
                  className="rounded border border-green-800 bg-green-800 px-4 py-2 text-xs font-mono font-bold text-white hover:bg-green-900 transition active:scale-98 disabled:opacity-50 shadow-xs"
                >
                  {isExecuting ? "Executing Ask..." : "🚀 Execute Live Ask"}
                </button>
              </div>
            </div>

            {/* Right: Live Governor Decision & Proof Output */}
            <div className="flex flex-col rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
              <div className="border-b border-[var(--border)] bg-[var(--background)] px-4 py-2.5 flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-[var(--secondary)] font-semibold">
                  Live Governor Response &amp; Economic Proof
                </span>
                {executionLatency && (
                  <span className="text-[11px] font-mono text-green-700 font-semibold">
                    Latency: {executionLatency}ms
                  </span>
                )}
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                {executionError && (
                  <div className="rounded border border-red-300 bg-red-50 p-4 text-xs font-mono text-red-800 mb-4">
                    ⚠️ {executionError}
                  </div>
                )}

                {executionResult ? (
                  <div className="flex flex-col gap-4 font-mono">
                    {/* Decision Hero Banner */}
                    <div
                      className={`rounded-lg border p-4 flex items-center justify-between ${
                        executionResult.action === "reuse"
                          ? "border-blue-300 bg-blue-50/80 text-blue-950"
                          : executionResult.action === "buy"
                          ? "border-emerald-300 bg-emerald-50/80 text-emerald-950"
                          : "border-red-300 bg-red-50/80 text-red-950"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white ${
                              executionResult.action === "reuse"
                                ? "bg-blue-700"
                                : executionResult.action === "buy"
                                ? "bg-emerald-700"
                                : "bg-red-700"
                            }`}
                          >
                            GOVERNOR: {executionResult.action}
                          </span>
                          <span className="text-xs font-semibold">
                            {executionResult.action === "reuse"
                              ? "Saved 100% of Ask Price"
                              : executionResult.action === "buy"
                              ? "Fresh Telegraph Miner Purchase"
                              : "Blocked"}
                          </span>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed">{executionResult.reason}</p>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-[var(--secondary)]">Cost</div>
                        <div className="text-lg font-bold">${executionResult.priceUsdc?.toFixed(3)}</div>
                      </div>
                    </div>

                    {/* Mathematical Inputs */}
                    {executionResult.inputs && (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="border border-[var(--border)] bg-[var(--background)] p-2.5 rounded">
                          <span className="text-[var(--secondary)]">Expected Drift:</span>{" "}
                          <span className="font-semibold">{Number(executionResult.inputs.drift).toFixed(5)}</span>
                        </div>
                        <div className="border border-[var(--border)] bg-[var(--background)] p-2.5 rounded">
                          <span className="text-[var(--secondary)]">Miner Noise Floor:</span>{" "}
                          <span className="font-semibold">{Number(executionResult.inputs.noiseFloor).toFixed(4)}</span>
                        </div>
                      </div>
                    )}

                    {/* Answer Preview */}
                    <div className="border border-[var(--border)] bg-[var(--background)] p-3 rounded text-xs">
                      <span className="text-[var(--secondary)] text-[11px] uppercase block mb-1">Answer Payload:</span>
                      <pre className="text-xs font-mono overflow-x-auto text-green-900 font-semibold">
                        {JSON.stringify(executionResult.answer, null, 2)}
                      </pre>
                    </div>

                    {/* On-Chain Receipt */}
                    {executionResult.txHash && (
                      <div className="text-[11px] text-[var(--secondary)] truncate">
                        Sepolia Proof: <span className="font-mono text-xs">{executionResult.txHash}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center text-xs text-[var(--secondary)]">
                    <span className="text-3xl mb-2">⚡</span>
                    <p className="font-medium">No ask executed yet.</p>
                    <p className="mt-1 max-w-xs">
                      Select a scenario or generate code with Gemini, then click <strong>&quot;Execute Live Ask&quot;</strong> to watch the Governor calculate decay in real time!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Analytics & Historical Run Viewer Tab */
        <div className="flex flex-col gap-6">
          {isLoadingAnalytics ? (
            <div className="p-12 text-center text-xs font-mono text-[var(--secondary)]">
              Loading playground analytics...
            </div>
          ) : analyticsData ? (
            <div className="flex flex-col gap-6">
              {/* Stat Metric Cards */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                <div className="border border-[var(--border)] bg-[var(--surface)] p-4 rounded-lg">
                  <span className="text-[10px] font-mono uppercase text-[var(--secondary)]">Total Runs</span>
                  <div className="mt-1 text-2xl font-semibold">{analyticsData.totalRuns}</div>
                </div>
                <div className="border border-[var(--border)] bg-[var(--surface)] p-4 rounded-lg">
                  <span className="text-[10px] font-mono uppercase text-[var(--secondary)]">Total Spend</span>
                  <div className="mt-1 text-2xl font-semibold">${analyticsData.totalSpend}</div>
                </div>
                <div className="border border-green-200 bg-green-50/50 p-4 rounded-lg text-green-900">
                  <span className="text-[10px] font-mono uppercase text-green-800">Total Saved ($)</span>
                  <div className="mt-1 text-2xl font-bold text-green-700">${analyticsData.totalSavings}</div>
                </div>
                <div className="border border-[var(--border)] bg-[var(--surface)] p-4 rounded-lg">
                  <span className="text-[10px] font-mono uppercase text-[var(--secondary)]">Governor Reuse Rate</span>
                  <div className="mt-1 text-2xl font-semibold">{analyticsData.savingsRate}%</div>
                </div>
                <div className="border border-[var(--border)] bg-[var(--surface)] p-4 rounded-lg">
                  <span className="text-[10px] font-mono uppercase text-[var(--secondary)]">Avg Latency</span>
                  <div className="mt-1 text-2xl font-semibold">{analyticsData.avgLatencyMs}ms</div>
                </div>
              </div>

              {/* Runs Table */}
              <div className="overflow-x-auto border border-[var(--border)] bg-[var(--surface)] rounded-lg">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[var(--border)] bg-[var(--background)] font-mono text-xs text-[var(--secondary)]">
                    <tr>
                      <th className="px-4 py-3">Run ID</th>
                      <th className="px-4 py-3">Timestamp (UTC)</th>
                      <th className="px-4 py-3">Agent</th>
                      <th className="px-4 py-3">Intent</th>
                      <th className="px-4 py-3">Decision</th>
                      <th className="px-4 py-3 text-right">Cost</th>
                      <th className="px-4 py-3 text-right">Saved</th>
                      <th className="px-4 py-3 text-right">Latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)] font-mono text-xs">
                    {analyticsData.runs.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-[var(--secondary)]">
                          No test runs recorded yet. Execute an ask in the studio to see analytics!
                        </td>
                      </tr>
                    ) : (
                      analyticsData.runs.map((r: any) => (
                        <tr key={r.runId} className="hover:bg-[var(--background)]">
                          <td className="px-4 py-3 font-semibold text-purple-900">{r.runId}</td>
                          <td className="px-4 py-3 text-[var(--secondary)]">{r.createdAt.slice(0, 19).replace("T", " ")}</td>
                          <td className="px-4 py-3 font-sans font-medium">{r.agentName}</td>
                          <td className="px-4 py-3">{r.intent}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded px-2 py-0.5 text-[10px] uppercase font-bold ${
                                r.action === "reuse"
                                  ? "bg-blue-100 text-blue-800"
                                  : r.action === "buy"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {r.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">${r.priceUsdc?.toFixed(3)}</td>
                          <td className="px-4 py-3 text-right font-bold text-green-700">${r.savingsUsdc?.toFixed(3)}</td>
                          <td className="px-4 py-3 text-right text-[var(--secondary)]">{r.latencyMs}ms</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
