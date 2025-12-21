import type { FC } from 'react';
import { Container, Title, Text, Stack } from '@mantine/core';
import classes from './ApplicationsPage.module.css';

export const ApplicationsPage: FC = () => {
  return (
    <Container size="xl" className={classes.container}>
      <Stack gap="lg">
        <Title order={1}>Applications</Title>
        <Text>Applications Page - Coming Soon</Text>
      </Stack>
    </Container>
  );
};
