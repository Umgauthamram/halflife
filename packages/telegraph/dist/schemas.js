import { z } from "zod";
export const FxNowParamsSchema = z.object({
    pair: z.string().regex(/^[A-Z]{3}\/[A-Z]{3}$/),
});
export const FxNowAnswerSchema = z.object({
    pair: z.string(),
    rate: z.number().positive(),
    timestamp: z.number().int().positive(),
});
export const WeatherForecastParamsSchema = z.object({
    location: z.string().min(1).max(100),
});
export const WeatherForecastAnswerSchema = z.object({
    location: z.string(),
    temperatureC: z.number(),
    condition: z.string(),
    forecastTimestamp: z.number().int().positive(),
});
export const SanctionsScreeningParamsSchema = z.object({
    entity: z.string().min(1).max(120),
});
export const SanctionsScreeningAnswerSchema = z.object({
    entity: z.string(),
    matched: z.boolean(),
    matchScore: z.number().min(0).max(1),
    listName: z.string().optional(),
});
export const WebSearchParamsSchema = z.object({
    query: z.string().min(1),
});
export const WebSearchAnswerSchema = z.object({
    query: z.string(),
    snippets: z.array(z.string()),
    sources: z.array(z.string()).optional(),
});
export const QuestionAnsweringParamsSchema = z.object({
    query: z.string().min(1),
    context: z.string().optional(),
});
export const QuestionAnsweringAnswerSchema = z.object({
    answer: z.string(),
    confidence: z.number().min(0).max(1).optional(),
    citations: z.array(z.string()).optional(),
});
export const WeatherCheckParamsSchema = z.object({
    location: z.string().min(1),
});
export const WeatherCheckAnswerSchema = z.object({
    location: z.string(),
    temperatureC: z.number(),
    condition: z.string(),
});
export const CryptoPriceParamsSchema = z.object({
    symbol: z.string().min(1),
});
export const CryptoPriceAnswerSchema = z.object({
    symbol: z.string(),
    priceUsd: z.number().positive(),
    timestamp: z.number().int().positive(),
});
export const TaskExecutionQualityParamsSchema = z.object({
    output: z.string(),
    rubric: z.string().optional(),
});
export const TaskExecutionQualityAnswerSchema = z.object({
    score: z.number().min(0).max(100),
    passed: z.boolean(),
    reasoning: z.string().optional(),
});
export const IntentSchemas = {
    FX_NOW: {
        params: FxNowParamsSchema,
        answer: FxNowAnswerSchema,
    },
    WEATHER_FORECAST_VERIFY: {
        params: WeatherForecastParamsSchema,
        answer: WeatherForecastAnswerSchema,
    },
    SANCTIONS_SCREENING_MATCH: {
        params: SanctionsScreeningParamsSchema,
        answer: SanctionsScreeningAnswerSchema,
    },
    WEB_SEARCH: {
        params: WebSearchParamsSchema,
        answer: WebSearchAnswerSchema,
    },
    QUESTION_ANSWERING: {
        params: QuestionAnsweringParamsSchema,
        answer: QuestionAnsweringAnswerSchema,
    },
    WEATHER_CHECK: {
        params: WeatherCheckParamsSchema,
        answer: WeatherCheckAnswerSchema,
    },
    CRYPTO_PRICE: {
        params: CryptoPriceParamsSchema,
        answer: CryptoPriceAnswerSchema,
    },
    TASK_EXECUTION_QUALITY: {
        params: TaskExecutionQualityParamsSchema,
        answer: TaskExecutionQualityAnswerSchema,
    },
};
export function validateAnswerForIntent(intent, answer) {
    const schema = IntentSchemas[intent];
    if (!schema) {
        return answer; // fallback for unconstrained intents
    }
    return schema.answer.parse(answer);
}
//# sourceMappingURL=schemas.js.map