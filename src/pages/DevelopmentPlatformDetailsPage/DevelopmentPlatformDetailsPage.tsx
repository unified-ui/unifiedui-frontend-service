import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Center, Loader, Stack, Text, Button, Alert } from '@mantine/core';
import { IconAlertCircle, IconArrowLeft } from '@tabler/icons-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { useIdentity } from '../../contexts';
import type { DevelopmentPlatformResponse } from '../../api/types';
import classes from './DevelopmentPlatformDetailsPage.module.css';

export const DevelopmentPlatformDetailsPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { apiClient, selectedTenant } = useIdentity();
  
  const [platform, setPlatform] = useState<DevelopmentPlatformResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlatform = async () => {
      if (!apiClient || !selectedTenant || !id) return;

      setIsLoading(true);
      setError(null);

      try {
        const data = await apiClient.getDevelopmentPlatform(selectedTenant.id, id);
        setPlatform(data);
      } catch (err) {
        console.error('Error fetching development platform:', err);
        setError('Failed to load development platform');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlatform();
  }, [apiClient, selectedTenant, id]);

  if (isLoading) {
    return (
      <MainLayout>
        <Center style={{ height: '100%', minHeight: 400 }}>
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text c="dimmed">Loading development platform...</Text>
          </Stack>
        </Center>
      </MainLayout>
    );
  }

  if (error || !platform) {
    return (
      <MainLayout>
        <Center style={{ height: '100%', minHeight: 400 }}>
          <Stack align="center" gap="md">
            <Alert icon={<IconAlertCircle size={16} />} color="red" title="Error">
              {error || 'Development platform not found'}
            </Alert>
            <Button
              leftSection={<IconArrowLeft size={16} />}
              variant="light"
              onClick={() => navigate('/development-platforms')}
            >
              Back to Development Platforms
            </Button>
          </Stack>
        </Center>
      </MainLayout>
    );
  }

  if (!platform.iframe_url) {
    return (
      <MainLayout>
        <Center style={{ height: '100%', minHeight: 400 }}>
          <Stack align="center" gap="md">
            <Alert icon={<IconAlertCircle size={16} />} color="yellow" title="No URL configured">
              This development platform has no iframe URL configured.
            </Alert>
            <Button
              leftSection={<IconArrowLeft size={16} />}
              variant="light"
              onClick={() => navigate('/development-platforms')}
            >
              Back to Development Platforms
            </Button>
          </Stack>
        </Center>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className={classes.container}>
        <iframe
          src={platform.iframe_url}
          className={classes.iframe}
          title={platform.name}
        />
      </div>
    </MainLayout>
  );
};
