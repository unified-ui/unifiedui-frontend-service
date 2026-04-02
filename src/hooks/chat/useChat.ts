import { useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import {
  ChatAgentTypeEnum,
  type ConversationResponse,
  type ChatAgentResponse,
  type MessageResponse,
  type FileAttachment,
  type ReactionResponse,
} from '../../api/types';
import { filesToAttachments } from '../../utils/fileUtils';
import type { UnifiedUIAPIClient } from '../../api/client';
import { type ReActStreamState, useReActChat } from './useReActChat';

const CONTEXT_DATA_PREFIX = 'ctx_';
const MESSAGE_PAGE_SIZE = 25;

function extractContextDataFromSearchParams(
  searchParams: URLSearchParams
): Record<string, string> | undefined {
  const contextData: Record<string, string> = {};

  searchParams.forEach((value, key) => {
    if (key.startsWith(CONTEXT_DATA_PREFIX)) {
      const cleanKey = key.slice(CONTEXT_DATA_PREFIX.length);
      if (cleanKey) {
        contextData[cleanKey] = value;
      }
    }
  });

  return Object.keys(contextData).length > 0 ? contextData : undefined;
}

interface UseChatParams {
  apiClient: UnifiedUIAPIClient | null;
  tenantId: string | undefined;
  selectedChatAgentId: string | undefined;
  conversationId: string | undefined;
  chatAgents: ChatAgentResponse[];
  currentConversation: ConversationResponse | null;
  getFoundryToken: () => Promise<string | null>;
  setCurrentConversation: React.Dispatch<React.SetStateAction<ConversationResponse | null>>;
  setConversations: React.Dispatch<React.SetStateAction<ConversationResponse[]>>;
  setSelectedChatAgentId: React.Dispatch<React.SetStateAction<string | undefined>>;
  onRefreshTraces: () => Promise<void>;
  onNavigate?: (path: string, options?: { replace?: boolean }) => void;
}

interface UseChatReturn {
  messages: MessageResponse[];
  setMessages: React.Dispatch<React.SetStateAction<MessageResponse[]>>;
  isStreaming: boolean;
  streamingContent: string;
  streamingMessageId: string | undefined;
  isLoadingMessages: boolean;
  isLoadingMoreMessages: boolean;
  hasMoreMessages: boolean;
  setIsLoadingMessages: React.Dispatch<React.SetStateAction<boolean>>;
  abortControllerRef: React.RefObject<AbortController | null>;
  justCreatedConversationRef: React.RefObject<string | null>;
  reactions: Map<string, ReactionResponse>;
  reActState: ReActStreamState;
  hasReasoningSteps: boolean;
  setIsReasoningExpanded: (expanded: boolean) => void;
  handleSendMessage: (content: string, attachments?: File[], extra?: Record<string, unknown>) => Promise<void>;
  handleEditMessage: (messageId: string, newContent: string) => Promise<void>;
  handleDeleteMessage: (messageId: string) => Promise<void>;
  handleReaction: (messageId: string, reaction: 'thumbs_up' | 'thumbs_down', feedbackText?: string) => Promise<void>;
  handleCancelStream: () => void;
  resetStreamingState: () => void;
  loadConversationMessages: (convId: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
}

export function useChat({
  apiClient,
  tenantId,
  selectedChatAgentId,
  conversationId,
  chatAgents,
  currentConversation,
  getFoundryToken,
  setCurrentConversation,
  setConversations,
  setSelectedChatAgentId,
  onRefreshTraces,
  onNavigate,
}: UseChatParams): UseChatReturn {
  const routerNavigate = useNavigate();
  const nav = onNavigate ?? routerNavigate;
  const [searchParams] = useSearchParams();

  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingMessageId, setStreamingMessageId] = useState<string | undefined>();
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [reactions, setReactions] = useState<Map<string, ReactionResponse>>(new Map());

  const abortControllerRef = useRef<AbortController | null>(null);
  const justCreatedConversationRef = useRef<string | null>(null);

  const {
    reActState,
    hasReasoningSteps,
    setIsReasoningExpanded,
    resetReActState,
    onReasoningStart,
    onReasoningStream,
    onReasoningEnd,
    onToolCallStart,
    onToolCallStream,
    onToolCallEnd,
    onPlanStart,
    onPlanStream,
    onPlanComplete,
    onSubAgentStart,
    onSubAgentStream,
    onSubAgentEnd,
    onSynthesisStart,
    onSynthesisStream,
    onTrace,
    onReActStreamEnd,
  } = useReActChat();

  const resetStreamingState = useCallback(() => {
    setIsStreaming(false);
    setStreamingContent('');
    setStreamingMessageId(undefined);
    setMessages([]);
    setIsLoadingMessages(true);
  }, []);

  const handleCancelStream = useCallback(() => {
    if (!abortControllerRef.current) return;
    abortControllerRef.current.abort();

    setIsStreaming(false);
    const finalContent = streamingContent;
    const finalMessageId = streamingMessageId;
    setStreamingContent('');
    setStreamingMessageId(undefined);

    if (finalMessageId && finalContent) {
      setMessages(prev => prev.map(m =>
        m.id === finalMessageId
          ? { ...m, content: finalContent, status: 'cancelled' as const }
          : m
      ));
    } else if (finalMessageId) {
      setMessages(prev => prev.filter(m => m.id !== finalMessageId));
    }
  }, [streamingContent, streamingMessageId]);

  const loadConversationMessages = useCallback(async (convId: string) => {
    if (!apiClient || !tenantId) return;

    setIsLoadingMessages(true);
    setHasMoreMessages(false);
    try {
      const [convData, messagesData] = await Promise.all([
        apiClient.getConversation(tenantId, convId),
        apiClient.getMessages(tenantId, convId, { limit: MESSAGE_PAGE_SIZE }),
      ]);

      setCurrentConversation(convData);
      const loadedMessages = [...messagesData.messages].reverse();
      setMessages(loadedMessages);
      setHasMoreMessages(messagesData.hasMore);
      setIsLoadingMessages(false);
      setSelectedChatAgentId(convData.chat_agent_id);

      const assistantMessageIds = loadedMessages
        .filter(m => m.type === 'assistant' && !m.id.startsWith('temp-'))
        .map(m => m.id);

      if (assistantMessageIds.length > 0) {
        try {
          const bulkRes = await apiClient.getBulkReactions(tenantId, convId, assistantMessageIds);
          const reactionsMap = new Map<string, ReactionResponse>();
          for (const [msgId, msgReactions] of Object.entries(bulkRes.reactions)) {
            if (msgReactions.length > 0) {
              reactionsMap.set(msgId, msgReactions[0]);
            }
          }
          setReactions(reactionsMap);
        } catch {
          setReactions(new Map());
        }
      } else {
        setReactions(new Map());
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load conversation',
        color: 'red',
      });
      nav('/conversations');
    } finally {
      if (isLoadingMessages) setIsLoadingMessages(false);
    }
  }, [apiClient, tenantId, nav, setCurrentConversation, setSelectedChatAgentId, isLoadingMessages]);

  const loadMoreMessages = useCallback(async () => {
    if (!apiClient || !tenantId || !conversationId || !hasMoreMessages || isLoadingMoreMessages) return;

    setIsLoadingMoreMessages(true);
    try {
      const data = await apiClient.getMessages(tenantId, conversationId, {
        limit: MESSAGE_PAGE_SIZE,
        skip: messages.length,
      });

      const olderMessages = [...data.messages].reverse();
      setMessages(prev => [...olderMessages, ...prev]);
      setHasMoreMessages(data.hasMore);

      const assistantIds = olderMessages
        .filter(m => m.type === 'assistant' && !m.id.startsWith('temp-'))
        .map(m => m.id);

      if (assistantIds.length > 0) {
        try {
          const bulkRes = await apiClient.getBulkReactions(tenantId, conversationId, assistantIds);
          setReactions(prev => {
            const next = new Map(prev);
            for (const [msgId, msgReactions] of Object.entries(bulkRes.reactions)) {
              if (msgReactions.length > 0) {
                next.set(msgId, msgReactions[0]);
              }
            }
            return next;
          });
        } catch { /* ignore */ }
      }
    } catch (error) {
      console.error('Failed to load more messages:', error);
    } finally {
      setIsLoadingMoreMessages(false);
    }
  }, [apiClient, tenantId, conversationId, hasMoreMessages, isLoadingMoreMessages, messages.length]);

  const executeStream = useCallback(async (
    content: string,
    activeConversationId: string,
    activeExtConversationId: string | undefined,
    optimisticUserMessage: MessageResponse,
    foundryToken: string | undefined,
    isFoundryApp: boolean,
    files?: FileAttachment[],
    extra?: Record<string, unknown>,
  ) => {
    let accumulatedContent = '';
    let currentStreamingMessageId = '';

    const contextData = extractContextDataFromSearchParams(searchParams);

    const stream = apiClient!.sendMessageStream(
      tenantId!,
      {
        conversationId: activeConversationId,
        chatAgentId: selectedChatAgentId!,
        message: {
          content,
          attachments: undefined,
          files,
        },
        invokeConfig: contextData ? { contextData } : undefined,
        extConversationId: isFoundryApp ? activeExtConversationId : undefined,
        extra,
      },
      (messageId: string, _newConversationId: string, isNewMessage: boolean) => {
        if (isNewMessage) {
          currentStreamingMessageId = messageId;
          setStreamingMessageId(messageId);

          const newStreamingMessage: MessageResponse = {
            id: messageId,
            type: 'assistant',
            conversationId: activeConversationId,
            chatAgentId: selectedChatAgentId!,
            content: '',
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          setMessages(prev => [...prev, newStreamingMessage]);
        } else {
          currentStreamingMessageId = messageId;
          setStreamingMessageId(messageId);

          const streamingAssistantMessage: MessageResponse = {
            id: messageId,
            type: 'assistant',
            conversationId: activeConversationId,
            chatAgentId: selectedChatAgentId!,
            content: '',
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          setMessages(prev => {
            const updated = prev.map(m =>
              m.id === optimisticUserMessage.id
                ? { ...m, status: 'completed' as const }
                : m
            );
            return [...updated, streamingAssistantMessage];
          });
        }
      },
      (chunk: string) => {
        if (!accumulatedContent && hasReasoningSteps) {
          onReActStreamEnd();
        }
        accumulatedContent += chunk;
        setStreamingContent(accumulatedContent);
      },
      () => {
        if (currentStreamingMessageId && accumulatedContent) {
          const previousMessageId = currentStreamingMessageId;
          const previousContent = accumulatedContent;
          setMessages(prev => prev.map(m =>
            m.id === previousMessageId
              ? { ...m, content: previousContent, status: 'completed' as const }
              : m
          ));
        }

        accumulatedContent = '';
        setStreamingContent('');
      },
      () => {
        setIsStreaming(false);

        const finalContent = accumulatedContent;
        if (finalContent && currentStreamingMessageId) {
          setMessages(prev => prev.map(m =>
            m.id === currentStreamingMessageId
              ? { ...m, content: finalContent, status: 'completed' as const }
              : m
          ));
        }

        setStreamingContent('');
        setStreamingMessageId(undefined);
        onReActStreamEnd();
      },
      async (code: string, message: string, details: string) => {
        console.error('Stream error:', { code, message, details });

        setIsStreaming(false);
        setStreamingContent('');
        setStreamingMessageId(undefined);
      },
      (completedMessage: MessageResponse) => {
        setMessages(prev => {
          const existingIndex = prev.findIndex(m => m.id === completedMessage.id);

          if (existingIndex >= 0) {
            return prev.map(m => {
              if (m.id === completedMessage.id) return completedMessage;
              if (m.id === optimisticUserMessage.id && completedMessage.userMessageId) {
                return { ...m, id: completedMessage.userMessageId, status: 'completed' as const };
              }
              return m;
            });
          }

          return prev.map(m => {
            if (m.id === optimisticUserMessage.id && completedMessage.userMessageId) {
              return { ...m, id: completedMessage.userMessageId, status: 'completed' as const };
            }
            return m;
          }).concat(completedMessage);
        });

        setTimeout(() => {
          onRefreshTraces();
        }, 1500);
      },
      (title: string) => {
        if (!activeConversationId) return;
        const convId = activeConversationId;
        let charIndex = 0;
        const typewriterInterval = setInterval(() => {
          charIndex++;
          const partial = title.slice(0, charIndex);
          setConversations(prev => prev.map(c =>
            c.id === convId ? { ...c, name: partial } : c
          ));
          setCurrentConversation(prev => prev?.id === convId ? { ...prev, name: partial } : prev);
          if (charIndex >= title.length) {
            clearInterval(typewriterInterval);
          }
        }, 30);
      },
      onReasoningStart,
      onReasoningStream,
      onReasoningEnd,
      onToolCallStart,
      onToolCallStream,
      onToolCallEnd,
      onPlanStart,
      onPlanStream,
      onPlanComplete,
      onSubAgentStart,
      onSubAgentStream,
      onSubAgentEnd,
      onSynthesisStart,
      onSynthesisStream,
      onTrace,
      foundryToken,
      abortControllerRef.current?.signal
    );

    for await (const _event of stream) {
      if (abortControllerRef.current?.signal.aborted) {
        break;
      }
    }
  }, [apiClient, tenantId, selectedChatAgentId, searchParams, setConversations, setCurrentConversation, onRefreshTraces, hasReasoningSteps, onReasoningStart, onReasoningStream, onReasoningEnd, onToolCallStart, onToolCallStream, onToolCallEnd, onPlanStart, onPlanStream, onPlanComplete, onSubAgentStart, onSubAgentStream, onSubAgentEnd, onSynthesisStart, onSynthesisStream, onTrace, onReActStreamEnd]);

  const handleSendMessage = useCallback(async (content: string, attachments?: File[], extra?: Record<string, unknown>) => {
    if (!apiClient || !tenantId || !selectedChatAgentId) {
      notifications.show({
        title: 'Error',
        message: 'Please select a chat agent first',
        color: 'red',
      });
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const selectedApp = chatAgents.find(app => app.id === selectedChatAgentId);
    const isFoundryApp = selectedApp?.type === ChatAgentTypeEnum.MICROSOFT_FOUNDRY;
    let foundryToken: string | undefined;
    if (isFoundryApp) {
      const token = await getFoundryToken();
      foundryToken = token ?? undefined;
    }

    let activeConversationId = conversationId;
    let activeExtConversationId = currentConversation?.ext_conversation_id;

    const attachmentsMetadata = attachments?.map(file => ({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      fileCategory: file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : 'file',
      fileId: undefined as string | undefined,
    }));

    const optimisticUserMessage: MessageResponse = {
      id: `temp-${Date.now()}`,
      type: 'user',
      conversationId: activeConversationId || 'pending',
      chatAgentId: selectedChatAgentId,
      content,
      status: 'pending',
      attachmentsMetadata,
      extra,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, optimisticUserMessage]);
    setIsStreaming(true);
    setStreamingContent('');
    resetReActState();

    if (!activeConversationId) {
      try {
        const newConv = await apiClient.createConversation(
          tenantId,
          {
            chat_agent_id: selectedChatAgentId,
            name: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
          },
          foundryToken
        );

        activeConversationId = newConv.id;
        activeExtConversationId = newConv.ext_conversation_id;

        justCreatedConversationRef.current = newConv.id;

        const qs = searchParams.toString();
        nav(`/conversations/${newConv.id}${qs ? `?${qs}` : ''}`, { replace: true });

        setCurrentConversation(newConv);
        setConversations(prev => [newConv, ...prev]);
      } catch (error) {
        console.error('Failed to create conversation:', error);
        setIsStreaming(false);
        setStreamingContent('');
        setMessages(prev => prev.filter(m => m.id !== optimisticUserMessage.id));
        notifications.show({
          title: 'Error',
          message: 'Failed to create conversation',
          color: 'red',
        });
        return;
      }
    }

    let files: FileAttachment[] | undefined;
    if (attachments && attachments.length > 0) {
      files = await filesToAttachments(attachments);

      try {
        const uploadResults = await Promise.all(
          attachments.map(file =>
            apiClient.uploadFile(tenantId, file, 'CHAT_ATTACHMENT', activeConversationId)
          )
        );
        uploadResults.forEach((result, index) => {
          if (attachmentsMetadata) {
            attachmentsMetadata[index].fileId = result.id;
          }
          if (files) {
            files[index].fileId = result.id;
          }
        });
        if (attachmentsMetadata) {
          setMessages(prev =>
            prev.map(m =>
              m.id === optimisticUserMessage.id
                ? { ...m, attachmentsMetadata: [...attachmentsMetadata] }
                : m
            )
          );
        }
      } catch (error) {
        console.error('Failed to upload files to storage:', error);
      }
    }

    try {
      await executeStream(
        content,
        activeConversationId!,
        activeExtConversationId,
        optimisticUserMessage,
        foundryToken,
        isFoundryApp,
        files,
        extra,
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsStreaming(false);
      setStreamingContent('');
      setStreamingMessageId(undefined);

      setMessages(prev => prev.filter(m => m.id !== optimisticUserMessage.id));

      if ((error as Error).name !== 'AbortError') {
        notifications.show({
          title: 'Error',
          message: 'Failed to send message',
          color: 'red',
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiClient, tenantId, selectedChatAgentId, conversationId, chatAgents, currentConversation, getFoundryToken, nav, setCurrentConversation, setConversations, executeStream, resetReActState]);

  const handleEditMessage = useCallback(async (messageId: string, newContent: string) => {
    if (!apiClient || !tenantId || !conversationId) return;

    try {
      const updatedMessage = await apiClient.editMessage(
        tenantId,
        conversationId,
        messageId,
        { content: newContent }
      );

      setMessages(prev => prev.map(m =>
        m.id === messageId ? updatedMessage : m
      ));

      await handleSendMessage(newContent);
    } catch (error) {
      console.error('Failed to edit message:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to edit message',
        color: 'red',
      });
    }
  }, [apiClient, tenantId, conversationId, handleSendMessage]);

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    if (!apiClient || !tenantId || !conversationId) return;

    try {
      await apiClient.deleteMessage(tenantId, conversationId, messageId);

      setMessages(prev => {
        const deletedIndex = prev.findIndex(m => m.id === messageId);
        if (deletedIndex === -1) return prev;

        const deletedMessage = prev[deletedIndex];
        if (deletedMessage.type === 'user') {
          const nextMessage = prev[deletedIndex + 1];
          if (nextMessage && nextMessage.type === 'assistant') {
            return prev.filter(m => m.id !== messageId && m.id !== nextMessage.id);
          }
        }

        return prev.filter(m => m.id !== messageId);
      });
    } catch (error) {
      console.error('Failed to delete message:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to delete message',
        color: 'red',
      });
    }
  }, [apiClient, tenantId, conversationId]);

  const handleReaction = useCallback(async (messageId: string, reaction: 'thumbs_up' | 'thumbs_down', feedbackText?: string) => {
    if (!apiClient || !tenantId || !conversationId) return;

    const existingReaction = reactions.get(messageId);
    const isSameReaction = existingReaction?.reaction === reaction;

    try {
      if (isSameReaction) {
        await apiClient.deleteReaction(tenantId, conversationId, messageId);
        setReactions(prev => {
          const next = new Map(prev);
          next.delete(messageId);
          return next;
        });
      } else {
        const result = await apiClient.upsertReaction(tenantId, conversationId, messageId, {
          reaction,
          feedbackText,
        });
        setReactions(prev => {
          const next = new Map(prev);
          next.set(messageId, result);
          return next;
        });
      }
    } catch (error) {
      console.error('Failed to update reaction:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update reaction',
        color: 'red',
      });
    }
  }, [apiClient, tenantId, conversationId, reactions]);

  return {
    messages,
    setMessages,
    isStreaming,
    streamingContent,
    streamingMessageId,
    isLoadingMessages,
    isLoadingMoreMessages,
    hasMoreMessages,
    setIsLoadingMessages,
    abortControllerRef,
    justCreatedConversationRef,
    handleSendMessage,
    handleEditMessage,
    handleDeleteMessage,
    handleReaction,
    handleCancelStream,
    reactions,
    reActState,
    hasReasoningSteps,
    setIsReasoningExpanded,
    resetStreamingState,
    loadConversationMessages,
    loadMoreMessages,
  };
}
