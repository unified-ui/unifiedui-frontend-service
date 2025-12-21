import type { FC } from 'react';
import { Container, Title, Text, Stack } from '@mantine/core';
import classes from './DashboardPage.module.css';

export const DashboardPage: FC = () => {
  return (
    <Container size="xl" className={classes.container}>
      <Stack gap="lg">
        <Title order={1}>Dashboard</Title>
        <Text>Dashboard Page - Coming Soon</Text>
      </Stack>
    </Container>
  );
};
