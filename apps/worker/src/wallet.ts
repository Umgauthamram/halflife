import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { ObjectId, type Db } from "mongodb";
import { encryptPrivateKey, decryptPrivateKey, type EncryptedWalletKeyRecord } from "./crypto.js";
import { guardTransaction, type GuardTransactionParams, type ChainGuardConfig } from "@half-life/chain";

export interface GeneratedWallet {
  address: `0x${string}`;
  keyRef: string;
}

/**
 * Generates an Ethereum keypair on Sepolia, encrypts it with envelope encryption,
 * stores the ciphertext in `wallet_keys`, and returns only the public address and key reference.
 */
export async function createAgentWallet(
  db: Db,
  agentId: string,
  masterKeyBase64: string
): Promise<GeneratedWallet> {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);

  const encrypted = encryptPrivateKey(privateKey, masterKeyBase64);

  const insertResult = await db.collection("wallet_keys").insertOne({
    agentId,
    ...encrypted,
    createdAt: new Date(),
  });

  return {
    address: account.address,
    keyRef: insertResult.insertedId.toString(),
  };
}

/**
 * Retrieves the encrypted wallet key, performs safety chain guard checks,
 * decrypts the key in the worker's secure memory boundary, and signs the payload.
 */
export async function signWithAgentWallet(
  db: Db,
  agentId: string,
  guardParams: GuardTransactionParams,
  guardConfig: ChainGuardConfig,
  masterKeyBase64: string
): Promise<{ account: ReturnType<typeof privateKeyToAccount> }> {
  // 1. Mandatory Chain Guard check before touching keys
  guardTransaction(guardParams, guardConfig);

  // 2. Fetch encrypted key record
  const keyRecord = await db.collection("wallet_keys").findOne({
    agentId,
  });

  if (!keyRecord) {
    throw new Error(`Wallet key not found for agent: ${agentId}`);
  }

  const record: EncryptedWalletKeyRecord = {
    ciphertext: keyRecord.ciphertext,
    nonce: keyRecord.nonce,
    tag: keyRecord.tag,
    wrappedDataKey: keyRecord.wrappedDataKey,
    wrappedNonce: keyRecord.wrappedNonce,
    wrappedTag: keyRecord.wrappedTag,
    keyVersion: keyRecord.keyVersion ?? 1,
  };

  // 3. Decrypt in memory
  const privateKeyHex = decryptPrivateKey(record, masterKeyBase64);
  const account = privateKeyToAccount(privateKeyHex as `0x${string}`);

  return { account };
}

