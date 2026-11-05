import { describe, expect, it } from "vitest";
import { normalizeAnswerValue } from "./sampler.js";
describe("Atlas Sampler Normalization & Disagreement", () => {
    it("normalizes numeric rate for FX_NOW and generates hash", () => {
        const rawAnswer = { pair: "EUR/USD", rate: 1.0850, timestamp: 1730700000 };
        const { valueNorm, hash } = normalizeAnswerValue("FX_NOW", rawAnswer);
        expect(valueNorm).toBe(1.0850);
        expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });
    it("normalizes temperature for WEATHER_FORECAST_VERIFY", () => {
        const rawAnswer = { location: "London", temperatureC: 15.2, condition: "Sunny", forecastTimestamp: 1730700000 };
        const { valueNorm } = normalizeAnswerValue("WEATHER_FORECAST_VERIFY", rawAnswer);
        expect(valueNorm).toBe(15.2);
    });
    it("normalizes matchScore for SANCTIONS_SCREENING_MATCH", () => {
        const rawAnswer = { entity: "Test Corp", matched: false, matchScore: 0.15 };
        const { valueNorm } = normalizeAnswerValue("SANCTIONS_SCREENING_MATCH", rawAnswer);
        expect(valueNorm).toBe(0.15);
    });
});
//# sourceMappingURL=sampler.test.js.map