# Design documentation

The design system for Urisdae: what the interface is made of, and how it is expected to behave.

## What lives here vs. in `docs/adr/`

**ADRs record architectural decisions** — choices about stack, structure, and persistence that are
expensive to reverse, each capturing the alternatives that lost and why. They are dated, numbered,
and superseded rather than edited.

**These documents record design intent** — the visual vocabulary and the interaction conventions
every tool is built from. They are living documents: edited in place as the system grows, not
superseded. A change here does not need a new numbered record, it needs an edit and a reason in the
commit message.

If a decision is about _how the app is built_, it is an ADR. If it is about _how the app looks or
behaves_, it belongs here.

## Contents

| Document                         | Covers                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------ |
| [foundations.md](foundations.md) | Design tokens, typography, spacing, shape, iconography — the raw material            |
| [interaction.md](interaction.md) | How controls communicate: affordance placement, keyboard conventions, icon restraint |

## Scope

These conventions apply to every tool in the collection. A tool may extend the system — a new
semantic color, a tool-specific component — but should not contradict it. Where a tool needs to
break a convention, note why in the tool's own epic document.

The tokens described in [foundations.md](foundations.md) are implemented in `src/index.css` as a
Tailwind v4 `@theme` block; that file is the source of truth for the actual values, and these
documents explain the intent behind them.
