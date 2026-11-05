import { z } from "zod";
export declare const UserRoleSchema: z.ZodEnum<["visitor", "member", "admin"]>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export declare const UserStatusSchema: z.ZodEnum<["active", "suspended", "deleted"]>;
export type UserStatus = z.infer<typeof UserStatusSchema>;
export declare const UserSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    image: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    role: z.ZodEnum<["visitor", "member", "admin"]>;
    status: z.ZodEnum<["active", "suspended", "deleted"]>;
    lastSignInAt: z.ZodOptional<z.ZodDate>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    status: "active" | "suspended" | "deleted";
    id: string;
    email: string;
    role: "visitor" | "member" | "admin";
    createdAt: Date;
    name?: string | null | undefined;
    image?: string | null | undefined;
    lastSignInAt?: Date | undefined;
}, {
    status: "active" | "suspended" | "deleted";
    id: string;
    email: string;
    role: "visitor" | "member" | "admin";
    createdAt: Date;
    name?: string | null | undefined;
    image?: string | null | undefined;
    lastSignInAt?: Date | undefined;
}>;
export type User = z.infer<typeof UserSchema>;
export declare const AgentModeSchema: z.ZodEnum<["naive", "halflife"]>;
export type AgentMode = z.infer<typeof AgentModeSchema>;
export declare const AgentStatusSchema: z.ZodEnum<["active", "paused"]>;
export type AgentStatus = z.infer<typeof AgentStatusSchema>;
export declare const AgentPolicySchema: z.ZodObject<{
    perAskCapUsdc: z.ZodNumber;
    dailyCapUsdc: z.ZodNumber;
    stakeDefault: z.ZodDefault<z.ZodNumber>;
    escrowCapUsdc: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    perAskCapUsdc: number;
    dailyCapUsdc: number;
    stakeDefault: number;
    escrowCapUsdc?: number | undefined;
}, {
    perAskCapUsdc: number;
    dailyCapUsdc: number;
    stakeDefault?: number | undefined;
    escrowCapUsdc?: number | undefined;
}>;
export type AgentPolicy = z.infer<typeof AgentPolicySchema>;
export declare const AgentSchema: z.ZodObject<{
    id: z.ZodString;
    ownerId: z.ZodString;
    name: z.ZodString;
    mode: z.ZodEnum<["naive", "halflife"]>;
    walletAddress: z.ZodString;
    walletKeyRef: z.ZodString;
    allowedIntents: z.ZodArray<z.ZodString, "many">;
    policy: z.ZodObject<{
        perAskCapUsdc: z.ZodNumber;
        dailyCapUsdc: z.ZodNumber;
        stakeDefault: z.ZodDefault<z.ZodNumber>;
        escrowCapUsdc: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        perAskCapUsdc: number;
        dailyCapUsdc: number;
        stakeDefault: number;
        escrowCapUsdc?: number | undefined;
    }, {
        perAskCapUsdc: number;
        dailyCapUsdc: number;
        stakeDefault?: number | undefined;
        escrowCapUsdc?: number | undefined;
    }>;
    status: z.ZodEnum<["active", "paused"]>;
    pausedBy: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    status: "active" | "paused";
    id: string;
    name: string;
    createdAt: Date;
    ownerId: string;
    mode: "halflife" | "naive";
    walletAddress: string;
    walletKeyRef: string;
    allowedIntents: string[];
    policy: {
        perAskCapUsdc: number;
        dailyCapUsdc: number;
        stakeDefault: number;
        escrowCapUsdc?: number | undefined;
    };
    pausedBy?: string | undefined;
}, {
    status: "active" | "paused";
    id: string;
    name: string;
    createdAt: Date;
    ownerId: string;
    mode: "halflife" | "naive";
    walletAddress: string;
    walletKeyRef: string;
    allowedIntents: string[];
    policy: {
        perAskCapUsdc: number;
        dailyCapUsdc: number;
        stakeDefault?: number | undefined;
        escrowCapUsdc?: number | undefined;
    };
    pausedBy?: string | undefined;
}>;
export type Agent = z.infer<typeof AgentSchema>;
export declare const IntentSchema: z.ZodEnum<["FX_NOW", "WEATHER_FORECAST_VERIFY", "SANCTIONS_SCREENING_MATCH", "WEB_SEARCH", "QUESTION_ANSWERING", "WEATHER_CHECK", "CRYPTO_PRICE", "TASK_EXECUTION_QUALITY", "CONTENT_EXTRACTION", "URL_SAFE", "CODE_GENERATION", "TEXT_SUMMARIZATION", "AGENT_TASK", "LLM_OUTPUT_EVALUATION", "LIVE_SHELF_PRICE", "VENDOR_VERIFY", "CARRIER_SERVICEABILITY", "SHIP_RATE_ETA", "CLOUD_RESOURCE_USAGE"]>;
export type KnownIntent = z.infer<typeof IntentSchema>;
export declare const MinerSchema: z.ZodObject<{
    id: z.ZodString;
    address: z.ZodString;
    rank: z.ZodNumber;
    score: z.ZodNumber;
    priceUsdc: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    address: string;
    rank: number;
    score: number;
    priceUsdc: number;
}, {
    id: string;
    address: string;
    rank: number;
    score: number;
    priceUsdc: number;
}>;
export type Miner = z.infer<typeof MinerSchema>;
export declare const PurchaseVerificationStatusSchema: z.ZodEnum<["pending", "confirmed", "failed"]>;
export type PurchaseVerificationStatus = z.infer<typeof PurchaseVerificationStatusSchema>;
export declare const PurchaseSchema: z.ZodObject<{
    id: z.ZodString;
    agentId: z.ZodString;
    ownerId: z.ZodString;
    intent: z.ZodString;
    params: z.ZodUnknown;
    minerId: z.ZodString;
    minerRank: z.ZodNumber;
    priceUsdc: z.ZodNumber;
    paymentMode: z.ZodEnum<["x402", "escrow"]>;
    txHash: z.ZodString;
    signalHash: z.ZodString;
    answer: z.ZodUnknown;
    confidence: z.ZodOptional<z.ZodNumber>;
    askedAt: z.ZodDate;
    answeredAt: z.ZodDate;
    verification: z.ZodEnum<["pending", "confirmed", "failed"]>;
    verifiedAt: z.ZodOptional<z.ZodDate>;
    verifyDetail: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    ownerId: string;
    priceUsdc: number;
    agentId: string;
    intent: string;
    minerId: string;
    minerRank: number;
    paymentMode: "x402" | "escrow";
    txHash: string;
    signalHash: string;
    askedAt: Date;
    answeredAt: Date;
    verification: "pending" | "confirmed" | "failed";
    params?: unknown;
    answer?: unknown;
    confidence?: number | undefined;
    verifiedAt?: Date | undefined;
    verifyDetail?: string | undefined;
}, {
    id: string;
    createdAt: Date;
    ownerId: string;
    priceUsdc: number;
    agentId: string;
    intent: string;
    minerId: string;
    minerRank: number;
    paymentMode: "x402" | "escrow";
    txHash: string;
    signalHash: string;
    askedAt: Date;
    answeredAt: Date;
    verification: "pending" | "confirmed" | "failed";
    params?: unknown;
    answer?: unknown;
    confidence?: number | undefined;
    verifiedAt?: Date | undefined;
    verifyDetail?: string | undefined;
}>;
export type Purchase = z.infer<typeof PurchaseSchema>;
export declare const DecisionActionSchema: z.ZodEnum<["buy", "reuse", "escalate", "refuse"]>;
export type DecisionAction = z.infer<typeof DecisionActionSchema>;
export declare const DecisionInputsSchema: z.ZodObject<{
    ageSeconds: z.ZodNumber;
    drift: z.ZodNumber;
    noiseFloor: z.ZodNumber;
    price: z.ZodNumber;
    calibrated: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    ageSeconds: number;
    drift: number;
    noiseFloor: number;
    price: number;
    calibrated: boolean;
}, {
    ageSeconds: number;
    drift: number;
    noiseFloor: number;
    price: number;
    calibrated: boolean;
}>;
export type DecisionInputs = z.infer<typeof DecisionInputsSchema>;
export declare const DecisionSchema: z.ZodObject<{
    id: z.ZodString;
    agentId: z.ZodString;
    ownerId: z.ZodString;
    requestId: z.ZodString;
    intent: z.ZodString;
    stake: z.ZodNumber;
    action: z.ZodEnum<["buy", "reuse", "escalate", "refuse"]>;
    reason: z.ZodString;
    inputs: z.ZodObject<{
        ageSeconds: z.ZodNumber;
        drift: z.ZodNumber;
        noiseFloor: z.ZodNumber;
        price: z.ZodNumber;
        calibrated: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        ageSeconds: number;
        drift: number;
        noiseFloor: number;
        price: number;
        calibrated: boolean;
    }, {
        ageSeconds: number;
        drift: number;
        noiseFloor: number;
        price: number;
        calibrated: boolean;
    }>;
    purchaseId: z.ZodOptional<z.ZodString>;
    cacheEntryId: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    ownerId: string;
    agentId: string;
    intent: string;
    requestId: string;
    stake: number;
    action: "buy" | "reuse" | "escalate" | "refuse";
    reason: string;
    inputs: {
        ageSeconds: number;
        drift: number;
        noiseFloor: number;
        price: number;
        calibrated: boolean;
    };
    purchaseId?: string | undefined;
    cacheEntryId?: string | undefined;
}, {
    id: string;
    createdAt: Date;
    ownerId: string;
    agentId: string;
    intent: string;
    requestId: string;
    stake: number;
    action: "buy" | "reuse" | "escalate" | "refuse";
    reason: string;
    inputs: {
        ageSeconds: number;
        drift: number;
        noiseFloor: number;
        price: number;
        calibrated: boolean;
    };
    purchaseId?: string | undefined;
    cacheEntryId?: string | undefined;
}>;
export type Decision = z.infer<typeof DecisionSchema>;
export declare const AtlasSampleSchema: z.ZodObject<{
    id: z.ZodString;
    ts: z.ZodDate;
    intent: z.ZodString;
    paramsKey: z.ZodString;
    minerId: z.ZodString;
    valueNorm: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
    rawAnswerHash: z.ZodString;
    purchaseId: z.ZodString;
    priceUsdc: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    priceUsdc: number;
    intent: string;
    minerId: string;
    purchaseId: string;
    ts: Date;
    paramsKey: string;
    valueNorm: string | number;
    rawAnswerHash: string;
}, {
    id: string;
    priceUsdc: number;
    intent: string;
    minerId: string;
    purchaseId: string;
    ts: Date;
    paramsKey: string;
    valueNorm: string | number;
    rawAnswerHash: string;
}>;
export type AtlasSample = z.infer<typeof AtlasSampleSchema>;
export declare const DriftBucketSchema: z.ZodObject<{
    ageSeconds: z.ZodNumber;
    expectedDrift: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    ageSeconds: number;
    expectedDrift: number;
}, {
    ageSeconds: number;
    expectedDrift: number;
}>;
export type DriftBucket = z.infer<typeof DriftBucketSchema>;
export declare const AtlasStatsSchema: z.ZodObject<{
    intent: z.ZodString;
    window: z.ZodNumber;
    driftCurve: z.ZodArray<z.ZodObject<{
        ageSeconds: z.ZodNumber;
        expectedDrift: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        ageSeconds: number;
        expectedDrift: number;
    }, {
        ageSeconds: number;
        expectedDrift: number;
    }>, "many">;
    noiseFloor: z.ZodNumber;
    sampleCount: z.ZodNumber;
    computedAt: z.ZodDate;
    calibrated: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    intent: string;
    noiseFloor: number;
    calibrated: boolean;
    window: number;
    driftCurve: {
        ageSeconds: number;
        expectedDrift: number;
    }[];
    sampleCount: number;
    computedAt: Date;
}, {
    intent: string;
    noiseFloor: number;
    calibrated: boolean;
    window: number;
    driftCurve: {
        ageSeconds: number;
        expectedDrift: number;
    }[];
    sampleCount: number;
    computedAt: Date;
}>;
export type AtlasStats = z.infer<typeof AtlasStatsSchema>;
//# sourceMappingURL=types.d.ts.map