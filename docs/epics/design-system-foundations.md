# Design system foundations

<!-- slug: design-system-foundations -->

Extracts the generic, reusable design-system and layout work from the in-progress
`epic/30/financial-hub` branch into its own standalone epic off `main`, so other tools (starting
with the Tasks canvas) can adopt the same visual language without depending on financial-hub's
unfinished, finance-specific work. Built from financial-hub's own commits via `git cherry-pick`
(financial-hub's branch and history are untouched), split where a commit mixed generic and
finance-specific changes.

## Design tokens, brand font, and default icon set

Add the Tailwind `@theme` design tokens (colors, fonts, spacing, radius) to `src/index.css`, the
self-hosted brand font, and Phosphor icons as the default icon set. Update the landing, not-found,
tool, and example pages to consume the new tokens.

## Breadcrumb nav and layout rework

Rework the top-level nav into a breadcrumb-style bar and update the surrounding page layout to
match, driven by the tool registry.

## Reusable draggable/resizable tile grid

Add generic `Tile` and `TileGrid` components (built on `react-grid-layout`) for equal-size
dashboard tiles that can be dragged to reorder and resized, plus the danger-color tokens and
testing-library configuration they need.
