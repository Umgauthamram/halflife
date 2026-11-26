import crypto from "node:crypto";

/**
 * Extracts a normalized numeric or string value from an intent's answer.
 * Returns null if the value is missing, invalid, or cannot be parsed.
 * Never returns 0 as a fallback default.
 */
export function normalizeAnswerValue(
  intent: string,
  answer: any
): { valueNorm: number | string | null; hash: string } {
  if (answer === null || answer === undefined) {
    return {
      valueNorm: null,
      hash: crypto.createHash("sha256").update("").digest("hex"),
    };
  }

  let val: number | string | null = null;

  if (intent.startsWith("FX_NOW")) {
    if (typeof answer.rate === "number" && !isNaN(answer.rate)) val = answer.rate;
    else if (typeof answer.rates?.USD === "number" && !isNaN(answer.rates.USD)) val = answer.rates.USD;
    else if (typeof answer.rates?.EUR === "number" && !isNaN(answer.rates.EUR)) val = answer.rates.EUR;
    else if (typeof answer.value === "number" && !isNaN(answer.value)) val = answer.value;
    else if (typeof answer === "number" && !isNaN(answer)) val = answer;
    else if (typeof answer === "string" && answer.trim()) val = answer.trim();
  } else if (intent.startsWith("WEATHER")) {
    if (typeof answer.temperatureC === "number" && !isNaN(answer.temperatureC)) val = answer.temperatureC;
    else if (typeof answer.temperature === "number" && !isNaN(answer.temperature)) val = answer.temperature;
    else if (typeof answer.temp === "number" && !isNaN(answer.temp)) val = answer.temp;
    else if (typeof answer.value === "number" && !isNaN(answer.value)) val = answer.value;
    else if (typeof answer === "string" && answer.trim()) val = answer.trim();
  } else if (intent.startsWith("SANCTIONS")) {
    if (typeof answer.matchScore === "number" && !isNaN(answer.matchScore)) val = answer.matchScore;
    else if (typeof answer.score === "number" && !isNaN(answer.score)) val = answer.score;
    else if (typeof answer.match === "boolean") val = answer.match ? 1 : 0;
    else if (typeof answer.value === "number" && !isNaN(answer.value)) val = answer.value;
    else if (typeof answer === "string" && answer.trim()) val = answer.trim();
  } else {
    if (typeof answer.value === "number" && !isNaN(answer.value)) val = answer.value;
    else if (typeof answer.value === "string" && answer.trim()) val = answer.value.trim();
    else if (typeof answer === "number" && !isNaN(answer)) val = answer;
    else if (typeof answer === "string" && answer.trim()) val = answer.trim();
    else if (typeof answer === "object" && answer !== null && Object.keys(answer).length > 0) {
      val = JSON.stringify(answer);
    }
  }

  const hash = crypto.createHash("sha256").update(JSON.stringify(answer ?? "")).digest("hex");
  return { valueNorm: val, hash };
}
