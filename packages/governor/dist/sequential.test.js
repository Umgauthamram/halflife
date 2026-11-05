import { describe, expect, it } from "vitest";
import { evaluateSequentialErrand } from "./sequential.js";
describe("Sequential Checks with Early Stopping", () => {
    const steps = [
        {
            name: "Sanctions Check",
            intent: "SANCTIONS_SCREENING_MATCH",
            params: { entity: "Suspicious Payee Ltd" },
            stake: 1000,
            priceUsdc: 0.05,
            shouldHaltPipeline: (answer) => {
                if (answer.matched) {
                    return { halt: true, reason: "Payee matched designated sanctions list" };
                }
                return { halt: false, reason: "" };
            },
        },
        {
            name: "FX Rate Check",
            intent: "FX_NOW",
            params: { pair: "EUR/USD" },
            stake: 1000,
            priceUsdc: 0.01,
        },
        {
            name: "Destination Weather Check",
            intent: "WEATHER_FORECAST_VERIFY",
            params: { location: "London" },
            stake: 50,
            priceUsdc: 0.01,
        },
    ];
    it("halts early when sanctions screening fails, saving remaining query budget", () => {
        const result = evaluateSequentialErrand(steps, 1000000, () => null, // No cache
        () => null, // No stats
        (intent) => {
            if (intent === "SANCTIONS_SCREENING_MATCH") {
                return { matched: true, matchScore: 0.98 }; // Positive sanctions hit
            }
            return { rate: 1.085 };
        });
        expect(result.haltedEarly).toBe(true);
        expect(result.completedStepsCount).toBe(1);
        expect(result.totalStepsCount).toBe(3);
        expect(result.haltReason).toContain("Payee matched designated sanctions list");
        // Remaining steps: FX ($0.01) + Weather ($0.01) = $0.02 saved
        expect(result.budgetSavedUsdc).toBe(0.02);
        expect(result.stepResults[1].skipped).toBe(true);
        expect(result.stepResults[2].skipped).toBe(true);
    });
    it("executes all steps when no early halt condition is met", () => {
        const result = evaluateSequentialErrand(steps, 1000000, () => null, () => null, (intent) => {
            if (intent === "SANCTIONS_SCREENING_MATCH") {
                return { matched: false, matchScore: 0.0 }; // Clean sanctions check
            }
            return { rate: 1.085 };
        });
        expect(result.haltedEarly).toBe(false);
        expect(result.completedStepsCount).toBe(3);
        expect(result.budgetSavedUsdc).toBe(0);
        expect(result.stepResults.every((s) => !s.skipped)).toBe(true);
    });
});
//# sourceMappingURL=sequential.test.js.map