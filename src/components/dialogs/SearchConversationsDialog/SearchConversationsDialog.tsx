import type { FC } from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Modal,
  Stack,
  TextInput,
  Paper,
  Text,
  Group,
  Badge,
  ScrollArea,
  Box,
  UnstyledButton,
  ActionIcon,
  Loader,
  Center,
} from '@mantine/core';
import { DelayedTooltip } from '../../common';
import { useDebouncedValue } from '@mantine/hooks';
import { IconSearch, IconMessage, IconX, IconClock, IconUser, IconRobot } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type {
  ConversationResponse,
  ChatAgentResponse,
  MessageResponse,
} from '../../../api/types';
import type { UnifiedUIAPIClient } from '../../../api/client';
import classes from './SearchConversationsDialog.module.css';

interface SearchConversationsDialogProps {
  opened: boolean;
  onClose: () => void;
  conversations: ConversationResponse[];
  chatAgents: ChatAgentResponse[];
  apiClient: UnifiedUIAPIClient | null;
  tenantId: string | undefined;
  onSelectMessage: (conversationId: string, messageId: string) => void;
}

interface ConversationSearchResult {
  conversation: ConversationResponse;
  chatAgentName: string;
}

export const SearchConversationsDialog: FC<SearchConversationsDialogProps> = ({
  opened,
  onClose,
  conversations,
  chatAgents,
  apiClient,
  tenantId,
  onSelectMessage,
}) => {
  const { t } = useTranslation('conversations');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebouncedValue(searchQuery, 400);
  const [messageResults, setMessageResults] = useState<MessageResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!opened) {

      setSearchQuery('');

      setMessageResults([]);
    }
  }, [opened]);

  useEffect(() => {
    if (!debouncedQuery.trim() || !apiClient || !tenantId) {

      setMessageResults([]);
      return;
    }

    let cancelled = false;
    const fetchResults = async () => {

      setIsSearching(true);
      try {
        const response = await apiClient.searchMessages(tenantId, {
          query: debouncedQuery.trim(),
          limit: 30,
        });
        if (!cancelled) {
          setMessageResults(response.messages);
        }
      } catch {
        if (!cancelled) {
          setMessageResults([]);
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    };

    fetchResults();
    return () => { cancelled = true; };
  }, [debouncedQuery, apiClient, tenantId]);

  const conversationMap = useMemo(() => {
    const map = new Map<string, ConversationResponse>();
    conversations.forEach(conv => map.set(conv.id, conv));
    return map;
  }, [conversations]);

  const chatAgentMap = useMemo(() => {
    const map = new Map<string, string>();
    chatAgents.forEach(agent => map.set(agent.id, agent.name));
    return map;
  }, [chatAgents]);

  const getConversationName = useCallback((conversationId: string): string => {
    return conversationMap.get(conversationId)?.name || conversationId;
  }, [conversationMap]);

  const getChatAgentName = useCallback((chatAgentId: string): string => {
    return chatAgentMap.get(chatAgentId) || t('unknownAgent');
  }, [chatAgentMap, t]);

  const recentConversations = useMemo((): ConversationSearchResult[] => {
    return [...conversations]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 10)
      .map(conv => ({
        conversation: conv,
        chatAgentName: getChatAgentName(conv.chat_agent_id),
      }));
  }, [conversations, getChatAgentName]);

  const handleSelectMessage = (msg: MessageResponse) => {
    onSelectMessage(msg.conversationId, msg.id);
    onClose();
  };

  const handleSelectConversation = (conversationId: string) => {
    onSelectMessage(conversationId, '');
    onClose();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const truncateContent = (content: string, maxLength: number = 120): string => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const isShowingMessages = debouncedQuery.trim().length > 0;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <IconSearch size={24} />
          <Text fw={600} size="lg">{t('searchMessages')}</Text>
        </Group>
      }
      size="lg"
      padding="md"
      centered
    >
      <Stack gap="md">
        <TextInput
          placeholder={t('searchMessagesPlaceholder')}
          size="md"
          leftSection={<IconSearch size={20} />}
          rightSection={
            searchQuery ? (
              <ActionIcon
                variant="subtle"
                onClick={() => setSearchQuery('')}
                size="sm"
              >
                <IconX size={16} />
              </ActionIcon>
            ) : undefined
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          data-autofocus
        />

        <ScrollArea h={400} type="auto" scrollbarSize={8}>
          {isSearching ? (
            <Center h={200}>
              <Loader size="md" color="gray" />
            </Center>
          ) : isShowingMessages ? (
            messageResults.length === 0 ? (
              <Box className={classes.emptyState}>
                <IconMessage size={48} className={classes.emptyIcon} />
                <Text size="sm" c="dimmed" mt="md">
                  {t('noMessagesFound')}
                </Text>
                <Text size="xs" c="dimmed">
                  {t('tryDifferentKeywords')}
                </Text>
              </Box>
            ) : (
              <Stack gap="xs" pr="md">
                {messageResults.map((msg) => (
                  <UnstyledButton
                    key={msg.id}
                    onClick={() => handleSelectMessage(msg)}
                    className={classes.resultItem}
                  >
                    <Paper p="md" withBorder className={classes.resultPaper}>
                      <Group gap="md" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                        {msg.type === 'user' ? (
                          <IconUser size={20} className={classes.resultIcon} />
                        ) : (
                          <IconRobot size={20} className={classes.resultIcon} />
                        )}
                        <Box style={{ flex: 1, minWidth: 0 }}>
                          <Text size="sm" lineClamp={2} className={classes.messagePreview}>
                            {truncateContent(msg.content)}
                          </Text>
                          <Group gap="xs" mt={4}>
                            <Badge
                              size="xs"
                              variant="light"
                              color={msg.type === 'user' ? 'blue' : 'teal'}
                            >
                              {msg.type === 'user' ? t('userMessage') : t('assistantMessage')}
                            </Badge>
                            <DelayedTooltip label={getConversationName(msg.conversationId)}>
                              <Badge size="xs" variant="outline">
                                {getConversationName(msg.conversationId)}
                              </Badge>
                            </DelayedTooltip>
                            <Group gap={4}>
                              <IconClock size={12} />
                              <Text size="xs" c="dimmed">
                                {formatDate(msg.createdAt)}
                              </Text>
                            </Group>
                          </Group>
                        </Box>
                      </Group>
                    </Paper>
                  </UnstyledButton>
                ))}
              </Stack>
            )
          ) : (
            recentConversations.length === 0 ? (
              <Box className={classes.emptyState}>
                <IconMessage size={48} className={classes.emptyIcon} />
                <Text size="sm" c="dimmed" mt="md">
                  {t('noConversations')}
                </Text>
              </Box>
            ) : (
              <Stack gap="xs" pr="md">
                {recentConversations.map((result) => (
                  <UnstyledButton
                    key={result.conversation.id}
                    onClick={() => handleSelectConversation(result.conversation.id)}
                    className={classes.resultItem}
                  >
                    <Paper p="md" withBorder className={classes.resultPaper}>
                      <Group gap="md" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                        <IconMessage size={20} className={classes.resultIcon} />
                        <Box style={{ flex: 1, minWidth: 0 }}>
                          <DelayedTooltip label={result.conversation.name}>
                            <Text size="sm" fw={500} lineClamp={1}>
                              {result.conversation.name}
                            </Text>
                          </DelayedTooltip>
                          {result.conversation.description && (
                            <DelayedTooltip label={result.conversation.description}>
                              <Text size="xs" c="dimmed" lineClamp={1}>
                                {result.conversation.description}
                              </Text>
                            </DelayedTooltip>
                          )}
                          <Group gap="xs" mt={4}>
                            <Badge size="xs" variant="light">
                              {result.chatAgentName}
                            </Badge>
                            <Group gap={4}>
                              <IconClock size={12} />
                              <Text size="xs" c="dimmed">
                                {formatDate(result.conversation.updated_at)}
                              </Text>
                            </Group>
                          </Group>
                        </Box>
                      </Group>
                    </Paper>
                  </UnstyledButton>
                ))}
              </Stack>
            )
          )}
        </ScrollArea>

        <Text size="xs" c="dimmed" ta="center">
          {isShowingMessages
            ? t('resultsFound', { count: messageResults.length })
            : t('recentConversations', { count: recentConversations.length })}
        </Text>
      </Stack>
    </Modal>
  );
};
