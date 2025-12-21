import type { FC } from 'react';
import { Title, Text, Stack } from '@mantine/core';
import { MainLayout } from '../../components/layout/MainLayout';

export const AutonomousAgentsPage: FC = () => {
  return (
    <MainLayout>
      <Stack gap="lg">
        <Title order={1}>Autonomous Agents</Title>
        <Text>Autonomous Agents Page - Coming Soon</Text>
      </Stack>
    </MainLayout>
  );
};
