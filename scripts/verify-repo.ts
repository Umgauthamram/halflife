import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export interface Violation {
  check: string;
  file: string;
  line: number;
  detail: string;
}

export interface FileEntry {
  path: string;
  content: string;
}

const CANONICAL_USDC = "0xcc194e1a843b658526d0d5c431f670028582ae17";
const TELEGRAPH_CONTRACT = "0x3624eb012b5e998bb57b6be6c9cfc9c4bc5eb99b";
const ALLOWED_REAL_TX = "0xbf283485aacb2e2964bf53fbd7eba05e080e710a77a756711a3f596a78989c1b";

function isTestFile(filePath: string): boolean {
  return /\.test\.(ts|tsx|js|jsx)$/.test(filePath) || /\.spec\.(ts|tsx|js|jsx)$/.test(filePath);
}

function isSelfVerifyFile(filePath: string): boolean {
  return filePath === "scripts/verify-repo.ts" || filePath.endsWith("/verify-repo.ts");
}

// Check 1: MockTelegraphClient referenced outside mock.ts, factory.ts, *.test.ts, scripts/test-*.ts
export function checkMockClientImports(files: FileEntry[]): Violation[] {
  const violations: Violation[] = [];
  const allowedPaths = new Set([
    "packages/telegraph/src/mock.ts",
    "packages/telegraph/src/factory.ts",
  ]);
  for (const f of files) {
    if (isSelfVerifyFile(f.path)) continue;
    if (allowedPaths.has(f.path) || isTestFile(f.path) || /^scripts\/test-.*\.ts$/.test(f.path)) {
      continue;
    }
    const lines = f.content.split(/\r?\n/);
    lines.forEach((line, idx) => {
      if (line.includes("MockTelegraphClient")) {
        violations.push({
          check: "1_no_mock_in_prod",
          file: f.path,
          line: idx + 1,
          detail: "MockTelegraphClient referenced outside allowed mock/factory/test files",
        });
      }
    });
  }
  return violations;
}

// Check 2: Legacy intent names (quoted, unquoted object keys, or template/backtick usages)
// Allowlist only: packages/shared/src/intents.ts, *.test.ts, and lines carrying (or preceded by) // simulated-data or // legacy-alias
export function checkLegacyIntents(files: FileEntry[]): Violation[] {
  const violations: Violation[] = [];
  const legacyNames = "FX_NOW|WEATHER_FORECAST_VERIFY|WEATHER_CHECK|SANCTIONS_SCREENING_MATCH";
  const quotedRegex = new RegExp(`(["'])(${legacyNames})\\1`);
  const unquotedKeyRegex = new RegExp(`(?:^|[\\s{,])(${legacyNames})\\s*:`);
  const backtickRegex = new RegExp(`\`[^\`]*(?<![A-Z0-9_])(${legacyNames})(?![A-Z0-9_])[^\`]*\``);

  for (const f of files) {
    if (isSelfVerifyFile(f.path)) continue;
    if (!/\.(ts|tsx)$/.test(f.path)) continue;
    if (f.path === "packages/shared/src/intents.ts" || isTestFile(f.path)) continue;

    const lines = f.content.split(/\r?\n/);
    lines.forEach((line, idx) => {
      const prevLine = idx > 0 ? lines[idx - 1] : "";
      const hasMarker =
        line.includes("// simulated-data") ||
        line.includes("// legacy-alias") ||
        prevLine.includes("// simulated-data") ||
        prevLine.includes("// legacy-alias");
      if (hasMarker) return;

      const m = quotedRegex.exec(line) || unquotedKeyRegex.exec(line) || backtickRegex.exec(line);
      if (m) {
        violations.push({
          check: "2_legacy_intent_names",
          file: f.path,
          line: idx + 1,
          detail: `Legacy intent usage (${m[0].trim()}) found without // simulated-data or // legacy-alias`,
        });
      }
    });
  }
  return violations;
}

// Check 3: "<5ms", "Capital Saved: $", "Pending / Mock" in non-test source
export function checkBannedUiStrings(files: FileEntry[]): Violation[] {
  const violations: Violation[] = [];
  const banned = ["<5ms", "Capital Saved: $", "Pending / Mock"];
  for (const f of files) {
    if (isSelfVerifyFile(f.path)) continue;
    if (!/\.(ts|tsx)$/.test(f.path) || isTestFile(f.path)) continue;
    const lines = f.content.split(/\r?\n/);
    lines.forEach((line, idx) => {
      for (const s of banned) {
        if (line.includes(s)) {
          violations.push({
            check: "3_banned_fallback_strings",
            file: f.path,
            line: idx + 1,
            detail: `Banned string "${s}" found in non-test source`,
          });
        }
      }
    });
  }
  return violations;
}

// Check 4: hl_live_ followed by 16+ hex/alphanumeric characters outside *.test.ts
export function checkHardcodedApiKeys(files: FileEntry[]): Violation[] {
  const violations: Violation[] = [];
  const keyRegex = /hl_live_[a-zA-Z0-9]{16,}/;
  for (const f of files) {
    if (isSelfVerifyFile(f.path) || isTestFile(f.path)) continue;
    const lines = f.content.split(/\r?\n/);
    lines.forEach((line, idx) => {
      if (keyRegex.test(line)) {
        violations.push({
          check: "4_hardcoded_api_key",
          file: f.path,
          line: idx + 1,
          detail: "Hardcoded hl_live_ API key found outside test files",
        });
      }
    });
  }
  return violations;
}

// Check 5: Wrong USDC address in source/docs (tests excluded if annotated // fixture)
export function checkUsdcAddresses(files: FileEntry[]): Violation[] {
  const violations: Violation[] = [];
  const legacyUsdc = "0x1c7d4b196cb0c7b01d743fbc6116a902379c7238";
  const addrRegex = /0x[a-fA-F0-9]{40}/g;

  for (const f of files) {
    if (isSelfVerifyFile(f.path)) continue;
    if (!/\.(ts|tsx|md)$/.test(f.path) && !f.path.endsWith(".env.example")) continue;
    const lines = f.content.split(/\r?\n/);
    lines.forEach((line, idx) => {
      if (isTestFile(f.path) && line.includes("// fixture")) return;
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes(legacyUsdc)) {
        violations.push({
          check: "5_wrong_usdc_address",
          file: f.path,
          line: idx + 1,
          detail: "Legacy Sepolia USDC address 0x1c7D... found",
        });
        return;
      }
      if (/\busdc\b/i.test(line) && !/priceusdc|capusdc|spendusdc|savedusdc/i.test(line)) {
        const matches = line.match(addrRegex) || [];
        for (const addr of matches) {
          const lowerAddr = addr.toLowerCase();
          if (
            lowerAddr !== CANONICAL_USDC &&
            lowerAddr !== TELEGRAPH_CONTRACT &&
            lowerAddr !== "0x0000000000000000000000000000000000000000" &&
            lowerAddr !== "0x000000000000000000000000000000000000dead"
          ) {
            violations.push({
              check: "5_wrong_usdc_address",
              file: f.path,
              line: idx + 1,
              detail: `Non-canonical USDC address ${addr} found`,
            });
          }
        }
      }
    });
  }
  return violations;
}

// Check 6: git ls-files containing .env* other than .env.example
export function checkTrackedEnvFiles(trackedPaths: string[]): Violation[] {
  const violations: Violation[] = [];
  const envRegex = /(^|\/)\.env($|\.)/;
  for (const p of trackedPaths) {
    if (envRegex.test(p) && p !== ".env.example") {
      violations.push({
        check: "6_tracked_env_file",
        file: p,
        line: 1,
        detail: `Tracked .env file '${p}' is forbidden (only .env.example allowed)`,
      });
    }
  }
  return violations;
}

// Check 7: .skip(, .only(, xit(, xdescribe( in test files
export function checkSkippedTests(files: FileEntry[]): Violation[] {
  const violations: Violation[] = [];
  const skipRegex = /\.(skip|only)\(|\b(xit|xdescribe)\(/;
  for (const f of files) {
    if (!isTestFile(f.path)) continue;
    const lines = f.content.split(/\r?\n/);
    lines.forEach((line, idx) => {
      if (skipRegex.test(line)) {
        violations.push({
          check: "7_skipped_or_focused_test",
          file: f.path,
          line: idx + 1,
          detail: "Skipped or focused test (.skip/.only/xit/xdescribe) is forbidden",
        });
      }
    });
  }
  return violations;
}

// Check 8: Hardcoded 0x + 64 hex tx-hash-looking strings in non-test source other than allowed real tx
export function checkHardcodedTxHashes(files: FileEntry[]): Violation[] {
  const violations: Violation[] = [];
  const hashRegex = /0x[0-9a-fA-F]{64}/g;
  const maxUint = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
  for (const f of files) {
    if (isSelfVerifyFile(f.path)) continue;
    if (!/\.(ts|tsx)$/.test(f.path) || isTestFile(f.path)) continue;
    const lines = f.content.split(/\r?\n/);
    lines.forEach((line, idx) => {
      const matches = line.match(hashRegex) || [];
      for (const h of matches) {
        const lower = h.toLowerCase();
        if (lower !== ALLOWED_REAL_TX && lower !== maxUint) {
          violations.push({
            check: "8_hardcoded_tx_hash",
            file: f.path,
            line: idx + 1,
            detail: `Hardcoded 64-hex hash ${h} found in non-test source`,
          });
        }
      }
    });
  }
  return violations;
}

// Check 9: No hardcoded arrays of 2+ intent-like UPPER_SNAKE strings in apps/web/app/**/*.tsx unless marked // simulated-data
export function checkHardcodedUiIntentArrays(files: FileEntry[]): Violation[] {
  const violations: Violation[] = [];
  const arrayLiteralRegex = /\[([^\[\]]*)\]/g;
  const intentStringRegex = /(["'])([A-Z]{2,}(?:_[A-Z0-9]+)+)\1/g;

  for (const f of files) {
    if (isSelfVerifyFile(f.path) || isTestFile(f.path)) continue;
    if (!/^apps\/web\/app\/.*\.tsx$/.test(f.path)) continue;

    const lines = f.content.split(/\r?\n/);
    let match: RegExpExecArray | null;
    arrayLiteralRegex.lastIndex = 0;

    while ((match = arrayLiteralRegex.exec(f.content)) !== null) {
      const inner = match[1];
      const intentsFound = Array.from(inner.matchAll(intentStringRegex)).map((m) => m[2]);
      if (intentsFound.length < 2) continue;

      const prefix = f.content.slice(0, match.index);
      const startLineIdx = prefix.split(/\r?\n/).length - 1;
      const prevLine = startLineIdx > 0 ? lines[startLineIdx - 1] : "";
      const startLine = lines[startLineIdx] || "";

      if (
        inner.includes("// simulated-data") ||
        startLine.includes("// simulated-data") ||
        prevLine.includes("// simulated-data")
      ) {
        continue;
      }

      violations.push({
        check: "9_hardcoded_ui_intent_array",
        file: f.path,
        line: startLineIdx + 1,
        detail: `Hardcoded UI intent array [${intentsFound.join(", ")}] found without // simulated-data`,
      });
    }
  }
  return violations;
}

export function runAllChecks(trackedPaths: string[], files: FileEntry[]): Violation[] {
  return [
    ...checkMockClientImports(files),
    ...checkLegacyIntents(files),
    ...checkBannedUiStrings(files),
    ...checkHardcodedApiKeys(files),
    ...checkUsdcAddresses(files),
    ...checkTrackedEnvFiles(trackedPaths),
    ...checkSkippedTests(files),
    ...checkHardcodedTxHashes(files),
    ...checkHardcodedUiIntentArrays(files),
  ];
}

function main() {
  const rawTracked = execSync("git ls-files", { encoding: "utf-8" });
  const trackedPaths = rawTracked
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const files: FileEntry[] = [];
  for (const relPath of trackedPaths) {
    if (!/\.(ts|tsx|md)$/.test(relPath) && !relPath.endsWith(".env.example")) continue;
    const fullPath = path.resolve(process.cwd(), relPath);
    if (!fs.existsSync(fullPath)) continue;
    const stat = fs.statSync(fullPath);
    if (!stat.isFile()) continue;
    files.push({
      path: relPath.replace(/\\/g, "/"),
      content: fs.readFileSync(fullPath, "utf-8"),
    });
  }

  const violations = runAllChecks(trackedPaths, files);
  if (violations.length > 0) {
    console.error(`[verify-repo] FAILED with ${violations.length} violation(s):`);
    for (const v of violations) {
      console.error(`  [${v.check}] ${v.file}:${v.line} — ${v.detail}`);
    }
    process.exit(1);
  }

  console.log(`[verify-repo] PASSED all 9 repo audit checks across ${files.length} tracked files.`);
}

// Only execute CLI main when run directly
const isDirectRun =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] &&
  process.argv[1].replace(/\\/g, "/").endsWith("scripts/verify-repo.ts");

if (isDirectRun) {
  main();
}
