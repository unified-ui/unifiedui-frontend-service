import type { FC } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Center, Stack, Text, Loader } from '@mantine/core';
import { useTranslation } from 'react-i18next';

export const EmbedChatPage: FC = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { t } = useTranslation('common');

  if (!agentId || !token) {
    return (
      <Center h="100vh">
        <Text c="red">{t('missingAgentIdOrToken')}</Text>
      </Center>
    );
  }

  return (
    <Center h="100vh">
      <Stack align="center" gap="md">
        <Loader size="lg" />
        <Text size="sm" c="dimmed">{t('embedChatAgent', { agentId })}</Text>
        <Text size="xs" c="dimmed">{t('tokenAuthComingSoon')}</Text>
      </Stack>
    </Center>
  );
};
