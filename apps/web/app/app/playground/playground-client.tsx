"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  generateAiCodeAction,
  executeTestAskAction,
  getPlaygroundAnalyticsAction,
  type AiCodeGenerationResult,
} from "./actions";

interface AgentSummary {
  id: string;
  name: string;
  fullKey?: string;
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
    why: "Real-time FX rates experience high market volatility. A $500 cross-border transaction exposes the agent to slippage if the rate drifts significantly. The Governor checks whether the price change since the last miner purchase exceeds the cost of a fresh query ($0.01).",
    how: "1. Governor looks up cached EUR/USD rate for this agent.\n2. Computes elapsed time Δt and queries the calibrated Atlas drift model.\n3. If expected drift d(Δt) is within the miner noise floor η, the cached rate is returned in <5ms for $0.00.\n4. If drift exceeds η or no cached rate exists, a fresh $0.01 ask is dispatched to Telegraph miners.",
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
    why: "High financial stake ($2,500) sharply compresses the acceptable error window. With $2,500 at risk, even a 0.05% price change costs $1.25, heavily favoring fresh miner re-evaluation unless the cached tick was fetched seconds ago.",
    how: "1. The Governor computes expected loss L(d) = stake * drift.\n2. When stake is high ($2,500), L(d) scales up rapidly.\n3. If L(d) exceeds the $0.01 ask price, the Governor triggers a BUY order to protect transaction value.\n4. Only ultra-fresh ticks (<2s) meet the reuse threshold.",
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
    why: "Agricultural parametric contracts trigger payouts based on observed weather thresholds. Ground weather measurements change slowly compared to financial markets, resulting in a much longer empirical half-life.",
    how: "1. Governor evaluates previous London weather observation.\n2. Because temperature drift is low over short horizons, the Atlas half-life curve shows zero information gain from re-buying within minutes.\n3. Governor reuses the certified observation at $0.00, eliminating duplicate oracle fees.",
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
    why: "Compliance checks require strict regulatory certainty ($10,000 stake). However, OFAC sanctions lists are updated on discrete daily or weekly government publication cycles.",
    how: "1. Governor hashes the target entity name.\n2. Recent sanctions screenings against this entity remain valid across the batch window.\n3. Governor reuses the certified compliance record with cryptographic provenance, maintaining auditability without recurring costs.",
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
    why: "High-frequency agents often poll rates in loops. Without Half-Life, an agent querying every second pays $0.01/sec ($864/day). With Half-Life, intermediate queries are satisfied from cache for $0.00.",
    how: "1. First call finds no cached tick; Governor buys from Telegraph for $0.01.\n2. Second call within seconds finds Δt ≈ 0, where drift is far below the miner noise floor.\n3. Governor returns action: REUSE at $0.00 with <5ms latency.",
  },
];

export default function PlaygroundClient({
  userAgents,
  defaultApiKey = "",
  hasGeminiKey,
}: PlaygroundClientProps) {
  const [activeTab, setActiveTab] = useState<"studio" | "analytics">("studio");
  const [studioMode, setStudioMode] = useState<"template" | "custom">("template");
  const [apiKey, setApiKey] = useState(defaultApiKey);

  // Studio State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(TEMPLATES[0].id);
  const [customPrompt, setCustomPrompt] = useState("");
  const [activeLanguage, setActiveLanguage] = useState<"curl" | "ts" | "py">("curl");
  const [codeResult, setCodeResult] = useState<AiCodeGenerationResult>({
    intent: TEMPLATES[0].intent,
    stake: TEMPLATES[0].stake,
    params: TEMPLATES[0].params,
    why: TEMPLATES[0].why,
    how: TEMPLATES[0].how,
    explanation: TEMPLATES[0].prompt,
    isAiGenerated: false,
    curlCode: `curl -X POST https://halflifes.vercel.app/api/v1/ask \\\n  -H "Authorization: Bearer ${defaultApiKey || "hl_live_YOUR_KEY"}" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify({ intent: TEMPLATES[0].intent, stake: TEMPLATES[0].stake, requestId: "req_" + Date.now(), params: TEMPLATES[0].params })}'`,
    typeScriptCode: `import { HalfLifeClient } from "@half-life/sdk";\n\nconst client = new HalfLifeClient({\n  apiKey: "${defaultApiKey || "hl_live_YOUR_KEY"}",\n  baseUrl: "https://halflifes.vercel.app",\n});\n\nconst decision = await client.ask({\n  intent: "${TEMPLATES[0].intent}",\n  stake: ${TEMPLATES[0].stake},\n  params: ${JSON.stringify(TEMPLATES[0].params)},\n});\nconsole.log(decision.action); // 'buy' or 'reuse'`,
    pythonCode: `import requests\n\nresponse = requests.post(\n    "https://halflifes.vercel.app/api/v1/ask",\n    headers={"Authorization": "Bearer ${defaultApiKey || "hl_live_YOUR_KEY"}"},\n    json={\n        "intent": "${TEMPLATES[0].intent}",\n        "stake": ${TEMPLATES[0].stake},\n        "requestId": "agent_req_01",\n        "params": ${JSON.stringify(TEMPLATES[0].params)}\n    }\n)\nprint(response.json())`,
  });

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

  // Helper to re-render code with specific API key
  const buildTemplateCode = (tmpl: typeof TEMPLATES[0], keyToUse: string) => ({
    intent: tmpl.intent,
    stake: tmpl.stake,
    params: tmpl.params,
    why: tmpl.why,
    how: tmpl.how,
    explanation: tmpl.prompt,
    isAiGenerated: false,
    curlCode: `curl -X POST https://halflifes.vercel.app/api/v1/ask \\\n  -H "Authorization: Bearer ${keyToUse || "hl_live_YOUR_KEY"}" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify({ intent: tmpl.intent, stake: tmpl.stake, requestId: "req_" + Date.now(), params: tmpl.params })}'`,
    typeScriptCode: `import { HalfLifeClient } from "@half-life/sdk";\n\nconst client = new HalfLifeClient({\n  apiKey: "${keyToUse || "hl_live_YOUR_KEY"}",\n  baseUrl: "https://halflifes.vercel.app",\n});\n\nconst decision = await client.ask({\n  intent: "${tmpl.intent}",\n  stake: ${tmpl.stake},\n  params: ${JSON.stringify(tmpl.params)},\n});\nconsole.log(decision.action); // 'buy' or 'reuse'`,
    pythonCode: `import requests\n\nresponse = requests.post(\n    "https://halflifes.vercel.app/api/v1/ask",\n    headers={"Authorization": "Bearer ${keyToUse || "hl_live_YOUR_KEY"}"},\n    json={\n        "intent": "${tmpl.intent}",\n        "stake": ${tmpl.stake},\n        "requestId": "agent_req_01",\n        "params": ${JSON.stringify(tmpl.params)}\n    }\n)\nprint(response.json())`,
  });

  // Apply template immediately without needing code generation button
  const handleSelectTemplate = (tmpl: typeof TEMPLATES[0], keyOverride?: string) => {
    setSelectedTemplateId(tmpl.id);
    setStudioMode("template");
    const activeKey = keyOverride || apiKey || "hl_live_YOUR_KEY";
    setCodeResult(buildTemplateCode(tmpl, activeKey));
  };

  // Auto-fill full active API key from user's agent
  const handleAutoFill = (ag: AgentSummary) => {
    const fullKey = ag.fullKey || ag.prefix || defaultApiKey;
    setApiKey(fullKey);
    if (selectedTemplateId) {
      const tmpl = TEMPLATES.find((t) => t.id === selectedTemplateId) || TEMPLATES[0];
      setCodeResult(buildTemplateCode(tmpl, fullKey));
    }
  };

  const handleApiKeyChange = (newKey: string) => {
    setApiKey(newKey);
    if (selectedTemplateId && studioMode === "template") {
      const tmpl = TEMPLATES.find((t) => t.id === selectedTemplateId) || TEMPLATES[0];
      setCodeResult(buildTemplateCode(tmpl, newKey));
    }
  };

  // Run AI Code Generator for Custom / Own Idea
  const handleGenerateCustomCode = () => {
    const query = customPrompt.trim() || "Check EUR/USD rate before settling a $500 cross-border supplier payment";
    startGenerating(async () => {
      setExecutionError(null);
      const res = await generateAiCodeAction(query, apiKey || "hl_live_YOUR_KEY");
      setCodeResult(res);
    });
  };

  // Run Live Ask Request
  const handleExecuteAsk = () => {
    if (!apiKey.trim()) {
      setExecutionError("Please provide an Agent API Key first (copy from /app/agents or click auto-fill).");
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
        setExecutionResult({ ...res.result, runId: res.runId });
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
      {/* Top Header & Tab Toggle */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agent Testing Studio &amp; AI Generator</h1>
          <p className="mt-1 text-sm text-[var(--secondary)]">
            Test pre-built scenario templates or write custom queries with Gemini AI.
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
            className={`rounded px-3.5 py-1.5 text-xs font-mono font-medium transition ${
              activeTab === "analytics"
                ? "bg-[var(--foreground)] text-[var(--background)] shadow-xs"
                : "text-[var(--secondary)] hover:text-[var(--foreground)]"
            }`}
          >
            Analytics &amp; History
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
                      onClick={() => handleAutoFill(ag)}
                      className="rounded border border-[var(--border)] bg-[var(--background)] px-2.5 py-1 text-xs font-mono hover:border-purple-600 hover:text-purple-900 transition font-medium cursor-pointer"
                      title={`Click to fill full active API key for ${ag.name}`}
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
                onChange={(e) => handleApiKeyChange(e.target.value)}
                className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-3.5 py-2 font-mono text-xs focus-visible:outline-2 focus-visible:outline-[var(--border-strong)]"
              />
            </div>
          </div>

          {/* Mode Switcher: Pre-built Scenarios vs Own Idea (AI Code Writer) */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStudioMode("template");
                    if (!selectedTemplateId) {
                      handleSelectTemplate(TEMPLATES[0]);
                    }
                  }}
                  className={`rounded px-3 py-1.5 text-xs font-mono font-semibold transition ${
                    studioMode === "template"
                      ? "bg-[var(--foreground)] text-[var(--background)] shadow-xs"
                      : "border border-[var(--border)] bg-[var(--surface)] text-[var(--secondary)] hover:text-[var(--foreground)]"
                  }`}
                >
                  Pre-Built Scenarios (5)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStudioMode("custom");
                    setSelectedTemplateId(null);
                  }}
                  className={`rounded px-3 py-1.5 text-xs font-mono font-semibold transition flex items-center gap-1.5 ${
                    studioMode === "custom"
                      ? "bg-purple-900 text-white shadow-xs border border-purple-800"
                      : "border border-purple-300 bg-purple-50 text-purple-900 hover:bg-purple-100"
                  }`}
                >
                  <span>+ Write Own Idea (AI Code Writer)</span>
                </button>
              </div>

              <span className="text-[11px] font-mono text-[var(--secondary)]">
                {studioMode === "template"
                  ? "Select any scenario &mdash; code is ready to execute immediately."
                  : "Type any idea &mdash; Google Gemini AI will write the integration code."}
              </span>
            </div>

            {/* Template Mode: 5 Pre-Built Scenarios (NO Generate Code Button needed) */}
            {studioMode === "template" && (
              <div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
                  {TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => handleSelectTemplate(tmpl)}
                      className={`flex flex-col justify-between text-left rounded-lg border p-3.5 transition cursor-pointer ${
                        selectedTemplateId === tmpl.id
                          ? "border-[var(--border-strong)] bg-amber-50/50 shadow-xs ring-1 ring-[var(--border-strong)]"
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
            )}

            {/* Custom Mode: Dedicated AI Code Writer for Own Idea */}
            {studioMode === "custom" && (
              <div className="rounded-lg border-2 border-purple-300 bg-purple-50/40 p-5">
                <div className="flex items-center justify-between border-b border-purple-200 pb-3 mb-3">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-wider text-purple-900 font-bold block">
                      Own Idea &bull; AI Code Writer
                    </span>
                    <span className="text-xs text-[var(--secondary)]">
                      Describe your query scenario in plain English. Gemini AI will configure the Telegraph intent, calculate the risk stake, and write client code.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStudioMode("template");
                      handleSelectTemplate(TEMPLATES[0]);
                    }}
                    className="text-xs font-mono text-purple-900 hover:underline shrink-0"
                  >
                    &larr; Switch to Pre-Built Templates
                  </button>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <textarea
                    rows={2}
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Describe your custom scenario (e.g. Monitor GBP/JPY currency arbitrage before settling a $5,000 liquidity swap)..."
                    className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-purple-600 font-sans"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateCustomCode}
                    disabled={isGenerating}
                    className="whitespace-nowrap rounded border border-purple-800 bg-purple-900 px-5 py-2 text-xs font-mono font-bold text-white hover:bg-purple-950 transition active:scale-98 disabled:opacity-50 shrink-0 shadow-sm"
                  >
                    {isGenerating ? "Writing Code..." : "Generate with AI"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Why & How It Works Explanation Panel */}
          {codeResult && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-[var(--secondary)] font-semibold">
                  Why &amp; How It Works
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--background)] border border-[var(--border)] text-[var(--secondary)]">
                  Governor Logic
                </span>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
                <div className="rounded border border-[var(--border)] bg-[var(--background)] p-3.5">
                  <span className="font-mono font-semibold uppercase text-xs text-[var(--foreground)] block mb-1.5">
                    Why this Intent &amp; Stake:
                  </span>
                  <p className="text-[var(--secondary)] whitespace-pre-line leading-relaxed">{codeResult.why}</p>
                </div>
                <div className="rounded border border-[var(--border)] bg-[var(--background)] p-3.5">
                  <span className="font-mono font-semibold uppercase text-xs text-[var(--foreground)] block mb-1.5">
                    How Governor Evaluates:
                  </span>
                  <p className="text-[var(--secondary)] whitespace-pre-line leading-relaxed">{codeResult.how}</p>
                </div>
              </div>
            </div>
          )}

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
                  {copiedCode ? "Copied" : "Copy"}
                </button>
              </div>

              <div className="p-4 flex-1 bg-[#121214] text-gray-200 font-mono text-xs overflow-x-auto leading-relaxed">
                <pre>
                  {activeLanguage === "curl"
                    ? codeResult?.curlCode || "// Select a scenario or generate custom code above"
                    : activeLanguage === "ts"
                    ? codeResult?.typeScriptCode || "// Select a scenario or generate custom code above"
                    : codeResult?.pythonCode || "# Select a scenario or generate custom code above"}
                </pre>
              </div>

              <div className="border-t border-[var(--border)] p-3 bg-[var(--background)] flex items-center justify-between">
                <span className="text-[11px] font-mono text-[var(--secondary)] line-clamp-1 mr-2">
                  {codeResult?.explanation || "Ready to execute against Telegraph Governor."}
                </span>
                <button
                  type="button"
                  onClick={handleExecuteAsk}
                  disabled={isExecuting}
                  className="rounded border border-green-800 bg-green-800 px-4 py-2 text-xs font-mono font-bold text-white hover:bg-green-900 transition active:scale-98 disabled:opacity-50 shadow-xs shrink-0 cursor-pointer"
                >
                  {isExecuting ? "Executing Ask..." : "Execute Live Ask"}
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
                    {executionError}
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

                    {/* Dedicated Analysis Link */}
                    {executionResult.runId && (
                      <div className="flex items-center justify-between border border-[var(--border)] bg-[var(--background)] p-3 rounded text-xs font-mono">
                        <span className="text-[var(--secondary)]">
                          Recorded Run: <span className="font-semibold text-purple-900">{executionResult.runId}</span>
                        </span>
                        <Link
                          href={`/app/playground/${executionResult.runId}`}
                          className="font-semibold text-purple-700 hover:text-purple-900 hover:underline"
                        >
                          View Full Test Summary &rarr;
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center text-xs text-[var(--secondary)]">
                    <div className="rounded border border-[var(--border)] bg-[var(--background)] px-3 py-1 font-mono text-[11px] uppercase font-semibold text-[var(--foreground)] mb-3">
                      Awaiting Execution
                    </div>
                    <p className="font-medium text-[var(--foreground)]">No ask executed yet.</p>
                    <p className="mt-1 max-w-xs leading-relaxed">
                      Select a scenario or generate code with Gemini, then click <strong>&quot;Execute Live Ask&quot;</strong> to watch the Governor calculate decay in real time.
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
              {/* How Analytics Are Computed Explanation Card */}
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <span className="text-xs font-mono uppercase tracking-wider text-[var(--secondary)] font-semibold">
                    How Half-Life Analytics Are Measured
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--background)] border border-[var(--border)] text-[var(--secondary)]">
                    Statistical Metrics
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs leading-relaxed">
                  <div className="rounded border border-[var(--border)] bg-[var(--background)] p-3">
                    <span className="font-mono font-semibold uppercase text-xs text-[var(--foreground)] block mb-1">
                      Total Spend ($)
                    </span>
                    <p className="text-[var(--secondary)]">
                      Capital paid out to Telegraph miners for fresh answers whenever expected drift exceeds the noise floor.
                    </p>
                  </div>
                  <div className="rounded border border-[var(--border)] bg-[var(--background)] p-3">
                    <span className="font-mono font-semibold uppercase text-xs text-green-700 block mb-1">
                      Total Saved ($)
                    </span>
                    <p className="text-[var(--secondary)]">
                      Miner purchase fees eliminated by reusing fresh cached answers at $0.00 without loss of fidelity.
                    </p>
                  </div>
                  <div className="rounded border border-[var(--border)] bg-[var(--background)] p-3">
                    <span className="font-mono font-semibold uppercase text-xs text-[var(--foreground)] block mb-1">
                      Governor Reuse Rate
                    </span>
                    <p className="text-[var(--secondary)]">
                      Percentage of requests served from cache. Higher reuse rates signify maximum bandwidth and capital efficiency.
                    </p>
                  </div>
                  <div className="rounded border border-[var(--border)] bg-[var(--background)] p-3">
                    <span className="font-mono font-semibold uppercase text-xs text-[var(--foreground)] block mb-1">
                      Latency Reduction
                    </span>
                    <p className="text-[var(--secondary)]">
                      Cached queries resolve in sub-5ms locally versus 1,000ms+ network consensus and miner signature latency.
                    </p>
                  </div>
                </div>
              </div>

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

              {/* Visual Performance Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Visual Chart 1: Spend vs Savings Breakdown */}
                <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono uppercase tracking-wider text-[var(--secondary)] font-semibold">
                      Economic Efficiency: Spend vs Savings
                    </span>
                    <span className="text-xs font-mono text-[var(--secondary)]">
                      Total Volume: ${(analyticsData.totalSpend + analyticsData.totalSavings).toFixed(3)}
                    </span>
                  </div>

                  <div className="h-6 w-full flex rounded-full overflow-hidden border border-[var(--border)] bg-[var(--background)]">
                    <div
                      style={{
                        width: `${
                          analyticsData.totalSpend + analyticsData.totalSavings > 0
                            ? (analyticsData.totalSpend / (analyticsData.totalSpend + analyticsData.totalSavings)) * 100
                            : 50
                        }%`,
                      }}
                      className="bg-amber-600 transition-all duration-500"
                      title={`Spend: $${analyticsData.totalSpend}`}
                    />
                    <div
                      style={{
                        width: `${
                          analyticsData.totalSpend + analyticsData.totalSavings > 0
                            ? (analyticsData.totalSavings / (analyticsData.totalSpend + analyticsData.totalSavings)) * 100
                            : 50
                        }%`,
                      }}
                      className="bg-green-600 transition-all duration-500"
                      title={`Saved: $${analyticsData.totalSavings}`}
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-3 w-3 rounded-xs bg-amber-600" />
                      <span className="text-[var(--secondary)]">Miner Spend:</span>
                      <span className="font-semibold">${analyticsData.totalSpend.toFixed(3)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-3 w-3 rounded-xs bg-green-600" />
                      <span className="text-[var(--secondary)]">Governor Savings:</span>
                      <span className="font-bold text-green-700">${analyticsData.totalSavings.toFixed(3)}</span>
                    </div>
                  </div>
                </div>

                {/* Visual Chart 2: Governor Action Distribution */}
                <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono uppercase tracking-wider text-[var(--secondary)] font-semibold">
                      Decision Distribution (Buy vs Reuse)
                    </span>
                    <span className="text-xs font-mono text-[var(--secondary)]">
                      {analyticsData.totalRuns} Total Invocations
                    </span>
                  </div>

                  <div className="h-6 w-full flex rounded-full overflow-hidden border border-[var(--border)] bg-[var(--background)]">
                    <div
                      style={{
                        width: `${
                          analyticsData.totalRuns > 0 ? (analyticsData.buysCount / analyticsData.totalRuns) * 100 : 50
                        }%`,
                      }}
                      className="bg-emerald-700 transition-all duration-500"
                      title={`Buys: ${analyticsData.buysCount}`}
                    />
                    <div
                      style={{
                        width: `${
                          analyticsData.totalRuns > 0 ? (analyticsData.reusesCount / analyticsData.totalRuns) * 100 : 50
                        }%`,
                      }}
                      className="bg-blue-600 transition-all duration-500"
                      title={`Reuses: ${analyticsData.reusesCount}`}
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-3 w-3 rounded-xs bg-emerald-700" />
                      <span className="text-[var(--secondary)]">Purchased Fresh:</span>
                      <span className="font-semibold">{analyticsData.buysCount} ({analyticsData.totalRuns > 0 ? Math.round((analyticsData.buysCount / analyticsData.totalRuns) * 100) : 0}%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-3 w-3 rounded-xs bg-blue-600" />
                      <span className="text-[var(--secondary)]">Reused from Cache:</span>
                      <span className="font-bold text-blue-700">{analyticsData.reusesCount} ({analyticsData.savingsRate}%)</span>
                    </div>
                  </div>
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
                      <th className="px-4 py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)] font-mono text-xs">
                    {analyticsData.runs.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-[var(--secondary)]">
                          No test runs recorded yet. Execute an ask in the studio to see analytics.
                        </td>
                      </tr>
                    ) : (
                      analyticsData.runs.map((r: any) => (
                        <tr key={r.runId} className="hover:bg-[var(--background)]">
                          <td className="px-4 py-3">
                            <Link
                              href={`/app/playground/${r.runId}`}
                              className="font-semibold text-purple-900 hover:underline"
                            >
                              {r.runId}
                            </Link>
                          </td>
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
                          <td className="px-4 py-3 text-center">
                            <Link
                              href={`/app/playground/${r.runId}`}
                              className="rounded border border-[var(--border)] bg-[var(--background)] px-2.5 py-1 text-[11px] font-mono hover:border-[var(--border-strong)] transition"
                            >
                              View Details &rarr;
                            </Link>
                          </td>
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
