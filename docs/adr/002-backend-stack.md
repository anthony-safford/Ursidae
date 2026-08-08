# ADR-0002: Backend Stack

## Status
Accepted

## Context
Urisdae is a collection of small, standalone web tools. This ADR complements ADR-0001 (React + Vite + Wouter + Tailwind frontend). The project needs a single backend framework and routing convention chosen up front so individual tools don't each invent their own API structure. Constraints: solo developer, local-only usage currently, TypeScript/Node tooling already in place for the rest of the repo.

## Decision
- Framework: Fastify.
- Route organization: a single Fastify instance with one sub-router mounted per tool via plugin encapsulation, e.g. `fastify.register(toolARoutes, { prefix: '/api/tool-a' })`. Each tool's routes, schemas, and hooks are isolated in their own plugin, but all run in one process on one port.
- Dev-mode boundary: the Vite dev server proxies `/api/*` requests to the local Fastify dev server (via `server.proxy` in `vite.config`). The browser only ever talks to Vite's origin, so no CORS configuration is needed in dev.
- Prod-mode boundary: a single process — Fastify serves the Vite-built static frontend assets alongside the `/api` routes, all on one port.

## Alternatives Considered
- Express: mature and ubiquitous, but heavier overhead and an older plugin model compared to Fastify's schema validation and encapsulation.
- Hono: very lightweight and edge-first, but a younger ecosystem and less proven for this use case; Fastify's plugin system fits the multi-tool structure better.
- Flat single router with manual path prefixes: simpler to start, but no isolation between tools — naming collisions and shared state become easy to introduce as tools grow.
- Separate process per tool: maximum isolation, but adds real operational overhead (multiple processes, ports) that's unnecessary for a solo-dev local tool collection.
- CORS headers on backend (dev-mode alternative): works, but requires maintaining CORS config that isn't needed if prod ends up same-origin.
- Two processes in prod: more moving parts (reverse proxy or CORS config needed), only pays off with independent scaling/deployment needs that aren't a priority here.

## Consequences
- Adding a new tool means adding a new route plugin registered with a prefix — the pattern scales cleanly as tools are added.
- Fastify's built-in JSON schema validation is available per route for request/response validation.
- The dev workflow requires a Vite proxy config pointing `/api` at the local Fastify port.
- The prod build requires the backend to serve the static frontend directory (e.g. via `@fastify/static`), with a build step ordering: build the frontend first, then start the backend pointing at the built assets.
- The project is locked into a single-process deployment model — there's no built-in path to independently scale or deploy the API separately from the frontend without revisiting this decision.
- No CORS configuration is needed in prod since frontend and API are same-origin, simplifying the security posture.
