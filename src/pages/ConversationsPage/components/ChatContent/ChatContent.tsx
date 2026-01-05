import type { FC, ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { ScrollArea, Box, Text, Avatar, Stack, Loader, Paper } from '@mantine/core';
import { IconUser, IconSparkles } from '@tabler/icons-react';
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
}

export const ChatContent: FC<ChatContentProps> = ({
  messages,
  isLoading,
  isStreaming,
  streamingContent,
  streamingMessageId,
  emptyStateMessage = 'Start a conversation by typing a message below.',
}) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change or streaming
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

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
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isStreaming={isStreaming && message.id === streamingMessageId}
            streamingContent={message.id === streamingMessageId ? streamingContent : undefined}
          />
        ))}
        
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
}

const MessageBubble: FC<MessageBubbleProps> = ({ message, isStreaming, streamingContent }) => {
  const isUser = message.type === 'user';
  const content = streamingContent || message.content;

  if (isUser) {
    return (
      <Box className={classes.messageWrapper}>
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
      </Box>
    );
  }

  return (
    <Box className={classes.messageWrapper}>
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
