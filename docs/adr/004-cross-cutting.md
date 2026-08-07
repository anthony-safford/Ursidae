# ADR-0004: Cross-Cutting Conventions

## Status
Accepted

## Context
Urisdae tools are independent and plugin-encapsulated per ADR-0002 (Backend Stack), each with their own SQLite database per ADR-0003 (Data & Persistence), running on a React/Vite/Wouter/Tailwind frontend per ADR-0001 (Frontend Stack) and Fastify backend per ADR-0002. This ADR fixes cross-cutting conventions common to every tool — config/env handling, logging, API error shape, TypeScript project structure, auth posture, and testing scope — decided once so individual tools don't reinvent them. Constraints: solo developer, local-only usage currently, TypeScript/Node tooling throughout.

## Decision
- Config/env: a `.env` file loaded via `dotenv`, validated at startup against a zod schema. A missing or invalid required variable fails loudly (the process exits) rather than silently falling back to a default.
- Logging: pino, writing structured logs to both the console (pretty-printed in dev via pino-pretty) and a local log file, giving a persistent history across restarts.
- Error handling: every API error response uses one shape — `{ error: { code: string; message: string; details?: unknown } }` — set via a single Fastify `setErrorHandler`, so the frontend never special-cases error handling per tool. `code` is a machine-readable identifier (e.g. `VALIDATION_ERROR`, `NOT_FOUND`), `message` is human-readable, and `details` carries optional extra context such as field-level validation errors.
- TypeScript project structure: a root `tsconfig.json` holds shared base compiler options (strictness, module resolution, etc.). `tsconfig.client.json` (DOM lib, `react-jsx`) and `tsconfig.server.json` (Node types) each extend the base and override environment-specific options, linked via TypeScript project references.
- Auth: none. The application is local-PC-only with no network exposure, so there is no authentication or authorization layer. This must be explicitly revisited before the app is ever exposed beyond the local machine.
- Testing scope: tests start day one and are comprehensive — backend logic (Fastify routes, data access) and frontend components (via React Testing Library) are both tested, using the existing Vitest setup and the 80% coverage thresholds already configured in vitest.config.ts.

## Alternatives Considered
- Console-only logging: simpler, with no rotation or cleanup concerns, but loses history across restarts — rejected in favor of also persisting to a local log file for after-the-fact debugging.
- Ad hoc or per-tool error shapes: would force the frontend to special-case error handling for each tool — rejected in favor of one shared shape.
- A single root tsconfig.json for both client and server: avoids extra files, but the client needs DOM lib and JSX while the server needs Node types; mixing them risks leaking browser globals into server code and vice versa — rejected.
- Fully separate client/server tsconfigs with no shared base: zero coupling, but duplicates shared strictness options across configs — rejected in favor of one small shared base.
- Deferring tests until later ("until it hurts"): rejected — comprehensive day-one testing catches regressions early and keeps the existing coverage thresholds meaningful from the start.
- Any form of auth or session handling now: rejected as unnecessary complexity for a local-only tool suite; explicitly deferred until the app might be exposed beyond the local machine.

## Consequences
- Every tool validates its required env vars at startup via a shared zod schema pattern; a missing variable stops the app immediately instead of surfacing as a confusing runtime error later.
- Local log files need periodic cleanup or rotation consideration as they accumulate over time; this ADR doesn't mandate a rotation strategy, just states console + file logging.
- The frontend can implement one generic error-handling path (e.g. a shared API client wrapper) instead of per-tool logic, but every backend route must funnel errors through the shared Fastify error handler consistently.
- Adding a client or server file requires knowing which tsconfig (client or server) it belongs to; shared options only need to change in one place, the root base config.
- No auth means the app must not be exposed to any network beyond the local machine as-is; this decision needs explicit revisiting (and likely a new ADR) before any remote or multi-user deployment.
- Comprehensive day-one testing means both backend and frontend contributions require accompanying tests to meet the existing 80% coverage thresholds, which adds effort per feature but keeps regressions from creeping in as the tool collection grows.
