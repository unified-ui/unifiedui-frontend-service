import type { FC } from 'react';
import { Title, Text, Stack } from '@mantine/core';
import { MainLayout } from '../../components/layout/MainLayout';

export const DashboardPage: FC = () => {
  return (
    <MainLayout>
      <Stack gap="lg">
        <Title order={1}>Dashboard</Title>
        <Text>Dashboard Page - Content Area</Text>
        <Text size="sm" c="dimmed">
          Dies ist der Hauptinhaltsbereich. Header ist oben fix, Sidebar links fix.
        </Text>
      </Stack>
    </MainLayout>
  );
};
