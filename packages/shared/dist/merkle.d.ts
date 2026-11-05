export interface MerkleProof {
    leaf: string;
    root: string;
    proof: Array<{
        position: "left" | "right";
        hash: string;
    }>;
}
export declare function hashLeaf(data: string): string;
export declare function combineHash(left: string, right: string): string;
/**
 * Builds a Merkle tree from an array of leaf hashes and returns the root hash.
 * If leaf count is odd, duplicates the last leaf to balance the tree.
 */
export declare function buildMerkleTree(leafHashes: string[]): {
    root: string;
    layers: string[][];
};
/**
 * Generates an audit proof for a specific leaf index.
 */
export declare function generateMerkleProof(leafHashes: string[], leafIndex: number): MerkleProof;
/**
 * Cryptographically verifies that a leaf belongs to a Merkle root using its proof path.
 */
export declare function verifyMerkleProof(leafHash: string, root: string, proof: MerkleProof["proof"]): boolean;
//# sourceMappingURL=merkle.d.ts.map