import type { FC } from 'react';
import { Stack, Text } from '@mantine/core';
import classes from './Sidebar.module.css';

export const Sidebar: FC = () => {
  return (
    <aside className={classes.sidebar}>
      <Stack gap="md" p="md">
        <Text size="sm" fw={600}>Sidebar</Text>
        <Text size="xs" c="dimmed">Navigation Links</Text>
        <Text size="xs" c="dimmed">Menu Items</Text>
      </Stack>
    </aside>
  );
};
