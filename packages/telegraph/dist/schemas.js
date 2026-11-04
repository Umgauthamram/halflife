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
};
export function validateAnswerForIntent(intent, answer) {
    const schema = IntentSchemas[intent];
    if (!schema) {
        return answer; // fallback for unconstrained intents
    }
    return schema.answer.parse(answer);
}
//# sourceMappingURL=schemas.js.map