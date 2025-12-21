import type { FC } from 'react';
import { Container, Title, Text, Stack } from '@mantine/core';
import classes from './AutonomousAgentsPage.module.css';

export const AutonomousAgentsPage: FC = () => {
  return (
    <Container size="xl" className={classes.container}>
      <Stack gap="lg">
        <Title order={1}>Autonomous Agents</Title>
        <Text>Autonomous Agents Page - Coming Soon</Text>
      </Stack>
    </Container>
  );
};
