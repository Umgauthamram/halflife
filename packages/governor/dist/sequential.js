import { decide } from "./governor.js";
/**
 * Executes a multi-step sequential intelligence check with early stopping.
 * Halts pipeline and saves budget if an early condition (e.g. sanctions match or adverse price) is met.
 */
export function evaluateSequentialErrand(steps, now, getCachedAnswer, getAtlasStats, executeBuyFallback) {
    const stepResults = [];
    let haltedEarly = false;
    let haltReason;
    let budgetSavedUsdc = 0;
    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        if (haltedEarly) {
            // Step skipped due to prior early stop
            budgetSavedUsdc += step.priceUsdc;
            stepResults.push({
                stepName: step.name,
                intent: step.intent,
                decision: {
                    action: "refuse",
                    reason: `Skipped: Pipeline halted early (${haltReason})`,
                    inputs: { ageSeconds: 0, drift: 0, noiseFloor: 0, price: step.priceUsdc, calibrated: false },
                },
                answerUsed: null,
                skipped: true,
            });
            continue;
        }
        const cached = getCachedAnswer(step.intent);
        const stats = getAtlasStats(step.intent);
        const decision = decide({ intent: step.intent, now, stake: step.stake }, cached, stats, step.priceUsdc);
        let answer;
        if (decision.action === "buy" || !cached) {
            answer = executeBuyFallback(step.intent, step.params);
        }
        else {
            answer = cached.answer;
        }
        let haltTrigger;
        if (step.shouldHaltPipeline) {
            const check = step.shouldHaltPipeline(answer);
            if (check.halt) {
                haltedEarly = true;
                haltReason = check.reason;
                haltTrigger = { reason: check.reason };
            }
        }
        stepResults.push({
            stepName: step.name,
            intent: step.intent,
            decision,
            answerUsed: answer,
            haltTriggered: haltTrigger,
            skipped: false,
        });
    }
    return {
        completedStepsCount: stepResults.filter((s) => !s.skipped).length,
        totalStepsCount: steps.length,
        haltedEarly,
        haltReason,
        budgetSavedUsdc: Number(budgetSavedUsdc.toFixed(4)),
        stepResults,
    };
}
//# sourceMappingURL=sequential.js.map