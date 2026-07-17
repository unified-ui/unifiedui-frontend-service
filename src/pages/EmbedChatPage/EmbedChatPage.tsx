import type { FC } from 'react';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Center, Text, Loader, Button, Box, ActionIcon, UnstyledButton, useMantineColorScheme } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { IconMessageCircle, IconPlus, IconSun, IconMoon } from '@tabler/icons-react';
import { useAuth } from '../../auth';
import { enabledProviders } from '../../auth/authConfig';
import { useIdentity } from '../../contexts';
import { ChatView, ChatHeader, ChatEmptyState } from '../../components/chat';
import { TracingProvider, TracingSidebar, TracingVisualDialog } from '../../components/tracing';
import { useChat, useConversationTracing, useWidgetCache } from '../../hooks';
import type { ChatAgentResponse, ConversationResponse } from '../../api/types';
import classes from './EmbedChatPage.module.css';
import chatClasses from '../../components/chat/ChatEmptyState/ChatEmptyState.module.css';

export const EmbedChatPage: FC = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation('common');

  const tenantIdParam = searchParams.get('tenantId');
  const themeParam = searchParams.get('theme');

  const { isAuthenticated, isLoading: isAuthLoading, loginWithProvider } = useAuth();
  const { apiClient, selectedTenant, selectTenant, getFoundryToken, isLoading: isIdentityLoading } = useIdentity();
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  const [chatAgent, setChatAgent] = useState<ChatAgentResponse | null>(null);
  const [currentConversation, setCurrentConversation] = useState<ConversationResponse | null>(null);
  const [_conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [selectedChatAgentId, setSelectedChatAgentId] = useState<string | undefined>(agentId);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [appError, setAppError] = useState<string | null>(null);
  const [isLoadingApp, setIsLoadingApp] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (themeParam === 'dark') {
      document.documentElement.setAttribute('data-mantine-color-scheme', 'dark');
    } else if (themeParam === 'light') {
      document.documentElement.setAttribute('data-mantine-color-scheme', 'light');
    }
  }, [themeParam]);

  useEffect(() => {
    if (tenantIdParam && selectedTenant?.id !== tenantIdParam) {
      selectTenant(tenantIdParam);
    }
  }, [tenantIdParam, selectedTenant?.id, selectTenant]);

  useEffect(() => {
    if (!apiClient || !selectedTenant || !agentId || hasFetched.current) return;

    hasFetched.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoadingApp(true);
    setAppError(null);

    apiClient.getChatAgent(selectedTenant.id, agentId)
      .then((app) => {
        setChatAgent(app);
        setSelectedChatAgentId(app.id);
      })
      .catch((err) => {
        console.error('Failed to load chat agent:', err);
        setAppError('Failed to load chat agent');
      })
      .finally(() => setIsLoadingApp(false));
  }, [apiClient, selectedTenant, agentId]);

  const handleNavigate = useCallback((_path: string) => {
    const match = _path.match(/\/conversations\/([^?]+)/);
    if (match) {
      setConversationId(match[1]);
    }
  }, []);

  const handlePopupLogin = useCallback(async () => {
    const provider = enabledProviders.includes('microsoft') ? 'microsoft' : enabledProviders[0];
    if (!provider) return;

    try {
      await loginWithProvider(provider);
    } catch (err) {
      console.error('Login failed:', err);
    }
  }, [loginWithProvider]);

  const handleToggleColorScheme = useCallback(() => {
    setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
  }, [colorScheme, setColorScheme]);

  const tracing = useConversationTracing({
    apiClient,
    tenantId: selectedTenant?.id,
    conversationId,
  });
  const { setMessagesRef } = tracing;

  const chat = useChat({
    apiClient,
    tenantId: selectedTenant?.id,
    selectedChatAgentId,
    conversationId,
    chatAgents: chatAgent ? [chatAgent] : [],
    currentConversation,
    getFoundryToken,
    setCurrentConversation,
    setConversations,
    setSelectedChatAgentId,
    onRefreshTraces: tracing.refreshTracesWithRetry,
    onNavigate: handleNavigate,
  });

  const widgetCache = useWidgetCache(apiClient);

  const handleNewChat = useCallback(() => {
    chat.resetStreamingState();
    setConversationId(undefined);
    setCurrentConversation(null);
    widgetCache.clear();
  }, [chat, widgetCache]);

  useEffect(() => {
    setMessagesRef(chat.messages);
  }, [chat.messages, setMessagesRef]);

  if (!agentId) {
    return (
      <Center h="100vh">
        <Text c="red">{t('embedMissingAgentId')}</Text>
      </Center>
    );
  }

  if (isAuthLoading) {
    return (
      <Box className={classes.authContainer}>
        <Loader size="lg" />
        <Text size="sm" c="dimmed">{t('embedAuthenticating')}</Text>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return (
      <Box className={classes.authContainer}>
        <Text size="lg" fw={500}>{t('embedLoginRequired')}</Text>
        <Button onClick={handlePopupLogin} size="md">
          {t('embedLogin')}
        </Button>
      </Box>
    );
  }

  if (isIdentityLoading || isLoadingApp) {
    return (
      <Box className={classes.authContainer}>
        <Loader size="lg" />
        <Text size="sm" c="dimmed">{t('loading')}</Text>
      </Box>
    );
  }

  if (appError) {
    return (
      <Box className={classes.errorContainer}>
        <Text c="red">{appError}</Text>
      </Box>
    );
  }

  const emptyStateSlot = !conversationId ? (
    <ChatEmptyState
      icon={<IconMessageCircle size={64} />}
      title={chatAgent?.name || t('embedChatAgent', { agentId })}
      description={chatAgent?.description || ''}
    />
  ) : undefined;

  const suggestionsSlot = !conversationId && chatAgent ? (() => {
    const starters = chatAgent.greeting_messages?.filter(Boolean).slice(0, 4);
    if (!starters || starters.length === 0) return undefined;
    return (
      <Box className={chatClasses.startersContainer}>
        {starters.map((starter) => (
          <UnstyledButton
            key={starter}
            className={chatClasses.starterButton}
            onClick={() => chat.handleSendMessage(starter)}
          >
            {starter}
          </UnstyledButton>
        ))}
      </Box>
    );
  })() : undefined;

  const tracingSlot = tracing.tracingSidebarVisible && tracing.traces.length > 0 ? (
    <TracingProvider
      traces={tracing.traces}
      initialNodeReferenceId={tracing.selectedNodeReferenceId}
      onNodeReferenceIdChange={tracing.handleNodeReferenceIdChange}
    >
      <TracingSidebar
        onOpenFullscreen={tracing.handleOpenTracingFullscreen}
        onRefresh={tracing.refreshTraces}
      />
    </TracingProvider>
  ) : undefined;

  const isNewChat = !conversationId;

  const headerSlot = (
    <Box className={classes.embedToolbar}>
      <ActionIcon variant="subtle" size="md" onClick={handleNewChat} title={t('newChat')}>
        <IconPlus size={18} />
      </ActionIcon>
      <ChatHeader
        conversation={currentConversation}
        chatAgents={chatAgent ? [chatAgent] : []}
        selectedChatAgentId={selectedChatAgentId}
        isNewChat={isNewChat}
        tracingSidebarVisible={tracing.tracingSidebarVisible}
        hasTraces={tracing.traces.length > 0}
        messages={chat.messages}
        onChatAgentChange={() => {}}
        onToggleTracingSidebar={tracing.handleToggleTracingSidebar}
      />
      <Box className={classes.toolbarSpacer} />
      <ActionIcon variant="subtle" size="md" onClick={handleToggleColorScheme} title={t('toggleColorScheme')}>
        {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
      </ActionIcon>
    </Box>
  );

  return (
    <Box className={classes.embedContainer}>
      <ChatView
        messages={chat.messages}
        isLoading={chat.isLoadingMessages}
        isStreaming={chat.isStreaming}
        streamingContent={chat.streamingContent}
        streamingMessageId={chat.streamingMessageId}
        onSendMessage={chat.handleSendMessage}
        onCancelStream={chat.handleCancelStream}
        onReaction={chat.handleReaction}
        onViewTrace={tracing.handleViewTrace}
        reactions={chat.reactions}
        highlightedExtMessageId={tracing.highlightedMessageExtId}
        highlightedUserMessageId={tracing.highlightedUserMessageId}
        inputDisabled={!selectedChatAgentId}
        reActState={chat.hasReasoningSteps ? chat.reActState : undefined}
        onToggleReasoning={() => chat.setIsReasoningExpanded(!chat.reActState.isReasoningExpanded)}
        headerSlot={headerSlot}
        emptyStateSlot={emptyStateSlot}
        suggestionsSlot={suggestionsSlot}
        tracingSlot={tracingSlot}
        showReactions
        showTracing
        enableFileDrop
        onLoadMore={chat.loadMoreMessages}
        hasMoreMessages={chat.hasMoreMessages}
        isLoadingMoreMessages={chat.isLoadingMoreMessages}
        widgetCache={widgetCache}
      />

      {tracing.tracingDialogOpen && tracing.traces.length > 0 && (
        <TracingVisualDialog
          opened={tracing.tracingDialogOpen}
          onClose={() => tracing.setTracingDialogOpen(false)}
          traces={tracing.traces}
          onRefresh={tracing.refreshTraces}
        />
      )}
    </Box>
  );
};
