import type { Db } from "mongodb";

export interface DecayCurvePoint {
  ageSeconds: number;
  expectedDrift: number;
}

export interface AtlasStatsDoc {
  intent: string;
  window: number;
  driftCurve: DecayCurvePoint[];
  noiseFloor: number;
  sampleCount: number;
  confidence: number;
  computedAt: Date;
  calibrated: boolean;
}

const DEFAULT_BUCKETS = [0, 60, 300, 1800, 3600, 86400]; // 0s, 1m, 5m, 30m, 1h, 24h

/**
 * Fits an empirical monotonic drift curve from historical atlas_samples.
 */
export async function updateDecayEstimates(db: Db, intent: string): Promise<AtlasStatsDoc | null> {
  // 1. Fetch recent samples for this intent (last 500 samples)
  const samples = await db
    .collection("atlas_samples")
    .find({ intent })
    .sort({ ts: -1 })
    .limit(500)
    .toArray();

  if (samples.length === 0) {
    return null;
  }

  // 2. Fetch noise measurements for noise floor
  const noiseDocs = await db
    .collection("atlas_noise_measurements")
    .find({ intent })
    .sort({ ts: -1 })
    .limit(100)
    .toArray();

  let noiseFloor = 0.002; // safe fallback
  if (noiseDocs.length > 0) {
    const sum = noiseDocs.reduce((acc, d) => acc + (typeof d.disagreement === "number" ? d.disagreement : 0), 0);
    noiseFloor = sum / noiseDocs.length;
  }

  // 3. Compute temporal drift from pairs of samples by the same miner
  const minerGroups = new Map<string, Array<{ ts: number; val: number }>>();
  for (const s of samples) {
    if (typeof s.valueNorm !== "number") continue;
    const mId = s.minerId || "unknown";
    if (!minerGroups.has(mId)) {
      minerGroups.set(mId, []);
    }
    minerGroups.get(mId)!.push({
      ts: new Date(s.ts).getTime(),
      val: s.valueNorm,
    });
  }

  const bucketDeltas: Record<number, number[]> = {};
  for (const b of DEFAULT_BUCKETS) {
    bucketDeltas[b] = [];
  }

  for (const [_mId, group] of minerGroups.entries()) {
    // Sort chronologically
    group.sort((a, b) => a.ts - b.ts);
    for (let i = 0; i < group.length - 1; i++) {
      for (let j = i + 1; j < Math.min(group.length, i + 10); j++) {
        const dtSec = Math.max(0, (group[j].ts - group[i].ts) / 1000);
        const refVal = Math.abs(group[i].val) || 1.0;
        const drift = Math.abs(group[j].val - group[i].val) / refVal;

        // Assign to closest bucket
        let closestBucket = DEFAULT_BUCKETS[0];
        let minDiff = Infinity;
        for (const b of DEFAULT_BUCKETS) {
          const diff = Math.abs(dtSec - b);
          if (diff < minDiff) {
            minDiff = diff;
            closestBucket = b;
          }
        }
        bucketDeltas[closestBucket].push(drift);
      }
    }
  }

  // 4. Compute median drift per bucket
  const rawCurve: DecayCurvePoint[] = [];
  let prevDrift = noiseFloor;

  for (const b of DEFAULT_BUCKETS) {
    const arr = bucketDeltas[b];
    let expectedDrift = prevDrift;
    if (arr && arr.length > 0) {
      arr.sort((x, y) => x - y);
      const median = arr[Math.floor(arr.length / 2)];
      expectedDrift = Math.max(median, prevDrift); // Monotonic isotonic constraint
    } else {
      // Conservative growth if bucket is empty
      expectedDrift = prevDrift * (b === 0 ? 1 : 1.15);
    }
    prevDrift = expectedDrift;
    rawCurve.push({
      ageSeconds: b,
      expectedDrift: Number(expectedDrift.toFixed(6)),
    });
  }

  const sampleCount = samples.length;
  const confidence = Math.min(1.0, Number((sampleCount / 50).toFixed(2)));
  const calibrated = sampleCount >= 20;

  const statsDoc: AtlasStatsDoc = {
    intent,
    window: 86400,
    driftCurve: rawCurve,
    noiseFloor: Number(noiseFloor.toFixed(6)),
    sampleCount,
    confidence,
    computedAt: new Date(),
    calibrated,
  };

  // Upsert into atlas_stats
  await db.collection("atlas_stats").updateOne(
    { intent },
    { $set: statsDoc },
    { upsert: true }
  );

  return statsDoc;
}
