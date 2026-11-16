import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { ObjectId } from "mongodb";
import { getDb } from "../../../../lib/mongodb";
import { authenticateApiKey } from "../../../../lib/api-key";
import { decide, type CachedAnswer } from "@half-life/governor";
import { createTelegraphClient, type TelegraphReceipt } from "@half-life/telegraph";
import { verifySettlementTx, createSepoliaClient } from "@half-life/chain";
import type { AtlasStats } from "@half-life/shared";

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
    const telegraphClient = createTelegraphClient();
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
        shadowCostUsdc: priceUsdc,
        savedUsdc: priceUsdc,
        createdAt: new Date(),
      });

      // Record in Shadow Ledger (Live Savings)
      await db.collection("shadow_ledger").insertOne({
        agentId,
        ownerId,
        intent,
        requestId,
        action: "reuse",
        naiveCostUsdc: priceUsdc,
        actualCostUsdc: 0.0,
        capitalSavedUsdc: priceUsdc,
        createdAt: new Date(),
      });

      // Update Agent aggregates
      await db.collection("agents").updateOne(
        { $or: [{ _id: agentQueryId as unknown as ObjectId }, { id: agentId }] },
        {
          $inc: {
            "stats.totalReuses": 1,
            "stats.capitalSavedUsdc": priceUsdc,
          },
        }
      );

      return NextResponse.json({
        action: "reuse",
        reason: decisionResult.reason,
        answer: cachedEntry.answer,
        ageSeconds: decisionResult.inputs.ageSeconds,
        purchaseId: cachedEntry.purchaseId,
        inputs: decisionResult.inputs,
        capitalSavedUsdc: priceUsdc,
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
    let receipt: TelegraphReceipt;
    try {
      receipt = await telegraphClient.ask({
        intent,
        params,
        maxPriceUsdc: perAskCap,
        paymentMode: "x402",
        requestId,
      });
    } catch (askErr: any) {
      // Release the reserved budget on failure
      await db.collection("budget_counters").updateOne(
        { agentId, period: todayPeriod },
        { $inc: { spentUsdc: -priceUsdc } }
      );
      return NextResponse.json(
        { action: "failed", error: `Telegraph execution failed: ${askErr.message || String(askErr)}` },
        { status: 502 }
      );
    }

    // Verify settlement transaction on Sepolia
    let verificationStatus: "confirmed" | "failed" | "pending" | "unverified" = "confirmed";
    if (receipt.txHash && receipt.txHash.startsWith("0x")) {
      try {
        const sepoliaClient = createSepoliaClient(process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org");
        const vResult = await verifySettlementTx(
          sepoliaClient,
          receipt.txHash as `0x${string}`,
          process.env.TELEGRAPH_CONTRACT || "0x3624EB012B5E998BB57B6bE6C9Cfc9c4bc5eb99b"
        );
        verificationStatus = vResult.status;
      } catch {
        verificationStatus = "unverified";
      }
    }

    // Store in purchases ledger
    const purchaseDoc = {
      agentId,
      ownerId,
      intent,
      params,
      minerId: receipt.minerId,
      minerName: receipt.minerName,
      minerRank: receipt.minerRank,
      priceUsdc: receipt.priceUsdc,
      paymentMode: "x402",
      txHash: receipt.txHash,
      receiptHash: receipt.receiptHash,
      signalHash: receipt.signalHash,
      answer: receipt.answer,
      confidence: receipt.confidence,
      outcome: receipt.outcome || "paid",
      askedAt: receipt.askedAt,
      answeredAt: receipt.answeredAt,
      verification: verificationStatus,
      verifiedAt: new Date(),
      createdAt: new Date(),
    };

    const purchaseInsert = await db.collection("purchases").insertOne(purchaseDoc);
    const purchaseId = purchaseInsert.insertedId.toString();

    // Only update cache if the answer is valid (never cache failed_paid)
    if (receipt.outcome === "paid") {
      // Check if this was replacing a stale cache entry and compare drift
      if (cachedEntry?.answer) {
        try {
          const oldVal = typeof cachedEntry.answer === "number" ? cachedEntry.answer : parseFloat(cachedEntry.answer?.rate || cachedEntry.answer?.rates?.USD || cachedEntry.answer?.value);
          const newVal = typeof receipt.answer === "number" ? receipt.answer : parseFloat((receipt.answer as any)?.rate || (receipt.answer as any)?.rates?.USD || (receipt.answer as any)?.value);
          if (!isNaN(oldVal) && !isNaN(newVal) && oldVal !== 0) {
            const actualDrift = Math.abs(newVal - oldVal) / Math.abs(oldVal);
            const tolerance = stats?.noiseFloor ?? 0.002;
            const wasStale = actualDrift > tolerance;
            await db.collection("stale_decision_events").insertOne({
              agentId,
              ownerId,
              intent,
              cachedVal: oldVal,
              freshVal: newVal,
              actualDrift,
              tolerance,
              wasStale,
              ts: new Date(),
            });
            if (wasStale) {
              await db.collection("agents").updateOne(
                { $or: [{ _id: agentQueryId as unknown as ObjectId }, { id: agentId }] },
                { $inc: { "stats.staleErrorsCount": 1 } }
              );
            }
          }
        } catch {}
      }

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
    }

    // Record decision
    await db.collection("decisions").insertOne({
      agentId,
      ownerId,
      requestId,
      intent,
      stake,
      action: receipt.outcome === "paid" ? "buy" : "failed_paid",
      reason: decisionResult.reason,
      inputs: decisionResult.inputs,
      purchaseId,
      createdAt: new Date(),
    });

    return NextResponse.json({
      action: receipt.outcome === "paid" ? "buy" : "failed_paid",
      reason: decisionResult.reason,
      answer: receipt.answer,
      ageSeconds: 0,
      purchaseId,
      txHash: receipt.txHash,
      receiptHash: receipt.receiptHash,
      signalHash: receipt.signalHash,
      outcome: receipt.outcome,
      verification: verificationStatus,
      inputs: decisionResult.inputs,
    });
  } catch (err: unknown) {
    console.error("[API v1 ask error]:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

