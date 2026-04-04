import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Stack,
  TextInput,
  Text,
  Group,
  UnstyledButton,
  ActionIcon,
  Loader,
  Center,
  Paper,
  Box,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconSearch, IconRefresh, IconApps } from '@tabler/icons-react';
import type { QuickListItemResponse } from '../../../api/types';
import { useIdentity } from '../../../contexts';
import { DelayedTooltip, EntityAvatar } from '../../common';
import classes from './ChatAgentSelectDialog.module.css';

interface ChatAgentSelectDialogProps {
  opened: boolean;
  onClose: () => void;
  onSelect: (chatAgent: QuickListItemResponse) => void;
}

export const ChatAgentSelectDialog: FC<ChatAgentSelectDialogProps> = ({
  opened,
  onClose,
  onSelect,
}) => {
  const { t } = useTranslation();
  const { apiClient, selectedTenant } = useIdentity();
  const [chatAgents, setChatAgents] = useState<QuickListItemResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebouncedValue(searchQuery, 300);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchChatAgents = useCallback(async (nameFilter?: string) => {
    if (!apiClient || !selectedTenant) return;

    setIsLoading(true);
    try {
      const result = await apiClient.listChatAgents(selectedTenant.id, {
        limit: 50,
        order_by: 'name',
        order_direction: 'asc',
        name: nameFilter || undefined,
        fields: 'id,name,is_active',
      });
      setChatAgents(result as QuickListItemResponse[]);
      setHasFetched(true);
    } catch (error) {
      console.error('Failed to fetch chat agents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, selectedTenant]);

  useEffect(() => {
    if (opened && !hasFetched) {
      fetchChatAgents();
    }
  }, [opened, hasFetched, fetchChatAgents]);

  useEffect(() => {
    if (opened && hasFetched) {
      fetchChatAgents(debouncedQuery || undefined);
    }
  }, [debouncedQuery, opened, hasFetched, fetchChatAgents]);

  useEffect(() => {
    if (!opened) {
      setSearchQuery('');
      setHasFetched(false);
    }
  }, [opened]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchChatAgents(debouncedQuery || undefined);
    setIsRefreshing(false);
  };

  const handleSelect = (app: QuickListItemResponse) => {
    onSelect(app);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <IconApps size={24} />
          <Text fw={600} size="lg">{t('conversations:selectChatAgent')}</Text>
        </Group>
      }
      size="lg"
      centered
    >
      <Stack gap="md">
        <Group gap="xs">
          <TextInput
            placeholder={t('conversations:searchChatAgents')}
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1 }}
            data-autofocus
          />
          <ActionIcon
            variant="subtle"
            onClick={handleRefresh}
            loading={isRefreshing}
            title={t('common:refresh')}
          >
            <IconRefresh size={18} />
          </ActionIcon>
        </Group>

        <Box className={classes.listContainer}>
          <div className={classes.scrollArea}>
            {isLoading && !hasFetched ? (
              <Center h={300}>
                <Loader size="sm" />
              </Center>
            ) : chatAgents.length === 0 ? (
              <Center h={300} className={classes.emptyState}>
                <IconApps size={40} className={classes.emptyIcon} />
                <Text size="sm" c="dimmed" mt="sm">
                  {searchQuery ? t('conversations:noChatAgentsFound') : t('conversations:noChatAgentsAvailable')}
                </Text>
              </Center>
            ) : (
              <Stack gap="xs">
                {chatAgents.map((app) => (
                  <UnstyledButton
                    key={app.id}
                    className={classes.chatAgentItem}
                    onClick={() => handleSelect(app)}
                  >
                    <Paper className={classes.chatAgentPaper} p="sm" radius="md" withBorder>
                      <Group gap="sm" wrap="nowrap">
                        <EntityAvatar entityType="chat-agent" size="sm" />
                        <DelayedTooltip label={app.name}>
                          <Text size="sm" fw={500} lineClamp={1} style={{ flex: 1 }}>
                            {app.name}
                          </Text>
                        </DelayedTooltip>
                      </Group>
                    </Paper>
                  </UnstyledButton>
                ))}
              </Stack>
            )}
          </div>
        </Box>
      </Stack>
    </Modal>
  );
};
