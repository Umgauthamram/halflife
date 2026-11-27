import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "../../../../lib/mongodb";
import { PUBLIC_DATASET_FILTER } from "../../../../lib/dataset-filter";
import { buildMerkleTree, hashLeaf } from "@half-life/shared";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const db = await getDb();
    const searchParams = req.nextUrl.searchParams;

    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "100", 10), 1), 500);
    const cursor = searchParams.get("cursor");
    const format = searchParams.get("format");

    // Strict filter: live source, confirmed on-chain verification, non-null valueNorm, no mock miner_ prefix
    const filter: Record<string, any> = {
      ...PUBLIC_DATASET_FILTER,
    };

    if (cursor) {
      try {
        filter._id = { $lt: new ObjectId(cursor) };
      } catch {
        filter._id = { $lt: cursor };
      }
    }

    const samples = await db
      .collection("atlas_samples")
      .find(filter)
      .sort({ _id: -1 })
      .limit(limit)
      .toArray();

    const rows = samples.map((s) => ({
      id: s._id.toString(),
      ts: s.ts ? new Date(s.ts).toISOString() : new Date().toISOString(),
      intent: s.intent,
      minerId: s.minerId,
      valueNorm: s.valueNorm,
      rawAnswerHash: s.rawAnswerHash,
      txHash: s.txHash,
      priceUsdc: s.priceUsdc,
    }));

    // Cryptographic Merkle Root over confirmed live rows
    let merkleRoot: string | null = null;
    if (rows.length > 0) {
      const leafHashes = rows.map((s) =>
        hashLeaf(`${s.intent}:${s.minerId}:${s.valueNorm}:${s.rawAnswerHash}:${s.txHash}`)
      );
      const tree = buildMerkleTree(leafHashes);
      merkleRoot = tree.root;

      // Store published root snapshot in dataset_roots
      await db.collection("dataset_roots").insertOne({
        merkleRoot,
        count: rows.length,
        firstSampleId: rows[0].id,
        lastSampleId: rows[rows.length - 1].id,
        createdAt: new Date(),
      });
    }

    // CSV Format support
    if (format === "csv") {
      const csvHeader = "id,ts,intent,minerId,valueNorm,rawAnswerHash,txHash,priceUsdc\n";
      const csvRows = rows
        .map((s) =>
          [
            s.id,
            s.ts,
            `"${String(s.intent).replace(/"/g, '""')}"`,
            `"${String(s.minerId).replace(/"/g, '""')}"`,
            `"${String(s.valueNorm ?? "").replace(/"/g, '""')}"`,
            s.rawAnswerHash,
            s.txHash,
            s.priceUsdc,
          ].join(",")
        )
        .join("\n");

      return new Response(csvHeader + csvRows, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="halflife-atlas-dataset.csv"',
          "X-Merkle-Root": merkleRoot || "none",
          "X-Total-Count": String(rows.length),
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      });
    }

    const nextCursor = rows.length === limit ? rows[rows.length - 1].id : null;

    return NextResponse.json(
      {
        title: "Half-Life Freshness Atlas Public Dataset",
        network: "Ethereum Sepolia (Chain ID: 11155111)",
        license: "Apache-2.0",
        filter: "source: live, verification: confirmed",
        count: rows.length,
        merkleRoot,
        nextCursor,
        rows,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
