# Visual foundations

**Direction: dark, modern, terminal-influenced.**

Not a terminal emulator pastiche — a modern interface that borrows the terminal's discipline: sharp
edges, monospace type, dense information, restraint with color. Implemented in `src/index.css` as a
Tailwind v4 `@theme` block, which is the source of truth for values. This document explains intent.

## Color

| Token                   | Value       | Role                                                |
| ----------------------- | ----------- | --------------------------------------------------- |
| `--color-bg`            | `#2C3E50`   | Off-dark navy — page background, and canvas ground  |
| `--color-surface`       | `#34495E`   | Header, nav, cards — one step lighter than the bg   |
| `--color-border`        | `#2C3E50`   | Dividers between surface elements                   |
| `--color-border-lit`    | `#47606E`   | Edges of a surface sitting directly on `--color-bg` |
| `--color-text`          | `#FFFFFF`   | Primary text — full contrast, not softened          |
| `--color-text-muted`    | `#ECF0F199` | Secondary text — light color, reduced opacity       |
| `--color-accent`        | `#1ABC9C`   | Teal — primary actions, active states               |
| `--color-accent-hover`  | `#16A085`   | Deeper teal — hover/pressed                         |
| `--color-danger`        | `#E74C3C`   | Destructive actions                                 |
| `--color-danger-hover`  | `#C0392B`   | Hover/pressed danger                                |
| `--color-warning`       | `#F39C12`   | Cautionary emphasis, third semantic channel         |
| `--color-warning-hover` | `#E67E22`   | Hover/pressed warning                               |

**Elevation is a color relationship, not a shadow.** A surface reads as lifted because it is one
step lighter than what sits behind it. This only works if the two layers actually differ — placing
a `--color-surface` element on a `--color-surface` container produces a flat, invisible object no
border can rescue. When nesting surfaces, step the ground _down_ to `--color-bg` rather than
matching.

**`--color-border` disappears on a `--color-bg` ground — that's by design, not a bug.**
`--color-border` and `--color-bg` are the same navy on purpose, so a hairline divider between two
elements that already sit on a `--color-surface` parent reads as a quiet seam, not a hard rule. But
that means `--color-border` is the wrong choice for the _outer_ edge of a surface floating directly
on `--color-bg` (a card on a canvas, a panel on the page) — the edge would vanish. Use
`--color-border-lit` there instead, and pair it with a soft shadow so the surface reads as an object
sitting on the ground rather than a hole cut into it.

**Accent is for one thing per view.** One filled-accent primary action; everything else is ghost or
outline. Accent also marks active state and current selection. If accent appears three times in a
viewport, two of them are decoration.

**Semantic color is separate from accent.** Danger and warning carry meaning (destructive,
cautionary) and are never used because they look good. Where a set of categories needs distinct
colors and the semantic palette runs out, prefer adding a redundant encoding — a dash pattern, a
glyph — over inventing hues, so the distinction survives for colorblind users.

## Typography

| Token            | Family                                   | Role                                |
| ---------------- | ---------------------------------------- | ----------------------------------- |
| `--font-heading` | `Departure Mono`, `JetBrains Mono`, mono | Headings, large labels, card titles |
| `--font-body`    | `JetBrains Mono`, mono                   | Body copy, UI text                  |
| `--font-mono`    | `JetBrains Mono`, mono                   | Code, data — same family as body    |

**Departure Mono** is self-hosted from `public/fonts/` (SIL OFL, license included). It is a pixel
display face and renders crisp at multiples of 11px (11, 22, 33…); other sizes look soft. Size
headings accordingly.

**JetBrains Mono** loads from Google Fonts in `index.html`.

**Uppercase + tracked labels** for nav items, field labels, buttons, and status: `COUNT`, not
`Count`, with `letter-spacing: 0.05–0.1em`. This is the system's most recognizable texture — it is
what makes mono type read as deliberate rather than as a default.

Use `font-variant-numeric: tabular-nums` wherever digits align in columns.

## Spacing

`--spacing-xs: 4px` · `--spacing-sm: 8px` · `--spacing-md: 16px` · `--spacing-lg: 24px` ·
`--spacing-xl: 32px`

Lay out sibling groups with flex/grid and `gap` rather than per-element margins, so spacing stays
predictable and does not collapse or double.

## Shape

`--radius-brand: 4px` — deliberately sharp, down from an earlier 8px, to reinforce the
terminal/technical direction. Applies everywhere: cards, buttons, pills, inputs, avatars. There is
one radius; resist adding a second.

## Iconography

**Phosphor icons** are the default set. Weight `bold` generally reads better against the blocky
monospace letterforms than `regular` — check side by side when introducing a new icon at a new size.

Icons are sized in the 10–20px range and inherit `currentColor` so they pick up the surrounding
text color and its hover transition. Placement and restraint rules live in
[interaction.md](interaction.md).

## Structural rules

These are patterns applied consistently, not per-component styling decisions.

- **Active nav/tab state is a left accent border**, not a filled pill: `border-left: 2px solid
var(--color-accent)` plus a faint tinted background. Reads as a terminal-style selection
  indicator and suits sharp corners better than a rounded pill.
- **A hairline border separates the header from content** (`border-bottom: 1px solid
var(--color-border)`), so the header reads as a distinct elevated layer rather than a same-color
  band bleeding into the page.
- **The header is balanced on both sides.** Nav and logo do not sit alone on the left with empty
  space on the right; a search trigger (with a `⌘K` hint), settings, and an avatar give it
  structure.
- **Data values are wrapped in a bordered surface card**, never left as loose floating text:
  `background: var(--color-surface)`, hairline border, `--radius-brand`.
- **One primary (filled accent) button per view.** Secondary actions are ghost/outline —
  transparent background, hairline border.
- **Third-party component chrome gets re-themed, not accepted.** Libraries that ship their own
  light-mode defaults (React Flow's controls, minimap, and attribution, for example) are re-skinned
  through their CSS custom properties to these tokens; an un-themed widget is a visible seam.
