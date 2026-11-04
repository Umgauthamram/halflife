import { z } from "zod";
export declare const FxNowParamsSchema: z.ZodObject<{
    pair: z.ZodString;
}, "strip", z.ZodTypeAny, {
    pair: string;
}, {
    pair: string;
}>;
export declare const FxNowAnswerSchema: z.ZodObject<{
    pair: z.ZodString;
    rate: z.ZodNumber;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    pair: string;
    rate: number;
    timestamp: number;
}, {
    pair: string;
    rate: number;
    timestamp: number;
}>;
export declare const WeatherForecastParamsSchema: z.ZodObject<{
    location: z.ZodString;
}, "strip", z.ZodTypeAny, {
    location: string;
}, {
    location: string;
}>;
export declare const WeatherForecastAnswerSchema: z.ZodObject<{
    location: z.ZodString;
    temperatureC: z.ZodNumber;
    condition: z.ZodString;
    forecastTimestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    location: string;
    temperatureC: number;
    condition: string;
    forecastTimestamp: number;
}, {
    location: string;
    temperatureC: number;
    condition: string;
    forecastTimestamp: number;
}>;
export declare const SanctionsScreeningParamsSchema: z.ZodObject<{
    entity: z.ZodString;
}, "strip", z.ZodTypeAny, {
    entity: string;
}, {
    entity: string;
}>;
export declare const SanctionsScreeningAnswerSchema: z.ZodObject<{
    entity: z.ZodString;
    matched: z.ZodBoolean;
    matchScore: z.ZodNumber;
    listName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    entity: string;
    matched: boolean;
    matchScore: number;
    listName?: string | undefined;
}, {
    entity: string;
    matched: boolean;
    matchScore: number;
    listName?: string | undefined;
}>;
export declare const IntentSchemas: {
    readonly FX_NOW: {
        readonly params: z.ZodObject<{
            pair: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            pair: string;
        }, {
            pair: string;
        }>;
        readonly answer: z.ZodObject<{
            pair: z.ZodString;
            rate: z.ZodNumber;
            timestamp: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            pair: string;
            rate: number;
            timestamp: number;
        }, {
            pair: string;
            rate: number;
            timestamp: number;
        }>;
    };
    readonly WEATHER_FORECAST_VERIFY: {
        readonly params: z.ZodObject<{
            location: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            location: string;
        }, {
            location: string;
        }>;
        readonly answer: z.ZodObject<{
            location: z.ZodString;
            temperatureC: z.ZodNumber;
            condition: z.ZodString;
            forecastTimestamp: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            location: string;
            temperatureC: number;
            condition: string;
            forecastTimestamp: number;
        }, {
            location: string;
            temperatureC: number;
            condition: string;
            forecastTimestamp: number;
        }>;
    };
    readonly SANCTIONS_SCREENING_MATCH: {
        readonly params: z.ZodObject<{
            entity: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            entity: string;
        }, {
            entity: string;
        }>;
        readonly answer: z.ZodObject<{
            entity: z.ZodString;
            matched: z.ZodBoolean;
            matchScore: z.ZodNumber;
            listName: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            entity: string;
            matched: boolean;
            matchScore: number;
            listName?: string | undefined;
        }, {
            entity: string;
            matched: boolean;
            matchScore: number;
            listName?: string | undefined;
        }>;
    };
};
export declare function validateAnswerForIntent(intent: string, answer: unknown): unknown;
//# sourceMappingURL=schemas.d.ts.map