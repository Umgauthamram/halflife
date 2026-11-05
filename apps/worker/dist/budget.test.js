import { describe, expect, it, vi } from "vitest";
import { getCurrentPeriodKey, reserveBudget, releaseBudget } from "./budget.js";
describe("Worker Atomic Budget & Cap Controls", () => {
    const policy = {
        perAskCapUsdc: 0.10,
        dailyCapUsdc: 1.00,
        stakeDefault: 50,
    };
    it("formats current period key as YYYYMMDD", () => {
        const fixedDate = new Date("2026-11-04T12:00:00Z");
        expect(getCurrentPeriodKey(fixedDate)).toBe("20261104");
    });
    it("rejects reservation when amount exceeds per-ask cap", async () => {
        const mockDb = {
            collection: vi.fn().mockReturnValue({
                findOne: vi.fn().mockResolvedValue({ id: "agent_1", status: "active" }),
            }),
        };
        await expect(reserveBudget(mockDb, "agent_1", 0.15, policy)).rejects.toThrowError(/PER_ASK_CAP_EXCEEDED/);
    });
    it("rejects reservation when agent is paused (kill switch)", async () => {
        const mockDb = {
            collection: vi.fn().mockReturnValue({
                findOne: vi.fn().mockResolvedValue({ id: "agent_1", status: "paused" }),
            }),
        };
        await expect(reserveBudget(mockDb, "agent_1", 0.05, policy)).rejects.toThrowError(/AGENT_PAUSED/);
    });
    it("successfully reserves budget atomically", async () => {
        const mockDb = {
            collection: vi.fn().mockReturnValue({
                findOne: vi.fn().mockResolvedValue({ id: "agent_1", status: "active" }),
                updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1, upsertedCount: 0 }),
            }),
        };
        const res = await reserveBudget(mockDb, "agent_1", 0.05, policy);
        expect(res.reservedAmount).toBe(0.05);
        expect(res.period).toBe(getCurrentPeriodKey());
    });
    it("releases budget on failure", async () => {
        const updateOneMock = vi.fn().mockResolvedValue({ modifiedCount: 1 });
        const mockDb = {
            collection: vi.fn().mockReturnValue({
                updateOne: updateOneMock,
            }),
        };
        await releaseBudget(mockDb, "agent_1", "20261104", 0.05);
        expect(updateOneMock).toHaveBeenCalledWith({ agentId: "agent_1", period: "20261104" }, { $inc: { spentUsdc: -0.05 } });
    });
});
//# sourceMappingURL=budget.test.js.map