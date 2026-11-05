export class BudgetCapError extends Error {
    code;
    constructor(code, message) {
        super(`[BudgetCap:${code}] ${message}`);
        this.code = code;
        this.name = "BudgetCapError";
    }
}
export function getCurrentPeriodKey(date = new Date()) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    return `${y}${m}${d}`;
}
/**
 * Checks agent active status (kill switch) and atomically reserves funds
 * against both per-ask and daily caps before any purchase or transaction signature.
 */
export async function reserveBudget(db, agentId, amountUsdc, policy) {
    // 1. Kill Switch Check
    const agent = await db.collection("agents").findOne({ id: agentId });
    if (agent && agent.status !== "active") {
        throw new BudgetCapError("AGENT_PAUSED", `Agent ${agentId} is currently paused`);
    }
    // 2. Per-Ask Cap Check
    if (amountUsdc > policy.perAskCapUsdc) {
        throw new BudgetCapError("PER_ASK_CAP_EXCEEDED", `Request price ($${amountUsdc.toFixed(4)}) exceeds per-ask cap ($${policy.perAskCapUsdc.toFixed(4)})`);
    }
    // 3. Atomic Daily Cap Reservation
    const period = getCurrentPeriodKey();
    const maxAllowedSpentBefore = policy.dailyCapUsdc - amountUsdc;
    // We find a document where current spent + amount <= dailyCap
    const result = await db.collection("budget_counters").updateOne({
        agentId,
        period,
        spentUsdc: { $lte: maxAllowedSpentBefore },
    }, {
        $inc: { spentUsdc: amountUsdc },
        $setOnInsert: { createdAt: new Date() },
    }, { upsert: true });
    const reserved = result.modifiedCount > 0 || result.upsertedCount > 0;
    if (!reserved) {
        throw new BudgetCapError("DAILY_CAP_EXCEEDED", `Daily budget cap of $${policy.dailyCapUsdc.toFixed(2)} reached for agent ${agentId} on ${period}`);
    }
    return { period, reservedAmount: amountUsdc };
}
/**
 * Releases reserved budget in case a purchase fails, times out, or is aborted.
 */
export async function releaseBudget(db, agentId, period, amountUsdc) {
    await db.collection("budget_counters").updateOne({
        agentId,
        period,
    }, {
        $inc: { spentUsdc: -amountUsdc },
    });
}
//# sourceMappingURL=budget.js.map