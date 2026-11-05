import { type CachedAnswer, type DecisionResult } from "./governor.js";
import type { AtlasStats } from "@half-life/shared";
export interface ErrandStep {
    name: string;
    intent: string;
    params: Record<string, unknown>;
    stake: number;
    priceUsdc: number;
    shouldHaltPipeline?: (answer: any) => {
        halt: boolean;
        reason: string;
    };
}
export interface StepExecutionResult {
    stepName: string;
    intent: string;
    decision: DecisionResult;
    answerUsed: any;
    haltTriggered?: {
        reason: string;
    };
    skipped: boolean;
}
export interface SequentialErrandResult {
    completedStepsCount: number;
    totalStepsCount: number;
    haltedEarly: boolean;
    haltReason?: string;
    budgetSavedUsdc: number;
    stepResults: StepExecutionResult[];
}
/**
 * Executes a multi-step sequential intelligence check with early stopping.
 * Halts pipeline and saves budget if an early condition (e.g. sanctions match or adverse price) is met.
 */
export declare function evaluateSequentialErrand(steps: ErrandStep[], now: number, getCachedAnswer: (intent: string) => (CachedAnswer & {
    answer: any;
}) | null, getAtlasStats: (intent: string) => AtlasStats | null, executeBuyFallback: (intent: string, params: Record<string, unknown>) => any): SequentialErrandResult;
//# sourceMappingURL=sequential.d.ts.map