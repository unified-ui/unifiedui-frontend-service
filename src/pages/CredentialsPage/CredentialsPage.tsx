import type { FC } from 'react';
import { Title, Text, Stack } from '@mantine/core';
import { MainLayout } from '../../components/layout/MainLayout';

export const CredentialsPage: FC = () => {
  return (
    <MainLayout>
      <Stack gap="lg">
        <Title order={1}>Credentials</Title>
        <Text>Credentials Page - Coming Soon</Text>
      </Stack>
    </MainLayout>
  );
};
