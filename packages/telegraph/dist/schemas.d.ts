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
export declare const WebSearchParamsSchema: z.ZodObject<{
    query: z.ZodString;
}, "strip", z.ZodTypeAny, {
    query: string;
}, {
    query: string;
}>;
export declare const WebSearchAnswerSchema: z.ZodObject<{
    query: z.ZodString;
    snippets: z.ZodArray<z.ZodString, "many">;
    sources: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    query: string;
    snippets: string[];
    sources?: string[] | undefined;
}, {
    query: string;
    snippets: string[];
    sources?: string[] | undefined;
}>;
export declare const QuestionAnsweringParamsSchema: z.ZodObject<{
    query: z.ZodString;
    context: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    query: string;
    context?: string | undefined;
}, {
    query: string;
    context?: string | undefined;
}>;
export declare const QuestionAnsweringAnswerSchema: z.ZodObject<{
    answer: z.ZodString;
    confidence: z.ZodOptional<z.ZodNumber>;
    citations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    answer: string;
    confidence?: number | undefined;
    citations?: string[] | undefined;
}, {
    answer: string;
    confidence?: number | undefined;
    citations?: string[] | undefined;
}>;
export declare const WeatherCheckParamsSchema: z.ZodObject<{
    location: z.ZodString;
}, "strip", z.ZodTypeAny, {
    location: string;
}, {
    location: string;
}>;
export declare const WeatherCheckAnswerSchema: z.ZodObject<{
    location: z.ZodString;
    temperatureC: z.ZodNumber;
    condition: z.ZodString;
}, "strip", z.ZodTypeAny, {
    location: string;
    temperatureC: number;
    condition: string;
}, {
    location: string;
    temperatureC: number;
    condition: string;
}>;
export declare const CryptoPriceParamsSchema: z.ZodObject<{
    symbol: z.ZodString;
}, "strip", z.ZodTypeAny, {
    symbol: string;
}, {
    symbol: string;
}>;
export declare const CryptoPriceAnswerSchema: z.ZodObject<{
    symbol: z.ZodString;
    priceUsd: z.ZodNumber;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    timestamp: number;
    priceUsd: number;
}, {
    symbol: string;
    timestamp: number;
    priceUsd: number;
}>;
export declare const TaskExecutionQualityParamsSchema: z.ZodObject<{
    output: z.ZodString;
    rubric: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    output: string;
    rubric?: string | undefined;
}, {
    output: string;
    rubric?: string | undefined;
}>;
export declare const TaskExecutionQualityAnswerSchema: z.ZodObject<{
    score: z.ZodNumber;
    passed: z.ZodBoolean;
    reasoning: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    score: number;
    passed: boolean;
    reasoning?: string | undefined;
}, {
    score: number;
    passed: boolean;
    reasoning?: string | undefined;
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
    readonly WEB_SEARCH: {
        readonly params: z.ZodObject<{
            query: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            query: string;
        }, {
            query: string;
        }>;
        readonly answer: z.ZodObject<{
            query: z.ZodString;
            snippets: z.ZodArray<z.ZodString, "many">;
            sources: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            query: string;
            snippets: string[];
            sources?: string[] | undefined;
        }, {
            query: string;
            snippets: string[];
            sources?: string[] | undefined;
        }>;
    };
    readonly QUESTION_ANSWERING: {
        readonly params: z.ZodObject<{
            query: z.ZodString;
            context: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            query: string;
            context?: string | undefined;
        }, {
            query: string;
            context?: string | undefined;
        }>;
        readonly answer: z.ZodObject<{
            answer: z.ZodString;
            confidence: z.ZodOptional<z.ZodNumber>;
            citations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            answer: string;
            confidence?: number | undefined;
            citations?: string[] | undefined;
        }, {
            answer: string;
            confidence?: number | undefined;
            citations?: string[] | undefined;
        }>;
    };
    readonly WEATHER_CHECK: {
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
        }, "strip", z.ZodTypeAny, {
            location: string;
            temperatureC: number;
            condition: string;
        }, {
            location: string;
            temperatureC: number;
            condition: string;
        }>;
    };
    readonly CRYPTO_PRICE: {
        readonly params: z.ZodObject<{
            symbol: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            symbol: string;
        }, {
            symbol: string;
        }>;
        readonly answer: z.ZodObject<{
            symbol: z.ZodString;
            priceUsd: z.ZodNumber;
            timestamp: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            symbol: string;
            timestamp: number;
            priceUsd: number;
        }, {
            symbol: string;
            timestamp: number;
            priceUsd: number;
        }>;
    };
    readonly TASK_EXECUTION_QUALITY: {
        readonly params: z.ZodObject<{
            output: z.ZodString;
            rubric: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            output: string;
            rubric?: string | undefined;
        }, {
            output: string;
            rubric?: string | undefined;
        }>;
        readonly answer: z.ZodObject<{
            score: z.ZodNumber;
            passed: z.ZodBoolean;
            reasoning: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            score: number;
            passed: boolean;
            reasoning?: string | undefined;
        }, {
            score: number;
            passed: boolean;
            reasoning?: string | undefined;
        }>;
    };
};
export declare function validateAnswerForIntent(intent: string, answer: unknown): unknown;
//# sourceMappingURL=schemas.d.ts.map