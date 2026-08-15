# Freeform Tasks canvas #38

<!-- slug: tasks-canvas -->

A new "Tasks" tool for capturing unplanned, untracked work as cards on a freeform, pannable
canvas, with connector lines showing order, dependency, and other relationships between tasks
and their sub-tasks. Built on `@xyflow/react` for the canvas, with a real Fastify + Drizzle +
SQLite backend per-tool from the start, following the existing `example` tool's scaffold and
ADR-0003's persistence conventions — so tasks, sub-tasks, and links actually persist across
reloads rather than living only in client memory.

## Tasks tool scaffold: schema, backend routes, and a rendered list #39

Add `server/tools/tasks/` with a Drizzle schema for tasks and task links, a connection factory,
`drizzle.config.ts`, and migrations, plus Fastify CRUD routes registered in `server/app.ts`. Add
a `tasks` entry to the tool registry and a minimal `TasksToolPage` that fetches and renders tasks
as a plain list, proving DB → API → UI end-to-end before any canvas work begins.

## React Flow canvas with draggable, position-persisting cards #40

Add `@xyflow/react` and build a canvas component that renders existing tasks as pannable,
zoomable nodes at their persisted x/y position. Wire node-drag-stop to persist the new position
back to the API so layout survives a reload.

## Create, edit, and delete tasks from the canvas UI #41

Add an "Add Task" toolbar action and an edit panel for title, description, questions, and
status, plus delete-from-card, all persisting through the routes added in the first feature.

## Sub-tasks #42

Support a parent/child relationship end-to-end: creating a sub-task from a parent card,
rendering it as a smaller node with an auto-drawn hierarchy connector to its parent, and
cascade-deleting sub-tasks (and any links referencing them) when a parent task is deleted.

## Links between tasks #43

Implement CRUD for relationship links between any two tasks, drag-to-connect handles on cards, a
relationship-type picker (blocks/related/order), distinctly styled connector lines per type, and
edge deletion.

## Canvas polish and empty/error states #44

Empty-canvas call-to-action, fit-view and minimap controls, a delete confirmation step, and
visible error handling when a persistence call fails.
