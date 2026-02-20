import type { FC } from 'react';
import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Drawer, Loader, Center, Title } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconMessageCircle } from '@tabler/icons-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { useIdentity } from '../../contexts';
import { useRecentVisits } from '../../contexts';
import { ShareConversationDialog } from '../../components/dialogs/ShareConversationDialog';
import { SearchConversationsDialog } from '../../components/dialogs/SearchConversationsDialog';
import { TracingProvider, TracingSidebar, TracingVisualDialog } from '../../components/tracing';
import { ConversationSidebar } from '../../components/conversation';
import { ChatView, ChatHeader, ChatEmptyState } from '../../components/chat';
import { useConversationList, useChat, useConversationTracing, useDelayedLoading } from '../../hooks';
import classes from './ConversationsPage.module.css';

/**
 * Main conversations page — wires hooks + sub-components.
 */
export const ConversationsPage: FC = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const { apiClient, selectedTenant, user, getFoundryToken } = useIdentity();
  const { trackVisit } = useRecentVisits();
  const { t } = useTranslation();

  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

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

  const chat = useChat({
    apiClient,
    tenantId,
    selectedApplicationId: convList.selectedApplicationId,
    conversationId,
    applications: convList.applications,
    currentConversation: convList.currentConversation,
    getFoundryToken,
    setCurrentConversation: convList.setCurrentConversation,
    setConversations: convList.setConversations,
    setSelectedApplicationId: convList.setSelectedApplicationId,
    onRefreshTraces: tracing.refreshTraces,
  });

  useEffect(() => {
    tracing.setMessagesRef(chat.messages);
  }, [chat.messages, tracing.setMessagesRef]);

  useEffect(() => {
    if (!apiClient || !tenantId || !conversationId) {
      convList.setCurrentConversation(null);
      chat.setMessages([]);
      return;
    }

    if (chat.justCreatedConversationRef.current === conversationId) {
      chat.justCreatedConversationRef.current = null;
      return;
    }

    chat.loadConversationMessages(conversationId);
  }, [apiClient, tenantId, conversationId]);

  useEffect(() => {
    if (convList.currentConversation) {
      trackVisit({
        resource_type: 'conversation',
        resource_id: convList.currentConversation.id,
        resource_name: convList.currentConversation.name || convList.currentConversation.id,
      });
    }
  }, [convList.currentConversation?.id]);

  const convPerm = convList.currentConversation?.my_permission;
  const canWriteConversation = !convPerm || convPerm === 'ADMIN' || convPerm === 'WRITE';

  const handleNewChat = useCallback(() => {
    chat.resetStreamingState();
    convList.handleNewChat(chat.abortControllerRef);
  }, [chat, convList]);

  const handleSelectConversation = useCallback((id: string) => {
    chat.resetStreamingState();
    convList.handleSelectConversation(id, chat.abortControllerRef);
  }, [chat, convList]);

  const handleShare = useCallback(() => setShareDialogOpen(true), []);
  const handleSearchOpen = useCallback(() => setSearchDialogOpen(true), []);

  const handleEmbedSetup = useCallback(() => {
    if (convList.selectedApplicationId) {
      navigate(`/applications/${convList.selectedApplicationId}/embed-chat`);
    }
  }, [convList.selectedApplicationId, navigate]);

  const showInitialLoading = useDelayedLoading(
    convList.isLoadingConversations && !convList.conversations.length,
    1000,
  );

  if (convList.isLoadingConversations && !convList.conversations.length) {
    return (
      <MainLayout noPadding>
        <Box className={classes.pageContainer}>
          <Box className={classes.pageHeader}>
            <Title order={1} className={classes.pageTitle}>{t('conversations:yourAIChats')}</Title>
          </Box>
          <Box className={classes.pageContent}>
            <Box className={classes.chatSidebarWrapper}>
              {showInitialLoading && (
                <Center style={{ flex: 1 }}>
                  <Loader size="md" color="gray" />
                </Center>
              )}
            </Box>
            <Box className={classes.mainArea}>
              <ChatEmptyState
                icon={<IconMessageCircle size={64} />}
                title={t('conversations:startNewConversation')}
                description={t('conversations:selectAgentToStart')}
              />
            </Box>
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

  const headerSlot = (
    <ChatHeader
      conversation={convList.currentConversation}
      applications={convList.applications}
      selectedApplicationId={convList.selectedApplicationId}
      isNewChat={convList.isNewChat}
      isFavorite={convList.currentConversation ? convList.favoriteIds.has(convList.currentConversation.id) : false}
      tracingSidebarVisible={tracing.tracingSidebarVisible}
      hasTraces={tracing.traces.length > 0}
      messages={chat.messages}
      onApplicationChange={convList.handleApplicationChange}
      onShare={handleShare}
      onToggleFavorite={() => {
        if (convList.currentConversation) {
          convList.handleToggleFavorite(convList.currentConversation.id);
        }
      }}
      onDelete={() => {
        if (convList.currentConversation) {
          convList.handleDeleteConversation(convList.currentConversation.id);
        }
      }}
      onToggleTracingSidebar={tracing.handleToggleTracingSidebar}
      onEmbedSetup={handleEmbedSetup}
    />
  );

  const emptyStateSlot = convList.isNewChat ? (
    <ChatEmptyState
      icon={<IconMessageCircle size={64} />}
      title={t('conversations:startNewConversation')}
      description={
        convList.selectedApplicationId
          ? t('conversations:typeToStart')
          : t('conversations:selectAgentToStart')
      }
    />
  ) : undefined;

  return (
    <MainLayout noPadding>
      <Box className={classes.pageContainer}>
        <Box className={classes.pageHeader}>
          <Title order={1} className={classes.pageTitle}>{t('conversations:yourAIChats')}</Title>
        </Box>
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
              applications={convList.applications}
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
              applications={convList.applications}
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
            isLoading={chat.isLoadingMessages}
            isStreaming={chat.isStreaming}
            streamingContent={chat.streamingContent}
            streamingMessageId={chat.streamingMessageId}
            onSendMessage={chat.handleSendMessage}
            onCancelStream={chat.handleCancelStream}
            onEditMessage={canWriteConversation ? chat.handleEditMessage : undefined}
            onDeleteMessage={canWriteConversation ? chat.handleDeleteMessage : undefined}
            onReaction={chat.handleReaction}
            onRetry={(failedMessageId) => {
              const failedMsg = chat.messages.find(m => m.id === failedMessageId);
              const userMsg = failedMsg?.userMessageId
                ? chat.messages.find(m => m.id === failedMsg.userMessageId)
                : undefined;
              if (userMsg?.content) {
                chat.handleSendMessage(userMsg.content);
              }
            }}
            onViewTrace={tracing.handleViewTrace}
            reactions={chat.reactions}
            highlightedExtMessageId={tracing.highlightedMessageExtId}
            highlightedUserMessageId={tracing.highlightedUserMessageId}
            inputDisabled={!convList.selectedApplicationId || !canWriteConversation}
            inputPlaceholder={
              convList.selectedApplicationId
                ? (convList.isNewChat ? t('conversations:typeToStart') : t('conversations:messageInput'))
                : t('conversations:selectAgentToStart')
            }
            headerSlot={headerSlot}
            tracingSlot={tracingSlot}
            emptyStateSlot={emptyStateSlot}
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
        applications={convList.applications}
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
