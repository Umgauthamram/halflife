import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/mongodb";
import { buildMerkleTree, hashLeaf } from "@half-life/shared";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDb();
    const samples = await db
      .collection("atlas_samples")
      .find({})
      .sort({ ts: -1 })
      .limit(100)
      .toArray();

    const formattedSamples = samples.map((s) => ({
      id: s._id.toString(),
      ts: s.ts,
      intent: s.intent,
      minerId: s.minerId,
      valueNorm: s.valueNorm,
      rawAnswerHash: s.rawAnswerHash,
      txHash: s.txHash,
      priceUsdc: s.priceUsdc,
    }));

    // Compute cryptographic Merkle Root over the dataset
    const leafHashes = formattedSamples.map((s) =>
      hashLeaf(`${s.intent}:${s.minerId}:${s.valueNorm}:${s.rawAnswerHash}:${s.txHash}`)
    );

    const { root: merkleRoot } = buildMerkleTree(leafHashes);

    return NextResponse.json(
      {
        title: "Half-Life Freshness Atlas Public Dataset",
        network: "Ethereum Sepolia (Chain ID: 11155111)",
        license: "Apache-2.0",
        totalCount: formattedSamples.length,
        merkleRoot,
        samples: formattedSamples,
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

