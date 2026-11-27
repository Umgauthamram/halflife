import { describe, expect, it } from "vitest";
import {
  checkMockClientImports,
  checkLegacyIntents,
  checkBannedUiStrings,
  checkHardcodedApiKeys,
  checkUsdcAddresses,
  checkTrackedEnvFiles,
  checkSkippedTests,
  checkHardcodedTxHashes,
} from "../../../scripts/verify-repo";

describe("verify-repo audit checks", () => {
  it("check 1: MockTelegraphClient", () => {
    expect(
      checkMockClientImports([
        { path: "packages/telegraph/src/factory.ts", content: "new MockTelegraphClient()" },
        { path: "packages/telegraph/src/live.test.ts", content: "MockTelegraphClient" },
      ])
    ).toEqual([]);

    expect(
      checkMockClientImports([
        { path: "apps/web/app/api/v1/ask/route.ts", content: "import { MockTelegraphClient } from '@half-life/telegraph';" },
      ])
    ).toHaveLength(1);
  });

  it("check 2: legacy intent names", () => {
    expect(
      checkLegacyIntents([
        { path: "packages/shared/src/intents.ts", content: 'FX_NOW: "FX_NOW_EUR"' },
        { path: "packages/bench/src/cli.ts", content: '// simulated-data\nconst i = "FX_NOW";' },
      ])
    ).toEqual([]);

    expect(
      checkLegacyIntents([
        { path: "apps/web/app/page.tsx", content: 'const intent = "FX_NOW";' },
      ])
    ).toHaveLength(1);
  });

  it("check 3: banned fallback strings", () => {
    expect(
      checkBannedUiStrings([
        { path: "apps/web/app/app/dashboard-client.tsx", content: '<span>no data yet</span>' },
      ])
    ).toEqual([]);

    expect(
      checkBannedUiStrings([
        { path: "apps/web/app/app/dashboard-client.tsx", content: '<span>{"<5ms"}</span>' },
      ])
    ).toHaveLength(1);
  });

  it("check 4: hardcoded hl_live_ API keys", () => {
    expect(
      checkHardcodedApiKeys([
        { path: "apps/web/lib/api-key.ts", content: 'const prefix = "hl_live_";' },
        { path: "apps/web/test/api-key.test.ts", content: 'const k = "hl_live_0123456789abcdef0123";' },
      ])
    ).toEqual([]);

    expect(
      checkHardcodedApiKeys([
        { path: "scripts/live-agent.ts", content: 'const k = "hl_live_5e24cb11155111evaluator";' },
      ])
    ).toHaveLength(1);
  });

  it("check 5: USDC address consistency", () => {
    expect(
      checkUsdcAddresses([
        { path: "docs/JUDGE.md", content: "USDC: `0xcc194e1a843B658526D0D5C431f670028582Ae17`" },
        { path: "packages/shared/src/env.test.ts", content: 'USDC_ADDRESS: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // fixture' },
      ])
    ).toEqual([]);

    expect(
      checkUsdcAddresses([
        { path: "docs/submission.md", content: "USDC: 0x1c7D" + "4B196Cb0C7B01d743Fbc6116a902379C7238" },
      ])
    ).toHaveLength(1);
  });

  it("check 6: tracked .env files", () => {
    expect(checkTrackedEnvFiles([".env.example", "README.md"])).toEqual([]);
    expect(checkTrackedEnvFiles([".env.example", "apps/web/.env.local"])).toHaveLength(1);
  });

  it("check 7: skipped or focused tests", () => {
    expect(
      checkSkippedTests([{ path: "apps/web/test/a.test.ts", content: 'it("works", () => {});' }])
    ).toEqual([]);

    expect(
      checkSkippedTests([{ path: "apps/web/test/a.test.ts", content: "it." + 'skip("broken", () => {});' }])
    ).toHaveLength(1);
  });

  it("check 8: hardcoded 0x+64 hex tx hashes", () => {
    expect(
      checkHardcodedTxHashes([
        {
          path: "scripts/generate-findings.ts",
          content: 'const tx = "0xbf283485aacb2e2964bf53fbd7eba05e080e710a77a756711a3f596a78989c1b";',
        },
      ])
    ).toEqual([]);

    expect(
      checkHardcodedTxHashes([
        {
          path: "apps/web/app/landing-client.tsx",
          content: 'const fake = "0x13522a15fd5bf7c67406bbd63e118b7aba4677d29229ca4a89f91f4552b976f0";',
        },
      ])
    ).toHaveLength(1);
  });
});
