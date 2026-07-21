import { useState, useEffect, useRef, useCallback, type FormEvent, type ChangeEvent } from 'react';

// MIGRATION_NOTE: The original Backbone app persisted todos to LocalStorage via
// the Backbone.LocalStorage adapter under the key "backbone-todos". We preserve
// that exact key so previously stored data remains readable after migration.
const STORAGE_KEY = 'backbone-todos';

interface Todo {
  id: string;
  title: string;
  done: boolean;
}

// MIGRATION_NOTE: The original index.html defined an inline <style> block. React
// has no direct equivalent for a document-level <head> stylesheet inside a
// component, so these rules are injected once via a <style> element rendered by
// the component. The CSS selectors are preserved verbatim so any external
// stylesheet rules that also target these classes continue to apply. For a
// production app, consider moving this to a dedicated CSS/CSS-module file.
const INDEX_STYLES = `
  body { font-family: sans-serif; max-width: 400px; margin: 40px auto; }
  .done { text-decoration: line-through; color: #888; }
  li { margin: 8px 0; }
  button { margin-left: 10px; cursor: pointer; }
`;

function generateId(): string {
  // Backbone.LocalStorage generated a GUID-like id per model. crypto.randomUUID
  // is the idiomatic modern equivalent, with a fallback for older environments.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    // Defensively validate each entry so malformed storage cannot crash render.
    return parsed.filter(
      (t): t is Todo =>
        typeof t === 'object' &&
        t !== null &&
        typeof (t as Todo).id === 'string' &&
        typeof (t as Todo).title === 'string' &&
        typeof (t as Todo).done === 'boolean',
    );
  } catch {
    // Corrupt JSON or unavailable storage — start fresh rather than crash.
    return [];
  }
}

function saveTodos(todos: Todo[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // Storage may be full or disabled (e.g. private mode). Fail silently as the
    // original app had no error handling here either.
  }
}

/**
 * TodoItem replaces the Underscore <script type="text/template" id="item-template">.
 * MIGRATION_NOTE: The class names (.toggle, .done, .destroy) and DOM nesting are
 * preserved verbatim so the source stylesheet rules keep applying. The original
 * template rendered the .destroy button with text "Delete"; that is preserved.
 */
interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDestroy: (id: string) => void;
}

function TodoItem({ todo, onToggle, onDestroy }: TodoItemProps) {
  return (
    <li>
      <input
        type="checkbox"
        className="toggle"
        checked={todo.done}
        onChange={() => onToggle(todo.id)}
      />
      <span className={todo.done ? 'done' : ''}>{todo.title}</span>
      <button type="button" className="destroy" onClick={() => onDestroy(todo.id)}>
        Delete
      </button>
    </li>
  );
}

/**
 * Index is the single-page Backbone Todo app migrated to React. It mirrors the
 * #todoapp mount point, the #todo-form add form, and the #todo-list list from
 * the original index.html.
 */
export default function Index() {
  const [todos, setTodos] = useState<Todo[]>(() => loadTodos());
  const [newTitle, setNewTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // MIGRATION_NOTE: Backbone.LocalStorage persisted on every model save/destroy.
  // We replicate that by syncing the whole list to storage whenever it changes.
  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const title = newTitle.trim();
      // The original <input required> prevented empty submissions; we replicate.
      if (!title) {
        return;
      }
      setTodos((prev) => [...prev, { id: generateId(), title, done: false }]);
      setNewTitle('');
      inputRef.current?.focus();
    },
    [newTitle],
  );

  const handleTitleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setNewTitle(e.target.value);
  }, []);

  const handleToggle = useCallback((id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
  }, []);

  const handleDestroy = useCallback((id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <>
      <style>{INDEX_STYLES}</style>
      <div id="todoapp">
        <h1>Todos</h1>
        <form id="todo-form" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            id="new-todo"
            placeholder="What needs to be done?"
            required
            value={newTitle}
            onChange={handleTitleChange}
          />
          <button type="submit">Add</button>
        </form>
        <ul id="todo-list">
          {todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={handleToggle}
              onDestroy={handleDestroy}
            />
          ))}
        </ul>
      </div>
    </>
  );
}
