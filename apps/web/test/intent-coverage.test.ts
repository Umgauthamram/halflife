import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_SAMPLER_INTENTS, parseSamplerIntents } from "@half-life/shared";
import { IntentSchemas } from "@half-life/telegraph";
import { conservativeWindowSeconds } from "@half-life/governor";
import { getActiveAtlasIntents } from "../lib/intents";

describe("Cross-package intent coverage for DEFAULT_SAMPLER_INTENTS", () => {
  const formPath = path.resolve(process.cwd(), "app/app/agents/new/page.tsx");
  const formSource = fs.readFileSync(formPath, "utf-8");

  const emptyDb: any = {
    collection: () => ({
      distinct: async () => [],
    }),
  };

  it("every DEFAULT_SAMPLER_INTENTS entry has schema, non-600 governor window, helper coverage, and agent form checkbox", async () => {
    const helperDefaults = parseSamplerIntents(undefined);
    const activeIntents = await getActiveAtlasIntents(emptyDb, undefined);

    expect(DEFAULT_SAMPLER_INTENTS.length).toBeGreaterThan(0);

    for (const intent of DEFAULT_SAMPLER_INTENTS) {
      // (a) Schema entry exists in @half-life/telegraph schemas
      expect(IntentSchemas[intent], `Missing IntentSchemas entry for ${intent}`).toBeDefined();

      // (b) conservativeWindowSeconds(intent) is NOT the generic 600 default
      expect(
        conservativeWindowSeconds(intent),
        `conservativeWindowSeconds(${intent}) fell back to generic 600s default`
      ).not.toBe(600);

      // (c) Shared helpers list it
      expect(helperDefaults, `parseSamplerIntents() missing ${intent}`).toContain(intent);
      expect(activeIntents, `getActiveAtlasIntents() missing ${intent}`).toContain(intent);

      // (d) Agent-creation form checkbox values include it
      expect(
        formSource,
        `Agent creation form missing checkbox value="${intent}"`
      ).toContain(`value="${intent}"`);
    }
  });
});
