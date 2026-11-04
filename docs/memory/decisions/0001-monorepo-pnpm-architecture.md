---
title: "ADR 0001: Monorepo Architecture and pnpm Workspace"
status: "accepted"
date: "2026-11-04"
linked_files:
  - "pnpm-workspace.yaml"
  - "package.json"
  - "apps/web/package.json"
  - "apps/worker/package.json"
  - "packages/shared/package.json"
  - "packages/governor/package.json"
---

# ADR 0001: Monorepo Architecture and pnpm Workspace

## Context
Half-Life consists of a Next.js web application (`apps/web`), a long-running background service (`apps/worker`), and reusable packages (`packages/shared`, `packages/governor`, `packages/chain`, `packages/telegraph`, `packages/sdk`, `packages/bench`). Previously, a prototype Next.js app resided in `site/` with npm.

Per the Technical Requirements Document (TRD Section 1 & 4), the project requires:
1. Pure TypeScript across all services and packages.
2. A single lockfile (`pnpm-lock.yaml`) with pinned `packageManager`.
3. Clear separation of privileges: the web app never holds decrypted wallet keys and communicates with the worker asynchronously via MongoDB documents.
4. Isolating pure logic (like the Governor decision engine) from I/O and network operations to allow independent unit and property testing without network dependencies.

## Decision
1. Standardize on a `pnpm` monorepo defined via `pnpm-workspace.yaml`.
2. Move `site/` to `apps/web/`.
3. Scaffold `apps/worker/`, `packages/shared/`, and `packages/governor/`.
4. Delete root and subproject `package-lock.json` files and commit exactly one `pnpm-lock.yaml`.

## Consequences
- Clean package isolation and dependency sharing.
- Consistent builds across local development, CI, and Vercel.
- Security isolation between web tier and worker processes.

