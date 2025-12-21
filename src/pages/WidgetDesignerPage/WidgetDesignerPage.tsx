import type { FC } from 'react';
import { Container, Title, Text, Stack } from '@mantine/core';
import classes from './WidgetDesignerPage.module.css';

export const WidgetDesignerPage: FC = () => {
  return (
    <Container size="xl" className={classes.container}>
      <Stack gap="lg">
        <Title order={1}>Widget Designer</Title>
        <Text>Widget Designer Page - Coming Soon</Text>
      </Stack>
    </Container>
  );
};
