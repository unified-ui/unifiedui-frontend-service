import type { FC } from 'react';
import { Title, Text, Stack } from '@mantine/core';
import { MainLayout } from '../../components/layout/MainLayout';

export const ConversationsPage: FC = () => {
  return (
    <MainLayout>
      <Stack gap="lg">
        <Title order={1}>Conversations</Title>
        <Text>Conversations Page - Coming Soon</Text>
      </Stack>
    </MainLayout>
  );
};
