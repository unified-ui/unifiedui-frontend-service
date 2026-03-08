import type { FC, ReactNode } from 'react';
import { useState, useCallback, useRef } from 'react';
import { Box, Text } from '@mantine/core';
import { IconUpload } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { ChatContent } from '../ChatContent';
import { ChatInput } from '../ChatInput';
import type { ChatInputRef } from '../ChatInput';
import type { MessageResponse, ReactionResponse } from '../../../api/types';
import type { ReActStreamState } from '../../../hooks/chat/useReActChat';
import classes from './ChatView.module.css';

export interface ChatViewProps {
  messages: MessageResponse[];
  isLoading?: boolean;
  isStreaming?: boolean;
  streamingContent?: string;
  streamingMessageId?: string;
  emptyStateMessage?: string;
  emptyStateSlot?: ReactNode;

  onSendMessage?: (content: string, attachments?: File[]) => void;
  onCancelStream?: () => void;
  onEditMessage?: (messageId: string, content: string) => Promise<void>;
  onDeleteMessage?: (messageId: string) => Promise<void>;
  onReaction?: (messageId: string, reaction: 'thumbs_up' | 'thumbs_down', feedbackText?: string) => Promise<void>;
  onRetry?: (messageId: string) => void;
  onViewTrace?: (messageId: string) => void;
  reactions?: Map<string, ReactionResponse>;

  highlightedExtMessageId?: string | null;
  highlightedUserMessageId?: string | null;

  inputPlaceholder?: string;
  inputDisabled?: boolean;

  showReactions?: boolean;
  showTracing?: boolean;
  enableFileDrop?: boolean;

  reActState?: ReActStreamState;
  onToggleReasoning?: () => void;
  alwaysExpandReasoning?: boolean;

  headerSlot?: ReactNode;
  tracingSlot?: ReactNode;
}

export const ChatView: FC<ChatViewProps> = ({
  messages,
  isLoading = false,
  isStreaming = false,
  streamingContent = '',
  streamingMessageId,
  emptyStateMessage,
  emptyStateSlot,

  onSendMessage,
  onCancelStream,
  onEditMessage,
  onDeleteMessage,
  onReaction,
  onRetry,
  onViewTrace,
  reactions,

  highlightedExtMessageId,
  highlightedUserMessageId,

  inputPlaceholder,
  inputDisabled = false,

  showReactions = true,
  showTracing = true,
  enableFileDrop = true,

  reActState,
  onToggleReasoning,
  alwaysExpandReasoning,

  headerSlot,
  tracingSlot,
}) => {
  const { t } = useTranslation();
  const chatInputRef = useRef<ChatInputRef>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounterRef = useRef(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    if (!enableFileDrop) return;
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true);
    }
  }, [enableFileDrop]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!enableFileDrop) return;
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }, [enableFileDrop]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!enableFileDrop) return;
    e.preventDefault();
    e.stopPropagation();
  }, [enableFileDrop]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    if (!enableFileDrop) return;
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && chatInputRef.current) {
      chatInputRef.current.handleFileDrop(files);
    }
  }, [enableFileDrop]);

  const showEmpty = emptyStateSlot && messages.length === 0 && !isStreaming && !isLoading;

  return (
    <Box className={classes.chatViewLayout}>
      <Box
        className={`${classes.chatSection} ${tracingSlot ? classes.withTracingSidebar : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <Box className={`${classes.dropZoneOverlay} ${isDragOver ? classes.active : ''}`}>
          <Box className={classes.dropZoneContent}>
            <IconUpload size={48} stroke={1.5} />
            <Text size="lg" fw={500}>{t('conversations:dropFilesHere')}</Text>
            <Text size="sm" c="dimmed">{t('conversations:filesAttached')}</Text>
          </Box>
        </Box>

        {headerSlot}

        {showEmpty ? (
          <>
            <Box className={classes.contentArea}>
              {emptyStateSlot}
            </Box>
            <ChatInput
              ref={chatInputRef}
              onSend={onSendMessage ?? (() => {})}
              onCancel={onCancelStream}
              isDisabled={inputDisabled}
              isStreaming={isStreaming}
              placeholder={inputPlaceholder}
            />
          </>
        ) : (
          <>
            <Box className={classes.contentArea}>
              <ChatContent
                messages={messages}
                isLoading={isLoading}
                isStreaming={isStreaming}
                streamingContent={streamingContent}
                streamingMessageId={streamingMessageId}
                emptyStateMessage={emptyStateMessage}
                onViewTrace={showTracing ? onViewTrace : undefined}
                highlightedExtMessageId={highlightedExtMessageId}
                highlightedUserMessageId={highlightedUserMessageId}
                onEditMessage={onEditMessage}
                onDeleteMessage={onDeleteMessage}
                onReaction={showReactions ? onReaction : undefined}
                reactions={reactions}
                onRetry={onRetry}
                reActState={reActState}
                onToggleReasoning={onToggleReasoning}
                alwaysExpandReasoning={alwaysExpandReasoning}
              />
            </Box>
            <ChatInput
              ref={chatInputRef}
              onSend={onSendMessage ?? (() => {})}
              onCancel={onCancelStream}
              isDisabled={inputDisabled}
              isStreaming={isStreaming}
              placeholder={inputPlaceholder}
            />
          </>
        )}
      </Box>

      {tracingSlot && (
        <Box className={classes.tracingSidebarWrapper}>
          {tracingSlot}
        </Box>
      )}
    </Box>
  );
};
