import { type FormEvent, type FC, useState } from 'react';
import { Button, Group, Paper, SegmentedControl, Stack, Text, TextInput, Title } from '@mantine/core';
import { IconCirclePlus } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '@unified-ui/custom-api';
import { TodoListItem } from '../components/TodoListItem';
import { useTodos, type TodoFilter } from '../hooks/useTodos';
import classes from './TodoPage.module.css';

export const TodoPage: FC = () => {
  const { t } = useTranslation('custom-test');
  const [title, setTitle] = useState('');
  const {
    todos,
    visibleTodos,
    filter,
    setFilter,
    addTodo,
    toggleTodo,
    deleteTodo,
    clearCompleted,
  } = useTodos();

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    addTodo(title);
    setTitle('');
  };

  const remainingCount = todos.filter(todo => !todo.completed).length;
  const completedCount = todos.length - remainingCount;

  return (
    <MainLayout>
      <section className={classes.page}>
        <Stack gap="lg" className={classes.content}>
          <div>
            <Title order={1}>{t('title')}</Title>
            <Text c="dimmed">{t('description')}</Text>
          </div>
          <Paper className={classes.todoPanel}>
            <form onSubmit={handleSubmit}>
              <Group align="flex-end" wrap="nowrap">
                <TextInput
                  className={classes.todoInput}
                  label={t('inputLabel')}
                  placeholder={t('inputPlaceholder')}
                  value={title}
                  maxLength={160}
                  onChange={event => setTitle(event.currentTarget.value)}
                />
                <Button type="submit" leftSection={<IconCirclePlus size={18} />} disabled={!title.trim()}>
                  {t('add')}
                </Button>
              </Group>
            </form>
            <Group justify="space-between" className={classes.toolbar}>
              <SegmentedControl
                value={filter}
                onChange={value => setFilter(value as TodoFilter)}
                data={[
                  { value: 'all', label: t('all') },
                  { value: 'open', label: t('open') },
                  { value: 'completed', label: t('completed') },
                ]}
              />
              <Text size="sm" c="dimmed">{t('remaining', { count: remainingCount })}</Text>
            </Group>
            <Stack gap="xs" className={classes.todoList}>
              {visibleTodos.length === 0 ? (
                <Text className={classes.emptyState}>{t('empty')}</Text>
              ) : visibleTodos.map(todo => (
                <TodoListItem
                  key={todo.id}
                  todo={todo}
                  deleteLabel={t('delete')}
                  onToggle={toggleTodo}
                  onDelete={deleteTodo}
                />
              ))}
            </Stack>
            <Group justify="flex-end">
              <Button variant="subtle" color="red" disabled={completedCount === 0} onClick={clearCompleted}>
                {t('clearCompleted')}
              </Button>
            </Group>
          </Paper>
        </Stack>
      </section>
    </MainLayout>
  );
};
