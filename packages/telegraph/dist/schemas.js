import { z } from "zod";
export const FxNowParamsSchema = z.object({
    pair: z.string().optional(),
    currency: z.string().optional(),
}).refine((data) => data.pair || data.currency, {
    message: "Either pair or currency must be provided",
});
export const FxNowAnswerSchema = z.object({
    rate: z.number().positive(),
    pair: z.string().optional(),
    timestamp: z.union([z.number(), z.string()]).optional(),
});
export const WeatherForecastParamsSchema = z.object({
    location: z.string().min(1).max(100).optional(),
    city: z.string().optional(),
});
export const WeatherForecastAnswerSchema = z.object({
    location: z.string().optional(),
    temperatureC: z.number().optional(),
    temperature: z.number().optional(),
    condition: z.string().optional(),
    forecastTimestamp: z.union([z.number(), z.string()]).optional(),
}).refine((data) => data.temperatureC !== undefined || data.temperature !== undefined, {
    message: "Weather answer must contain temperature",
});
export const SanctionsScreeningParamsSchema = z.object({
    entity: z.string().min(1).max(120),
});
export const SanctionsScreeningAnswerSchema = z.object({
    entity: z.string().optional(),
    matched: z.boolean(),
    matchScore: z.number().min(0).max(1).optional(),
    listName: z.string().optional(),
});
export const CryptoPriceParamsSchema = z.object({
    symbol: z.string().min(1).optional(),
    currency: z.string().optional(),
});
export const CryptoPriceAnswerSchema = z.object({
    symbol: z.string().optional(),
    priceUsd: z.number().positive().optional(),
    price: z.number().positive().optional(),
    timestamp: z.union([z.number(), z.string()]).optional(),
}).refine((data) => data.priceUsd !== undefined || data.price !== undefined, {
    message: "Crypto answer must contain price",
});
export const WebSearchParamsSchema = z.object({
    query: z.string().min(1),
});
export const WebSearchAnswerSchema = z.object({
    query: z.string().optional(),
    snippets: z.array(z.string()).optional(),
    sources: z.array(z.string()).optional(),
    result: z.unknown().optional(),
});
export const IntentSchemas = {
    FX_NOW: { params: FxNowParamsSchema, answer: FxNowAnswerSchema },
    FX_NOW_EUR: { params: FxNowParamsSchema, answer: FxNowAnswerSchema },
    FX_NOW_CAD: { params: FxNowParamsSchema, answer: FxNowAnswerSchema },
    FX_NOW_SEK: { params: FxNowParamsSchema, answer: FxNowAnswerSchema },
    WEATHER_FORECAST_VERIFY: { params: WeatherForecastParamsSchema, answer: WeatherForecastAnswerSchema },
    WEATHER_FORECAST_VERIFY_GENERAL: { params: WeatherForecastParamsSchema, answer: WeatherForecastAnswerSchema },
    WEATHER_CHECK: { params: WeatherForecastParamsSchema, answer: WeatherForecastAnswerSchema },
    WEATHER_CHECK_TEMPERATURE: { params: WeatherForecastParamsSchema, answer: WeatherForecastAnswerSchema },
    SANCTIONS_SCREENING_MATCH: { params: SanctionsScreeningParamsSchema, answer: SanctionsScreeningAnswerSchema },
    SANCTIONS_SCREENING_MATCH_GENERAL: { params: SanctionsScreeningParamsSchema, answer: SanctionsScreeningAnswerSchema },
    CRYPTO_PRICE: { params: CryptoPriceParamsSchema, answer: CryptoPriceAnswerSchema },
    CRYPTO_PRICE_USD: { params: CryptoPriceParamsSchema, answer: CryptoPriceAnswerSchema },
    WEB_SEARCH: { params: WebSearchParamsSchema, answer: WebSearchAnswerSchema },
    WEB_SEARCH_GENERAL: { params: WebSearchParamsSchema, answer: WebSearchAnswerSchema },
};
export function validateAnswerForIntent(intent, answer) {
    if (answer === null || answer === undefined) {
        throw new Error(`Intent ${intent} returned null or undefined answer`);
    }
    // If answer is wrapped in { result: ... }, unwrap or normalize
    let target = answer;
    if (typeof answer === "object" && answer !== null && "result" in answer) {
        const res = answer.result;
        if (typeof res === "object" && res !== null) {
            target = { ...res, ...answer };
        }
    }
    const schema = IntentSchemas[intent];
    if (!schema) {
        return target;
    }
    return schema.answer.parse(target);
}
//# sourceMappingURL=schemas.js.map