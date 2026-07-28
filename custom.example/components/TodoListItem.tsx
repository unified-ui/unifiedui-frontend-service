import type { FC } from 'react';
import { ActionIcon, Checkbox, Group, Text, Tooltip } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import type { TodoItem } from '../hooks/useTodos';
import classes from '../pages/TodoPage.module.css';

interface TodoListItemProps {
  todo: TodoItem;
  deleteLabel: string;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export const TodoListItem: FC<TodoListItemProps> = ({
  todo,
  deleteLabel,
  onToggle,
  onDelete,
}) => (
  <Group className={classes.todoItem} wrap="nowrap">
    <Checkbox checked={todo.completed} onChange={() => onToggle(todo.id)} aria-label={todo.title} />
    <Text className={todo.completed ? classes.completedText : classes.todoText}>{todo.title}</Text>
    <Tooltip label={deleteLabel}>
      <ActionIcon variant="subtle" color="red" aria-label={deleteLabel} onClick={() => onDelete(todo.id)}>
        <IconTrash size={18} />
      </ActionIcon>
    </Tooltip>
  </Group>
);
