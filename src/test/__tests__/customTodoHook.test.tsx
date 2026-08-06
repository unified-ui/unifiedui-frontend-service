import { type FC } from 'react';
import { Button, Text } from '@mantine/core';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTodos } from '../../../custom.example/hooks/useTodos';
import { renderWithProviders } from '../utils';

const TodoHarness: FC = () => {
  const { todos, visibleTodos, addTodo, toggleTodo, clearCompleted } = useTodos();
  return (
    <>
      <Button onClick={() => addTodo('Write extension')}>Add</Button>
      <Button onClick={() => todos[0] && toggleTodo(todos[0].id)}>Toggle</Button>
      <Button onClick={clearCompleted}>Clear</Button>
      {visibleTodos.map(todo => <Text key={todo.id}>{`${todo.title}:${todo.completed}`}</Text>)}
    </>
  );
};

describe('useTodos', () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: vi.fn((key: string) => values.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => values.set(key, value)),
        removeItem: vi.fn((key: string) => values.delete(key)),
        clear: vi.fn(() => values.clear()),
        key: vi.fn((index: number) => [...values.keys()][index] ?? null),
        get length() {
          return values.size;
        },
      },
    });
  });

  it('adds, completes, and clears local tasks', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TodoHarness />);

    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(screen.getByText('Write extension:false')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Toggle' }));
    expect(screen.getByText('Write extension:true')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.queryByText(/Write extension/)).not.toBeInTheDocument();
  });
});
