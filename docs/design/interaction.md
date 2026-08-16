# Interaction conventions

How controls communicate what they do — _before_ they are clicked.

[foundations.md](foundations.md) covers what the interface is made of. This covers how it behaves,
and the reasoning is one idea: **an affordance should explain itself by where it sits and which way
it points, not by a tooltip, a label, or trial and error.** A control that has to be tried once to
be understood is a control that was placed wrong.

---

## 1. A control points at its result

**A control sits where the thing it affects will appear, and its glyph carries the direction of that
movement.**

Position is the strongest signal an interface has. A symbol placed beside a list implies the result
lands beside it; a symbol below implies below. When placement contradicts behavior, the user learns
the control by being surprised by it.

### Rules

- A control that **appends to a list** sits at the **start of the row below the last item** — the
  position the new item will occupy. Not trailing the section label, not right-aligned beside the
  input.
- A control whose result appears **elsewhere in a hierarchy** uses a **directional glyph** matching
  that movement: `↳` or an elbow connector for creating a child (down and away from the parent).
- A bare `+` is reserved for cases where **the new item appears exactly where the `+` sits**.
- Where a structural relationship is already drawn — a tree, a connector line — **the drawn
  structure anchors the control**: the add affordance terminates the branch rather than floating
  beside it.
- Destructive controls sit **away from constructive ones**, not adjacent in the same cluster.

### Example

The Tasks card's add-question control originally sat to the right of its input:

```
Add a question…                    +      ✗  implies a second question appears beside it
```

The new question actually appears _below_. Corrected, the control leads the row it creates:

```
? Big jork?                        ×
? Little jork?                     ×
+ Add a question…                  ↵      ✓  sits where the new row will land
```

And sub-task creation, whose result is a new node below and to the side, uses the elbow rather than
a second `+`:

```
↳ Sub-task                                ✓  branches down and away
```

---

## 2. Submit is always Enter, and says so

**Any form that adds or saves commits on Enter, and its submit button shows the `↵` glyph.**

A keyboard shortcut nobody can discover gets used only by whoever wrote it. Putting the glyph on the
button makes the shortcut part of the control's appearance, so the pointer path and the keyboard
path are visibly the same action.

### Rules

- Applies to **modal forms and inline single-field rows alike** — Add Task, Add Sub-task, the
  link-type picker, the in-card question row.
- The submit button renders its label with a trailing `↵`:

  ```
  ┌──────────────┐
  │  SAVE    ↵   │
  └──────────────┘
  ```

- **`Escape` dismisses** the same form without saving.
- The `↵` glyph is **decorative for assistive tech** (`aria-hidden="true"`); the button's accessible
  name stays the plain label — "Save", "Add Task".
- **Exception — textareas.** Where the focused control legitimately consumes Enter (a multi-line
  description), Enter inserts a newline. Those forms keep an explicit submit button, still marked
  with `↵` for the pointer path, and may offer `Cmd/Ctrl + Enter` to submit.
- A disabled submit (empty required field) still shows the glyph; the shortcut is inert for the same
  reason the button is.

---

## 3. Icon restraint

**At most two icon-only controls sit adjacent in a header or row.**

Three glyphs in a row stop reading as three distinct affordances and start reading as texture. The
Tasks card header originally carried a status chevron, an add-sub-task plus, and a delete trash all
in sequence — none of which indicated where its effect would land.

### Rules

- Beyond two adjacent controls, move them to a **hover-revealed footer or action bar with text
  labels**.
- **Destructive actions are labelled**, never icon-only. "Delete" costs a few pixels and removes an
  entire class of mistake.
- A control that only appears on hover must still be **reachable by keyboard** — reveal on
  `:focus-within` as well as `:hover`.
- Prefer **removing a control** over hiding it in an overflow menu. If it is worth building, it is
  worth placing; if it is not worth placing, question whether it belongs.

---

## 4. Destructive actions confirm

Any action that **cascades** — deleting a task also deletes its sub-tasks, their questions, and any
links referencing them — requires a confirmation step that **names the cascade** rather than asking
a generic "Are you sure?".

Non-cascading, easily-repeated actions (removing a single question) do not need confirmation; they
need to fail visibly and restore themselves if the server rejects them.

---

## 5. Failure is visible, and optimistic updates roll back

Optimistic UI is the default: the interface updates immediately and reconciles with the server
after. That trade is only honest if failure is surfaced.

- A failed persistence call **shows a message in the UI**, never only `console.error`.
- An optimistic change that fails **restores the previous state** and says so.
- Error copy states **what failed and what happened to the data** — "Failed to delete the task. It
  has been restored." — not an apology or a raw status code.
- Where the API returns a message in the shared error shape from ADR-0004, that message is what the
  user sees; the generic fallback is for network failures only.
