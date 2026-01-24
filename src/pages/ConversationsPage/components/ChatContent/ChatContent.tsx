import type { FC, ReactNode } from 'react';
import { useEffect, useRef, useCallback, useState } from 'react';
import { ScrollArea, Box, Text, Avatar, Stack, Loader, Paper, Tooltip, ActionIcon, CopyButton, Group } from '@mantine/core';
import { IconUser, IconSparkles, IconCopy, IconCheck, IconBinaryTree } from '@tabler/icons-react';
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
  /** Called when user clicks trace button on a user message. Passes the extMessageId from the following assistant message. */
  onViewTrace?: (extMessageId: string) => void;
  /** The extMessageId of the message to highlight (when selecting a node in trace hierarchy) */
  highlightedExtMessageId?: string | null;
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
}) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  // Refs for each message element (keyed by extMessageId)
  const messageRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());
  // Track if we should flash the highlight (only on new highlight, not initial render)
  const [flashingExtId, setFlashingExtId] = useState<string | null>(null);
  const prevHighlightedRef = useRef<string | null>(null);

  // Callback to register message refs - MUST be defined before any early returns!
  const setMessageRef = useCallback((extMessageId: string, element: HTMLDivElement | null) => {
    if (element) {
      messageRefsMap.current.set(extMessageId, element);
    } else {
      messageRefsMap.current.delete(extMessageId);
    }
  }, []);

  // Auto-scroll to highlighted message and trigger flash animation
  useEffect(() => {
    if (highlightedExtMessageId && highlightedExtMessageId !== prevHighlightedRef.current) {
      const element = messageRefsMap.current.get(highlightedExtMessageId);
      if (element) {
        // Scroll to the message
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Trigger flash animation
        setFlashingExtId(highlightedExtMessageId);
        // Remove flash class after animation completes
        const timer = setTimeout(() => {
          setFlashingExtId(null);
        }, 600); // Match animation duration
        return () => clearTimeout(timer);
      }
    }
    prevHighlightedRef.current = highlightedExtMessageId || null;
  }, [highlightedExtMessageId]);

  // Auto-scroll to bottom when messages change or streaming
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Early returns AFTER all hooks are defined
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
        <Text size="lg" fw={500} mt="md">
          How can I help you today?
        </Text>
        <Text c="dimmed" size="sm" mt="xs" maw={400} ta="center">
          {emptyStateMessage}
        </Text>
      </Box>
    );
  }

  return (
    <ScrollArea
      className={classes.scrollArea}
      viewportRef={scrollAreaRef}
      scrollbarSize={8}
    >
      <Stack gap="lg" className={classes.messagesContainer}>
        {messages.map((message) => {
          // Check if this message should be highlighted (assistant message with matching extMessageId)
          const messageExtId = message.type !== 'user' ? message.metadata?.extMessageId : undefined;
          const isHighlighted = !!(messageExtId && highlightedExtMessageId === messageExtId);
          const isFlashing = !!(messageExtId && flashingExtId === messageExtId);
          
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
            />
          );
        })}
        
        {/* Streaming message that's not yet in messages array */}
        {isStreaming && streamingContent && !streamingMessageId && (
          <StreamingMessage content={streamingContent} />
        )}
        
        <div ref={bottomRef} />
      </Stack>
    </ScrollArea>
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
}

const MessageBubble: FC<MessageBubbleProps> = ({ 
  message, 
  isStreaming, 
  streamingContent, 
  onViewTrace,
  isHighlighted,
  isFlashing,
  onRefSet,
}) => {
  const isUser = message.type === 'user';
  const content = streamingContent || message.content;
  // For assistant messages, get extMessageId from metadata
  const extMessageId = !isUser ? message.metadata?.extMessageId : undefined;

  const handleViewTrace = useCallback(() => {
    if (extMessageId && onViewTrace) {
      onViewTrace(extMessageId);
    }
  }, [extMessageId, onViewTrace]);

  if (isUser) {
    return (
      <Box className={classes.messageWrapper}>
        <Box className={classes.userMessageContainer}>
          <Box className={classes.userMessage}>
            <Paper className={classes.userBubble} shadow="xs">
              <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                {content}
              </Text>
            </Paper>
            <Avatar size="sm" radius="xl" className={classes.avatar} color="primary">
              <IconUser size={16} />
            </Avatar>
          </Box>
          {/* Copy button below user message */}
          <Group gap="xs" className={classes.messageActions}>
            <CopyButton value={content} timeout={2000}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? 'Copied!' : 'Copy message'} withArrow position="bottom">
                  <ActionIcon 
                    size="xs" 
                    variant="subtle" 
                    color={copied ? 'teal' : 'gray'}
                    onClick={copy}
                  >
                    {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </Group>
        </Box>
      </Box>
    );
  }

  // Build className for messageWrapper
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
                    return (
                      <code className={classes.inlineCode} {...props}>
                        {children}
                      </code>
                    );
                  }
                  
                  return (
                    <Box className={classes.codeBlock}>
                      {match && (
                        <Box className={classes.codeHeader}>
                          <Text size="xs" c="dimmed">{match[1]}</Text>
                        </Box>
                      )}
                      <pre className={classes.pre}>
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    </Box>
                  );
                },
                p: ({ children }: { children?: ReactNode }) => (
                  <Text size="sm" component="p" className={classes.paragraph}>
                    {children}
                  </Text>
                ),
                ul: ({ children }: { children?: ReactNode }) => (
                  <ul className={classes.list}>{children}</ul>
                ),
                ol: ({ children }: { children?: ReactNode }) => (
                  <ol className={classes.list}>{children}</ol>
                ),
                li: ({ children }: { children?: ReactNode }) => (
                  <li className={classes.listItem}>{children}</li>
                ),
                a: ({ href, children }: { href?: string; children?: ReactNode }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={classes.link}
                  >
                    {children}
                  </a>
                ),
                blockquote: ({ children }: { children?: ReactNode }) => (
                  <blockquote className={classes.blockquote}>{children}</blockquote>
                ),
                table: ({ children }: { children?: ReactNode }) => (
                  <Box className={classes.tableWrapper}>
                    <table className={classes.table}>{children}</table>
                  </Box>
                ),
                th: ({ children }: { children?: ReactNode }) => (
                  <th className={classes.tableHeader}>{children}</th>
                ),
                td: ({ children }: { children?: ReactNode }) => (
                  <td className={classes.tableCell}>{children}</td>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </Box>
          {isStreaming && (
            <Box className={classes.typingIndicator}>
              <span></span>
              <span></span>
              <span></span>
            </Box>
          )}
          {/* Copy and Trace buttons below assistant message */}
          {!isStreaming && (
            <Group gap="xs" className={classes.messageActionsLeft}>
              <CopyButton value={content} timeout={2000}>
                {({ copied, copy }) => (
                  <Tooltip label={copied ? 'Copied!' : 'Copy message'} withArrow position="bottom">
                    <ActionIcon 
                      size="xs" 
                      variant="subtle" 
                      color={copied ? 'teal' : 'gray'}
                      onClick={copy}
                    >
                      {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
              {extMessageId && (
                <Tooltip label="View trace" withArrow position="bottom">
                  <ActionIcon 
                    size="xs" 
                    variant="subtle" 
                    color="gray"
                    onClick={handleViewTrace}
                  >
                    <IconBinaryTree size={14} />
                  </ActionIcon>
                </Tooltip>
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
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </Box>
          <Box className={classes.typingIndicator}>
            <span></span>
            <span></span>
            <span></span>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
