import type { FC } from 'react';
import { useState, useEffect, useMemo } from 'react';
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
import { useSidebarData } from '../../../contexts/SidebarDataContext';
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
  const { chatAgents, loadingStates, fetchChatAgents, refreshChatAgents, hasFetched } = useSidebarData();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebouncedValue(searchQuery, 300);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (opened && !hasFetched('chat-agents')) {
      fetchChatAgents();
    }
  }, [opened, hasFetched, fetchChatAgents]);

  useEffect(() => {
    if (!opened) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchQuery('');
    }
  }, [opened]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshChatAgents();
    setIsRefreshing(false);
  };

  const filteredChatAgents = useMemo(() => {
    if (!debouncedQuery.trim()) return chatAgents;
    
    const query = debouncedQuery.toLowerCase();
    return chatAgents.filter(app => 
      app.name.toLowerCase().includes(query)
    );
  }, [debouncedQuery, chatAgents]);

  const handleSelect = (app: QuickListItemResponse) => {
    onSelect(app);
    onClose();
  };

  const isLoading = loadingStates['chat-agents'] && !hasFetched('chat-agents');

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
      size="md"
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
            {isLoading ? (
              <Center h={300}>
                <Loader size="sm" />
              </Center>
            ) : filteredChatAgents.length === 0 ? (
              <Center h={300} className={classes.emptyState}>
                <IconApps size={40} className={classes.emptyIcon} />
                <Text size="sm" c="dimmed" mt="sm">
                  {searchQuery ? t('conversations:noChatAgentsFound') : t('conversations:noChatAgentsAvailable')}
                </Text>
              </Center>
            ) : (
              <Stack gap="xs">
                {filteredChatAgents.map((app) => (
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
