import { describe, expect, it } from "vitest";
import { buildMerkleTree, generateMerkleProof, verifyMerkleProof, hashLeaf } from "./merkle.js";

describe("Cryptographic Merkle Tree Anchoring", () => {
  const leaves = [
    hashLeaf("sample_fx_1"),
    hashLeaf("sample_fx_2"),
    hashLeaf("sample_weather_1"),
    hashLeaf("sample_sanctions_1"),
  ];

  it("builds a deterministic 256-bit Merkle root", () => {
    const { root } = buildMerkleTree(leaves);
    expect(root).toMatch(/^[0-9a-f]{64}$/);
  });

  it("generates valid inclusion proof that verifies successfully", () => {
    const { root } = buildMerkleTree(leaves);

    for (let i = 0; i < leaves.length; i++) {
      const proof = generateMerkleProof(leaves, i);
      expect(proof.root).toBe(root);
      expect(proof.leaf).toBe(leaves[i]);

      const isValid = verifyMerkleProof(leaves[i], root, proof.proof);
      expect(isValid).toBe(true);
    }
  });

  it("rejects invalid or tampered proof", () => {
    const { root } = buildMerkleTree(leaves);
    const proof = generateMerkleProof(leaves, 0);

    // Tamper with the leaf
    const tamperedLeaf = hashLeaf("tampered_content");
    const isValid = verifyMerkleProof(tamperedLeaf, root, proof.proof);
    expect(isValid).toBe(false);
  });

  it("handles odd number of leaves gracefully", () => {
    const oddLeaves = leaves.slice(0, 3);
    const { root } = buildMerkleTree(oddLeaves);
    expect(root).toBeDefined();

    const proof = generateMerkleProof(oddLeaves, 2);
    expect(verifyMerkleProof(oddLeaves[2], root, proof.proof)).toBe(true);
  });
});

