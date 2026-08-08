# ADR-0001: Frontend Stack

## Status
Accepted

## Context
Urisdae is a collection of small, standalone web tools. The project needs a single frontend stack chosen up front so individual tools don't each invent their own framework, routing, or styling approach. Constraints: solo developer, local-only usage currently, TypeScript/Node tooling already in place for the rest of the repo.

## Decision
- Framework: React, built with Vite.
- Router: Wouter, using a nested URL convention of `/tools/:toolName` (the root path `/` is reserved for a landing/index page that lists available tools).
- Styling: Tailwind CSS, adopted project-wide so every tool shares one styling approach.
- Shared UI: a broader shared design system lives in a shared `components/` folder — composed, reusable patterns such as page headers, result panels, layout shell, buttons, cards, and form controls belong there. Tool-specific business logic and UI stay within each tool's own folder.

## Alternatives Considered
- Preact: smaller bundle size, but lost out to React for ecosystem maturity and versatility, which matters more given the variety of tools planned.
- React Router: the more common choice, but heavier than needed for a small collection of tool pages.
- TanStack Router: offers strong type safety, but adds more complexity/learning curve than this project needs.
- Flat routes (`/:toolName`): rejected because it doesn't reserve the root path for a hub/landing page and doesn't group tool routes as clearly.
- CSS Modules / plain CSS: rejected in favor of Tailwind to avoid each tool inventing its own styling conventions.

## Consequences
- Every new tool page follows the same `/tools/:toolName` routing pattern, making it easy to add navigation and auto-generate a tool listing.
- Wouter's minimal API means no built-in data loaders or nested route configuration; future tools needing more complex routing will require hand-rolled solutions.
- Tailwind requires configuration (tailwind.config, postcss.config) and means every tool uses utility classes rather than scoped CSS — consistent, but less flexible for one-off custom designs.
- Investing in a shared design system in `components/` adds upfront work per shared component, but reduces duplicated UI patterns as more tools are added over time.
- The project is locked into the React + Vite build chain going forward.
