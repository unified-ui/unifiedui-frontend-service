import type { FC } from 'react';
import { Title, Text, Stack, Button, Center } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/layout/MainLayout';

export const NotFoundPage: FC = () => {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <Center style={{ minHeight: '60vh' }}>
        <Stack gap="lg" align="center" ta="center">
          <Title order={1} size={72} c="primary">404</Title>
          <Title order={2}>Page Not Found</Title>
          <Text c="dimmed">Die angeforderte Seite konnte nicht gefunden werden.</Text>
          <Button onClick={() => navigate('/dashboard')} size="lg">
            Zurück zum Dashboard
          </Button>
        </Stack>
      </Center>
    </MainLayout>
  );
};
