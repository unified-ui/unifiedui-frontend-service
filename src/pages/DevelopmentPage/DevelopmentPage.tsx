import type { FC } from 'react';
import { Title, Text, Stack } from '@mantine/core';
import { MainLayout } from '../../components/layout/MainLayout';

export const DevelopmentPage: FC = () => {
  return (
    <MainLayout>
      <Stack gap="lg">
        <Title order={1}>Development</Title>
        <Text>Development Page - Coming Soon</Text>
      </Stack>
    </MainLayout>
  );
};
