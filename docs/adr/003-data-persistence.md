# ADR-0003: Data & Persistence

## Status
Accepted

## Context
Urisdae tools are standalone and plugin-encapsulated per ADR-0002 (Backend Stack). The project needs one consistent data story (storage engine, access layer, migrations) chosen up front so individual tools don't each invent their own. The first planned tool (an expense tracker) needs relational data (accounts, categories, transactions), motivating a relational store with a type-safe query layer. Constraints: solo developer, local-only usage currently, TypeScript/Node tooling already in place for the rest of the repo.

## Decision
- Persistence: SQLite, with one `.db` file per tool (e.g. `expense.db`). This mirrors the per-tool plugin encapsulation from ADR-0002, keeping each tool's data lifecycle (backup, reset, delete) fully independent of other tools.
- Data access: Drizzle ORM (`drizzle-orm/better-sqlite3` driver). Lightweight and TS-native, with schema-as-code that produces typed queries and relations, plus a raw SQL escape hatch via `sql\`...\`` when needed.
- Migrations: Drizzle Kit, adopted from day one. It generates versioned SQL migration files from schema diffs and tracks applied migrations in the database, avoiding drift as more tools and tables accumulate.

## Alternatives Considered
- Shared `.db` with table prefixes: simpler single-file operations, but requires naming discipline and intertwines migration history across unrelated tools — rejected in favor of per-tool isolation consistent with ADR-0002.
- Raw `better-sqlite3` without an ORM: full control and no abstraction overhead, but no type safety on queries and no migration tooling, meaning more manual bookkeeping as tools grow.
- Prisma: heavier, with its own schema DSL, a generated client, and a schema engine binary — more opinionated tooling (including a Studio GUI) than needed for a small local project.
- Hand-written SQL migrations until it hurts: avoids tooling overhead upfront, but risks schema drift and manual bookkeeping — rejected since Drizzle Kit is low-friction to adopt immediately once Drizzle is already the chosen ORM.

## Consequences
- Each tool ships its own SQLite file, Drizzle schema module, and migration folder — consistent with the per-tool plugin pattern from ADR-0002.
- No cross-tool joins are possible since data lives in separate files; this is acceptable since tools are designed to be standalone.
- Drizzle's typed schema gives compile-time safety on queries and relations (e.g. the expense tracker's accounts, categories, and transactions tables), reducing runtime SQL errors.
- Schema changes require generating and committing Drizzle Kit migration files as part of the dev workflow, keeping schema code and the database in sync.
- Backing up or resetting a single tool's data is a simple file-level operation (copying or deleting its `.db` file) without touching other tools.
- The project is locked into Drizzle's schema and migration conventions across all tools going forward.
- Each tool's Drizzle Kit config lives at `server/tools/<slug>/drizzle.config.ts` (one config file per tool, not one shared parameterized config), alongside `server/tools/<slug>/db/schema.ts` and `server/tools/<slug>/db/migrations/`.
- Migrations are applied automatically at connection-creation time (via drizzle-orm's `migrate()` function running against the tool's migration folder) rather than via a manual `drizzle-kit migrate` CLI step — every time a tool's DB connection singleton is first created, pending migrations are applied.
- Tests exercise the persistence layer using in-memory SQLite (`:memory:`) via a `filenameOverride` parameter on the shared connection factory, rather than temp files on disk.
