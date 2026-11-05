import crypto from "node:crypto";
/**
 * Encrypts a private key using envelope encryption:
 * 1. Generates a unique 256-bit Data Encryption Key (DEK).
 * 2. Encrypts the private key with DEK via AES-256-GCM.
 * 3. Encrypts the DEK with the Master Key via AES-256-GCM.
 */
export function encryptPrivateKey(privateKeyHex, masterKeyBase64) {
    const masterKey = Buffer.from(masterKeyBase64, "base64");
    if (masterKey.length !== 32) {
        throw new Error("Master key must be exactly 32 bytes (256 bits)");
    }
    // 1. Generate unique random Data Encryption Key (DEK)
    const dek = crypto.randomBytes(32);
    // 2. Encrypt private key with DEK
    const payloadIv = crypto.randomBytes(12);
    const payloadCipher = crypto.createCipheriv("aes-256-gcm", dek, payloadIv);
    let ciphertext = payloadCipher.update(privateKeyHex, "utf8", "base64");
    ciphertext += payloadCipher.final("base64");
    const payloadTag = payloadCipher.getAuthTag();
    // 3. Wrap DEK with Master Key
    const wrapIv = crypto.randomBytes(12);
    const wrapCipher = crypto.createCipheriv("aes-256-gcm", masterKey, wrapIv);
    let wrappedDataKey = wrapCipher.update(dek.toString("base64"), "utf8", "base64");
    wrappedDataKey += wrapCipher.final("base64");
    const wrapTag = wrapCipher.getAuthTag();
    return {
        ciphertext,
        nonce: payloadIv.toString("base64"),
        tag: payloadTag.toString("base64"),
        wrappedDataKey,
        wrappedNonce: wrapIv.toString("base64"),
        wrappedTag: wrapTag.toString("base64"),
        keyVersion: 1,
    };
}
/**
 * Decrypts a private key inside the worker process at signing time.
 * Verifies both authentication tags (AEAD) to detect any tampering.
 */
export function decryptPrivateKey(record, masterKeyBase64) {
    const masterKey = Buffer.from(masterKeyBase64, "base64");
    if (masterKey.length !== 32) {
        throw new Error("Master key must be exactly 32 bytes");
    }
    // 1. Unwrap DEK using Master Key
    const wrapIv = Buffer.from(record.wrappedNonce, "base64");
    const wrapTag = Buffer.from(record.wrappedTag, "base64");
    const wrapDecipher = crypto.createDecipheriv("aes-256-gcm", masterKey, wrapIv);
    wrapDecipher.setAuthTag(wrapTag);
    let dekBase64 = wrapDecipher.update(record.wrappedDataKey, "base64", "utf8");
    dekBase64 += wrapDecipher.final("utf8");
    const dek = Buffer.from(dekBase64, "base64");
    // 2. Decrypt private key using DEK
    const payloadIv = Buffer.from(record.nonce, "base64");
    const payloadTag = Buffer.from(record.tag, "base64");
    const payloadDecipher = crypto.createDecipheriv("aes-256-gcm", dek, payloadIv);
    payloadDecipher.setAuthTag(payloadTag);
    let privateKeyHex = payloadDecipher.update(record.ciphertext, "base64", "utf8");
    privateKeyHex += payloadDecipher.final("utf8");
    return privateKeyHex;
}
//# sourceMappingURL=crypto.js.map