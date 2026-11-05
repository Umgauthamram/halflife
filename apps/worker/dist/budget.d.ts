import type { Db } from "mongodb";
import type { AgentPolicy } from "@half-life/shared";
export declare class BudgetCapError extends Error {
    code: string;
    constructor(code: string, message: string);
}
export declare function getCurrentPeriodKey(date?: Date): string;
/**
 * Checks agent active status (kill switch) and atomically reserves funds
 * against both per-ask and daily caps before any purchase or transaction signature.
 */
export declare function reserveBudget(db: Db, agentId: string, amountUsdc: number, policy: AgentPolicy): Promise<{
    period: string;
    reservedAmount: number;
}>;
/**
 * Releases reserved budget in case a purchase fails, times out, or is aborted.
 */
export declare function releaseBudget(db: Db, agentId: string, period: string, amountUsdc: number): Promise<void>;
//# sourceMappingURL=budget.d.ts.map