import { MongoClient, ServerApiVersion, type Db } from "mongodb";

const uri = process.env.MONGODB_URI_WEB || "mongodb://127.0.0.1:27017/halflife";

const clientOptions = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  maxPoolSize: 10,
  minPoolSize: 1,
  maxIdleTimeMS: 60000,
  connectTimeoutMS: 5000,
  socketTimeoutMS: 20000,
};

// Global cache for serverless environments (reused across warm invocations in both dev & prod)
const globalWithMongo = global as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
  _mongoIndexesInitialized?: boolean;
};

let clientPromise: Promise<MongoClient>;

if (!globalWithMongo._mongoClientPromise) {
  const client = new MongoClient(uri, clientOptions);
  globalWithMongo._mongoClientPromise = client.connect();
}
clientPromise = globalWithMongo._mongoClientPromise;

export default clientPromise;

/**
 * Initializes database indexes once per container lifecycle to prevent full-table collection scans.
 */
async function ensureIndexes(db: Db) {
  if (globalWithMongo._mongoIndexesInitialized) return;
  globalWithMongo._mongoIndexesInitialized = true;

  try {
    await Promise.allSettled([
      // NextAuth sessions collection (critical for 0ms session lookups)
      db.collection("sessions").createIndex({ sessionToken: 1 }, { unique: true }),
      db.collection("sessions").createIndex({ userId: 1 }),

      // Users
      db.collection("users").createIndex({ email: 1 }),
      db.collection("users").createIndex({ id: 1 }),

      // Agents
      db.collection("agents").createIndex({ ownerId: 1 }),
      db.collection("agents").createIndex({ ownerId: 1, createdAt: -1 }),

      // API Keys
      db.collection("api_keys").createIndex({ hash: 1 }),
      db.collection("api_keys").createIndex({ agentId: 1, ownerId: 1 }),
      db.collection("api_keys").createIndex({ ownerId: 1, revokedAt: 1 }),

      // Playground Runs
      db.collection("playground_runs").createIndex({ userId: 1, createdAt: -1 }),
      db.collection("playground_runs").createIndex({ runId: 1 }, { unique: true }),

      // Cache Entries & Governor
      db.collection("cache_entries").createIndex({ agentId: 1, intent: 1, paramsHash: 1 }),

      // Atlas Samples & Stats
      db.collection("atlas_samples").createIndex({ intent: 1, ts: -1 }),
      db.collection("atlas_samples").createIndex({ intent: 1, ts: 1 }),
      db.collection("atlas_noise_measurements").createIndex({ intent: 1 }),
      db.collection("atlas_stats").createIndex({ intent: 1 }, { unique: true }),

      // Purchases & Decisions
      db.collection("purchases").createIndex({ ownerId: 1, askedAt: -1 }),
      db.collection("decisions").createIndex({ ownerId: 1, createdAt: -1 }),

      // Audit Log
      db.collection("audit_log").createIndex({ ts: -1 }),
    ]);
  } catch (err) {
    console.warn("[MongoDB] Non-fatal index creation warning:", err);
  }
}

export async function getDb() {
  const client = await clientPromise;
  const dbName = process.env.DB_NAME || "halflife";
  const db = client.db(dbName);
  ensureIndexes(db).catch(() => {});
  return db;
}
