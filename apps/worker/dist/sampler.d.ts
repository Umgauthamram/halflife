import type { Db } from "mongodb";
import type { TelegraphClient } from "@half-life/telegraph";
import type { AgentPolicy } from "@half-life/shared";
export interface SamplerConfig {
    intents: string[];
    intervalMs: number;
    dailyCapUsdc: number;
}
export interface SampleDisagreement {
    intent: string;
    miner1Id: string;
    miner2Id: string;
    disagreement: number;
    ts: Date;
}
/**
 * Extracts a normalized numeric or string value from an intent's answer.
 */
export declare function normalizeAnswerValue(intent: string, answer: any): {
    valueNorm: number | string;
    hash: string;
};
/**
 * Executes a single sampling round for a given intent:
 * 1. Claims distributed lock in MongoDB to prevent concurrent worker runs.
 * 2. Checks top miners available.
 * 3. Purchases from top 2 named miners concurrently to measure instantaneous disagreement (noise floor).
 * 4. Records samples and ledger purchases with verification and outcomeState.
 * 5. Updates empirical decay estimates in atlas_stats.
 */
export declare function sampleIntent(db: Db, client: TelegraphClient, intent: string, systemAgentId: string, samplerPolicy: AgentPolicy): Promise<{
    samplesCount: number;
    noiseMeasurement?: SampleDisagreement;
}>;
//# sourceMappingURL=sampler.d.ts.map