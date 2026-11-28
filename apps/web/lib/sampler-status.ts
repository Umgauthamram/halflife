import { buildMerkleTree, hashLeaf } from "@half-life/shared";
import { filterPublicDatasetRows, type DatasetSampleCandidate } from "./dataset-filter";

export interface SamplerHeartbeatInput {
  lastLoopAt?: Date | string | number | null;
  consecutiveFailures?: number;
  paused?: boolean;
}

export interface ComputeSamplerStateInput {
  now: number;
  heartbeat: SamplerHeartbeatInput | null | undefined;
  intervalMs: number;
  paused?: boolean;
}

export interface SamplerStateResult {
  running: boolean;
  status: "operational" | "paused" | "degraded";
}

/**
 * Pure computation of sampler running & overall status:
 * - running = true iff heartbeat.lastLoopAt exists AND now - lastLoopAt <= 3 * intervalMs AND !paused
 * - status = "paused" if paused; else "operational" iff running && consecutiveFailures < 3; else "degraded"
 */
export function computeSamplerState({
  now,
  heartbeat,
  intervalMs,
  paused,
}: ComputeSamplerStateInput): SamplerStateResult {
  const isPaused = Boolean(paused ?? heartbeat?.paused);

  let lastLoopMs: number | null = null;
  if (heartbeat?.lastLoopAt !== undefined && heartbeat?.lastLoopAt !== null) {
    const parsed =
      heartbeat.lastLoopAt instanceof Date
        ? heartbeat.lastLoopAt.getTime()
        : typeof heartbeat.lastLoopAt === "number"
        ? heartbeat.lastLoopAt
        : new Date(heartbeat.lastLoopAt).getTime();
    if (Number.isFinite(parsed)) {
      lastLoopMs = parsed;
    }
  }

  const isFresh = lastLoopMs !== null && now - lastLoopMs <= 3 * intervalMs;
  const running = Boolean(lastLoopMs !== null && isFresh && !isPaused);

  const consecutiveFailures =
    typeof heartbeat?.consecutiveFailures === "number" ? heartbeat.consecutiveFailures : 0;

  let status: "operational" | "paused" | "degraded";
  if (isPaused) {
    status = "paused";
  } else if (running && consecutiveFailures < 3) {
    status = "operational";
  } else {
    status = "degraded";
  }

  return { running, status };
}

export interface LiveSampleStatusCandidate extends DatasetSampleCandidate {
  intent?: string;
  rawAnswerHash?: string;
  txHash?: string;
  ts?: Date | string;
  verifiedAt?: Date | string;
}

export interface ConfirmedPurchaseCandidate {
  txHash?: string;
  verifiedAt?: Date | string;
  createdAt?: Date | string;
}

export interface PublicVerificationSummary {
  liveSamples: number;
  confirmedSamples: number;
  unverifiedSamples: number;
  failedSamples: number;
  merkleRoot: string | null;
  lastVerifiedTx: string | null;
}

function toMs(val: Date | string | undefined): number {
  if (!val) return 0;
  const ms = val instanceof Date ? val.getTime() : new Date(val).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

/**
 * Computes Merkle root over confirmed dataset rows and selects the newest confirmed txHash
 * across confirmed live samples and purchases.
 */
export function selectMerkleAndLastVerifiedTx(
  confirmedDatasetRows: LiveSampleStatusCandidate[],
  latestConfirmedPurchase: ConfirmedPurchaseCandidate | null | undefined
): { merkleRoot: string | null; lastVerifiedTx: string | null } {
  const leafHashes = confirmedDatasetRows.map((s) =>
    hashLeaf(`${s.intent}:${s.minerId}:${s.valueNorm}:${s.rawAnswerHash}:${s.txHash}`)
  );
  const merkleRoot = leafHashes.length > 0 ? buildMerkleTree(leafHashes).root : null;

  let bestTxHash: string | null = null;
  let bestTs = -1;

  for (const s of confirmedDatasetRows) {
    if (s.verification !== "confirmed") continue;
    if (typeof s.txHash !== "string" || !s.txHash.trim()) continue;
    const t = toMs(s.verifiedAt ?? s.ts);
    if (t >= bestTs) {
      bestTs = t;
      bestTxHash = s.txHash;
    }
  }

  if (latestConfirmedPurchase && typeof latestConfirmedPurchase.txHash === "string" && latestConfirmedPurchase.txHash.trim()) {
    const pTs = toMs(latestConfirmedPurchase.verifiedAt ?? latestConfirmedPurchase.createdAt);
    if (pTs >= bestTs) {
      bestTs = pTs;
      bestTxHash = latestConfirmedPurchase.txHash;
    }
  }

  return {
    merkleRoot,
    lastVerifiedTx: bestTxHash,
  };
}

/**
 * Pure summary over a collection of live sample candidates:
 * counts by verification state, Merkle root over the confirmed dataset subset, and newest confirmed txHash.
 */
export function summarizeSampleVerifications(
  samples: LiveSampleStatusCandidate[],
  latestConfirmedPurchase: ConfirmedPurchaseCandidate | null | undefined = null
): PublicVerificationSummary {
  const live = samples.filter((s) => s.source === "live");
  const liveSamples = live.length;
  const confirmedSamples = live.filter((s) => s.verification === "confirmed").length;
  const unverifiedSamples = live.filter((s) => s.verification === "unverified").length;
  const failedSamples = live.filter((s) => s.verification === "failed").length;

  const confirmedDatasetRows = filterPublicDatasetRows(live)
    .slice()
    .sort((a, b) => toMs(b.ts) - toMs(a.ts))
    .slice(0, 50);

  const { merkleRoot, lastVerifiedTx } = selectMerkleAndLastVerifiedTx(
    confirmedDatasetRows,
    latestConfirmedPurchase
  );

  return {
    liveSamples,
    confirmedSamples,
    unverifiedSamples,
    failedSamples,
    merkleRoot,
    lastVerifiedTx,
  };
}
