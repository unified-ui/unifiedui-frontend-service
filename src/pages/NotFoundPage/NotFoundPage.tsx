import type { FC } from 'react';
import { Container, Title, Text, Stack, Button } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import classes from './NotFoundPage.module.css';

export const NotFoundPage: FC = () => {
  const navigate = useNavigate();

  return (
    <Container size="sm" className={classes.container}>
      <Stack gap="lg" align="center" ta="center">
        <Title order={1} className={classes.title}>404</Title>
        <Title order={2}>Page Not Found</Title>
        <Text c="dimmed">Die angeforderte Seite konnte nicht gefunden werden.</Text>
        <Button onClick={() => navigate('/dashboard')} size="lg">
          Zurück zum Dashboard
        </Button>
      </Stack>
    </Container>
  );
};
