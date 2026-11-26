import fs from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config();

const BASE_URL = (process.env.HALFLIFE_BASE_URL || "https://halflifes.vercel.app").replace(/\/$/, "");
const API_KEY = process.env.HALFLIFE_API_KEY;
const PAUSED_API_KEY = process.env.PAUSED_AGENT_API_KEY;

if (!API_KEY) {
  console.error("Error: HALFLIFE_API_KEY environment variable is required.");
  process.exit(1);
}

interface EvidenceStep {
  step: string;
  status: "completed" | "skipped" | "error";
  request?: {
    url: string;
    method: string;
    body: Record<string, unknown>;
  };
  httpStatus?: number;
  latencyMs?: number;
  response?: any;
  etherscanUrl?: string | null;
  error?: string;
}

async function runStep(
  stepName: string,
  apiKey: string,
  body: Record<string, unknown>
): Promise<EvidenceStep> {
  const url = `${BASE_URL}/api/v1/ask`;
  const start = performance.now();

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });

    const latencyMs = Math.max(0, Math.round(performance.now() - start));
    const responseBody = await res.json().catch(async () => ({
      rawText: await res.text().catch(() => ""),
    }));

    const txHash =
      typeof responseBody?.txHash === "string" && responseBody.txHash.startsWith("0x")
        ? responseBody.txHash
        : null;

    return {
      step: stepName,
      status: res.ok ? "completed" : "error",
      request: { url, method: "POST", body },
      httpStatus: res.status,
      latencyMs: typeof responseBody?.latencyMs === "number" ? responseBody.latencyMs : latencyMs,
      response: responseBody,
      etherscanUrl: txHash ? `https://sepolia.etherscan.io/tx/${txHash}` : null,
    };
  } catch (err: any) {
    const latencyMs = Math.max(0, Math.round(performance.now() - start));
    return {
      step: stepName,
      status: "error",
      request: { url, method: "POST", body },
      latencyMs,
      error: err?.message || String(err),
      etherscanUrl: null,
    };
  }
}

function computeMedian(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

async function main() {
  const runTs = new Date().toISOString();
  const dateFolder = runTs.replace(/[:.]/g, "-");
  const outDir = path.resolve(process.cwd(), "docs", "evidence", dateFolder);

  console.log(`[Evidence] Capturing live evidence against ${BASE_URL}...`);
  const steps: EvidenceStep[] = [];

  // 1. Fresh buy for an intent
  steps.push(
    await runStep("1_fresh_buy", API_KEY!, {
      intent: "FX_NOW_EUR",
      params: { currency: "EUR" },
      stake: 1000,
      requestId: `evidence_buy_${Date.now()}`,
    })
  );

  // 2. Repeat within the reuse window (expect reuse)
  steps.push(
    await runStep("2_repeat_reuse", API_KEY!, {
      intent: "FX_NOW_EUR",
      params: { currency: "EUR" },
      stake: 10,
      requestId: `evidence_reuse_${Date.now()}`,
    })
  );

  // 3. Request exceeding per-ask cap (expect refuse)
  steps.push(
    await runStep("3_exceed_per_ask_cap", API_KEY!, {
      intent: "FX_NOW_EUR",
      params: { currency: "EUR" },
      stake: 100,
      maxPriceUsdc: 0.0001,
      requestId: `evidence_cap_${Date.now()}`,
    })
  );

  // 4. Unknown intent (expect failed/refuse)
  steps.push(
    await runStep("4_unknown_intent", API_KEY!, {
      intent: "UNKNOWN_INTENT_EVIDENCE_CHECK",
      params: {},
      stake: 100,
      requestId: `evidence_unknown_${Date.now()}`,
    })
  );

  // 5. Paused-agent request if PAUSED_AGENT_API_KEY is provided
  if (PAUSED_API_KEY) {
    steps.push(
      await runStep("5_paused_agent", PAUSED_API_KEY, {
        intent: "FX_NOW_EUR",
        params: { currency: "EUR" },
        stake: 100,
        requestId: `evidence_paused_${Date.now()}`,
      })
    );
  } else {
    steps.push({
      step: "5_paused_agent",
      status: "skipped",
      error: "PAUSED_AGENT_API_KEY not provided; skipped",
    });
  }

  // Compute totals strictly from recorded responses
  let totalSpendUsdc = 0;
  let totalSavedUsdc = 0;
  const latencies: number[] = [];

  for (const s of steps) {
    if (s.status === "skipped") continue;
    if (typeof s.latencyMs === "number") latencies.push(s.latencyMs);
    if (typeof s.response?.priceUsdc === "number") {
      totalSpendUsdc += s.response.priceUsdc;
    }
    if (typeof s.response?.capitalSavedUsdc === "number") {
      totalSavedUsdc += s.response.capitalSavedUsdc;
    }
  }

  const medianLatencyMs = computeMedian(latencies);
  const summary = {
    capturedAt: runTs,
    baseUrl: BASE_URL,
    totalSpendUsdc: Number(totalSpendUsdc.toFixed(6)),
    totalSavedUsdc: Number(totalSavedUsdc.toFixed(6)),
    medianLatencyMs,
    steps,
  };

  await fs.mkdir(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "results.json");
  await fs.writeFile(jsonPath, JSON.stringify(summary, null, 2), "utf-8");

  let md = `# Half-Life Live Evidence Capture\n\n`;
  md += `- **Captured At:** ${runTs}\n`;
  md += `- **Target URL:** ${BASE_URL}\n`;
  md += `- **Total Spend:** $${summary.totalSpendUsdc.toFixed(6)} USDC\n`;
  md += `- **Total Saved:** $${summary.totalSavedUsdc.toFixed(6)} USDC\n`;
  md += `- **Median Latency:** ${medianLatencyMs !== null ? `${medianLatencyMs} ms` : "unknown"}\n\n`;
  md += `## Step Results\n\n`;
  md += `| Step | Status | HTTP Status | Action | Latency (ms) | Etherscan |\n`;
  md += `| :--- | :--- | :---: | :---: | :---: | :--- |\n`;

  for (const s of steps) {
    const action = s.response?.action ?? (s.status === "skipped" ? "skipped" : "error");
    const http = s.httpStatus ?? "-";
    const lat = s.latencyMs ?? "-";
    const tx = s.etherscanUrl ? `[View TX](${s.etherscanUrl})` : "-";
    md += `| \`${s.step}\` | ${s.status} | ${http} | ${action} | ${lat} | ${tx} |\n`;
  }

  const mdPath = path.join(outDir, "results.md");
  await fs.writeFile(mdPath, md, "utf-8");

  console.log(`[Evidence] Wrote ${jsonPath}`);
  console.log(`[Evidence] Wrote ${mdPath}`);
}

main().catch((err) => {
  console.error("[Evidence] Fatal error:", err);
  process.exit(1);
});
