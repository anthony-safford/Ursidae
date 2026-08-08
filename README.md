# Ursidae

A collection of bearish tools.

## What is this?

Urisdae is a personal, local-only collection of small self-contained tools and utilities. Each tool is fully independent, built with a **React + Vite + wouter** frontend and a **Fastify** backend. Each tool can optionally have its own **SQLite database** for persistence, kept separate to ensure tools don't interfere with one another.

## Prerequisites

- **Node.js 24** (or later)
- **npm**

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure environment:**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and adjust values if needed. The file documents each variable:
   - `FRONTEND_PORT` — Vite dev server port (default: `5173`)
   - `BACKEND_PORT` — Fastify backend port (default: `3000`)
   - `DATA_DIR` — Directory for per-tool SQLite files (default: `./data`)
   - `LOG_DIR` — Directory for log files (default: `./logs`)
   - `LOG_LEVEL` — Logging level: `fatal`, `error`, `warn`, `info`, `debug`, `trace` (default: `info`)

3. **Start development servers:**

   ```bash
   npm run dev
   ```

   This starts both the Vite frontend dev server (with automatic proxy of `/api` to the backend) and the backend in watch mode. The CLI output shows the frontend URL (default: `http://localhost:5173`).

4. **Visit the app:**
   Open the URL printed by the dev command in your browser.

## Project Structure

- **`src/`** — React frontend
  - `src/tools/<tool-slug>/` — Per-tool frontend components
  - `src/routes/toolRegistry.tsx` — Central registry driving navigation and landing page
  - Tests colocated in `__tests__/` folders

- **`server/`** — Fastify backend
  - `server/tools/<tool-slug>/` — Per-tool API routes and database
  - `server/db/` — Shared database utilities
  - Tests colocated in `__tests__/` folders

- **`docs/adr/`** — Architecture Decision Records documenting key design choices

- **`data/`** — Per-tool SQLite files (gitignored, created on demand)

- **`logs/`** — Application log files (gitignored, created during runtime)

## Development

Key npm scripts:

| Script                              | Purpose                                                     |
| ----------------------------------- | ----------------------------------------------------------- |
| `npm run dev`                       | Start frontend (Vite) + backend (tsx watch) concurrently    |
| `npm run build`                     | Build frontend for production                               |
| `npm start`                         | Run backend in production, serving built frontend as static |
| `npm run lint` / `npm run lint:fix` | Run/fix ESLint violations                                   |
| `npm run type-check`                | Type-check both frontend and backend                        |
| `npm test`                          | Run test suite (single run)                                 |
| `npm run test:watch`                | Run tests in watch mode                                     |
| `npm run test:coverage`             | Run tests with coverage report (80% threshold)              |

See [CONTRIBUTING.md](CONTRIBUTING.md) for a complete list and details.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for:

- **Commit conventions** — format, types, and how issue numbers are enforced
- **Code style** — formatting (Prettier), linting (ESLint), naming conventions
- **Testing requirements** — where to place tests, coverage expectations
- **Adding a new tool** — step-by-step guide for creating frontend, API routes, and persistence
- **TypeScript, logging, error handling, and architecture** — cross-cutting conventions

For architectural rationale behind key decisions (frontend stack, backend, persistence, testing), see:

- [docs/adr/001-frontend-stack.md](docs/adr/001-frontend-stack.md)
- [docs/adr/002-backend-stack.md](docs/adr/002-backend-stack.md)
- [docs/adr/003-data-persistence.md](docs/adr/003-data-persistence.md)
- [docs/adr/004-cross-cutting.md](docs/adr/004-cross-cutting.md)
- [docs/adr/005-testing-strategy.md](docs/adr/005-testing-strategy.md)
