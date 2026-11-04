import { z } from "zod";

// -----------------------------------------------------------------------------
// Role and User Models
// -----------------------------------------------------------------------------
export const UserRoleSchema = z.enum(["visitor", "member", "admin"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserStatusSchema = z.enum(["active", "suspended", "deleted"]);
export type UserStatus = z.infer<typeof UserStatusSchema>;

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  role: UserRoleSchema,
  status: UserStatusSchema,
  lastSignInAt: z.date().optional(),
  createdAt: z.date(),
});
export type User = z.infer<typeof UserSchema>;

// -----------------------------------------------------------------------------
// Agent Models
// -----------------------------------------------------------------------------
export const AgentModeSchema = z.enum(["naive", "halflife"]);
export type AgentMode = z.infer<typeof AgentModeSchema>;

export const AgentStatusSchema = z.enum(["active", "paused"]);
export type AgentStatus = z.infer<typeof AgentStatusSchema>;

export const AgentPolicySchema = z.object({
  perAskCapUsdc: z.number().positive(),
  dailyCapUsdc: z.number().positive(),
  stakeDefault: z.number().nonnegative().default(100),
  escrowCapUsdc: z.number().positive().optional(),
});
export type AgentPolicy = z.infer<typeof AgentPolicySchema>;

export const AgentSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  name: z.string().min(1).max(100),
  mode: AgentModeSchema,
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  walletKeyRef: z.string(),
  allowedIntents: z.array(z.string()),
  policy: AgentPolicySchema,
  status: AgentStatusSchema,
  pausedBy: z.string().optional(),
  createdAt: z.date(),
});
export type Agent = z.infer<typeof AgentSchema>;

// -----------------------------------------------------------------------------
// Telegraph Intents & Receipts
// -----------------------------------------------------------------------------
export const IntentSchema = z.enum([
  "FX_NOW",
  "WEATHER_FORECAST_VERIFY",
  "SANCTIONS_SCREENING_MATCH",
]);
export type KnownIntent = z.infer<typeof IntentSchema>;

export const MinerSchema = z.object({
  id: z.string(),
  address: z.string(),
  rank: z.number().int().positive(),
  score: z.number().min(0).max(100),
  priceUsdc: z.number().nonnegative(),
});
export type Miner = z.infer<typeof MinerSchema>;

export const PurchaseVerificationStatusSchema = z.enum(["pending", "confirmed", "failed"]);
export type PurchaseVerificationStatus = z.infer<typeof PurchaseVerificationStatusSchema>;

export const PurchaseSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  ownerId: z.string(),
  intent: z.string(),
  params: z.unknown(),
  minerId: z.string(),
  minerRank: z.number().int(),
  priceUsdc: z.number().nonnegative(),
  paymentMode: z.enum(["x402", "escrow"]),
  txHash: z.string(),
  signalHash: z.string(),
  answer: z.unknown(),
  confidence: z.number().min(0).max(1).optional(),
  askedAt: z.date(),
  answeredAt: z.date(),
  verification: PurchaseVerificationStatusSchema,
  verifiedAt: z.date().optional(),
  verifyDetail: z.string().optional(),
  createdAt: z.date(),
});
export type Purchase = z.infer<typeof PurchaseSchema>;

// -----------------------------------------------------------------------------
// Decision Models (Governor Engine)
// -----------------------------------------------------------------------------
export const DecisionActionSchema = z.enum(["buy", "reuse", "escalate", "refuse"]);
export type DecisionAction = z.infer<typeof DecisionActionSchema>;

export const DecisionInputsSchema = z.object({
  ageSeconds: z.number().nonnegative(),
  drift: z.number().min(0),
  noiseFloor: z.number().min(0),
  price: z.number().nonnegative(),
  calibrated: z.boolean(),
});
export type DecisionInputs = z.infer<typeof DecisionInputsSchema>;

export const DecisionSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  ownerId: z.string(),
  requestId: z.string(),
  intent: z.string(),
  stake: z.number().nonnegative(),
  action: DecisionActionSchema,
  reason: z.string(),
  inputs: DecisionInputsSchema,
  purchaseId: z.string().optional(),
  cacheEntryId: z.string().optional(),
  createdAt: z.date(),
});
export type Decision = z.infer<typeof DecisionSchema>;

// -----------------------------------------------------------------------------
// Freshness Atlas Models
// -----------------------------------------------------------------------------
export const AtlasSampleSchema = z.object({
  id: z.string(),
  ts: z.date(),
  intent: z.string(),
  paramsKey: z.string(),
  minerId: z.string(),
  valueNorm: z.union([z.number(), z.string()]),
  rawAnswerHash: z.string(),
  purchaseId: z.string(),
  priceUsdc: z.number().nonnegative(),
});
export type AtlasSample = z.infer<typeof AtlasSampleSchema>;

export const DriftBucketSchema = z.object({
  ageSeconds: z.number().nonnegative(),
  expectedDrift: z.number().min(0),
});
export type DriftBucket = z.infer<typeof DriftBucketSchema>;

export const AtlasStatsSchema = z.object({
  intent: z.string(),
  window: z.number().positive(),
  driftCurve: z.array(DriftBucketSchema),
  noiseFloor: z.number().min(0),
  sampleCount: z.number().int().nonnegative(),
  computedAt: z.date(),
  calibrated: z.boolean(),
});
export type AtlasStats = z.infer<typeof AtlasStatsSchema>;

