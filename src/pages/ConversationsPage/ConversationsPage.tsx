import type { FC } from 'react';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Drawer, Loader, Center, UnstyledButton } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconMessageCircle } from '@tabler/icons-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { useIdentity } from '../../contexts';
import { useRecentVisits } from '../../contexts';
import { ShareConversationDialog } from '../../components/dialogs/ShareConversationDialog';
import { SearchConversationsDialog } from '../../components/dialogs/SearchConversationsDialog';
import { TracingProvider, TracingSidebar, TracingVisualDialog } from '../../components/tracing';
import { ConversationSidebar } from '../../components/conversation';
import { ChatView, ChatHeader, ChatEmptyState, WidgetSidebar } from '../../components/chat';
import { useConversationList, useChat, useConversationTracing, useConversationWidgets, useDelayedLoading, useWidgetCache } from '../../hooks';
import classes from './ConversationsPage.module.css';
import chatClasses from '../../components/chat/ChatEmptyState/ChatEmptyState.module.css';

/**
 * Main conversations page — wires hooks + sub-components.
 */
export const ConversationsPage: FC = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { apiClient, selectedTenant, user, getFoundryToken } = useIdentity();
  const { trackVisit } = useRecentVisits();
  const { t } = useTranslation();

  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchHighlightedMessageId, setSearchHighlightedMessageId] = useState<string | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const focusTriggerRef = useRef(0);
  const [focusTrigger, setFocusTrigger] = useState(0);

  const tenantId = selectedTenant?.id;
  const userId = user?.id;

  const tracing = useConversationTracing({
    apiClient,
    tenantId,
    conversationId,
  });

  const convList = useConversationList({
    apiClient,
    tenantId,
    userId,
    conversationId,
  });

  const handleTrackChatAgent = useCallback((agentId: string, agentName: string) => {
    trackVisit({
      resource_type: 'chat_agent',
      resource_id: agentId,
      resource_name: agentName,
    });
  }, [trackVisit]);

  const chat = useChat({
    apiClient,
    tenantId,
    selectedChatAgentId: convList.selectedChatAgentId,
    conversationId,
    chatAgents: convList.chatAgents,
    currentConversation: convList.currentConversation,
    getFoundryToken,
    setCurrentConversation: convList.setCurrentConversation,
    setConversations: convList.setConversations,
    setSelectedChatAgentId: convList.setSelectedChatAgentId,
    onRefreshTraces: tracing.refreshTraces,
    onMessageSent: handleTrackChatAgent,
  });

  const widgets = useConversationWidgets({
    messages: chat.messages,
  });

  const widgetCache = useWidgetCache(apiClient);

  useEffect(() => {
    tracing.setMessagesRef(chat.messages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.messages, tracing.setMessagesRef]);

  useEffect(() => {
    if (!apiClient || !tenantId || !conversationId) {
      convList.setCurrentConversation(null);
      chat.setMessages(prev => prev.length === 0 ? prev : []);
      chat.setIsLoadingMessages(false);
      widgetCache.clear();
      return;
    }

    if (chat.justCreatedConversationRef.current === conversationId) {

      chat.justCreatedConversationRef.current = null;
      return;
    }

    chat.loadConversationMessages(conversationId);
    widgetCache.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiClient, tenantId, conversationId]);

  const convPerm = convList.currentConversation?.my_permission;
  const canWriteConversation = !convPerm || convPerm === 'ADMIN' || convPerm === 'WRITE';

  const triggerFocus = useCallback(() => {
    focusTriggerRef.current += 1;
    setFocusTrigger(focusTriggerRef.current);
  }, []);

  useEffect(() => {
    triggerFocus();
  }, [conversationId, convList.selectedChatAgentId, triggerFocus]);

  const handleNewChat = useCallback(() => {
    chat.resetStreamingState();
    convList.handleNewChat(chat.abortControllerRef);
    if (!conversationId) {
      chat.setIsLoadingMessages(false);
      triggerFocus();
    }
  }, [chat, convList, conversationId, triggerFocus]);

  const handleNewChatWithAgent = useCallback((agentId: string) => {
    chat.resetStreamingState();
    convList.handleChatAgentChange(agentId);
    convList.handleNewChat(chat.abortControllerRef, agentId);
  }, [chat, convList]);

  const handleSelectConversation = useCallback((id: string) => {
    chat.resetStreamingState();
    convList.handleSelectConversation(id, chat.abortControllerRef);
  }, [chat, convList]);

  const handleShare = useCallback(() => setShareDialogOpen(true), []);
  const handleSearchOpen = useCallback(() => setSearchDialogOpen(true), []);

  const handleSearchSelectMessage = useCallback((targetConversationId: string, messageId: string) => {
    if (messageId) {
      setSearchHighlightedMessageId(messageId);
      setTimeout(() => setSearchHighlightedMessageId(null), 2000);
    }
    if (targetConversationId !== conversationId) {
      const qs = searchParams.toString();
      navigate(`/conversations/${targetConversationId}${qs ? `?${qs}` : ''}`);
    }
  }, [conversationId, navigate, searchParams]);

  const handleEmbedSetup = useCallback(() => {
    if (convList.selectedChatAgentId) {
      navigate(`/chat-agents/${convList.selectedChatAgentId}/embed-chat`);
    }
  }, [convList.selectedChatAgentId, navigate]);

  const chatMessagesRef = useRef(chat.messages);
  chatMessagesRef.current = chat.messages;

  const handleRetry = useCallback(
    (failedMessageId: string) => {
      const failedMsg = chatMessagesRef.current.find(m => m.id === failedMessageId);
      const userMsg = failedMsg?.userMessageId
        ? chatMessagesRef.current.find(m => m.id === failedMsg.userMessageId)
        : undefined;
      if (userMsg?.content) {
        chat.handleSendMessage(userMsg.content);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chat.handleSendMessage],
  );

  const reActStateRef = useRef(chat.reActState);
  reActStateRef.current = chat.reActState;

  const handleToggleReasoning = useCallback(
    () => {
      chat.setIsReasoningExpanded(!reActStateRef.current.isReasoningExpanded);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chat.setIsReasoningExpanded],
  );

  const showInitialLoading = useDelayedLoading(
    convList.isLoadingConversations && !convList.conversations.length,
    1000,
  );

  const showMessageLoading = useDelayedLoading(chat.isLoadingMessages, 500);

  if (convList.isLoadingConversations && !convList.conversations.length) {
    return (
      <MainLayout noPadding>
        <Box className={classes.pageContainer}>
          <Box className={classes.pageHeader} />
          <Box className={classes.pageContent}>
            <Box className={classes.chatSidebarWrapper}>
              {showInitialLoading && (
                <Center style={{ flex: 1 }}>
                  <Loader size="md" color="gray" />
                </Center>
              )}
            </Box>
            <Box className={classes.mainArea} />
          </Box>
        </Box>
      </MainLayout>
    );
  }

  const tracingSlot = tracing.tracingSidebarVisible && tracing.traces.length > 0 ? (
    <TracingProvider
      traces={tracing.traces}
      initialNodeReferenceId={tracing.selectedNodeReferenceId}
      onNodeReferenceIdChange={tracing.handleNodeReferenceIdChange}
    >
      <TracingSidebar onOpenFullscreen={tracing.handleOpenTracingFullscreen} />
    </TracingProvider>
  ) : undefined;

    const widgetSlot = widgets.widgetSidebarVisible && widgets.hasWidgets ? (
      <WidgetSidebar interactions={widgets.interactions} widgetCache={widgetCache} />
    ) : undefined;

  const headerSlot = (
    <ChatHeader
      conversation={convList.currentConversation}
      chatAgents={convList.chatAgents}
      selectedChatAgentId={convList.selectedChatAgentId}
      isNewChat={convList.isNewChat}
      isFavorite={convList.currentConversation ? convList.favoriteIds.has(convList.currentConversation.id) : false}
      tracingSidebarVisible={tracing.tracingSidebarVisible}
      hasTraces={tracing.traces.length > 0}
      widgetSidebarVisible={widgets.widgetSidebarVisible}
      hasWidgets={widgets.hasWidgets}
      messages={chat.messages}
      onChatAgentChange={convList.handleChatAgentChange}
      onChatAgentSearch={convList.handleChatAgentSearch}
      onNewChatWithAgent={handleNewChatWithAgent}
      onShare={handleShare}
      onToggleFavorite={() => {
        if (convList.currentConversation) {
          convList.handleToggleFavorite(convList.currentConversation.id, convList.currentConversation.name);
        }
      }}
      onDelete={() => {
        if (convList.currentConversation) {
          convList.handleDeleteConversation(convList.currentConversation.id);
        }
      }}
      onToggleTracingSidebar={tracing.handleToggleTracingSidebar}
      onToggleWidgetSidebar={widgets.handleToggleWidgetSidebar}
      onEmbedSetup={handleEmbedSetup}
    />
  );

  const emptyStateSlot = convList.isNewChat ? (() => {
    const selectedAgent = convList.chatAgents.find(a => a.id === convList.selectedChatAgentId);
    const hasAgent = !!selectedAgent;
    return (
      <ChatEmptyState
        icon={<IconMessageCircle size={64} />}
        title={
          hasAgent
            ? t('conversations:welcomeTitleWithAgent', { agentName: selectedAgent.name })
            : t('conversations:welcomeTitle')
        }
        description={
          hasAgent
            ? t('conversations:welcomeDescription')
            : t('conversations:selectAgentToStart')
        }
      />
    );
  })() : undefined;

  const suggestionsSlot = convList.isNewChat ? (() => {
    const selectedAgent = convList.chatAgents.find(a => a.id === convList.selectedChatAgentId);
    const hasAgent = !!selectedAgent;
    const starters = selectedAgent?.greeting_messages?.filter(Boolean).slice(0, 4);
    if (!hasAgent || !starters || starters.length === 0) return undefined;
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

  return (
    <MainLayout noPadding>
      <Box className={classes.pageContainer}>
        <Box className={classes.pageHeader} />
        <Box className={classes.pageContent}>
        {isMobile ? (
          <Drawer
            opened={mobileSidebarOpen}
            onClose={() => setMobileSidebarOpen(false)}
            size="330px"
            padding={0}
            withCloseButton={false}
            overlayProps={{ backgroundOpacity: 0.3 }}
          >
            <ConversationSidebar
              conversations={convList.conversations}
              chatAgents={convList.chatAgents}
              selectedConversationId={conversationId}
              favoriteIds={convList.favoriteIds}
              isLoading={convList.isLoadingConversations}
              isCollapsed={false}
              hasMore={convList.hasMoreConversations}
              searchQuery={convList.sidebarSearchQuery}
              onCollapsedChange={() => setMobileSidebarOpen(false)}
              onNewChat={() => { handleNewChat(); setMobileSidebarOpen(false); }}
              onSelectConversation={(id: string) => { handleSelectConversation(id); setMobileSidebarOpen(false); }}
              onToggleFavorite={convList.handleToggleFavorite}
              onRenameConversation={convList.handleRenameConversation}
              onDeleteConversation={convList.handleDeleteConversation}
              onSearchOpen={handleSearchOpen}
              onSearchChange={convList.handleSidebarSearch}
              onLoadMore={convList.handleLoadMoreConversations}
            />
          </Drawer>
        ) : (
          <Box className={`${classes.chatSidebarWrapper} ${convList.sidebarCollapsed ? classes.collapsed : ''}`}>
            <ConversationSidebar
              conversations={convList.conversations}
              chatAgents={convList.chatAgents}
              selectedConversationId={conversationId}
              favoriteIds={convList.favoriteIds}
              isLoading={convList.isLoadingConversations}
              isCollapsed={convList.sidebarCollapsed}
              hasMore={convList.hasMoreConversations}
              searchQuery={convList.sidebarSearchQuery}
              onCollapsedChange={convList.handleSidebarCollapse}
              onNewChat={handleNewChat}
              onSelectConversation={handleSelectConversation}
              onToggleFavorite={convList.handleToggleFavorite}
              onRenameConversation={convList.handleRenameConversation}
              onDeleteConversation={convList.handleDeleteConversation}
              onSearchOpen={handleSearchOpen}
              onSearchChange={convList.handleSidebarSearch}
              onLoadMore={convList.handleLoadMoreConversations}
            />
          </Box>
        )}

        <Box
          className={`${classes.mainArea} ${!isMobile && convList.sidebarCollapsed ? classes.sidebarCollapsed : ''} ${isMobile ? classes.sidebarHidden : ''}`}
        >
          <ChatView
            messages={chat.messages}
            isLoading={showMessageLoading}
            isStreaming={chat.isStreaming}
            streamingContent={chat.streamingContent}
            streamingMessageId={chat.streamingMessageId}
            onSendMessage={chat.handleSendMessage}
            onCancelStream={chat.handleCancelStream}
            onEditMessage={canWriteConversation ? chat.handleEditMessage : undefined}
            onDeleteMessage={canWriteConversation ? chat.handleDeleteMessage : undefined}
            onReaction={chat.handleReaction}
            onRetry={handleRetry}
            onViewTrace={tracing.handleViewTrace}
            reactions={chat.reactions}
            highlightedExtMessageId={tracing.highlightedMessageExtId}
            highlightedUserMessageId={searchHighlightedMessageId || tracing.highlightedUserMessageId}
            inputDisabled={!convList.selectedChatAgentId || !canWriteConversation}
            inputPlaceholder={
              convList.selectedChatAgentId
                ? (convList.isNewChat ? t('conversations:typeToStart') : t('conversations:messageInput'))
                : t('conversations:selectAgentToStart')
            }
            reActState={chat.hasReasoningSteps ? chat.reActState : undefined}
            onToggleReasoning={handleToggleReasoning}
            headerSlot={headerSlot}
            tracingSlot={tracingSlot}
            widgetSlot={widgetSlot}
            emptyStateSlot={emptyStateSlot}
            suggestionsSlot={suggestionsSlot}
            focusTrigger={focusTrigger}
            onLoadMore={chat.loadMoreMessages}
            hasMoreMessages={chat.hasMoreMessages}
            isLoadingMoreMessages={chat.isLoadingMoreMessages}
            widgetCache={widgetCache}
          />
        </Box>
        </Box>
      </Box>

      <ShareConversationDialog
        opened={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        conversation={convList.currentConversation}
      />

      <SearchConversationsDialog
        opened={searchDialogOpen}
        onClose={() => setSearchDialogOpen(false)}
        conversations={convList.conversations}
        chatAgents={convList.chatAgents}
        apiClient={apiClient}
        tenantId={tenantId}
        onSelectMessage={handleSearchSelectMessage}
      />

      {tracing.tracingDialogOpen && tracing.traces.length > 0 && (
        <TracingVisualDialog
          opened={tracing.tracingDialogOpen}
          onClose={() => tracing.setTracingDialogOpen(false)}
          traces={tracing.traces}
        />
      )}
    </MainLayout>
  );
};
