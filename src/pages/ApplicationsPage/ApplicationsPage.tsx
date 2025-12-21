import type { FC } from 'react';
import { Title, Text, Stack } from '@mantine/core';
import { MainLayout } from '../../components/layout/MainLayout';

export const ApplicationsPage: FC = () => {
  return (
    <MainLayout>
      <Stack gap="lg">
        <Title order={1}>Applications</Title>
        <Text>Applications Page - Coming Soon</Text>
      </Stack>
    </MainLayout>
  );
};
