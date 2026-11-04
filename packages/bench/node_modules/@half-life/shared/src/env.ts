import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  
  // Auth.js
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters long"),
  AUTH_URL: z.string().url("AUTH_URL must be a valid URL").default("http://localhost:3000"),
  AUTH_GOOGLE_ID: z.string().min(1, "AUTH_GOOGLE_ID is required"),
  AUTH_GOOGLE_SECRET: z.string().min(1, "AUTH_GOOGLE_SECRET is required"),
  ADMIN_EMAILS: z
    .string()
    .transform((val) =>
      val
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    )
    .default(""),

  // Database
  MONGODB_URI_WEB: z.string().startsWith("mongodb", "MONGODB_URI_WEB must be a valid MongoDB connection string"),
  MONGODB_URI_WORKER: z.string().startsWith("mongodb", "MONGODB_URI_WORKER must be a valid MongoDB connection string"),
  DB_NAME: z.string().min(1).default("halflife"),

  // Cryptography (Worker envelope encryption)
  KEY_ENCRYPTION_KEY: z.string().min(32, "KEY_ENCRYPTION_KEY must be at least 32 characters"),

  // Network & Chain (Ethereum Sepolia = 11155111)
  CHAIN_ID: z.string().default("11155111"),
  SEPOLIA_RPC_URL: z.string().url("SEPOLIA_RPC_URL must be a valid RPC URL").default("https://rpc.sepolia.org"),
  TELEGRAPH_CONTRACT: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "TELEGRAPH_CONTRACT must be a valid Ethereum address")
    .default("0x3624EB012B5E998BB57B6bE6C9Cfc9c4bc5eb99b"),
  TELEGRAPH_NODE_URL: z.string().url("TELEGRAPH_NODE_URL must be a valid URL").default("http://127.0.0.1:8000"),
  USDC_ADDRESS: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "USDC_ADDRESS must be a valid Ethereum address")
    .default("0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"),

  // Sampler
  SAMPLER_DAILY_CAP_USDC: z
    .string()
    .transform((v) => parseFloat(v))
    .refine((n) => !isNaN(n) && n > 0, "SAMPLER_DAILY_CAP_USDC must be a positive number")
    .default("10.0"),

  ERROR_TRACKING_DSN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables.
 * In production, refuses to boot if required secrets are missing or invalid.
 */
export function validateEnv(rawEnv: Record<string, string | undefined> = process.env): Env {
  const result = envSchema.safeParse(rawEnv);
  if (!result.success) {
    const errorDetails = result.error.errors
      .map((err) => `  - ${err.path.join(".")}: ${err.message}`)
      .join("\n");
    const message = `[FATAL] Invalid environment configuration:\n${errorDetails}`;
    
    // In production or when strictly validating, throw an error to prevent boot
    if (rawEnv.NODE_ENV === "production") {
      throw new Error(message);
    }
    console.warn(`[WARN] Development environment validation warnings:\n${errorDetails}`);
    // In development, return partial or fallback for non-sensitive local bootstrapping if permissible
    return result.data ?? (rawEnv as unknown as Env);
  }
  return result.data;
}

