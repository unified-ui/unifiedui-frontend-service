import type { FC } from 'react';
import { Title, Text, Stack } from '@mantine/core';
import { MainLayout } from '../../components/layout/MainLayout';

export const WidgetDesignerPage: FC = () => {
  return (
    <MainLayout>
      <Stack gap="lg">
        <Title order={1}>Widget Designer</Title>
        <Text>Widget Designer Page - Coming Soon</Text>
      </Stack>
    </MainLayout>
  );
};
