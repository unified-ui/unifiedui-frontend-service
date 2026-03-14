import type { FC, ReactNode } from 'react';
import { useEffect, useLayoutEffect, useRef, useCallback, useState, useMemo } from 'react';
import { ScrollArea, Box, Text, Avatar, Stack, Loader, Paper, Tooltip, ActionIcon, CopyButton, Group, Button, Textarea } from '@mantine/core';
import { IconUser, IconSparkles, IconCopy, IconCheck, IconBinaryTree, IconThumbUp, IconThumbDown, IconThumbUpFilled, IconThumbDownFilled, IconArrowDown, IconEdit, IconTrash, IconAlertTriangle, IconRefresh, IconFile, IconPhoto, IconFileTypePdf, IconFileTypeDoc, IconFileTypeXls, IconFileTypePpt, IconFileText, IconMusic, IconFileCode } from '@tabler/icons-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { MessageResponse, AttachmentMetadata, ReactionResponse } from '../../../api/types';
import type { ReActStreamState } from '../../../hooks/chat/useReActChat';
import { statusTracesToReActState } from '../../../hooks/chat/useReActChat';
import { ConfirmDeleteDialog } from '../../common';
import { FeedbackDialog } from '../FeedbackDialog';
import { ReasoningSection } from '../ReasoningSection';
import classes from './ChatContent.module.css';
import mdClasses from './Markdown.module.css';

export interface ChatContentProps {
  messages: MessageResponse[];
  isLoading?: boolean;
  isStreaming?: boolean;
  streamingContent?: string;
  onViewTrace?: (extMessageId: string) => void;
  highlightedExtMessageId?: string | null;
  highlightedUserMessageId?: string | null;
  onEditMessage?: (messageId: string, newContent: string) => Promise<void>;
  onDeleteMessage?: (messageId: string) => Promise<void>;
  onReaction?: (messageId: string, reaction: 'thumbs_up' | 'thumbs_down', feedbackText?: string) => Promise<void>;
  reactions?: Map<string, ReactionResponse>;
  onRetry?: (failedMessageId: string) => void;
  reActState?: ReActStreamState;
  onToggleReasoning?: () => void;
  alwaysExpandReasoning?: boolean;
}

export const ChatContent: FC<ChatContentProps> = ({
  messages,
  isLoading,
  isStreaming,
  streamingContent,
  streamingMessageId,
  onViewTrace,
  highlightedExtMessageId,
  highlightedUserMessageId,
  onEditMessage,
  onDeleteMessage,
  onReaction,
  reactions,
  onRetry,
  reActState,
  onToggleReasoning,
  alwaysExpandReasoning,
}) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());
  const userMessageRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());
  const [flashingExtId, setFlashingExtId] = useState<string | null>(null);
  const [flashingUserMsgId, setFlashingUserMsgId] = useState<string | null>(null);
  const prevHighlightedRef = useRef<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const userScrolledUpRef = useRef(false);
  const prevMessageCountRef = useRef(0);
  const pendingScrollToBottomRef = useRef(false);

  const setMessageRef = useCallback((extMessageId: string, element: HTMLDivElement | null) => {
    if (element) {
      messageRefsMap.current.set(extMessageId, element);
    } else {
      messageRefsMap.current.delete(extMessageId);
    }
  }, []);

  const setUserMessageRef = useCallback((messageId: string, element: HTMLDivElement | null) => {
    if (element) {
      userMessageRefsMap.current.set(messageId, element);
    } else {
      userMessageRefsMap.current.delete(messageId);
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

  const prevHighlightedUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (highlightedExtMessageId && highlightedExtMessageId !== prevHighlightedRef.current) {
      const element = messageRefsMap.current.get(highlightedExtMessageId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFlashingExtId(highlightedExtMessageId);
        const timer = setTimeout(() => setFlashingExtId(null), 600);
        return () => clearTimeout(timer);
      }
    }
    prevHighlightedRef.current = highlightedExtMessageId || null;
  }, [highlightedExtMessageId]);

  useEffect(() => {
    if (highlightedUserMessageId && highlightedUserMessageId !== prevHighlightedUserRef.current) {
      const element = userMessageRefsMap.current.get(highlightedUserMessageId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFlashingUserMsgId(highlightedUserMessageId);
        const timer = setTimeout(() => setFlashingUserMsgId(null), 600);
        return () => clearTimeout(timer);
      }
    }
    prevHighlightedUserRef.current = highlightedUserMessageId || null;
  }, [highlightedUserMessageId]);

  useEffect(() => {
    const prevCount = prevMessageCountRef.current;
    prevMessageCountRef.current = messages.length;

    const isBulkLoad = prevCount === 0 && messages.length > 1;

    if (isBulkLoad) {
      userScrolledUpRef.current = false;
      pendingScrollToBottomRef.current = true;
      return;
    }

    if (messages.length > prevCount && messages.length > 0) {
      const newMessage = messages[messages.length - 1];
      if (newMessage.type === 'user') {
        const element = userMessageRefsMap.current.get(newMessage.id);
        if (element) {
          const viewport = viewportRef.current;
          if (spacerRef.current && viewport) {
            spacerRef.current.style.minHeight = `${viewport.clientHeight}px`;
          }
          requestAnimationFrame(() => {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
          userScrolledUpRef.current = false;
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setShowScrollButton(false);
          return;
        }
      }
    }

    if (!userScrolledUpRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useLayoutEffect(() => {
    if (!pendingScrollToBottomRef.current) return;
    if (spacerRef.current) spacerRef.current.style.minHeight = '0px';
    const viewport = viewportRef.current;
    if (viewport && messages.length > 0) {
      viewport.scrollTop = viewport.scrollHeight;
      pendingScrollToBottomRef.current = false;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowScrollButton(false);
    }
  });

  useEffect(() => {
    if (!userScrolledUpRef.current && streamingContent) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [streamingContent]);

  useEffect(() => {
    if (isStreaming) {
      userScrolledUpRef.current = false;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowScrollButton(false);
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isStreaming]);

  useEffect(() => {
    requestAnimationFrame(() => {
      const viewport = viewportRef.current;
      const spacer = spacerRef.current;
      const endMarker = messagesEndRef.current;
      if (!viewport || !spacer || !endMarker) return;

      if (messages.length === 0) {
        spacer.style.minHeight = '0px';
        return;
      }

      let lastUserEl: HTMLDivElement | undefined;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].type === 'user') {
          lastUserEl = userMessageRefsMap.current.get(messages[i].id);
          break;
        }
      }

      if (!lastUserEl) {
        spacer.style.minHeight = '0px';
        return;
      }

      const viewportHeight = viewport.clientHeight;
      const userRect = lastUserEl.getBoundingClientRect();
      const endRect = endMarker.getBoundingClientRect();
      const contentFromUserToEnd = endRect.top - userRect.top;

      spacer.style.minHeight = `${Math.max(0, viewportHeight - contentFromUserToEnd)}px`;
    });
  }, [messages, streamingContent, isStreaming]);

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

  return (
    <Box style={{ position: 'relative', height: '100%' }}>
      <ScrollArea
        className={classes.scrollArea}
        viewportRef={viewportRef}
        scrollbarSize={8}
        onScrollPositionChange={handleScroll}
      >
        <Box className={classes.scrollContentWrapper}>
          <Stack gap="lg" className={classes.messagesContainer}>
            {messages.map((message) => {
              const messageExtId = message.type !== 'user' ? message.metadata?.extMessageId : undefined;
              const isUser = message.type === 'user';
              const isHighlighted = isUser
                ? !!(highlightedUserMessageId && highlightedUserMessageId === message.id)
                : !!(messageExtId && highlightedExtMessageId === messageExtId);
              const isFlashing = isUser
                ? !!(flashingUserMsgId === message.id)
                : !!(messageExtId && flashingExtId === messageExtId);
              const isLastUserMessage = message.id === lastUserMessageId;
              const isError = message.status === 'failed';
              const isCancelled = message.status === 'cancelled';

              if (isError) {
                return (
                  <ErrorBubble
                    key={message.id}
                    message={message}
                    onRetry={onRetry}
                  />
                );
              }

              const refSetter = (el: HTMLDivElement | null) => {
                setUserMessageRef(message.id, el);
                if (!isUser && messageExtId) {
                  setMessageRef(messageExtId, el);
                }
              };

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isStreaming={isStreaming && message.id === streamingMessageId}
                  streamingContent={message.id === streamingMessageId ? streamingContent : undefined}
                  isCancelled={isCancelled}
                  onViewTrace={onViewTrace}
                  isHighlighted={isHighlighted}
                  isFlashing={isFlashing}
                  onRefSet={refSetter}
                  isLastUserMessage={isLastUserMessage}
                  onEditMessage={onEditMessage}
                  onDeleteMessage={onDeleteMessage}
                  onReaction={onReaction}
                  activeReaction={reactions?.get(message.id)}
                  reActState={reActState}
                  onToggleReasoning={onToggleReasoning}
                  alwaysExpandReasoning={alwaysExpandReasoning}
                />
              );
            })}

            {isStreaming && streamingContent && !streamingMessageId && (
              <StreamingMessage content={streamingContent} />
            )}

            <ThinkingIndicator isVisible={!!isStreaming && !streamingContent && !streamingMessageId} />
          </Stack>
          <div ref={messagesEndRef} />
          <div ref={spacerRef} />
          <div ref={bottomRef} />
        </Box>
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
  onRetry?: (failedMessageId: string) => void;
}

const ErrorBubble: FC<ErrorBubbleProps> = ({ message, onRetry }) => {
  const errorText = message.errorMessage || message.content || 'An error occurred while generating the response.';

  return (
    <Box className={classes.messageWrapper}>
      <Box className={classes.assistantMessage}>
        <Avatar size="sm" radius="xl" className={classes.avatar} color="red">
          <IconAlertTriangle size={16} />
        </Avatar>
        <Box className={classes.assistantContent}>
          <Paper className={classes.errorBubble} shadow="xs">
            <Text size="sm" c="red">{errorText}</Text>
          </Paper>
          {onRetry && (
            <Button
              size="xs"
              variant="light"
              color="red"
              leftSection={<IconRefresh size={14} />}
              mt="xs"
              onClick={() => onRetry(message.id)}
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
  isCancelled?: boolean;
  onViewTrace?: (extMessageId: string) => void;
  isHighlighted?: boolean;
  isFlashing?: boolean;
  onRefSet?: (element: HTMLDivElement | null) => void;
  isLastUserMessage?: boolean;
  onEditMessage?: (messageId: string, newContent: string) => Promise<void>;
  onDeleteMessage?: (messageId: string) => Promise<void>;
  onReaction?: (messageId: string, reaction: 'thumbs_up' | 'thumbs_down', feedbackText?: string) => Promise<void>;
  activeReaction?: ReactionResponse;
  reActState?: ReActStreamState;
  onToggleReasoning?: () => void;
  alwaysExpandReasoning?: boolean;
}

const MessageBubble: FC<MessageBubbleProps> = ({
  message,
  isStreaming,
  streamingContent,
  isCancelled,
  onViewTrace,
  isHighlighted,
  isFlashing,
  onRefSet,
  isLastUserMessage,
  onEditMessage,
  onDeleteMessage,
  onReaction,
  activeReaction,
  reActState,
  onToggleReasoning,
  alwaysExpandReasoning,
}) => {
  const isUser = message.type === 'user';
  const content = streamingContent || message.content;
  const extMessageId = !isUser ? message.metadata?.extMessageId : undefined;
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [persistedReasoningExpanded, setPersistedReasoningExpanded] = useState(false);

  const hasActiveReActSteps = !!reActState && reActState.reasoningSteps.length > 0;
  const isCurrentlyStreaming = !!isStreaming && (!!streamingContent || hasActiveReActSteps);

  const effectiveReActState = useMemo(() => {
    if (isCurrentlyStreaming && hasActiveReActSteps) {
      return reActState;
    }
    if (message.statusTraces && message.statusTraces.length > 0) {
      return statusTracesToReActState(message.statusTraces);
    }
    return null;
  }, [isCurrentlyStreaming, hasActiveReActSteps, reActState, message.statusTraces]);

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
    const userWrapperClassName = [
      classes.messageWrapper,
      isHighlighted ? classes.highlighted : '',
      isFlashing ? classes.flash : '',
    ].filter(Boolean).join(' ');

    return (
      <Box ref={onRefSet} className={userWrapperClassName}>
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
                <Paper className={classes.userBubble} shadow="xs" style={{ borderRadius: 'var(--mantine-radius-xl) var(--mantine-radius-xs) var(--mantine-radius-xl) var(--mantine-radius-xl)' }}>
                  <Text size="lg" style={{ whiteSpace: 'pre-wrap' }}>{content}</Text>
                </Paper>
                <Avatar size="sm" radius="xl" className={classes.avatar} color="primary">
                  <IconUser size={16} />
                </Avatar>
              </>
            )}
          </Box>
          {message.attachmentsMetadata && message.attachmentsMetadata.length > 0 && (
            <FileAttachmentChips attachments={message.attachmentsMetadata} />
          )}
          {!isEditing && (
            <Group gap="xs" className={classes.messageActions}>
              <CopyButton value={content} timeout={2000}>
                {({ copied, copy }) => (
                  <Tooltip label={copied ? 'Copied!' : 'Copy message'} withArrow position="bottom">
                    <ActionIcon size="md" variant="subtle" color={copied ? 'teal' : 'gray'} onClick={copy}>
                      {copied ? <IconCheck size={20} /> : <IconCopy size={20} />}
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
              {isLastUserMessage && onEditMessage && (
                <Tooltip label="Edit message" withArrow position="bottom">
                  <ActionIcon size="md" variant="subtle" color="gray" onClick={handleStartEdit}>
                    <IconEdit size={20} />
                  </ActionIcon>
                </Tooltip>
              )}
              {onDeleteMessage && !message.id.startsWith('temp-') && (
                <Tooltip label="Delete message" withArrow position="bottom">
                  <ActionIcon size="md" variant="subtle" color="red" onClick={() => setDeleteDialogOpen(true)}>
                    <IconTrash size={20} />
                  </ActionIcon>
                </Tooltip>
              )}
            </Group>
          )}
        </Box>
        <ConfirmDeleteDialog
          opened={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={() => {
            onDeleteMessage?.(message.id);
            setDeleteDialogOpen(false);
          }}
          itemType="message"
        />
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
          {effectiveReActState && effectiveReActState.reasoningSteps.length > 0 && (
            <ReasoningSection
              reActState={isCurrentlyStreaming ? effectiveReActState : { ...effectiveReActState, isReasoningExpanded: persistedReasoningExpanded }}
              isStreaming={isCurrentlyStreaming}
              onToggle={isCurrentlyStreaming && onToggleReasoning ? onToggleReasoning : () => setPersistedReasoningExpanded(prev => !prev)}
              alwaysExpanded={alwaysExpandReasoning}
            />
          )}
          <Box className={mdClasses.markdownContent}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code: ({ className, children, ...props }: { className?: string; children?: ReactNode }) => {
                  const match = /language-(\w+)/.exec(className || '');
                  const isInline = !match && !String(children).includes('\n');

                  if (isInline) {
                    return <code className={mdClasses.inlineCode} {...props}>{children}</code>;
                  }

                  const codeString = String(children).replace(/\n$/, '');

                  return (
                    <Box className={mdClasses.codeBlock}>
                      <Box className={mdClasses.codeHeader}>
                        <Text size="xs" c="dimmed">{match ? match[1] : 'code'}</Text>
                        <CopyButton value={codeString} timeout={2000}>
                          {({ copied, copy }) => (
                            <ActionIcon size="xs" variant="subtle" color={copied ? 'teal' : 'gray'} onClick={copy} className={mdClasses.codeBlockCopyButton}>
                              {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                            </ActionIcon>
                          )}
                        </CopyButton>
                      </Box>
                      <pre className={mdClasses.pre}>
                        <code className={className} {...props}>{children}</code>
                      </pre>
                    </Box>
                  );
                },
                p: ({ children }: { children?: ReactNode }) => (
                  <Text size="sm" component="p" className={mdClasses.paragraph}>{children}</Text>
                ),
                ul: ({ children }: { children?: ReactNode }) => <ul className={mdClasses.list}>{children}</ul>,
                ol: ({ children }: { children?: ReactNode }) => <ol className={mdClasses.list}>{children}</ol>,
                li: ({ children }: { children?: ReactNode }) => <li className={mdClasses.listItem}>{children}</li>,
                a: ({ href, children }: { href?: string; children?: ReactNode }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className={mdClasses.link}>{children}</a>
                ),
                blockquote: ({ children }: { children?: ReactNode }) => (
                  <blockquote className={mdClasses.blockquote}>{children}</blockquote>
                ),
                table: ({ children }: { children?: ReactNode }) => (
                  <Box className={mdClasses.tableWrapper}><table className={mdClasses.table}>{children}</table></Box>
                ),
                th: ({ children }: { children?: ReactNode }) => <th className={mdClasses.tableHeader}>{children}</th>,
                td: ({ children }: { children?: ReactNode }) => <td className={mdClasses.tableCell}>{children}</td>,
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
          {isCancelled && (
            <Paper className={classes.cancelledBanner} shadow="none">
              <Group gap="xs">
                <IconAlertTriangle size={14} />
                <Text size="xs">Response generation was stopped</Text>
              </Group>
            </Paper>
          )}
          {!isStreaming && (
            <Group gap="xs" className={classes.messageActionsLeft}>
              <CopyButton value={content} timeout={2000}>
                {({ copied, copy }) => (
                  <Tooltip label={copied ? 'Copied!' : 'Copy message'} withArrow position="bottom">
                    <ActionIcon size="md" variant="subtle" color={copied ? 'teal' : 'gray'} onClick={copy}>
                      {copied ? <IconCheck size={20} /> : <IconCopy size={20} />}
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
              {extMessageId && (
                <Tooltip label="View trace" withArrow position="bottom">
                  <ActionIcon size="md" variant="subtle" color="gray" onClick={handleViewTrace}>
                    <IconBinaryTree size={20} />
                  </ActionIcon>
                </Tooltip>
              )}
              {onReaction && (
                <>
                  <Tooltip label={activeReaction?.reaction === 'thumbs_up' ? 'Remove rating' : 'Good response'} withArrow position="bottom">
                    <ActionIcon
                      size="md"
                      variant="subtle"
                      color={activeReaction?.reaction === 'thumbs_up' ? 'teal' : 'gray'}
                      onClick={() => onReaction(message.id, 'thumbs_up')}
                    >
                      {activeReaction?.reaction === 'thumbs_up' ? <IconThumbUpFilled size={20} /> : <IconThumbUp size={20} />}
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label={activeReaction?.reaction === 'thumbs_down' ? 'Remove rating' : 'Bad response'} withArrow position="bottom">
                    <ActionIcon
                      size="md"
                      variant="subtle"
                      color={activeReaction?.reaction === 'thumbs_down' ? 'orange' : 'gray'}
                      onClick={() => {
                        if (activeReaction?.reaction === 'thumbs_down') {
                          onReaction(message.id, 'thumbs_down');
                        } else {
                          setFeedbackDialogOpen(true);
                        }
                      }}
                    >
                      {activeReaction?.reaction === 'thumbs_down' ? <IconThumbDownFilled size={20} /> : <IconThumbDown size={20} />}
                    </ActionIcon>
                  </Tooltip>
                </>
              )}
            </Group>
          )}
          <FeedbackDialog
            opened={feedbackDialogOpen}
            onClose={() => setFeedbackDialogOpen(false)}
            onSubmit={(feedbackText: string | undefined) => {
              onReaction?.(message.id, 'thumbs_down', feedbackText);
              setFeedbackDialogOpen(false);
            }}
          />
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
          <Box className={mdClasses.markdownContent}>
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

const getFileIcon = (attachment: AttachmentMetadata): ReactNode => {
  const mimeType = attachment.fileType?.toLowerCase() || '';
  const fileName = attachment.fileName?.toLowerCase() || '';
  const category = attachment.fileCategory?.toLowerCase() || '';

  if (category === 'image' || mimeType.startsWith('image/')) {
    return <IconPhoto size={14} className={classes.attachmentChipIcon} />;
  }
  if (mimeType.includes('pdf') || fileName.endsWith('.pdf')) {
    return <IconFileTypePdf size={14} className={classes.attachmentChipIcon} />;
  }
  if (mimeType.includes('word') || fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
    return <IconFileTypeDoc size={14} className={classes.attachmentChipIcon} />;
  }
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet') || fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) {
    return <IconFileTypeXls size={14} className={classes.attachmentChipIcon} />;
  }
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation') || fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) {
    return <IconFileTypePpt size={14} className={classes.attachmentChipIcon} />;
  }
  if (mimeType.includes('text') || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
    return <IconFileText size={14} className={classes.attachmentChipIcon} />;
  }
  if (category === 'audio' || mimeType.startsWith('audio/')) {
    return <IconMusic size={14} className={classes.attachmentChipIcon} />;
  }
  if (mimeType.includes('json') || mimeType.includes('javascript') || mimeType.includes('typescript') || fileName.endsWith('.json') || fileName.endsWith('.js') || fileName.endsWith('.ts')) {
    return <IconFileCode size={14} className={classes.attachmentChipIcon} />;
  }
  return <IconFile size={14} className={classes.attachmentChipIcon} />;
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

interface ThinkingIndicatorProps {
  isVisible: boolean;
}

const ThinkingIndicator: FC<ThinkingIndicatorProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <Box style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0' }}>
      <Avatar size="sm" radius="xl" color="violet">
        <IconSparkles size={16} />
      </Avatar>
      <div className="thinking-shimmer-bar" />
    </Box>
  );
};

interface FileAttachmentChipsProps {
  attachments: AttachmentMetadata[];
}

const FileAttachmentChips: FC<FileAttachmentChipsProps> = ({ attachments }) => {
  if (!attachments || attachments.length === 0) return null;

  return (
    <Box className={classes.attachmentsContainer}>
      {attachments.map((attachment, index) => (
        <Tooltip
          key={index}
          label={`${attachment.fileName} (${formatFileSize(attachment.fileSize)})`}
          withArrow
          position="bottom"
          openDelay={1000}
        >
          <Box className={classes.attachmentChip}>
            {getFileIcon(attachment)}
            <span className={classes.attachmentChipName}>{attachment.fileName}</span>
          </Box>
        </Tooltip>
      ))}
    </Box>
  );
};
