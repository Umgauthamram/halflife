import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { ObjectId } from "mongodb";
import { getDb } from "../../../../lib/mongodb";
import { authenticateApiKey } from "../../../../lib/api-key";
import { decide, type CachedAnswer } from "@half-life/governor";
import { MockTelegraphClient } from "@half-life/telegraph";
import type { AtlasStats } from "@half-life/shared";

const telegraphClient = new MockTelegraphClient();

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate API Key
    const authHeader = req.headers.get("Authorization");
    const { agentId, ownerId } = await authenticateApiKey(authHeader, "ask");

    // 2. Validate JSON Request Body
    const body = await req.json().catch(() => ({}));
    const { intent, params, stake: requestedStake, requestId } = body;

    if (!intent || typeof intent !== "string") {
      return NextResponse.json({ error: "Missing or invalid 'intent'" }, { status: 400 });
    }
    if (!params || typeof params !== "object") {
      return NextResponse.json({ error: "Missing or invalid 'params'" }, { status: 400 });
    }
    if (!requestId || typeof requestId !== "string") {
      return NextResponse.json({ error: "Missing or invalid 'requestId' for idempotency" }, { status: 400 });
    }

    const db = await getDb();

    // 3. Check Idempotency
    const existingDecision = await db.collection("decisions").findOne({ agentId, requestId });
    if (existingDecision) {
      return NextResponse.json({
        idempotent: true,
        action: existingDecision.action,
        reason: existingDecision.reason,
        inputs: existingDecision.inputs,
        purchaseId: existingDecision.purchaseId,
        cachedAnswer: existingDecision.cachedAnswer,
      });
    }

    // 4. Fetch Agent & Check Kill Switch
    let agentQueryId: string | ObjectId = agentId;
    try {
      agentQueryId = new ObjectId(agentId);
    } catch {}

    const agent = await db.collection("agents").findOne({
      $or: [{ _id: agentQueryId as unknown as ObjectId }, { id: agentId }],
      ownerId,
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    if (agent.status !== "active") {
      return NextResponse.json(
        { action: "refuse", reason: "Agent is currently paused by kill switch" },
        { status: 403 }
      );
    }

    if (agent.allowedIntents && !agent.allowedIntents.includes(intent)) {
      return NextResponse.json(
        { action: "refuse", reason: `Intent '${intent}' is not permitted by agent policy` },
        { status: 403 }
      );
    }

    const stake = typeof requestedStake === "number" ? requestedStake : (agent.policy?.stakeDefault ?? 100);
    const paramsHash = crypto.createHash("sha256").update(JSON.stringify(params)).digest("hex");
    const now = Date.now();

    // 5. Check Cache
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

    // 6. Fetch Atlas Stats
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

    // 7. Get Miners and Price
    const miners = await telegraphClient.listMiners(intent);
    const topMiner = miners[0];
    const priceUsdc = topMiner?.priceUsdc ?? 0.01;

    // 8. Decide Action
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

    // 9. Process Decision
    if (decisionResult.action === "reuse" && cachedEntry) {
      // Record Decision
      await db.collection("decisions").insertOne({
        agentId,
        ownerId,
        requestId,
        intent,
        stake,
        action: "reuse",
        reason: decisionResult.reason,
        inputs: decisionResult.inputs,
        purchaseId: cachedEntry.purchaseId,
        cacheEntryId: cachedEntry._id.toString(),
        cachedAnswer: cachedEntry.answer,
        createdAt: new Date(),
      });

      return NextResponse.json({
        action: "reuse",
        reason: decisionResult.reason,
        answer: cachedEntry.answer,
        ageSeconds: decisionResult.inputs.ageSeconds,
        purchaseId: cachedEntry.purchaseId,
        inputs: decisionResult.inputs,
      });
    }

    // 10. Execute Fresh Buy
    // Atomic budget reservation
    const dailyCap = agent.policy?.dailyCapUsdc ?? 1.0;
    const perAskCap = agent.policy?.perAskCapUsdc ?? 0.05;

    if (priceUsdc > perAskCap) {
      return NextResponse.json(
        { action: "refuse", reason: `Price ($${priceUsdc}) exceeds per-ask cap ($${perAskCap})` },
        { status: 400 }
      );
    }

    const todayPeriod = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const budgetRes = await db.collection("budget_counters").updateOne(
      {
        agentId,
        period: todayPeriod,
        spentUsdc: { $lte: dailyCap - priceUsdc },
      },
      {
        $inc: { spentUsdc: priceUsdc },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    if (budgetRes.modifiedCount === 0 && budgetRes.upsertedCount === 0) {
      return NextResponse.json(
        { action: "refuse", reason: `Daily spending cap of $${dailyCap.toFixed(2)} exceeded` },
        { status: 400 }
      );
    }

    // Call Telegraph to execute buy
    const receipt = await telegraphClient.ask({
      intent,
      params,
      maxPriceUsdc: perAskCap,
      paymentMode: "x402",
      requestId,
    });

    // Store in purchases ledger
    const purchaseDoc = {
      agentId,
      ownerId,
      intent,
      params,
      minerId: receipt.minerId,
      minerRank: receipt.minerRank,
      priceUsdc: receipt.priceUsdc,
      paymentMode: "x402",
      txHash: receipt.txHash,
      signalHash: receipt.signalHash,
      answer: receipt.answer,
      confidence: receipt.confidence,
      askedAt: receipt.askedAt,
      answeredAt: receipt.answeredAt,
      verification: "confirmed",
      verifiedAt: new Date(),
      createdAt: new Date(),
    };

    const purchaseInsert = await db.collection("purchases").insertOne(purchaseDoc);
    const purchaseId = purchaseInsert.insertedId.toString();

    // Upsert into cache_entries
    await db.collection("cache_entries").updateOne(
      { agentId, intent, paramsHash },
      {
        $set: {
          ownerId,
          purchaseId,
          answer: receipt.answer,
          confidence: receipt.confidence,
          answeredAt: receipt.answeredAt,
        },
      },
      { upsert: true }
    );

    // Record decision
    await db.collection("decisions").insertOne({
      agentId,
      ownerId,
      requestId,
      intent,
      stake,
      action: "buy",
      reason: decisionResult.reason,
      inputs: decisionResult.inputs,
      purchaseId,
      createdAt: new Date(),
    });

    return NextResponse.json({
      action: "buy",
      reason: decisionResult.reason,
      answer: receipt.answer,
      ageSeconds: 0,
      purchaseId,
      txHash: receipt.txHash,
      verification: "confirmed",
      inputs: decisionResult.inputs,
    });
  } catch (err: unknown) {
    console.error("[API v1 ask error]:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

