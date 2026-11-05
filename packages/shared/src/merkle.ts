import crypto from "node:crypto";

export interface MerkleProof {
  leaf: string;
  root: string;
  proof: Array<{ position: "left" | "right"; hash: string }>;
}

export function hashLeaf(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

export function combineHash(left: string, right: string): string {
  return crypto.createHash("sha256").update(left + right).digest("hex");
}

/**
 * Builds a Merkle tree from an array of leaf hashes and returns the root hash.
 * If leaf count is odd, duplicates the last leaf to balance the tree.
 */
export function buildMerkleTree(leafHashes: string[]): { root: string; layers: string[][] } {
  if (leafHashes.length === 0) {
    return { root: "0".repeat(64), layers: [[]] };
  }

  const layers: string[][] = [leafHashes];
  let currentLayer = leafHashes;

  while (currentLayer.length > 1) {
    const nextLayer: string[] = [];
    for (let i = 0; i < currentLayer.length; i += 2) {
      const left = currentLayer[i];
      const right = i + 1 < currentLayer.length ? currentLayer[i + 1] : left;
      nextLayer.push(combineHash(left, right));
    }
    layers.push(nextLayer);
    currentLayer = nextLayer;
  }

  return { root: currentLayer[0], layers };
}

/**
 * Generates an audit proof for a specific leaf index.
 */
export function generateMerkleProof(leafHashes: string[], leafIndex: number): MerkleProof {
  if (leafIndex < 0 || leafIndex >= leafHashes.length) {
    throw new Error("Leaf index out of bounds");
  }

  const { root, layers } = buildMerkleTree(leafHashes);
  const proof: MerkleProof["proof"] = [];

  let idx = leafIndex;
  for (let i = 0; i < layers.length - 1; i++) {
    const layer = layers[i];
    const isRightChild = idx % 2 === 1;
    const siblingIdx = isRightChild ? idx - 1 : idx + 1;

    if (siblingIdx < layer.length) {
      proof.push({
        position: isRightChild ? "left" : "right",
        hash: layer[siblingIdx],
      });
    } else {
      // Duplicated self when odd
      proof.push({
        position: "right",
        hash: layer[idx],
      });
    }

    idx = Math.floor(idx / 2);
  }

  return {
    leaf: leafHashes[leafIndex],
    root,
    proof,
  };
}

/**
 * Cryptographically verifies that a leaf belongs to a Merkle root using its proof path.
 */
export function verifyMerkleProof(leafHash: string, root: string, proof: MerkleProof["proof"]): boolean {
  let currentHash = leafHash;

  for (const step of proof) {
    if (step.position === "left") {
      currentHash = combineHash(step.hash, currentHash);
    } else {
      currentHash = combineHash(currentHash, step.hash);
    }
  }

  return currentHash === root;
}

