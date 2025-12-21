import type { FC } from 'react';
import { Container, Title, Text, Stack } from '@mantine/core';
import classes from './CredentialsPage.module.css';

export const CredentialsPage: FC = () => {
  return (
    <Container size="xl" className={classes.container}>
      <Stack gap="lg">
        <Title order={1}>Credentials</Title>
        <Text>Credentials Page - Coming Soon</Text>
      </Stack>
    </Container>
  );
};
