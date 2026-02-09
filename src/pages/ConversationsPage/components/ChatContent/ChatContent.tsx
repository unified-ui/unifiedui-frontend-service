import type { FC, ReactNode } from 'react';
import { useEffect, useRef, useCallback, useState } from 'react';
import { ScrollArea, Box, Text, Avatar, Stack, Loader, Paper, Tooltip, ActionIcon, CopyButton, Group, Button, Textarea } from '@mantine/core';
import { IconUser, IconSparkles, IconCopy, IconCheck, IconBinaryTree, IconThumbUp, IconThumbDown, IconArrowDown, IconEdit, IconTrash, IconAlertTriangle, IconRefresh } from '@tabler/icons-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { MessageResponse } from '../../../../api/types';
import classes from './ChatContent.module.css';

interface ChatContentProps {
  messages: MessageResponse[];
  isLoading?: boolean;
  isStreaming?: boolean;
  streamingContent?: string;
  streamingMessageId?: string;
  emptyStateMessage?: string;
  onViewTrace?: (extMessageId: string) => void;
  highlightedExtMessageId?: string | null;
  onEditMessage?: (messageId: string, newContent: string) => Promise<void>;
  onDeleteMessage?: (messageId: string) => Promise<void>;
  onReaction?: (messageId: string, reaction: 'thumbs_up' | 'thumbs_down') => Promise<void>;
  onRetry?: (content: string) => void;
}

export const ChatContent: FC<ChatContentProps> = ({
  messages,
  isLoading,
  isStreaming,
  streamingContent,
  streamingMessageId,
  emptyStateMessage = 'Start a conversation by typing a message below.',
  onViewTrace,
  highlightedExtMessageId,
  onEditMessage,
  onDeleteMessage,
  onReaction,
  onRetry,
}) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messageRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());
  const [flashingExtId, setFlashingExtId] = useState<string | null>(null);
  const prevHighlightedRef = useRef<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const userScrolledUpRef = useRef(false);

  const setMessageRef = useCallback((extMessageId: string, element: HTMLDivElement | null) => {
    if (element) {
      messageRefsMap.current.set(extMessageId, element);
    } else {
      messageRefsMap.current.delete(extMessageId);
    }
  }, []);

  const isNearBottom = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return true;
    const threshold = 50;
    return viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < threshold;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior });
    userScrolledUpRef.current = false;
    setShowScrollButton(false);
  }, []);

  const handleScroll = useCallback(() => {
    const nearBottom = isNearBottom();
    if (!nearBottom) {
      userScrolledUpRef.current = true;
      setShowScrollButton(true);
    } else {
      userScrolledUpRef.current = false;
      setShowScrollButton(false);
    }
  }, [isNearBottom]);

  useEffect(() => {
    if (highlightedExtMessageId && highlightedExtMessageId !== prevHighlightedRef.current) {
      const element = messageRefsMap.current.get(highlightedExtMessageId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setFlashingExtId(highlightedExtMessageId);
        const timer = setTimeout(() => setFlashingExtId(null), 600);
        return () => clearTimeout(timer);
      }
    }
    prevHighlightedRef.current = highlightedExtMessageId || null;
  }, [highlightedExtMessageId]);

  useEffect(() => {
    if (!userScrolledUpRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingContent]);

  const lastUserMessageId = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].type === 'user') return messages[i].id;
    }
    return undefined;
  })();

  if (isLoading) {
    return (
      <Box className={classes.loadingContainer}>
        <Loader size="lg" />
        <Text c="dimmed" mt="md">Loading messages...</Text>
      </Box>
    );
  }

  if (messages.length === 0 && !isStreaming) {
    return (
      <Box className={classes.emptyState}>
        <IconSparkles size={48} className={classes.emptyIcon} />
        <Text size="lg" fw={500} mt="md">How can I help you today?</Text>
        <Text c="dimmed" size="sm" mt="xs" maw={400} ta="center">{emptyStateMessage}</Text>
      </Box>
    );
  }

  return (
    <Box style={{ position: 'relative', height: '100%' }}>
      <ScrollArea
        className={classes.scrollArea}
        viewportRef={viewportRef}
        scrollbarSize={8}
        onScrollPositionChange={handleScroll}
      >
        <Stack gap="lg" className={classes.messagesContainer}>
          {messages.map((message) => {
            const messageExtId = message.type !== 'user' ? message.metadata?.extMessageId : undefined;
            const isHighlighted = !!(messageExtId && highlightedExtMessageId === messageExtId);
            const isFlashing = !!(messageExtId && flashingExtId === messageExtId);
            const isLastUserMessage = message.id === lastUserMessageId;
            const isError = message.status === 'error';

            if (isError) {
              return (
                <ErrorBubble
                  key={message.id}
                  message={message}
                  onRetry={onRetry}
                />
              );
            }

            return (
              <MessageBubble
                key={message.id}
                message={message}
                isStreaming={isStreaming && message.id === streamingMessageId}
                streamingContent={message.id === streamingMessageId ? streamingContent : undefined}
                onViewTrace={onViewTrace}
                isHighlighted={isHighlighted}
                isFlashing={isFlashing}
                onRefSet={messageExtId ? (el) => setMessageRef(messageExtId, el) : undefined}
                isLastUserMessage={isLastUserMessage}
                onEditMessage={onEditMessage}
                onDeleteMessage={onDeleteMessage}
                onReaction={onReaction}
              />
            );
          })}

          {isStreaming && streamingContent && !streamingMessageId && (
            <StreamingMessage content={streamingContent} />
          )}

          <div ref={bottomRef} />
        </Stack>
      </ScrollArea>

      {showScrollButton && (
        <Box className={classes.scrollToBottomWrapper}>
          <ActionIcon
            variant="filled"
            color="primary"
            size="lg"
            radius="xl"
            className={classes.scrollToBottomButton}
            onClick={() => scrollToBottom()}
          >
            <IconArrowDown size={18} />
          </ActionIcon>
        </Box>
      )}
    </Box>
  );
};

interface ErrorBubbleProps {
  message: MessageResponse;
  onRetry?: (content: string) => void;
}

const ErrorBubble: FC<ErrorBubbleProps> = ({ message, onRetry }) => {
  const userMessages = message.conversationId ? undefined : undefined;
  void userMessages;

  return (
    <Box className={classes.messageWrapper}>
      <Box className={classes.assistantMessage}>
        <Avatar size="sm" radius="xl" className={classes.avatar} color="red">
          <IconAlertTriangle size={16} />
        </Avatar>
        <Box className={classes.assistantContent}>
          <Paper className={classes.errorBubble} shadow="xs">
            <Text size="sm" c="red">{message.content}</Text>
          </Paper>
          {onRetry && (
            <Button
              size="xs"
              variant="light"
              color="red"
              leftSection={<IconRefresh size={14} />}
              mt="xs"
              onClick={() => onRetry(message.content)}
            >
              Retry
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

interface MessageBubbleProps {
  message: MessageResponse;
  isStreaming?: boolean;
  streamingContent?: string;
  onViewTrace?: (extMessageId: string) => void;
  isHighlighted?: boolean;
  isFlashing?: boolean;
  onRefSet?: (element: HTMLDivElement | null) => void;
  isLastUserMessage?: boolean;
  onEditMessage?: (messageId: string, newContent: string) => Promise<void>;
  onDeleteMessage?: (messageId: string) => Promise<void>;
  onReaction?: (messageId: string, reaction: 'thumbs_up' | 'thumbs_down') => Promise<void>;
}

const MessageBubble: FC<MessageBubbleProps> = ({
  message,
  isStreaming,
  streamingContent,
  onViewTrace,
  isHighlighted,
  isFlashing,
  onRefSet,
  isLastUserMessage,
  onEditMessage,
  onDeleteMessage,
  onReaction,
}) => {
  const isUser = message.type === 'user';
  const content = streamingContent || message.content;
  const extMessageId = !isUser ? message.metadata?.extMessageId : undefined;
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);

  const handleViewTrace = useCallback(() => {
    if (extMessageId && onViewTrace) {
      onViewTrace(extMessageId);
    }
  }, [extMessageId, onViewTrace]);

  const handleStartEdit = useCallback(() => {
    setEditContent(message.content);
    setIsEditing(true);
  }, [message.content]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditContent(message.content);
  }, [message.content]);

  const handleSubmitEdit = useCallback(async () => {
    if (!onEditMessage || !editContent.trim()) return;
    await onEditMessage(message.id, editContent.trim());
    setIsEditing(false);
  }, [onEditMessage, editContent, message.id]);

  if (isUser) {
    return (
      <Box className={classes.messageWrapper}>
        <Box className={classes.userMessageContainer}>
          <Box className={classes.userMessage}>
            {isEditing ? (
              <Box className={classes.editContainer}>
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.currentTarget.value)}
                  autosize
                  minRows={2}
                  maxRows={8}
                  className={classes.editTextarea}
                />
                <Group gap="xs" mt="xs" justify="flex-end">
                  <Button size="xs" variant="subtle" onClick={handleCancelEdit}>Cancel</Button>
                  <Button size="xs" onClick={handleSubmitEdit} disabled={!editContent.trim()}>Save & Send</Button>
                </Group>
              </Box>
            ) : (
              <>
                <Paper className={classes.userBubble} shadow="xs">
                  <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{content}</Text>
                </Paper>
                <Avatar size="sm" radius="xl" className={classes.avatar} color="primary">
                  <IconUser size={16} />
                </Avatar>
              </>
            )}
          </Box>
          {!isEditing && (
            <Group gap="xs" className={classes.messageActions}>
              <CopyButton value={content} timeout={2000}>
                {({ copied, copy }) => (
                  <Tooltip label={copied ? 'Copied!' : 'Copy message'} withArrow position="bottom">
                    <ActionIcon size="xs" variant="subtle" color={copied ? 'teal' : 'gray'} onClick={copy}>
                      {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
              {isLastUserMessage && onEditMessage && (
                <Tooltip label="Edit message" withArrow position="bottom">
                  <ActionIcon size="xs" variant="subtle" color="gray" onClick={handleStartEdit}>
                    <IconEdit size={14} />
                  </ActionIcon>
                </Tooltip>
              )}
              {onDeleteMessage && (
                <Tooltip label="Delete message" withArrow position="bottom">
                  <ActionIcon size="xs" variant="subtle" color="red" onClick={() => onDeleteMessage(message.id)}>
                    <IconTrash size={14} />
                  </ActionIcon>
                </Tooltip>
              )}
            </Group>
          )}
        </Box>
      </Box>
    );
  }

  const wrapperClassName = [
    classes.messageWrapper,
    isHighlighted ? classes.highlighted : '',
    isFlashing ? classes.flash : '',
  ].filter(Boolean).join(' ');

  return (
    <Box ref={onRefSet} className={wrapperClassName}>
      <Box className={classes.assistantMessage}>
        <Avatar size="sm" radius="xl" className={classes.avatar} color="violet">
          <IconSparkles size={16} />
        </Avatar>
        <Box className={classes.assistantContent}>
          <Box className={classes.markdownContent}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code: ({ className, children, ...props }: { className?: string; children?: ReactNode }) => {
                  const match = /language-(\w+)/.exec(className || '');
                  const isInline = !match && !String(children).includes('\n');

                  if (isInline) {
                    return <code className={classes.inlineCode} {...props}>{children}</code>;
                  }

                  const codeString = String(children).replace(/\n$/, '');

                  return (
                    <Box className={classes.codeBlock}>
                      <Box className={classes.codeHeader}>
                        <Text size="xs" c="dimmed">{match ? match[1] : 'code'}</Text>
                        <CopyButton value={codeString} timeout={2000}>
                          {({ copied, copy }) => (
                            <ActionIcon size="xs" variant="subtle" color={copied ? 'teal' : 'gray'} onClick={copy} className={classes.codeBlockCopyButton}>
                              {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                            </ActionIcon>
                          )}
                        </CopyButton>
                      </Box>
                      <pre className={classes.pre}>
                        <code className={className} {...props}>{children}</code>
                      </pre>
                    </Box>
                  );
                },
                p: ({ children }: { children?: ReactNode }) => (
                  <Text size="sm" component="p" className={classes.paragraph}>{children}</Text>
                ),
                ul: ({ children }: { children?: ReactNode }) => <ul className={classes.list}>{children}</ul>,
                ol: ({ children }: { children?: ReactNode }) => <ol className={classes.list}>{children}</ol>,
                li: ({ children }: { children?: ReactNode }) => <li className={classes.listItem}>{children}</li>,
                a: ({ href, children }: { href?: string; children?: ReactNode }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className={classes.link}>{children}</a>
                ),
                blockquote: ({ children }: { children?: ReactNode }) => (
                  <blockquote className={classes.blockquote}>{children}</blockquote>
                ),
                table: ({ children }: { children?: ReactNode }) => (
                  <Box className={classes.tableWrapper}><table className={classes.table}>{children}</table></Box>
                ),
                th: ({ children }: { children?: ReactNode }) => <th className={classes.tableHeader}>{children}</th>,
                td: ({ children }: { children?: ReactNode }) => <td className={classes.tableCell}>{children}</td>,
              }}
            >
              {content}
            </ReactMarkdown>
          </Box>
          {isStreaming && (
            <Box className={classes.typingIndicator}>
              <span></span><span></span><span></span>
            </Box>
          )}
          {!isStreaming && (
            <Group gap="xs" className={classes.messageActionsLeft}>
              <CopyButton value={content} timeout={2000}>
                {({ copied, copy }) => (
                  <Tooltip label={copied ? 'Copied!' : 'Copy message'} withArrow position="bottom">
                    <ActionIcon size="xs" variant="subtle" color={copied ? 'teal' : 'gray'} onClick={copy}>
                      {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
              {extMessageId && (
                <Tooltip label="View trace" withArrow position="bottom">
                  <ActionIcon size="xs" variant="subtle" color="gray" onClick={handleViewTrace}>
                    <IconBinaryTree size={14} />
                  </ActionIcon>
                </Tooltip>
              )}
              {onReaction && (
                <>
                  <Tooltip label="Good response" withArrow position="bottom">
                    <ActionIcon size="xs" variant="subtle" color="gray" onClick={() => onReaction(message.id, 'thumbs_up')}>
                      <IconThumbUp size={14} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Bad response" withArrow position="bottom">
                    <ActionIcon size="xs" variant="subtle" color="gray" onClick={() => onReaction(message.id, 'thumbs_down')}>
                      <IconThumbDown size={14} />
                    </ActionIcon>
                  </Tooltip>
                </>
              )}
            </Group>
          )}
        </Box>
      </Box>
    </Box>
  );
};

interface StreamingMessageProps {
  content: string;
}

const StreamingMessage: FC<StreamingMessageProps> = ({ content }) => {
  return (
    <Box className={classes.messageWrapper}>
      <Box className={classes.assistantMessage}>
        <Avatar size="sm" radius="xl" className={classes.avatar} color="violet">
          <IconSparkles size={16} />
        </Avatar>
        <Box className={classes.assistantContent}>
          <Box className={classes.markdownContent}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </Box>
          <Box className={classes.typingIndicator}>
            <span></span><span></span><span></span>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
