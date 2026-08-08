# Technical Debt & Deferred Decisions

Tracks intentional shortcuts taken to keep individual features scoped. Check this file before doing related work so a shortcut isn't mistaken for permanent architecture.

## tsconfig client/server split (deferred from #23)

ADR-0004 (Cross-Cutting Conventions) specifies a `tsconfig.client.json` + `tsconfig.server.json` split (DOM lib vs Node types) linked via TypeScript project references, replacing the single root `tsconfig.json`.

Feature #23 (config management) introduced the first non-`src` TypeScript file (`server/config.ts`) but kept a single root `tsconfig.json` for simplicity — added `server/**/*` to `include` and `"node"` to `compilerOptions.types` instead of doing the full split.

**Revisit when:** feature #22 (local API server) is built — that's when the Node-only backend surface grows enough to justify the split and the eslint `parserOptions.project` / `type-check` script changes it requires.
