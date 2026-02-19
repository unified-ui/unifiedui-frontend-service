import { useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import {
  ApplicationTypeEnum,
  type ConversationResponse,
  type ApplicationResponse,
  type MessageResponse,
  type FileAttachment,
  type ReactionResponse,
} from '../../api/types';
import { filesToAttachments } from '../../utils/fileUtils';
import type { UnifiedUIAPIClient } from '../../api/client';

const CONTEXT_DATA_PREFIX = 'ctx_';

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
  selectedApplicationId: string | undefined;
  conversationId: string | undefined;
  applications: ApplicationResponse[];
  currentConversation: ConversationResponse | null;
  getFoundryToken: () => Promise<string | null>;
  setCurrentConversation: React.Dispatch<React.SetStateAction<ConversationResponse | null>>;
  setConversations: React.Dispatch<React.SetStateAction<ConversationResponse[]>>;
  setSelectedApplicationId: React.Dispatch<React.SetStateAction<string | undefined>>;
  onRefreshTraces: () => Promise<void>;
}

interface UseChatReturn {
  messages: MessageResponse[];
  setMessages: React.Dispatch<React.SetStateAction<MessageResponse[]>>;
  isStreaming: boolean;
  streamingContent: string;
  streamingMessageId: string | undefined;
  isLoadingMessages: boolean;
  abortControllerRef: React.RefObject<AbortController | null>;
  justCreatedConversationRef: React.RefObject<string | null>;
  reactions: Map<string, ReactionResponse>;
  handleSendMessage: (content: string, attachments?: File[]) => Promise<void>;
  handleEditMessage: (messageId: string, newContent: string) => Promise<void>;
  handleDeleteMessage: (messageId: string) => Promise<void>;
  handleReaction: (messageId: string, reaction: 'thumbs_up' | 'thumbs_down', feedbackText?: string) => Promise<void>;
  handleCancelStream: () => void;
  resetStreamingState: () => void;
  loadConversationMessages: (convId: string) => Promise<void>;
}

export function useChat({
  apiClient,
  tenantId,
  selectedApplicationId,
  conversationId,
  applications,
  currentConversation,
  getFoundryToken,
  setCurrentConversation,
  setConversations,
  setSelectedApplicationId,
  onRefreshTraces,
}: UseChatParams): UseChatReturn {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingMessageId, setStreamingMessageId] = useState<string | undefined>();
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [reactions, setReactions] = useState<Map<string, ReactionResponse>>(new Map());

  const abortControllerRef = useRef<AbortController | null>(null);
  const justCreatedConversationRef = useRef<string | null>(null);

  const resetStreamingState = useCallback(() => {
    setIsStreaming(false);
    setStreamingContent('');
    setStreamingMessageId(undefined);
    setMessages([]);
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
    try {
      const [convData, messagesData] = await Promise.all([
        apiClient.getConversation(tenantId, convId),
        apiClient.getMessages(tenantId, convId),
      ]);

      setCurrentConversation(convData);
      const loadedMessages = [...messagesData.messages].reverse();
      setMessages(loadedMessages);
      setSelectedApplicationId(convData.application_id);

      const assistantMessages = loadedMessages.filter(m => m.type === 'assistant' && !m.id.startsWith('temp-'));
      const reactionsMap = new Map<string, ReactionResponse>();
      await Promise.all(
        assistantMessages.map(async (msg) => {
          try {
            const res = await apiClient.getReactions(tenantId, convId, msg.id);
            if (res.reactions.length > 0) {
              reactionsMap.set(msg.id, res.reactions[0]);
            }
          } catch {
            // ignore
          }
        })
      );
      setReactions(reactionsMap);
    } catch (error) {
      console.error('Failed to load conversation:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load conversation',
        color: 'red',
      });
      navigate('/conversations');
    } finally {
      setIsLoadingMessages(false);
    }
  }, [apiClient, tenantId, navigate, setCurrentConversation, setSelectedApplicationId]);

  const executeStream = useCallback(async (
    content: string,
    activeConversationId: string,
    activeExtConversationId: string | undefined,
    optimisticUserMessage: MessageResponse,
    foundryToken: string | undefined,
    isFoundryApp: boolean,
    files?: FileAttachment[],
  ) => {
    let accumulatedContent = '';
    let currentStreamingMessageId = '';

    const contextData = extractContextDataFromSearchParams(searchParams);

    const stream = apiClient!.sendMessageStream(
      tenantId!,
      {
        conversationId: activeConversationId,
        applicationId: selectedApplicationId!,
        message: {
          content,
          attachments: undefined,
          files,
        },
        invokeConfig: contextData ? { contextData } : undefined,
        extConversationId: isFoundryApp ? activeExtConversationId : undefined,
      },
      (messageId: string, _newConversationId: string, isNewMessage: boolean) => {
        if (isNewMessage) {
          currentStreamingMessageId = messageId;
          setStreamingMessageId(messageId);

          const newStreamingMessage: MessageResponse = {
            id: messageId,
            type: 'assistant',
            conversationId: activeConversationId,
            applicationId: selectedApplicationId!,
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
            applicationId: selectedApplicationId!,
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
      foundryToken,
      abortControllerRef.current?.signal
    );

    for await (const _event of stream) {
      if (abortControllerRef.current?.signal.aborted) {
        break;
      }
    }
  }, [apiClient, tenantId, selectedApplicationId, searchParams, setConversations, setCurrentConversation, onRefreshTraces]);

  const handleSendMessage = useCallback(async (content: string, attachments?: File[]) => {
    if (!apiClient || !tenantId || !selectedApplicationId) {
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

    const selectedApp = applications.find(app => app.id === selectedApplicationId);
    const isFoundryApp = selectedApp?.type === ApplicationTypeEnum.MICROSOFT_FOUNDRY;
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
    }));

    const optimisticUserMessage: MessageResponse = {
      id: `temp-${Date.now()}`,
      type: 'user',
      conversationId: activeConversationId || 'pending',
      applicationId: selectedApplicationId,
      content,
      status: 'pending',
      attachmentsMetadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, optimisticUserMessage]);
    setIsStreaming(true);
    setStreamingContent('');

    if (!activeConversationId) {
      try {
        const newConv = await apiClient.createConversation(
          tenantId,
          {
            application_id: selectedApplicationId,
            name: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
          },
          foundryToken
        );

        activeConversationId = newConv.id;
        activeExtConversationId = newConv.ext_conversation_id;

        justCreatedConversationRef.current = newConv.id;

        navigate(`/conversations/${newConv.id}`, { replace: true });

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
  }, [apiClient, tenantId, selectedApplicationId, conversationId, applications, currentConversation, getFoundryToken, navigate, setCurrentConversation, setConversations, executeStream]);

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
    abortControllerRef,
    justCreatedConversationRef,
    handleSendMessage,
    handleEditMessage,
    handleDeleteMessage,
    handleReaction,
    handleCancelStream,
    reactions,
    resetStreamingState,
    loadConversationMessages,
  };
}
