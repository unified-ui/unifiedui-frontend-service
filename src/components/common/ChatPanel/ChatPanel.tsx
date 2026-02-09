import type { FC } from 'react';
import { useState, useCallback, useRef } from 'react';
import { Stack, Box } from '@mantine/core';
import { ChatContent } from '../../../pages/ConversationsPage/components/ChatContent';
import { ChatInput } from '../../../pages/ConversationsPage/components/ChatInput';
import type { MessageResponse } from '../../../api/types';
import classes from './ChatPanel.module.css';

export interface PlaygroundAgentConfig {
  agentId: string;
  agentName?: string;
  systemPrompt?: string;
  aiModelIds?: string[];
  toolIds?: string[];
}

export interface ChatPanelProps {
  mode: 'conversation' | 'playground';
  conversationId?: string;
  applicationId?: string;
  agentConfig?: PlaygroundAgentConfig;
  persistMessages?: boolean;
  showTracing?: boolean;
  showExport?: boolean;
  showReactions?: boolean;

  messages?: MessageResponse[];
  isLoading?: boolean;
  isStreaming?: boolean;
  streamingContent?: string;
  streamingMessageId?: string;
  emptyStateMessage?: string;
  onSendMessage?: (content: string, attachments?: File[]) => void;
  onEditMessage?: (messageId: string, content: string) => Promise<void>;
  onDeleteMessage?: (messageId: string) => Promise<void>;
  onReaction?: (messageId: string, reaction: 'thumbs_up' | 'thumbs_down') => Promise<void>;
  onRetry?: (messageId: string) => void;
  onViewTrace?: (messageId: string) => void;
  inputPlaceholder?: string;
}

export const ChatPanel: FC<ChatPanelProps> = ({
  mode,
  agentConfig: _agentConfig,
  persistMessages: _persistMessages,
  showTracing = mode === 'conversation',
  showReactions = mode === 'conversation',
  messages: externalMessages,
  isLoading = false,
  isStreaming = false,
  streamingContent = '',
  streamingMessageId,
  emptyStateMessage,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onReaction,
  onRetry,
  onViewTrace,
  inputPlaceholder,
}) => {
  const [localMessages, setLocalMessages] = useState<MessageResponse[]>([]);
  const messageIdCounter = useRef(0);

  const messages = externalMessages ?? localMessages;

  const handlePlaygroundSend = useCallback((content: string) => {
    const userMessage: MessageResponse = {
      id: `local-${++messageIdCounter.current}`,
      type: 'user',
      conversationId: 'playground',
      applicationId: 'playground',
      content,
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setLocalMessages(prev => [...prev, userMessage]);

    if (onSendMessage) {
      onSendMessage(content);
    }
  }, [onSendMessage]);

  const handleSend = useCallback((content: string, attachments?: File[]) => {
    if (mode === 'playground' && !externalMessages) {
      handlePlaygroundSend(content);
    } else if (onSendMessage) {
      onSendMessage(content, attachments);
    }
  }, [mode, externalMessages, handlePlaygroundSend, onSendMessage]);

  const defaultEmptyMessage = mode === 'playground'
    ? 'Send a message to test your agent'
    : 'Select or start a conversation';

  return (
    <Stack gap={0} className={classes.chatPanel}>
      <Box className={classes.chatContent}>
        <ChatContent
          messages={messages}
          isLoading={isLoading}
          isStreaming={isStreaming}
          streamingContent={streamingContent}
          streamingMessageId={streamingMessageId}
          emptyStateMessage={emptyStateMessage ?? defaultEmptyMessage}
          onViewTrace={showTracing ? onViewTrace : undefined}
          onEditMessage={onEditMessage}
          onDeleteMessage={onDeleteMessage}
          onReaction={showReactions ? onReaction : undefined}
          onRetry={onRetry}
        />
      </Box>
      <Box className={classes.chatInput}>
        <ChatInput
          onSend={handleSend}
          isDisabled={isLoading}
          isStreaming={isStreaming}
          placeholder={inputPlaceholder}
        />
      </Box>
    </Stack>
  );
};
