import { useEffect, useState } from 'react';

export type TodoFilter = 'all' | 'open' | 'completed';

export interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
}

const storageKey = 'unified-ui-custom-test-todos';

const isTodoItem = (value: unknown): value is TodoItem => {
  if (!value || typeof value !== 'object') return false;
  return typeof Reflect.get(value, 'id') === 'string'
    && typeof Reflect.get(value, 'title') === 'string'
    && typeof Reflect.get(value, 'completed') === 'boolean';
};

const loadTodos = (): TodoItem[] => {
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter(isTodoItem) : [];
  } catch {
    return [];
  }
};

export const useTodos = () => {
  const [todos, setTodos] = useState<TodoItem[]>(loadTodos);
  const [filter, setFilter] = useState<TodoFilter>('all');

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(todos));
  }, [todos]);

  const addTodo = (title: string): void => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    setTodos(current => [
      ...current,
      { id: crypto.randomUUID(), title: trimmedTitle, completed: false },
    ]);
  };

  const toggleTodo = (id: string): void => {
    setTodos(current => current.map(todo => (
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    )));
  };

  const deleteTodo = (id: string): void => {
    setTodos(current => current.filter(todo => todo.id !== id));
  };

  const clearCompleted = (): void => {
    setTodos(current => current.filter(todo => !todo.completed));
  };

  const visibleTodos = todos.filter(todo => {
    if (filter === 'open') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  return {
    todos,
    visibleTodos,
    filter,
    setFilter,
    addTodo,
    toggleTodo,
    deleteTodo,
    clearCompleted,
  };
};
