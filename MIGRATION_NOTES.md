# Migration Notes

**Overall confidence:** 0%  
**Recommendation:** REVIEW RECOMMENDED

---

## What was migrated

- `app.js` → `src/App.tsx` (87% confidence)
- `index.html` → `src/Index.html.tsx` (78% confidence) ⚠️ needs review

## Components that could not be automatically migrated

These components require manual implementation. The migrated code contains
`MIGRATION_NOTE` comments at the relevant locations.

### `Backbone.LocalStorage (new Backbone.LocalStorage('backbone-todos'))` in `app.js`
**Reason:** This is a Backbone-specific sync adapter that overrides Backbone.sync to read/write the browser localStorage keyed by 'backbone-todos', including id generation. It has no direct equivalent in React/Vue and cannot be auto-translated.
**Suggestion:** Manually reimplement persistence: on app mount, JSON.parse localStorage.getItem('backbone-todos') to seed state; on every add/toggle/delete, JSON.stringify the todos array back to the same key. Generate ids client-side (crypto.randomUUID() or a counter). Optionally use a small library like 'use-local-storage' (React) or 'useLocalStorage' from VueUse.

### `#item-template (Underscore template)` in `app.js`
**Reason:** The actual template markup lives in an inline <script id='item-template'> in index.html, not in this JS file, so its structure is unknown from this file alone.
**Suggestion:** Extract the #item-template HTML from index.html and manually convert it to the target component's JSX/template, binding {title} and the done/checked state and wiring the .toggle and .destroy interactions.

### `index.html (as-is shell)` in `index.html`
**Reason:** Not truly unmigrable, but it is only scaffolding — the meaningful application behavior is defined in app.js, which is not provided. Full migration cannot be completed from this file alone.
**Suggestion:** Obtain and analyze app.js to extract the Model/Collection schema, Views, event wiring, and any Backbone.Router. This HTML converts cleanly into a root React/Vue component tree once app.js logic is understood.

## Files requiring manual review

These files were migrated but scored below the confidence threshold.
Review them carefully before merging.

### `index.html`
Confidence: 78%
Issues:
  - [info] The MIGRATION_NOTE comment still falsely claims legacy Backbone.LocalStorage data remains readable. Backbone.LocalStorage stores an id-list string under 'backbone-todos' plus per-model blobs under 'backbone-todos-<id>', so loadTodos() JSON.parse fails and returns [], silently dropping legacy data. The Expert conceded the concern but has not yet applied a fix — the comment must be corrected (Option A) or a real importer added (Option B).
