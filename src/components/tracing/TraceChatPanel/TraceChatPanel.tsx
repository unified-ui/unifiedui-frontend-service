import { useState, useRef, useEffect, useCallback } from 'react';
import type { FC } from 'react';
import { Stack, Group, Text, TextInput, ActionIcon, Loader, ScrollArea, Box } from '@mantine/core';
import { IconSend, IconSparkles, IconTrash } from '@tabler/icons-react';
import { MarkdownRenderer } from '../../common/MarkdownRenderer';
import { useIdentity } from '../../../contexts/IdentityContext';
import { useTracing } from '../TracingContext';
import type { TraceChatMessage } from '../../../api/types';
import classes from './TraceChatPanel.module.css';

export const TraceChatPanel: FC = () => {
  const { apiClient, selectedTenant } = useIdentity();
  const { selectedTrace, selectedNode } = useTracing();
  const [messages, setMessages] = useState<TraceChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport], div');
      if (scrollArea) {
        scrollArea.scrollTop = scrollArea.scrollHeight;
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    setMessages([]);
    setInput('');
  }, [selectedTrace?.id]);

  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || !apiClient || !selectedTenant || !selectedTrace || isLoading) return;

    const userMessage: TraceChatMessage = { role: 'user', content: trimmedInput };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const result = await apiClient.traceChat(selectedTenant.id, {
        trace: JSON.stringify(selectedTrace, null, 2),
        selected_node: selectedNode ? JSON.stringify(selectedNode, null, 2) : undefined,
        message: trimmedInput,
        history: messages,
      });

      const assistantMessage: TraceChatMessage = { role: 'assistant', content: result.reply };
      setMessages([...updatedMessages, assistantMessage]);
    } catch {
      const errorMessage: TraceChatMessage = {
        role: 'assistant',
        content: 'Failed to get a response. Please try again.',
      };
      setMessages([...updatedMessages, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([]);
    setInput('');
  };

  return (
    <Stack className={classes.container} gap={0}>
      <Group className={classes.header} justify="space-between" wrap="nowrap">
        <Group gap="xs" wrap="nowrap">
          <IconSparkles size={16} className={classes.headerIcon} />
          <Text size="sm" fw={600} className={classes.headerTitle}>
            Trace Chat
          </Text>
        </Group>
        {messages.length > 0 && (
          <ActionIcon
            variant="subtle"
            size="sm"
            onClick={handleClear}
            title="Clear chat"
          >
            <IconTrash size={14} />
          </ActionIcon>
        )}
      </Group>

      <ScrollArea className={classes.messagesArea} ref={scrollAreaRef} offsetScrollbars>
        {messages.length === 0 && !isLoading && (
          <Stack align="center" justify="center" className={classes.emptyState}>
            <IconSparkles size={32} className={classes.emptyIcon} />
            <Text size="sm" c="dimmed" ta="center">
              Ask questions about this trace
            </Text>
          </Stack>
        )}

        {messages.map((msg, index) => (
          <Box
            key={index}
            className={msg.role === 'user' ? classes.userMessage : classes.assistantMessage}
          >
            {msg.role === 'user' ? (
              <Text size="sm">{msg.content}</Text>
            ) : (
              <MarkdownRenderer content={msg.content} />
            )}
          </Box>
        ))}

        {isLoading && (
          <Box className={classes.assistantMessage}>
            <Group gap="xs">
              <Loader size="xs" />
              <Text size="sm" c="dimmed">Thinking...</Text>
            </Group>
          </Box>
        )}
      </ScrollArea>

      <Group className={classes.inputArea} gap="xs" wrap="nowrap">
        <TextInput
          ref={inputRef}
          className={classes.input}
          placeholder="Ask about this trace..."
          value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          size="sm"
        />
        <ActionIcon
          variant="filled"
          size="md"
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className={classes.sendButton}
        >
          <IconSend size={16} />
        </ActionIcon>
      </Group>
    </Stack>
  );
};

export default TraceChatPanel;
