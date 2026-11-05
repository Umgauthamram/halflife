export interface EncryptedWalletKeyRecord {
    ciphertext: string;
    nonce: string;
    tag: string;
    wrappedDataKey: string;
    wrappedNonce: string;
    wrappedTag: string;
    keyVersion: number;
}
/**
 * Encrypts a private key using envelope encryption:
 * 1. Generates a unique 256-bit Data Encryption Key (DEK).
 * 2. Encrypts the private key with DEK via AES-256-GCM.
 * 3. Encrypts the DEK with the Master Key via AES-256-GCM.
 */
export declare function encryptPrivateKey(privateKeyHex: string, masterKeyBase64: string): EncryptedWalletKeyRecord;
/**
 * Decrypts a private key inside the worker process at signing time.
 * Verifies both authentication tags (AEAD) to detect any tampering.
 */
export declare function decryptPrivateKey(record: EncryptedWalletKeyRecord, masterKeyBase64: string): string;
//# sourceMappingURL=crypto.d.ts.map