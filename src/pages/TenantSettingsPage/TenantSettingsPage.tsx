import type { FC } from 'react';
import { Container, Title, Text, Stack } from '@mantine/core';
import classes from './TenantSettingsPage.module.css';

export const TenantSettingsPage: FC = () => {
  return (
    <Container size="xl" className={classes.container}>
      <Stack gap="lg">
        <Title order={1}>Tenant Settings</Title>
        <Text>Tenant Settings Page - Coming Soon</Text>
      </Stack>
    </Container>
  );
};
