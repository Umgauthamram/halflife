import type { Miner } from "@half-life/shared";
import type { AskRequest, TelegraphClient, TelegraphReceipt } from "./client.js";
export declare class MockTelegraphClient implements TelegraphClient {
    private mockMiners;
    private requests;
    constructor(mockMiners?: Record<string, Miner[]>);
    listIntents(): Promise<string[]>;
    listMiners(intent: string): Promise<Miner[]>;
    ask(request: AskRequest): Promise<TelegraphReceipt>;
}
//# sourceMappingURL=mock.d.ts.map