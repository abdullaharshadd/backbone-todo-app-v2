```markdown
# backbone-todo-app-v2

A Todo application migrated from Backbone.js to React. The app allows users to create, complete, and delete todo items, with persistence handled via the browser's `localStorage`.

---

## Tech Stack

- **React** (UI layer, component state)
- **JavaScript (ES6+)**
- **HTML5 / CSS3**
- **localStorage** (client-side persistence)
- **npm** (package management)

---

## Prerequisites

- Node.js >= 16.x
- npm >= 8.x

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Environment setup

No environment variables are required for this project.

### 3. Run the application

> ⚠️ No start script was detected during migration. Verify the correct run command in `package.json` before proceeding. Common options are listed below — use whichever matches your setup:

```bash
# If using Create React App
npm start

# If using Vite
npm run dev
```

---

## Running Tests

> ⚠️ No test script was detected during migration. Check `package.json` for a `test` script. If one exists, run:

```bash
npm test
```

If no tests are present, this is a gap left from the original Backbone codebase that should be addressed.

---

## Environment Variables

No environment variables are required for this project.

| Variable | Required | Description |
|----------|----------|-------------|
| —        | —        | None defined |

---

## Architecture Overview

The migrated project replaces Backbone's Model/Collection/View pattern with a React component tree and plain JavaScript state management.

```
src/
├── components/
│   ├── TodoApp.jsx        # Root component; owns the todos state array
│   ├── TodoList.jsx       # Renders the list of TodoItem components
│   └── TodoItem.jsx       # Single todo row: title, toggle, delete
├── utils/
│   └── storage.js         # localStorage read/write helpers (replaces Backbone.LocalStorage)
├── index.js               # React DOM entry point
└── index.css
index.html                 # Static HTML shell with root mount point
```

**State management approach:**

- The `todos` array lives in `TodoApp` as React state (`useState`).
- On mount, todos are seeded from `localStorage.getItem('backbone-todos')`.
- Every add, toggle, or delete operation updates state and writes the full array back to `localStorage.setItem('backbone-todos', JSON.stringify(todos))`.
- Todo IDs are generated client-side using `crypto.randomUUID()`.

---

## Migration Notes

### What changed from the Backbone codebase

| Backbone concept | React equivalent |
|-----------------|-----------------|
| `Backbone.Model` (Todo) | Plain JavaScript object `{ id, title, completed }` held in React state |
| `Backbone.Collection` (TodoList) | `useState([])` array in `TodoApp` component |
| `Backbone.View` (AppView) | `TodoApp.jsx` root component |
| `Backbone.View` (TodoView) | `TodoItem.jsx` component |
| `Backbone.LocalStorage` sync adapter | Manual `localStorage` read/write in `utils/storage.js` |
| Underscore `#item-template` | JSX markup in `TodoItem.jsx` |
| jQuery DOM events | React `onClick` / `onChange` synthetic events |
| `Backbone.sync` lifecycle hooks | `useEffect` for persistence side effects |

### Key migration decisions

- **LocalStorage key preserved:** The storage key `'backbone-todos'` is intentionally kept the same so that existing user data is not lost after the migration.
- **ID generation:** `crypto.randomUUID()` replaces Backbone.LocalStorage's internal id generation. If the runtime does not support `crypto.randomUUID()`, substitute a counter or a library such as `uuid`.
- **No router:** If the original `app.js` included a `Backbone.Router` (e.g., for `all/active/completed` filter routes), that routing logic was not captured in the provided source files and must be reimplemented manually using React Router or a simple `useState` filter.

---

## Known Limitations

The following components could not be automatically migrated and require manual implementation:

### 1. `Backbone.LocalStorage` — `app.js`

**Reason:** This is a Backbone-specific sync adapter that overrides `Backbone.sync` to read and write browser `localStorage` under the key `'backbone-todos'`, including custom ID generation. There is no direct auto-translatable equivalent in React.

**Required action:**
Implement persistence manually in `utils/storage.js`:

```js
const STORAGE_KEY = 'backbone-todos';

export function loadTodos() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
  } catch {
    return [];
  }
}

export function saveTodos(todos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}
```

Call `loadTodos()` inside a `useEffect` on mount and `saveTodos(todos)` inside a `useEffect` that depends on the `todos` state.

---

### 2. `#item-template` (Underscore template) — `app.js` / `index.html`

**Reason:** The template markup is defined as an inline `<script id="item-template">` block in `index.html`. Because the full `app.js` was not available, the exact structure (title binding, checkbox state, destroy button) could not be automatically extracted and converted to JSX.

**Required action:**
Locate the `<script id="item-template">` block in the original `index.html`, then manually reproduce its markup as the return value of `TodoItem.jsx`, wiring:
- `{todo.title}` for display
- `checked={todo.completed}` on the toggle checkbox
- `onChange` → dispatch toggle action
- `onClick` → dispatch delete action on the destroy button

---

### 3. `index.html` shell — overall structure

**Reason:** The HTML file was the only source file fully available. Without the complete `app.js`, the full Model/Collection schema, all event bindings, and any router definitions could not be confirmed.

**Required action:**
Review the migrated components against the original Backbone source to ensure all features (filters, item counts, clear-completed button, etc.) are represented in the React component tree.

---

## Manual Review Required

The following files **must be manually reviewed** by a developer before this migration is considered complete:

| File | Reason |
|------|--------|
| `index.html` | Used as the sole structural reference; full app behavior depends on `app.js` which was not fully analyzed. Verify that all UI elements are reproduced in the React component tree. |
| `src/utils/storage.js` | `Backbone.LocalStorage` was not auto-migrated. Persistence logic must be written by hand (see Known Limitations §1). |
| `src/components/TodoItem.jsx` | The Underscore `#item-template` could not be automatically converted. JSX structure must be manually derived from the original HTML template (see Known Limitations §2). |
| `src/components/TodoApp.jsx` | Confirm that any `Backbone.Router` filter logic (`all`, `active`, `completed`) from the original `app.js` has been accounted for. |
| `package.json` | No `start` or `test` scripts were detected. Verify scripts are correctly defined before running the app or CI. |

---

## Migration Confidence

| Metric | Value |
|--------|-------|
| Overall migration confidence | 0% (auto-assessed) |
| Modules migrated | 2 / 2 |
| Modules requiring manual review | 1 (`index.html`) |
| Unmigrable components | 3 (see Known Limitations) |

> **This migration scaffold should be treated as a starting point, not a finished product.** All items in the Manual Review Required section above must be resolved before the application is considered functionally equivalent to the original Backbone implementation.
```