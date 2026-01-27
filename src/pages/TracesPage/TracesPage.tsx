import type { FC } from 'react';
import { Title, Text, Stack, Center, Paper, ThemeIcon } from '@mantine/core';
import { IconGitBranch } from '@tabler/icons-react';
import { MainLayout } from '../../components/layout/MainLayout';
import classes from './TracesPage.module.css';

export const TracesPage: FC = () => {
  return (
    <MainLayout>
      <Stack gap="lg" className={classes.container}>
        <Title order={1}>Traces</Title>
        <Paper p="xl" className={classes.placeholder}>
          <Center>
            <Stack align="center" gap="md">
              <ThemeIcon size={64} variant="light" color="gray" radius="xl">
                <IconGitBranch size={32} />
              </ThemeIcon>
              <Text size="xl" fw={500} c="dimmed">
                Tracing Dashboard Coming Soon
              </Text>
              <Text c="dimmed" ta="center" maw={400}>
                This page will provide an overview of all traces from your Chat Agents and Autonomous Agents, 
                allowing you to monitor and debug agent executions.
              </Text>
            </Stack>
          </Center>
        </Paper>
      </Stack>
    </MainLayout>
  );
};
