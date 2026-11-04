import { describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Security Gate: Absence of Demo, Guest, or Credentials Routes", () => {
  const authConfigPath = path.resolve(__dirname, "../auth.ts");
  const apiDir = path.resolve(__dirname, "../app/api");

  it("ensures auth.ts only imports and uses Google provider", () => {
    const authCode = fs.readFileSync(authConfigPath, "utf-8");
    expect(authCode).toContain('next-auth/providers/google');
    expect(authCode).not.toContain('next-auth/providers/credentials');
    expect(authCode).not.toContain('next-auth/providers/email');
    expect(authCode).not.toContain('next-auth/providers/github');
    expect(authCode).not.toContain('allowDangerousEmailAccountLinking: true');
  });

  it("ensures no dev-login, guest-login, or backdoor routes exist", () => {
    if (!fs.existsSync(apiDir)) return;

    const findRoutes = (dir: string): string[] => {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      for (const file of list) {
        const fullPath = path.resolve(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          results = results.concat(findRoutes(fullPath));
        } else {
          results.push(fullPath);
        }
      }
      return results;
    };

    const routes = findRoutes(apiDir);
    for (const route of routes) {
      const lower = route.toLowerCase();
      expect(lower).not.toContain("dev-login");
      expect(lower).not.toContain("demo-login");
      expect(lower).not.toContain("guest-login");
      expect(lower).not.toContain("bypass");
    }
  });
});

