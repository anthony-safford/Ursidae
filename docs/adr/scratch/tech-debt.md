# Technical Debt & Deferred Decisions

Tracks intentional shortcuts taken to keep individual features scoped. Check this file before doing related work so a shortcut isn't mistaken for permanent architecture.

## `scripts/` is not covered by lint or format checks

`npm run lint` only targets `src` and `server`; `npm run format:check` only targets `src`. The
`scripts/` directory (epic/issue automation, see `CONTRIBUTING.md`) is plain Node ESM and isn't
linted or format-checked by CI or `lint-staged`. Revisit if `scripts/` grows enough to warrant
its own ESLint flat-config block and tsconfig project.
