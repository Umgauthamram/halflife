import crypto from "node:crypto";
export function hashLeaf(data) {
    return crypto.createHash("sha256").update(data).digest("hex");
}
export function combineHash(left, right) {
    return crypto.createHash("sha256").update(left + right).digest("hex");
}
/**
 * Builds a Merkle tree from an array of leaf hashes and returns the root hash.
 * If leaf count is odd, duplicates the last leaf to balance the tree.
 */
export function buildMerkleTree(leafHashes) {
    if (leafHashes.length === 0) {
        return { root: "0".repeat(64), layers: [[]] };
    }
    const layers = [leafHashes];
    let currentLayer = leafHashes;
    while (currentLayer.length > 1) {
        const nextLayer = [];
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
export function generateMerkleProof(leafHashes, leafIndex) {
    if (leafIndex < 0 || leafIndex >= leafHashes.length) {
        throw new Error("Leaf index out of bounds");
    }
    const { root, layers } = buildMerkleTree(leafHashes);
    const proof = [];
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
        }
        else {
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
export function verifyMerkleProof(leafHash, root, proof) {
    let currentHash = leafHash;
    for (const step of proof) {
        if (step.position === "left") {
            currentHash = combineHash(step.hash, currentHash);
        }
        else {
            currentHash = combineHash(currentHash, step.hash);
        }
    }
    return currentHash === root;
}
//# sourceMappingURL=merkle.js.map