import { useState, useEffect, useRef, useCallback, type FormEvent } from 'react';

// MIGRATION_NOTE: The original Backbone app persisted todos to LocalStorage via
// the Backbone.LocalStorage adapter under the key "backbone-todos". We preserve
// that exact key so previously stored data remains readable after migration.
const STORAGE_KEY = 'backbone-todos';

interface Todo {
  id: string;
  title: string;
  done: boolean;
}

/**
 * MIGRATION_NOTE: Backbone.LocalStorage stored an index of model ids plus one
 * entry per model. We simplify to a single JSON array under the same key. This
 * is NOT wire-compatible with the old Backbone.LocalStorage format — if you must
 * read pre-existing production data written by Backbone.LocalStorage, add a
 * one-time migration reader here. Flagged for manual review.
 */
function loadTodos(): Todo[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((t): t is Partial<Todo> => t != null && typeof t === 'object')
      .map((t) => ({
        id: typeof t.id === 'string' ? t.id : makeId(),
        title: typeof t.title === 'string' ? t.title : '',
        done: typeof t.done === 'boolean' ? t.done : false,
      }));
  } catch (err) {
    // Corrupt storage should not crash the app; start empty.
    console.error('Failed to load todos from localStorage:', err);
    return [];
  }
}

function saveTodos(todos: Todo[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch (err) {
    // Quota exceeded or storage disabled (e.g. private mode).
    console.error('Failed to save todos to localStorage:', err);
  }
}

// Hardened id generator: crypto.randomUUID() is only available in secure
// contexts, so we fall back to a timestamp+random id otherwise.
function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * useTodos encapsulates the Backbone Model + Collection + LocalStorage logic.
 * - Pure functional updaters preserve batching correctness.
 * - A hydrated-ref guard prevents the save effect from overwriting storage
 *   before the initial fetch/hydration has completed (mirrors Backbone.fetch()).
 */
function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const hydrated = useRef(false);

  // Equivalent to Todos.fetch() on AppView.initialize — hydrate once on mount.
  useEffect(() => {
    setTodos(loadTodos());
    hydrated.current = true;
  }, []);

  // Persist whenever todos change, but only after hydration.
  useEffect(() => {
    if (!hydrated.current) return;
    saveTodos(todos);
  }, [todos]);

  // Todos.create({ title }) — instantiate + persist.
  const createTodo = useCallback((rawTitle: string) => {
    const title = rawTitle.trim();
    if (!title) return; // matches AppView.createTodo guard
    setTodos((prev) => [...prev, { id: makeId(), title, done: false }]);
  }, []);

  // Todo.toggle() -> save({ done: !done })
  const toggleTodo = useCallback((id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }, []);

  // model.destroy()
  const clearTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { todos, createTodo, toggleTodo, clearTodo };
}

// TodoView -> <li>. DOM structure mirrors the source #item-template so existing
// CSS selectors (.toggle, .destroy, .done) continue to apply unchanged.
interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onClear: (id: string) => void;
}

function TodoItem({ todo, onToggle, onClear }: TodoItemProps) {
  return (
    <li className={todo.done ? 'done' : ''}>
      <div className="view">
        <input
          className="toggle"
          type="checkbox"
          checked={todo.done}
          onChange={() => onToggle(todo.id)}
        />
        <label>{todo.title}</label>
        <button className="destroy" onClick={() => onClear(todo.id)} />
      </div>
    </li>
  );
}

// AppView -> the #todoapp root element and its #todo-form submit handler.
export default function App() {
  const { todos, createTodo, toggleTodo, clearTodo } = useTodos();
  const [newTodo, setNewTodo] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    createTodo(newTodo);
    setNewTodo(''); // clear input, mirroring this.$input.val('')
  };

  return (
    <section id="todoapp">
      <header>
        <h1>todos</h1>
        <form id="todo-form" onSubmit={handleSubmit}>
          <input
            id="new-todo"
            placeholder="What needs to be done?"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            autoFocus
          />
        </form>
      </header>
      <section id="main">
        <ul id="todo-list">
          {todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={toggleTodo}
              onClear={clearTodo}
            />
          ))}
        </ul>
      </section>
    </section>
  );
}
