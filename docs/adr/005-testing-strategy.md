# ADR-0005: Testing Strategy

## Status
Accepted

## Context
ADR-0004 (Cross-Cutting Conventions) already decided that testing starts day one, is comprehensive across backend and frontend, uses Vitest, adds React Testing Library for components, and enforces 80% coverage thresholds. That left several implementation details unresolved: how to run backend (node) and frontend (jsdom) tests with different environments from one Vitest setup; whether to mock API calls with `vi.fn()` or MSW; where test files live relative to source; and what npm scripts and CI wiring look like. This ADR fixes those details. Constraints: solo developer, local-only usage, no backend code exists yet (ADR-0002's Fastify backend hasn't been scaffolded), only the React frontend (`src/`) exists so far.

## Decision
- Environment split: a single `vitest.config.ts` using Vitest's `test.projects` array (not a separate `vitest.workspace.ts` file, which was deprecated in Vitest 3.2) to define two projects that both extend the root config:
  - `client`: `environment: 'jsdom'`, tests under `src/**/__tests__/`.
  - `server`: `environment: 'node'`, tests under `server/**/__tests__/` (stubbed with `passWithNoTests: true` since no backend code exists yet; will hold real tests once ADR-0002's backend is scaffolded).
- Component testing: `@testing-library/react` + `@testing-library/jest-dom` for the client project, loaded via a shared `src/test/setup.ts` setup file.
- Coverage provider: Vitest's built-in `v8` provider (already in use), keeping the existing 80% lines/functions/branches/statements thresholds from ADR-0004 as-is. This also fixes a latent bug where `coverage.include` only matched `.ts` files, so `.tsx` components were never actually counted.
- API mocking: Mock Service Worker (MSW), via `msw/node`'s `setupServer`, wired into `src/test/setup.ts`'s lifecycle hooks with an initially empty handlers list in `src/mocks/handlers.ts`. Adopted now even though no tool calls a real backend yet, to avoid re-tooling test mocks once multiple tools depend on `/api` routes.
- Test file convention: colocated `__tests__/` folders next to source (e.g. `src/components/__tests__/Nav.test.tsx`), not a separate top-level `__tests__/` tree.
- npm scripts: `test` (`vitest run`, single run — what CI and the pre-commit hook use), `test:watch` (`vitest`, local dev loop), `test:coverage` (`vitest run --coverage`).
- CI: no changes needed. The existing single `npm run test:coverage` step in `.github/workflows/ci.yml` already runs both projects and aggregates one `coverage/coverage-summary.json` + `coverage-final.json`, which the existing `davelosert/vitest-coverage-report-action` step already consumes.

## Alternatives Considered
- `vitest.workspace.ts`: the originally-considered approach for splitting environments, but deprecated since Vitest 3.2 in favor of `test.projects` — rejected in favor of the non-deprecated API.
- Two fully separate Vitest config files/CLI invocations (one per environment): would avoid `projects` entirely, but loses a single aggregated coverage run and requires two commands wired into CI instead of one — rejected.
- Plain `vi.fn()` fetch mocking: lower effort and sufficient for a single tool with no real API calls yet, but rejected in favor of adopting MSW now to avoid re-tooling test mocks once more tools call `/api` routes.
- Flat top-level `__tests__/` tree: keeps all tests in one place, but decouples them from the source they cover as the tool collection grows — rejected in favor of colocation.
- Deferring the `server` project until the backend is scaffolded: would avoid a stub project with zero tests, but splitting the config now means the eventual backend chore only needs to add test files, not touch test infrastructure — accepted the stub instead.
- Leaving existing components untested and scoping coverage only to files touched by new tests: lower effort now, but leaves the 80% gate meaningless until later — rejected in favor of backfilling tests for all existing components/pages immediately.

## Consequences
- Adding backend tests later only requires dropping files under `server/**/__tests__/`; no config changes needed since the `server` project already exists (currently passing vacuously via `passWithNoTests`).
- Every frontend component going forward needs a colocated `__tests__/` folder to keep the 80% coverage gate meaningful; the existing components/pages and `App` were backfilled with tests as part of this decision rather than left uncovered.
- MSW handlers must be added per tool as tools start calling real `/api` routes; `src/mocks/handlers.ts` is the single place new handlers are registered.
- `npm run test:coverage` remains the one command CI and the pre-commit hook rely on — no CI YAML changes were required by this decision.
- This ADR doesn't change or supersede ADR-0001 through ADR-0004; it fills in implementation details ADR-0004 explicitly left open (coverage tool and threshold were already decided; environment split, mocking strategy, file convention, and script names were not).
