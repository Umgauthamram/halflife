import { z } from "zod";
declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "test", "production"]>>;
    AUTH_SECRET: z.ZodString;
    AUTH_URL: z.ZodDefault<z.ZodString>;
    AUTH_GOOGLE_ID: z.ZodString;
    AUTH_GOOGLE_SECRET: z.ZodString;
    ADMIN_EMAILS: z.ZodDefault<z.ZodEffects<z.ZodString, string[], string>>;
    MONGODB_URI_WEB: z.ZodString;
    MONGODB_URI_WORKER: z.ZodString;
    DB_NAME: z.ZodDefault<z.ZodString>;
    KEY_ENCRYPTION_KEY: z.ZodString;
    CHAIN_ID: z.ZodDefault<z.ZodString>;
    SEPOLIA_RPC_URL: z.ZodDefault<z.ZodString>;
    TELEGRAPH_CONTRACT: z.ZodDefault<z.ZodString>;
    TELEGRAPH_NODE_URL: z.ZodDefault<z.ZodString>;
    USDC_ADDRESS: z.ZodDefault<z.ZodString>;
    SAMPLER_DAILY_CAP_USDC: z.ZodDefault<z.ZodEffects<z.ZodEffects<z.ZodString, number, string>, number, string>>;
    ERROR_TRACKING_DSN: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    NODE_ENV: "development" | "test" | "production";
    AUTH_SECRET: string;
    AUTH_URL: string;
    AUTH_GOOGLE_ID: string;
    AUTH_GOOGLE_SECRET: string;
    ADMIN_EMAILS: string[];
    MONGODB_URI_WEB: string;
    MONGODB_URI_WORKER: string;
    DB_NAME: string;
    KEY_ENCRYPTION_KEY: string;
    CHAIN_ID: string;
    SEPOLIA_RPC_URL: string;
    TELEGRAPH_CONTRACT: string;
    TELEGRAPH_NODE_URL: string;
    USDC_ADDRESS: string;
    SAMPLER_DAILY_CAP_USDC: number;
    ERROR_TRACKING_DSN?: string | undefined;
}, {
    AUTH_SECRET: string;
    AUTH_GOOGLE_ID: string;
    AUTH_GOOGLE_SECRET: string;
    MONGODB_URI_WEB: string;
    MONGODB_URI_WORKER: string;
    KEY_ENCRYPTION_KEY: string;
    NODE_ENV?: "development" | "test" | "production" | undefined;
    AUTH_URL?: string | undefined;
    ADMIN_EMAILS?: string | undefined;
    DB_NAME?: string | undefined;
    CHAIN_ID?: string | undefined;
    SEPOLIA_RPC_URL?: string | undefined;
    TELEGRAPH_CONTRACT?: string | undefined;
    TELEGRAPH_NODE_URL?: string | undefined;
    USDC_ADDRESS?: string | undefined;
    SAMPLER_DAILY_CAP_USDC?: string | undefined;
    ERROR_TRACKING_DSN?: string | undefined;
}>;
export type Env = z.infer<typeof envSchema>;
/**
 * Validates environment variables.
 * In production, refuses to boot if required secrets are missing or invalid.
 */
export declare function validateEnv(rawEnv?: Record<string, string | undefined>): Env;
export {};
//# sourceMappingURL=env.d.ts.map