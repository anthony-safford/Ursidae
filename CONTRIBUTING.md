# Contributing to Urisdae

This document describes the conventions established across the Urisdae codebase. Following these conventions ensures consistency and maintainability as the project evolves.

For architectural rationale behind key decisions, see the Architecture Decision Records in [docs/adr/](docs/adr/).

## Commit Conventions

Commits use the conventional commit format with a GitHub issue number scope:

**Format:** `<type>(#<issue-number>): <description>`

**Example:** `feat(#13): add vitest testing infrastructure`

### Scope Requirements

- The scope **must be a GitHub issue number** prefixed with `#` (e.g., `#13`, `#26`).
- This is enforced by a custom commitlint rule in `commitlint.config.mts` and enables automatic GitHub issue linking.
- **Exception:** `fix` and `chore` types have optional scopes. If you omit a scope, you don't need to add one. However, if you do include a scope, it must still use the `#123` format.

### Common Types

- `feat` — new feature or substantial addition (scope required)
- `fix` — bug fix (scope optional)
- `docs` — documentation changes (scope required)
- `test` — test-related changes (scope required)
- `chore` — maintenance tasks, dependency updates (scope optional)
- Avoid overloading `chore` for substantial work — use `feat` instead.

### Pre-commit Checks

Before a commit is accepted:

1. **Husky pre-commit hook** runs `lint-staged`, which automatically:
   - Runs ESLint with `--fix` on staged TypeScript/TSX files
   - Runs Prettier with `--write` to format staged files

2. **Test suite** (`npm run test:coverage`) runs and must pass (80% coverage thresholds enforced).

3. **GPG signing** is enabled (`commit.gpgsign=true`). Commits must be signed with a valid GPG key. If signing fails, the commit is rejected.

### Commit Message Body

If your commit has a body (multi-line message), keep body lines under **100 characters** (enforced by `commitlint`'s `body-max-line-length` rule). Use bullet points or concise paragraphs.

## Epic → Feature Workflow

Epics and their feature issues are created from a single markdown plan file rather than by hand
in the GitHub UI.

1. **Write the plan:** copy `docs/epics/_template.md` to `docs/epics/<slug>.md`. The `# ` heading
   becomes the epic issue; each `## ` heading becomes a feature issue nested under it as a native
   GitHub sub-issue. An optional `<!-- slug: my-slug -->` comment sets the branch slug (otherwise
   it's derived from the epic title).

2. **Create the issues:**

   ```bash
   npm run epic:new -- docs/epics/<slug>.md
   ```

   Add `--dry-run` to preview the `gh` commands without creating anything. The script rewrites
   the plan file in place, annotating each heading with its assigned issue number (e.g.
   `## Add vitest #13`), so `feat(#N):` commit scopes are ready to copy.

   Pass `--branch` to also create and push the `epic/<n>/<slug>` branch. It's off by default and
   refuses to run from a dirty working tree or anywhere but `main`.

3. **Work the epic:** commit to the epic branch as usual, scoping each commit to its feature
   issue (`feat(#23): ...`). Pushing to `epic/**` automatically closes any `feature`-labeled issue
   referenced by a landed commit.

4. **Open the epic PR:** open a PR from the epic branch to `main`. Its body is auto-populated
   between the `<!-- epic-summary:start -->`/`<!-- epic-summary:end -->` markers with the epic
   header, a feature checklist, and a changelog grouped by commit type — regenerated on every
   push. Anything written above the markers is preserved.

**Prerequisite:** the `gh` CLI must be installed and authenticated (`gh auth status`). If a
command fails with a missing-scope error, run `gh auth refresh -s <scope>`.

## Code Style & Formatting

### Prettier

Prettier is the **single source of truth** for code formatting. Configuration is in `.prettierrc`:

- **Indentation:** tabs (not spaces), 2-space width
- **Quotes:** single quotes
- **Semicolons:** required
- **Print width:** 100 characters
- **Trailing commas:** ES5 style (objects/arrays yes, function params no)
- **Arrow functions:** always use parentheses (even single params)

### Editor Setup

To prevent silent drifting from Prettier (a historical issue in this project), VS Code is configured to:

- Use the **Prettier extension** (`esbenp.prettier-vscode`) as the default formatter
- Enable `editor.formatOnSave`
- Use tab indentation with width 2

Configuration is in `.vscode/settings.json`, and the extension is listed in `.vscode/extensions.json` for automatic recommendation. Do **not** rely on VS Code's built-in per-language formatters (they may differ from Prettier).

### ESLint

ESLint uses the flat config format (`eslint.config.js`, ESLint 10+):

- Plugin: `eslint-plugin-import-x` (required for ESLint 9/10; the older `eslint-plugin-import` is not compatible)
- Naming convention rule (`@typescript-eslint/naming-convention`) is **active** on `server/**/*.ts` and `src/**/*.ts` (plain `.ts` files, e.g. `src/test/setup.ts`, `src/mocks/`)

#### Naming Conventions

On **`server/**/*.ts`** and **`src/**/*.ts`** (backend and non-component frontend files):

- **Function declarations** must start with an allowed verb prefix (`get`, `create`, `is`, `has`, `should`, `validate`, `fetch`, `build`, etc.)
- Example: `getUser()`, `createConnection()`, `isValid()`, `hasPermission()`
- **Local variables and destructured bindings** must NOT start with verb-prefix words.
  - ✅ Correct: `const transport = createTransport(...)`
  - ❌ Incorrect: `const createTransport = await import(...).then(m => m.createTransport)`
  - ✅ Workaround: `const module = await import(...); module.createTransport()` (member access instead of destructuring)

**Naming conventions are deliberately OFF** on `src/**/*.tsx` (React components) because components use PascalCase (e.g., `ErrorBoundary`, `Layout`), which conflicts with the backend's camelCase/verb-prefix rules.

#### Special Case: Fastify Plugins

Fastify plugin functions must be declared as arrow functions assigned to `const`, not function declarations:

```typescript
export const exampleRoutes: FastifyPluginCallback = (fastify, opts, done) => {
	// routes
};
```

This pattern works because arrow function expressions assigned to a `const` are classified as "variable" declarations by the naming-convention rule, not "function" declarations, so `exampleRoutes` (which doesn't start with a verb) is allowed.

### Import/Export Conventions

- `import-x/no-default-export` is enforced across `src/**` (frontend):
  - All React components use **named exports**, not default exports
  - Example: `export function MyComponent() { ... }`
- `React.lazy()` uses an adapter pattern to convert named exports:
  ```typescript
  lazy(() => import('./Foo').then((m) => ({ default: m.Foo })));
  ```

## TypeScript Project Structure

The project uses a multi-project TypeScript setup:

- **`tsconfig.json`** (root): references only; includes project references for `client` and `server`
- **`tsconfig.base.json`** (shared): contains strict compiler options used by both projects
- **`tsconfig.client.json`** (frontend): extends base; adds DOM library, JSX settings, Vite and Vitest globals for `src/**`
- **`tsconfig.server.json`** (backend): extends base; adds Node.js types and Vitest globals for `server/**`

Type-check with:

```bash
npm run type-check
# Runs: tsc --build (not tsc --noEmit)
```

## Testing Conventions

### Overview

**Vitest** is the test runner, configured in `vitest.config.ts`:

- Two separate projects: `client` (jsdom environment) and `server` (node environment)
- **Coverage threshold:** 80% across lines, functions, branches, and statements (enforced by `npm run test:coverage`)
- Coverage report is generated in `coverage/`

### Test Structure

Tests are **colocated** in `__tests__/` folders next to the code they test:

```
src/components/
  Nav.tsx
  __tests__/
    Nav.test.tsx

server/
  app.ts
  __tests__/
    app.test.ts
```

NOT a flat top-level test directory.

### Client Testing (React)

- Located at `src/**/__tests__/**/*.test.{ts,tsx}`
- Uses **@testing-library/react** and **@testing-library/jest-dom**
- Uses **MSW** (Mock Service Worker) for mocking API calls, configured in `src/mocks/`
- Tests React components by rendering and querying the DOM

### Server Testing (Backend)

- Located at `server/**/__tests__/**/*.test.ts`
- Tests Fastify routes, database access, and business logic
- Node.js environment (no DOM)

### Scripts

```bash
npm test              # vitest run (CI mode, single run)
npm run test:watch   # vitest (watch mode for development)
npm run test:coverage # vitest run --coverage (enforces 80% thresholds)
```

### Expectations

Testing is comprehensive from the start. New work requires accompanying tests:

- Frontend: test React components and user interactions
- Backend: test API routes, data access, and error handling
- See [docs/adr/005-testing-strategy.md](docs/adr/005-testing-strategy.md) for rationale

## Cross-Cutting Conventions

See [docs/adr/004-cross-cutting.md](docs/adr/004-cross-cutting.md) for full details. Quick reference:

### Environment & Configuration

- **Config file:** `.env` (gitignored; template is `.env.example`)
- **Loading:** via `dotenv` package, validated at startup using a Zod schema in `server/config.ts`
- **Behavior:** missing or invalid required env vars cause the application to exit loudly with an error (fail-fast), not silently default
- **Setup:** copy `.env.example` to `.env` and fill in actual values as part of initial setup

### Logging

- **Library:** pino (configured in `server/logger.ts`)
- **Output:** console (pretty-printed via `pino-pretty` in development) and log files
- **Log directory:** configurable via `LOG_DIR` env var (default: `./logs`)
- **Log level:** configurable via `LOG_LEVEL` env var; valid values: `fatal`, `error`, `warn`, `info`, `debug`, `trace` (default: `info`)

### API Error Responses

All Fastify error responses follow a consistent shape:

```json
{
	"error": {
		"code": "ERROR_CODE",
		"message": "Human-readable message",
		"details": {/* optional additional info */}
	}
}
```

- `code` is machine-readable (e.g., `VALIDATION_ERROR`, `NOT_FOUND`, `INTERNAL_ERROR`)
- `message` is human-readable
- Implemented via a shared `setErrorHandler` in `server/app.ts`

### Authentication & Security

**Current state:** None. This is a local-only, single-machine application with no network exposure.

**Important:** Before ever exposing this application beyond the local machine (e.g., over a network, in a container, etc.), authentication and security must be implemented. This is a critical future consideration.

## Adding a New Tool

Each tool is a self-contained, independent plugin. Tools cannot cross-communicate or share data.

### Folder Structure

```
src/tools/<tool-slug>/
  ExampleToolPage.tsx          # React component (named export)
  __tests__/
    ExampleToolPage.test.tsx   # Tests

server/tools/<tool-slug>/
  routes.ts                    # Fastify plugin (if tool needs an API)
  __tests__/
    routes.test.ts             # Route tests
  db/
    schema.ts                  # Drizzle ORM schema
    connection.ts              # SQLite connection
    migrations/                # Auto-generated migration files
  drizzle.config.ts            # Drizzle CLI config (one per tool)
```

### Steps

1. **Frontend component:**
   - Add `src/tools/<slug>/ExampleToolPage.tsx` as a named export

2. **Register in tool registry:**
   - Add an entry to `src/routes/toolRegistry.tsx`:
     ```typescript
     {
       label: 'Example Tool',
       component: ExampleToolPage,
     }
     ```
   - This single registry drives the landing page tiles and Nav links automatically

3. **Backend API (if needed):**
   - Create `server/tools/<slug>/routes.ts` as a Fastify plugin using the arrow-const pattern:
     ```typescript
     export const exampleRoutes: FastifyPluginCallback = (fastify, opts, done) => {
     	fastify.get('/endpoint', async (request, reply) => {
     		// route handler
     	});
     	done();
     };
     ```
   - Register in `server/app.ts`:
     ```typescript
     app.register(exampleRoutes, { prefix: '/api/<slug>' });
     ```

4. **Database (if needed):**
   - Create schema at `server/tools/<slug>/db/schema.ts` using Drizzle ORM
   - Create connection at `server/tools/<slug>/db/connection.ts`
   - Create migrations folder at `server/tools/<slug>/db/migrations/`
   - Create `server/tools/<slug>/drizzle.config.ts` (one config per tool, not shared)
   - **Migrations auto-run** at startup via `server/db/createSqliteConnection.ts` — no manual `migrate` command needed
   - Add an npm script following the pattern:
     ```json
     "db:generate:<slug>": "drizzle-kit generate --config server/tools/<slug>/drizzle.config.ts"
     ```

5. **Testing:**
   - Add tests in `__tests__/` folders alongside the source
   - Ensure coverage meets 80% thresholds

### Key Principles

- **One SQLite file per tool** — no shared databases or cross-tool joins
- **Independence:** one tool breaking doesn't affect others
- **Discoverability:** toolRegistry is the single source of truth for routing and navigation

## Common npm Scripts

| Script                  | Purpose                                                                    |
| ----------------------- | -------------------------------------------------------------------------- |
| `npm run dev`           | Start Vite frontend dev server and backend (tsx watch) concurrently        |
| `npm run build`         | Build frontend for production (`vite build`)                               |
| `npm start`             | Run backend in production mode, serving the built frontend as static files |
| `npm run lint`          | Run ESLint on `src/` and `server/`                                         |
| `npm run lint:fix`      | Run ESLint with `--fix`                                                    |
| `npm run format`        | Run Prettier to format files                                               |
| `npm run format:check`  | Check Prettier compliance without writing                                  |
| `npm run type-check`    | Run `tsc --build` across both TypeScript projects                          |
| `npm test`              | Run Vitest (single run, CI mode)                                           |
| `npm run test:watch`    | Run Vitest in watch mode                                                   |
| `npm run test:coverage` | Run Vitest with coverage report (enforces 80% thresholds)                  |
| `npm run epic:new`      | Create an epic issue + feature sub-issues from a plan file (see above)     |

## Resources

- **Architecture Decisions:** [docs/adr/](docs/adr/)
  - [001-frontend-stack.md](docs/adr/001-frontend-stack.md) — React, Vite, wouter, Tailwind
  - [002-backend-stack.md](docs/adr/002-backend-stack.md) — Fastify, pino, Node.js
  - [003-data-persistence.md](docs/adr/003-data-persistence.md) — SQLite, Drizzle, per-tool isolation
  - [004-cross-cutting.md](docs/adr/004-cross-cutting.md) — config, logging, error handling, auth
  - [005-testing-strategy.md](docs/adr/005-testing-strategy.md) — Vitest, coverage gates, testing library
