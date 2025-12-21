import type { FC } from 'react';
import { Container, Title, Text, Stack } from '@mantine/core';
import classes from './ConversationsPage.module.css';

export const ConversationsPage: FC = () => {
  return (
    <Container size="xl" className={classes.container}>
      <Stack gap="lg">
        <Title order={1}>Conversations</Title>
        <Text>Conversations Page - Coming Soon</Text>
      </Stack>
    </Container>
  );
};
