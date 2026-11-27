"use server";

import { requireUser } from "../../../lib/dal";
import { getDb } from "../../../lib/mongodb";
import { authenticateApiKey } from "../../../lib/api-key";
import { decide, type CachedAnswer } from "@half-life/governor";
import { createTelegraphClient } from "@half-life/telegraph";
import type { AtlasStats } from "@half-life/shared";
import crypto from "node:crypto";
import { ObjectId } from "mongodb";

export interface AiCodeGenerationResult {
  intent: string;
  stake: number;
  params: Record<string, unknown>;
  why: string;
  how: string;
  explanation: string;
  pythonCode: string;
  typeScriptCode: string;
  curlCode: string;
  isAiGenerated: boolean;
}

export async function generateAiCodeAction(
  prompt: string,
  virtualApiKey: string = "hl_live_test_virtual_key_preview"
): Promise<AiCodeGenerationResult> {
  await requireUser();

  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const rawKey = virtualApiKey || "hl_live_test_virtual_key_preview";

  if (geminiKey) {
    try {
      const systemInstruction = `You are the Half-Life Intelligent Integration Assistant for Telegraph Protocol.
Analyze the user's intent or query and map it to one of the 3 supported Telegraph intents:
- FX_NOW: Real-time foreign exchange currency rates. params: { "pair": "EURUSD" | "GBPUSD" | "USDJPY" }
- WEATHER_FORECAST_VERIFY: Meteorological temperature and weather verification. params: { "location": "London" | "New York" | "Tokyo" }
- SANCTIONS_SCREENING_MATCH: Anti-money laundering (AML) and OFAC compliance screening. params: { "entity": string }

Return ONLY a valid JSON object with NO markdown formatting, NO backticks, and NO extra text:
{
  "intent": "FX_NOW_EUR" | "WEATHER_CHECK_TEMPERATURE" | "SANCTIONS_SCREENING_MATCH_GENERAL",
  "stake": number (financial value at risk in USD, default 100),
  "params": object,
  "why": string (clear explanation of why this intent, parameter, and stake size were selected for this scenario),
  "how": string (step-by-step explanation of how the Governor evaluates cache decay d(Δt), noise floor η, and miner purchase economics),
  "explanation": string (1 concise summary sentence),
  "pythonCode": string (executable python code using requests),
  "typeScriptCode": string (executable typescript code using fetch),
  "curlCode": string (cURL command)
}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  { text: systemInstruction },
                  { text: `User Query / Scenario: "${prompt}". Inject this API key: "${rawKey}".` },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          return {
            intent: parsed.intent || "FX_NOW_EUR",
            stake: Number(parsed.stake) || 100,
            params: parsed.params || { pair: "EURUSD" },
            why: parsed.why || `Selected intent ${parsed.intent || "FX_NOW_EUR"} with financial stake $${parsed.stake || 100} to match the risk profile of this transaction.`,
            how: parsed.how || `Governor checks local cache for ${parsed.intent || "FX_NOW_EUR"}. If cached answer drift d(Δt) is below the miner noise floor, it reuses the answer at $0 cost; otherwise it dispatches a buy order to Telegraph miners.`,
            explanation: parsed.explanation || "Interpreted via Google Gemini 2.5 Flash",
            pythonCode: parsed.pythonCode || "",
            typeScriptCode: parsed.typeScriptCode || "",
            curlCode: parsed.curlCode || "",
            isAiGenerated: true,
          };
        }
      }
    } catch (aiErr) {
      console.warn("[Playground] Gemini API call failed, falling back to deterministic generator:", aiErr);
    }
  }

  // Deterministic Fallback if Gemini key is not set or network fails
  const lower = prompt.toLowerCase();
  let intent = "FX_NOW_EUR";
  let params: Record<string, unknown> = { pair: "EURUSD" };
  let stake = 100;

  if (lower.includes("weather") || lower.includes("temp") || lower.includes("rain") || lower.includes("climate")) {
    intent = "WEATHER_CHECK_TEMPERATURE";
    params = { location: "London" };
    stake = 1200;
  } else if (lower.includes("sanction") || lower.includes("aml") || lower.includes("compliance") || lower.includes("ofac")) {
    intent = "SANCTIONS_SCREENING_MATCH_GENERAL";
    params = { entity: "Acme International" };
    stake = 10000;
  } else if (lower.includes("gbp") || lower.includes("pound")) {
    params = { pair: "GBPUSD" };
    stake = 2500;
  } else if (lower.includes("jpy") || lower.includes("yen")) {
    params = { pair: "USDJPY" };
    stake = 1500;
  }

  const curlCode = `curl -X POST https://halflifes.vercel.app/api/v1/ask \\
  -H "Authorization: Bearer ${rawKey}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({ intent, stake, requestId: "req_" + Date.now(), params })}'`;

  const typeScriptCode = `import { HalfLifeClient } from "@half-life/sdk";

const client = new HalfLifeClient({
  apiKey: "${rawKey}",
  baseUrl: "https://halflifes.vercel.app",
});

const decision = await client.ask({
  intent: "${intent}",
  stake: ${stake},
  params: ${JSON.stringify(params)},
});

if (decision.action === "reuse") {
  console.log("Cached answer reused for $0.00!");
} else {
  console.log("Fresh answer purchased from Telegraph miner: " + decision.answer);
}`;

  const pythonCode = `import requests

response = requests.post(
    "https://halflifes.vercel.app/api/v1/ask",
    headers={"Authorization": "Bearer ${rawKey}"},
    json={
        "intent": "${intent}",
        "stake": ${stake},
        "requestId": f"agent_{int(time.time())}",
        "params": ${JSON.stringify(params)}
    }
)

data = response.json()
print("Action:", data.get("action"))  # 'buy' or 'reuse'
print("Answer:", data.get("answer"))
print("Cost:", data.get("priceUsdc"))`;

  let why = `Selected intent ${intent} with a $${stake} financial stake. This parameterization reflects the risk exposure where stale data could cause transaction loss.`;
  let how = `The Governor checks your local cache for ${intent} (${JSON.stringify(params)}). If an answer exists and its expected drift d(Δt) is lower than the miner noise floor η, the cached answer is returned from cache for $0.00. If drift exceeds η or no cached data exists, a live $0.01 ask is dispatched to Telegraph miners.`;

  if (intent === "FX_NOW_EUR") {
    why = `Real-time FX rates experience high market volatility. A stake of $${stake} means small basis point deviations matter. The Governor monitors the calibrated Atlas half-life curve to decide whether to re-sample Telegraph miners or reuse fresh ticks.`;
    how = `1. Compute elapsed age Δt since previous FX quote was recorded.\n2. Calculate expected drift: d(Δt) = c * (Δt)^α from the empirical Atlas.\n3. Compare against miner disagreement noise floor η. If drift <= η, buying yields 0 net information; Governor executes REUSE at $0.00 cost.`;
  } else if (intent === "WEATHER_CHECK_TEMPERATURE") {
    why = `Parametric insurance contracts require verified ground meteorological truth. A $${stake} policy requires high certainty, but physical weather observations have slower decay curves than financial ticks.`;
    how = `1. Look up previous temperature observation for ${JSON.stringify(params)}.\n2. Because weather decay has a longer half-life, the Governor reuses valid measurements within their validity window, preventing redundant miner fees.`;
  } else if (intent === "SANCTIONS_SCREENING_MATCH_GENERAL") {
    why = `Compliance screening carries severe regulatory penalties (stake $${stake}). However, OFAC Specially Designated Nationals (SDN) lists update infrequently.`;
    how = `1. Query cache for entity hash.\n2. Recent sanctions checks retain validity as list updates happen on daily cycles. If queried within the threshold, Governor returns REUSE to maximize throughput without risk.`;
  }

  return {
    intent,
    stake,
    params,
    why,
    how,
    explanation: geminiKey
      ? "Interpreted by pattern matcher."
      : "Scenario template loaded. Ready to execute against Governor.",
    pythonCode,
    typeScriptCode,
    curlCode,
    isAiGenerated: false,
  };
}

export async function executeTestAskAction(
  apiKey: string,
  payload: {
    intent: string;
    stake: number;
    params: Record<string, unknown>;
    requestId: string;
  }
) {
  const user = await requireUser();
  const startTime = Date.now();

  const authHeader = `Bearer ${apiKey.trim()}`;
  let authResult;
  try {
    authResult = await authenticateApiKey(authHeader, "ask");
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Invalid or revoked API key",
    };
  }

  const { agentId, ownerId } = authResult;
  const db = await getDb();

  // Fetch Agent
  let agentQueryId: string | ObjectId = agentId;
  try {
    agentQueryId = new ObjectId(agentId);
  } catch {}

  const agent = await db.collection("agents").findOne({
    $or: [{ _id: agentQueryId as unknown as ObjectId }, { id: agentId }],
    ownerId,
  });

  if (!agent) {
    return { success: false, error: "Agent associated with this API key not found" };
  }

  if (agent.status !== "active") {
    return {
      success: true,
      result: {
        action: "refuse",
        reason: "Agent is currently paused by kill switch",
        priceUsdc: 0,
        answer: null,
      },
      latencyMs: Date.now() - startTime,
    };
  }

  const { intent, stake, params, requestId } = payload;
  const paramsHash = crypto.createHash("sha256").update(JSON.stringify(params)).digest("hex");
  const now = Date.now();

  // Check Cache
  const cachedEntry = await db.collection("cache_entries").findOne({
    agentId,
    intent,
    paramsHash,
  });

  let cached: CachedAnswer | null = null;
  if (cachedEntry) {
    cached = {
      id: cachedEntry._id.toString(),
      purchaseId: cachedEntry.purchaseId,
      answeredAt: new Date(cachedEntry.answeredAt).getTime(),
      confidence: cachedEntry.confidence,
    };
  }

  // Fetch Atlas Stats
  const statsDoc = await db.collection("atlas_stats").findOne({ intent });
  let stats: AtlasStats | null = null;
  if (statsDoc) {
    stats = {
      intent: statsDoc.intent,
      window: statsDoc.window,
      driftCurve: statsDoc.driftCurve,
      noiseFloor: statsDoc.noiseFloor,
      sampleCount: statsDoc.sampleCount,
      computedAt: statsDoc.computedAt,
      calibrated: statsDoc.calibrated,
    };
  }

  const telegraphClient = createTelegraphClient();
  const miners = await telegraphClient.listMiners(intent);
  const topMiner = miners[0];
  const priceUsdc = topMiner?.priceUsdc ?? 0.01;

  // Decide Action
  let decisionResult;
  if (agent.mode === "naive") {
    decisionResult = {
      action: "buy" as const,
      reason: "Naive agent mode configured to buy on every request",
      inputs: {
        ageSeconds: cached ? (now - cached.answeredAt) / 1000 : 0,
        drift: 0,
        noiseFloor: stats?.noiseFloor ?? 0,
        price: priceUsdc,
        calibrated: stats?.calibrated ?? false,
      },
    };
  } else {
    decisionResult = decide({ intent, now, stake }, cached, stats, priceUsdc);
  }

  let finalAction = decisionResult.action;
  let finalReason = decisionResult.reason;
  let finalAnswer = cachedEntry?.answer;
  let finalPrice = 0;
  let finalTxHash = cachedEntry?.txHash;

  if (finalAction === "reuse" && cachedEntry) {
    finalAnswer = cachedEntry.answer;
    finalPrice = 0;
  } else {
    // Buy from miner
    const receipt = await telegraphClient.ask({
      intent,
      params,
      maxPriceUsdc: agent.policy?.perAskCapUsdc ?? 0.05,
      paymentMode: "x402",
      requestId,
    });

    finalAnswer = receipt.answer;
    finalPrice = receipt.priceUsdc;
    finalTxHash = receipt.txHash;

    // Update Cache
    await db.collection("cache_entries").updateOne(
      { agentId, intent, paramsHash },
      {
        $set: {
          answer: receipt.answer,
          txHash: receipt.txHash,
          priceUsdc: receipt.priceUsdc,
          confidence: receipt.confidence,
          answeredAt: new Date(receipt.answeredAt),
          updatedAt: new Date(),
        },
        $setOnInsert: {
          purchaseId: `purch_${Date.now()}`,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );
  }

  const latencyMs = Math.max(1, Date.now() - startTime);
  const savingsUsdc = finalAction === "reuse" ? priceUsdc : 0;
  const runId = "test_" + crypto.randomBytes(6).toString("hex");

  // Record Run in playground_runs for Analytics
  await db.collection("playground_runs").insertOne({
    runId,
    userId: user.id,
    agentId,
    agentName: agent.name,
    apiKeyPrefix: apiKey.slice(0, 16),
    intent,
    stake,
    params,
    requestId,
    action: finalAction,
    reason: finalReason,
    priceUsdc: finalPrice,
    savingsUsdc,
    latencyMs,
    answer: finalAnswer,
    txHash: finalTxHash,
    inputs: decisionResult.inputs,
    simulated: true,
    createdAt: new Date(),
  });

  return {
    success: true,
    runId,
    latencyMs,
    result: {
      action: finalAction,
      reason: finalReason,
      answer: finalAnswer,
      priceUsdc: finalPrice,
      savingsUsdc,
      txHash: finalTxHash,
      inputs: decisionResult.inputs,
      simulated: true,
    },
  };
}

export async function getPlaygroundAnalyticsAction() {
  const user = await requireUser();
  const db = await getDb();

  const runs = await db
    .collection("playground_runs")
    .find({ userId: user.id })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  const totalRuns = runs.length;
  let totalSpend = 0;
  let totalSavings = 0;
  let reusesCount = 0;
  let buysCount = 0;
  let totalLatency = 0;

  for (const r of runs) {
    totalSpend += r.priceUsdc || 0;
    totalSavings += r.savingsUsdc || 0;
    if (r.action === "reuse") reusesCount++;
    if (r.action === "buy") buysCount++;
    totalLatency += r.latencyMs || 0;
  }

  const avgLatencyMs = totalRuns > 0 ? Math.round(totalLatency / totalRuns) : 0;
  const savingsRate = totalSpend + totalSavings > 0 ? Math.round((totalSavings / (totalSpend + totalSavings)) * 100) : 0;

  return {
    totalRuns,
    totalSpend: Number(totalSpend.toFixed(3)),
    totalSavings: Number(totalSavings.toFixed(3)),
    reusesCount,
    buysCount,
    avgLatencyMs,
    savingsRate,
    runs: runs.map((r) => ({
      runId: r.runId,
      agentName: r.agentName || "Agent",
      intent: r.intent,
      stake: r.stake,
      action: r.action,
      reason: r.reason,
      priceUsdc: r.priceUsdc,
      savingsUsdc: r.savingsUsdc,
      latencyMs: r.latencyMs,
      answer: r.answer,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
    })),
  };
}

export async function getPlaygroundRunDetailsAction(runId: string) {
  const user = await requireUser();
  const db = await getDb();

  const run = await db.collection("playground_runs").findOne({
    runId,
    userId: user.id,
  });

  if (!run) {
    return null;
  }

  return {
    runId: run.runId,
    userId: run.userId,
    agentId: run.agentId,
    agentName: run.agentName || "Agent",
    apiKeyPrefix: run.apiKeyPrefix || "hl_live_...",
    intent: run.intent,
    stake: run.stake,
    params: run.params || {},
    requestId: run.requestId,
    action: run.action,
    reason: run.reason,
    priceUsdc: run.priceUsdc ?? 0,
    savingsUsdc: run.savingsUsdc ?? 0,
    latencyMs: run.latencyMs ?? 0,
    answer: run.answer,
    txHash: run.txHash,
    inputs: run.inputs || null,
    createdAt: run.createdAt ? new Date(run.createdAt).toISOString() : new Date().toISOString(),
  };
}


