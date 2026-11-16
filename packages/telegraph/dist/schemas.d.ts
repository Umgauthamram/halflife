import { z } from "zod";
export declare const FxNowParamsSchema: z.ZodEffects<z.ZodObject<{
    pair: z.ZodOptional<z.ZodString>;
    currency: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    pair?: string | undefined;
    currency?: string | undefined;
}, {
    pair?: string | undefined;
    currency?: string | undefined;
}>, {
    pair?: string | undefined;
    currency?: string | undefined;
}, {
    pair?: string | undefined;
    currency?: string | undefined;
}>;
export declare const FxNowAnswerSchema: z.ZodObject<{
    rate: z.ZodNumber;
    pair: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
}, "strip", z.ZodTypeAny, {
    rate: number;
    pair?: string | undefined;
    timestamp?: string | number | undefined;
}, {
    rate: number;
    pair?: string | undefined;
    timestamp?: string | number | undefined;
}>;
export declare const WeatherForecastParamsSchema: z.ZodObject<{
    location: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    location?: string | undefined;
    city?: string | undefined;
}, {
    location?: string | undefined;
    city?: string | undefined;
}>;
export declare const WeatherForecastAnswerSchema: z.ZodEffects<z.ZodObject<{
    location: z.ZodOptional<z.ZodString>;
    temperatureC: z.ZodOptional<z.ZodNumber>;
    temperature: z.ZodOptional<z.ZodNumber>;
    condition: z.ZodOptional<z.ZodString>;
    forecastTimestamp: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
}, "strip", z.ZodTypeAny, {
    location?: string | undefined;
    temperatureC?: number | undefined;
    temperature?: number | undefined;
    condition?: string | undefined;
    forecastTimestamp?: string | number | undefined;
}, {
    location?: string | undefined;
    temperatureC?: number | undefined;
    temperature?: number | undefined;
    condition?: string | undefined;
    forecastTimestamp?: string | number | undefined;
}>, {
    location?: string | undefined;
    temperatureC?: number | undefined;
    temperature?: number | undefined;
    condition?: string | undefined;
    forecastTimestamp?: string | number | undefined;
}, {
    location?: string | undefined;
    temperatureC?: number | undefined;
    temperature?: number | undefined;
    condition?: string | undefined;
    forecastTimestamp?: string | number | undefined;
}>;
export declare const SanctionsScreeningParamsSchema: z.ZodObject<{
    entity: z.ZodString;
}, "strip", z.ZodTypeAny, {
    entity: string;
}, {
    entity: string;
}>;
export declare const SanctionsScreeningAnswerSchema: z.ZodObject<{
    entity: z.ZodOptional<z.ZodString>;
    matched: z.ZodBoolean;
    matchScore: z.ZodOptional<z.ZodNumber>;
    listName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    matched: boolean;
    entity?: string | undefined;
    matchScore?: number | undefined;
    listName?: string | undefined;
}, {
    matched: boolean;
    entity?: string | undefined;
    matchScore?: number | undefined;
    listName?: string | undefined;
}>;
export declare const CryptoPriceParamsSchema: z.ZodObject<{
    symbol: z.ZodOptional<z.ZodString>;
    currency: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    symbol?: string | undefined;
    currency?: string | undefined;
}, {
    symbol?: string | undefined;
    currency?: string | undefined;
}>;
export declare const CryptoPriceAnswerSchema: z.ZodEffects<z.ZodObject<{
    symbol: z.ZodOptional<z.ZodString>;
    priceUsd: z.ZodOptional<z.ZodNumber>;
    price: z.ZodOptional<z.ZodNumber>;
    timestamp: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
}, "strip", z.ZodTypeAny, {
    symbol?: string | undefined;
    timestamp?: string | number | undefined;
    priceUsd?: number | undefined;
    price?: number | undefined;
}, {
    symbol?: string | undefined;
    timestamp?: string | number | undefined;
    priceUsd?: number | undefined;
    price?: number | undefined;
}>, {
    symbol?: string | undefined;
    timestamp?: string | number | undefined;
    priceUsd?: number | undefined;
    price?: number | undefined;
}, {
    symbol?: string | undefined;
    timestamp?: string | number | undefined;
    priceUsd?: number | undefined;
    price?: number | undefined;
}>;
export declare const WebSearchParamsSchema: z.ZodObject<{
    query: z.ZodString;
}, "strip", z.ZodTypeAny, {
    query: string;
}, {
    query: string;
}>;
export declare const WebSearchAnswerSchema: z.ZodObject<{
    query: z.ZodOptional<z.ZodString>;
    snippets: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    sources: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    result: z.ZodOptional<z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    query?: string | undefined;
    snippets?: string[] | undefined;
    sources?: string[] | undefined;
    result?: unknown;
}, {
    query?: string | undefined;
    snippets?: string[] | undefined;
    sources?: string[] | undefined;
    result?: unknown;
}>;
export declare const IntentSchemas: Record<string, {
    params: z.ZodTypeAny;
    answer: z.ZodTypeAny;
}>;
export declare function validateAnswerForIntent(intent: string, answer: unknown): unknown;
//# sourceMappingURL=schemas.d.ts.map