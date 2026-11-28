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
  statusLabel?: string;
}

const DEFAULT_BUCKETS = [0, 60, 300, 1800, 3600, 86400]; // 0s, 1m, 5m, 30m, 1h, 24h

/**
 * Fits an empirical monotonic drift curve from historical atlas_samples.
 * Requires at least 30 real live samples spanning at least 6 hours to mark calibrated.
 */
export async function updateDecayEstimates(db: Db, intent: string): Promise<AtlasStatsDoc | null> {
  // 1. Fetch recent confirmed live samples for this intent (last 500 samples)
  const rawSamples = await db
    .collection("atlas_samples")
    .find({
      intent,
      source: "live",
      verification: "confirmed",
      valueNorm: { $ne: null },
    })
    .sort({ ts: -1 })
    .limit(500)
    .toArray();

  // Filter out unverified/failed rows in JS as well (defense in depth for in-memory/mock DBs)
  const samples = rawSamples.filter(
    (s) => s.verification === undefined || s.verification === "confirmed"
  );

  let unverifiedCount = rawSamples.filter((s) => s.verification === "unverified").length;
  let failedCount = rawSamples.filter((s) => s.verification === "failed").length;
  const col = db.collection("atlas_samples") as any;
  if (typeof col.countDocuments === "function") {
    unverifiedCount = await col.countDocuments({ intent, source: "live", verification: "unverified" });
    failedCount = await col.countDocuments({ intent, source: "live", verification: "failed" });
  }
  console.log(
    `[DecayEstimator] ${intent}: confirmed=${samples.length}, unverified=${unverifiedCount}, failed=${failedCount}`
  );

  // If no live samples exist yet, provide a conservative prior
  if (samples.length === 0) {
    const priorCurve: DecayCurvePoint[] = DEFAULT_BUCKETS.map((b) => ({
      ageSeconds: b,
      expectedDrift: Number((0.002 * (b === 0 ? 1 : 1 + (b / 3600) * 0.05)).toFixed(6)),
    }));

    const statsDoc: AtlasStatsDoc = {
      intent,
      window: 86400,
      driftCurve: priorCurve,
      noiseFloor: 0.002,
      sampleCount: 0,
      confidence: 0.0,
      computedAt: new Date(),
      calibrated: false,
      statusLabel: "prior (not measured)",
    };

    await db.collection("atlas_stats").updateOne(
      { intent },
      { $set: statsDoc },
      { upsert: true }
    );

    return statsDoc;
  }

  // 2. Fetch noise measurements for noise floor
  const noiseDocs = await db
    .collection("atlas_noise_measurements")
    .find({ intent })
    .sort({ ts: -1 })
    .limit(100)
    .toArray();

  let noiseFloor = 0.002;
  if (noiseDocs.length > 0) {
    const sum = noiseDocs.reduce(
      (acc, d) => acc + (typeof d.disagreement === "number" ? d.disagreement : 0),
      0
    );
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
    group.sort((a, b) => a.ts - b.ts);
    for (let i = 0; i < group.length - 1; i++) {
      for (let j = i + 1; j < Math.min(group.length, i + 10); j++) {
        const dtSec = Math.max(0, (group[j].ts - group[i].ts) / 1000);
        const refVal = Math.abs(group[i].val) || 1.0;
        const drift = Math.abs(group[j].val - group[i].val) / refVal;

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
      expectedDrift = prevDrift * (b === 0 ? 1 : 1.15);
    }
    prevDrift = expectedDrift;
    rawCurve.push({
      ageSeconds: b,
      expectedDrift: Number(expectedDrift.toFixed(6)),
    });
  }

  // 5. Calibration check: At least 30 samples spanning at least 6 hours
  let timeSpanHours = 0;
  if (samples.length >= 2) {
    const ts0 = new Date(samples[0].ts).getTime();
    const tsEnd = new Date(samples[samples.length - 1].ts).getTime();
    timeSpanHours = Math.abs(ts0 - tsEnd) / (1000 * 3600);
  }

  const sampleCount = samples.length;
  const isCalibrated = sampleCount >= 30 && timeSpanHours >= 6.0;
  const confidence = isCalibrated ? Math.min(1.0, Number((sampleCount / 100).toFixed(2))) : 0.0;
  const statusLabel = isCalibrated ? "calibrated" : "prior (not measured)";

  const statsDoc: AtlasStatsDoc = {
    intent,
    window: 86400,
    driftCurve: rawCurve,
    noiseFloor: Number(noiseFloor.toFixed(6)),
    sampleCount,
    confidence,
    computedAt: new Date(),
    calibrated: isCalibrated,
    statusLabel,
  };

  // Upsert into atlas_stats
  await db.collection("atlas_stats").updateOne(
    { intent },
    { $set: statsDoc },
    { upsert: true }
  );

  return statsDoc;
}
