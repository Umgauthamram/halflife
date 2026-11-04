import { describe, expect, it } from "vitest";
import crypto from "node:crypto";
import { encryptPrivateKey, decryptPrivateKey } from "./crypto.js";

describe("Worker Envelope Encryption", () => {
  const masterKeyBase64 = crypto.randomBytes(32).toString("base64");
  const samplePrivateKey = "0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f3608a9";

  it("successfully encrypts and decrypts a private key", () => {
    const record = encryptPrivateKey(samplePrivateKey, masterKeyBase64);

    expect(record.ciphertext).toBeDefined();
    expect(record.nonce).toBeDefined();
    expect(record.tag).toBeDefined();
    expect(record.wrappedDataKey).toBeDefined();
    expect(record.ciphertext).not.toEqual(samplePrivateKey);

    const decrypted = decryptPrivateKey(record, masterKeyBase64);
    expect(decrypted).toBe(samplePrivateKey);
  });

  it("detects ciphertext tampering and throws authentication error", () => {
    const record = encryptPrivateKey(samplePrivateKey, masterKeyBase64);

    // Tamper with ciphertext
    const tampered = {
      ...record,
      ciphertext: Buffer.from("tampered_ciphertext").toString("base64"),
    };

    expect(() => {
      decryptPrivateKey(tampered, masterKeyBase64);
    }).toThrow();
  });

  it("fails decryption if master key is invalid", () => {
    const record = encryptPrivateKey(samplePrivateKey, masterKeyBase64);
    const wrongMasterKey = crypto.randomBytes(32).toString("base64");

    expect(() => {
      decryptPrivateKey(record, wrongMasterKey);
    }).toThrow();
  });
});

