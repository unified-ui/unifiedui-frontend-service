import type { FC } from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Loader, Center, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconUpload } from '@tabler/icons-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { useIdentity } from '../../contexts';
import { ChatSidebar } from './components/ChatSidebar';
import { ChatHeader } from './components/ChatHeader';
import { ChatContent } from './components/ChatContent';
import { ChatInput, type ChatInputRef } from './components/ChatInput';
import {
  FavoriteResourceTypeEnum,
  type ConversationResponse,
  type ApplicationResponse,
  type MessageResponse,
} from '../../api/types';
import classes from './ConversationsPage.module.css';

// Local storage keys
const STORAGE_KEY_LAST_APP = 'unified-ui-last-application-id';
const STORAGE_KEY_SIDEBAR_COLLAPSED = 'unified-ui-sidebar-collapsed';

export const ConversationsPage: FC = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { apiClient, selectedTenant, user } = useIdentity();

  // State
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [applications, setApplications] = useState<ApplicationResponse[]>([]);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [currentConversation, setCurrentConversation] = useState<ConversationResponse | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | undefined>();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  
  // UI State
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingMessageId, setStreamingMessageId] = useState<string | undefined>();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY_SIDEBAR_COLLAPSED);
    return stored === 'true';
  });

  // Refs for abort controller
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatInputRef = useRef<ChatInputRef>(null);

  // Drag and drop state
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounterRef = useRef(0);

  // Determine if this is a new chat
  const isNewChat = !conversationId;

  // Load initial data
  useEffect(() => {
    if (!apiClient || !selectedTenant || !user) return;

    const loadInitialData = async () => {
      setIsLoadingConversations(true);
      try {
        // Load conversations, applications, and favorites in parallel
        const [convsData, appsData, favoritesData] = await Promise.all([
          apiClient.listConversations(selectedTenant.id, { limit: 999 }),
          apiClient.listApplications(selectedTenant.id, { limit: 999 }) as Promise<ApplicationResponse[]>,
          apiClient.listConversationFavorites(selectedTenant.id, user.id),
        ]);

        setConversations(convsData);
        setApplications(appsData);
        setFavoriteIds(new Set(favoritesData.favorites.map(f => f.resource_id)));

        // Set initial application from query param or localStorage
        const queryAppId = searchParams.get('chat-agent');
        const storedAppId = localStorage.getItem(STORAGE_KEY_LAST_APP);
        
        if (queryAppId) {
          setSelectedApplicationId(queryAppId);
        } else if (storedAppId && appsData.some(a => a.id === storedAppId)) {
          setSelectedApplicationId(storedAppId);
        } else if (appsData.length > 0) {
          // Select first active application
          const firstActive = appsData.find(a => a.is_active);
          if (firstActive) {
            setSelectedApplicationId(firstActive.id);
          }
        }
      } catch (error) {
        console.error('Failed to load initial data:', error);
        notifications.show({
          title: 'Error',
          message: 'Failed to load conversations',
          color: 'red',
        });
      } finally {
        setIsLoadingConversations(false);
      }
    };

    loadInitialData();
  }, [apiClient, selectedTenant, user]);

  // Load conversation details and messages when conversationId changes
  useEffect(() => {
    if (!apiClient || !selectedTenant || !conversationId) {
      setCurrentConversation(null);
      setMessages([]);
      return;
    }

    const loadConversation = async () => {
      setIsLoadingMessages(true);
      try {
        // Load conversation details and messages in parallel
        const [convData, messagesData] = await Promise.all([
          apiClient.getConversation(selectedTenant.id, conversationId),
          apiClient.getMessages(selectedTenant.id, conversationId),
        ]);

        setCurrentConversation(convData);
        setMessages(messagesData.messages);
        setSelectedApplicationId(convData.application_id);
      } catch (error) {
        console.error('Failed to load conversation:', error);
        notifications.show({
          title: 'Error',
          message: 'Failed to load conversation',
          color: 'red',
        });
        // Navigate to new chat if conversation not found
        navigate('/conversations');
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadConversation();
  }, [apiClient, selectedTenant, conversationId, navigate]);

  // Handle application change
  const handleApplicationChange = useCallback((applicationId: string) => {
    setSelectedApplicationId(applicationId);
    localStorage.setItem(STORAGE_KEY_LAST_APP, applicationId);
    
    // Update query param
    setSearchParams({ 'chat-agent': applicationId });
  }, [setSearchParams]);

  // Handle sidebar collapse
  const handleSidebarCollapse = useCallback((collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    localStorage.setItem(STORAGE_KEY_SIDEBAR_COLLAPSED, String(collapsed));
  }, []);

  // Handle new chat
  const handleNewChat = useCallback(() => {
    // Clear any streaming state
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
    setStreamingContent('');
    setStreamingMessageId(undefined);
    setMessages([]);
    setCurrentConversation(null);
    
    // Navigate to new chat with current application
    if (selectedApplicationId) {
      navigate(`/conversations?chat-agent=${selectedApplicationId}`);
    } else {
      navigate('/conversations');
    }
  }, [navigate, selectedApplicationId]);

  // Handle select conversation
  const handleSelectConversation = useCallback((id: string) => {
    // Clear any streaming state
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
    setStreamingContent('');
    setStreamingMessageId(undefined);
    
    navigate(`/conversations/${id}`);
  }, [navigate]);

  // Handle toggle favorite (pin/unpin)
  const handleToggleFavorite = useCallback(async (id: string) => {
    if (!apiClient || !selectedTenant || !user) return;

    const isFavorite = favoriteIds.has(id);
    
    try {
      await apiClient.toggleFavorite(
        selectedTenant.id, 
        user.id, 
        FavoriteResourceTypeEnum.CONVERSATION, 
        id, 
        isFavorite
      );
      
      // Update local state
      setFavoriteIds(prev => {
        const next = new Set(prev);
        if (isFavorite) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update favorite',
        color: 'red',
      });
    }
  }, [apiClient, selectedTenant, user, favoriteIds]);

  // Handle delete conversation
  const handleDeleteConversation = useCallback(async (id: string) => {
    if (!apiClient || !selectedTenant) return;

    try {
      await apiClient.deleteConversation(selectedTenant.id, id);
      
      // Update local state
      setConversations(prev => prev.filter(c => c.id !== id));
      
      // If deleted current conversation, navigate to new chat
      if (currentConversation?.id === id) {
        handleNewChat();
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to delete conversation',
        color: 'red',
      });
    }
  }, [apiClient, selectedTenant, currentConversation?.id, handleNewChat]);

  // Handle send message
  const handleSendMessage = useCallback(async (content: string, attachments?: File[]) => {
    if (!apiClient || !selectedTenant || !selectedApplicationId) {
      notifications.show({
        title: 'Error',
        message: 'Please select a chat agent first',
        color: 'red',
      });
      return;
    }

    // Abort any existing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Create optimistic user message
    const optimisticUserMessage: MessageResponse = {
      id: `temp-${Date.now()}`,
      type: 'user',
      conversationId: conversationId || '',
      applicationId: selectedApplicationId,
      content,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add user message to UI immediately
    setMessages(prev => [...prev, optimisticUserMessage]);
    setIsStreaming(true);
    setStreamingContent('');

    // Store current streaming content in a local variable for closure
    let accumulatedContent = '';

    try {
      // Process attachments if any (convert to base64 or upload)
      const attachmentUrls: string[] = [];
      if (attachments && attachments.length > 0) {
        // TODO: Implement file upload logic
        console.log('Attachments:', attachments);
      }

      // Send message via SSE stream
      const stream = apiClient.sendMessageStream(
        selectedTenant.id,
        {
          conversationId: conversationId || undefined,
          applicationId: selectedApplicationId,
          message: {
            content,
            attachments: attachmentUrls.length > 0 ? attachmentUrls : undefined,
          },
        },
        // onStreamStart
        (messageId: string, newConversationId: string) => {
          setStreamingMessageId(messageId);
          
          // If new conversation was created, navigate to it
          if (!conversationId && newConversationId) {
            // Update URL without full navigation to preserve state
            window.history.replaceState(null, '', `/conversations/${newConversationId}`);
            
            // Create new conversation object for UI
            const newConversation: ConversationResponse = {
              id: newConversationId,
              tenant_id: selectedTenant.id,
              application_id: selectedApplicationId,
              name: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            
            setCurrentConversation(newConversation);
            setConversations(prev => [newConversation, ...prev]);
            
            // Update user message with real conversation ID
            setMessages(prev => prev.map(m => 
              m.id === optimisticUserMessage.id 
                ? { ...m, conversationId: newConversationId }
                : m
            ));
          }
        },
        // onTextChunk
        (chunk: string) => {
          accumulatedContent += chunk;
          setStreamingContent(accumulatedContent);
        },
        // onStreamEnd
        () => {
          setIsStreaming(false);
          
          // Convert streaming content to a proper message
          const finalContent = accumulatedContent;
          if (finalContent) {
            const assistantMessage: MessageResponse = {
              id: `assistant-${Date.now()}`,
              type: 'assistant',
              conversationId: conversationId || currentConversation?.id || '',
              applicationId: selectedApplicationId,
              content: finalContent,
              status: 'completed',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            
            setMessages(prev => {
              // Remove optimistic user message and add real messages
              const filtered = prev.filter(m => m.id !== optimisticUserMessage.id);
              return [...filtered, 
                { ...optimisticUserMessage, id: `user-${Date.now()}`, status: 'completed' as const },
                assistantMessage
              ];
            });
          }
          
          setStreamingContent('');
          setStreamingMessageId(undefined);
        },
        // onError
        (code: string, message: string, details: string) => {
          console.error('Stream error:', { code, message, details });
          setIsStreaming(false);
          setStreamingContent('');
          setStreamingMessageId(undefined);
          
          // Remove optimistic message on error
          setMessages(prev => prev.filter(m => m.id !== optimisticUserMessage.id));
          
          notifications.show({
            title: 'Error',
            message: message || 'Failed to send message',
            color: 'red',
          });
        }
      );

      // Consume the stream
      for await (const _event of stream) {
        // Stream events are handled by callbacks above
        // This loop just drives the async generator
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsStreaming(false);
      setStreamingContent('');
      setStreamingMessageId(undefined);
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticUserMessage.id));
      
      if ((error as Error).name !== 'AbortError') {
        notifications.show({
          title: 'Error',
          message: 'Failed to send message',
          color: 'red',
        });
      }
    }
  }, [apiClient, selectedTenant, selectedApplicationId, conversationId, currentConversation, applications]);

  // Handle share (placeholder)
  const handleShare = useCallback(() => {
    notifications.show({
      title: 'Coming Soon',
      message: 'Share functionality will be available soon',
      color: 'blue',
    });
  }, []);

  // Drag and drop handlers for the main chat area
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && chatInputRef.current) {
      chatInputRef.current.handleFileDrop(files);
    }
  }, []);

  // Show initial loading
  if (isLoadingConversations && !conversations.length) {
    return (
      <MainLayout noPadding>
        <Box className={classes.pageContainer}>
          <Center h="100%">
            <Box ta="center">
              <Loader size="lg" />
              <Text c="dimmed" mt="md">Loading...</Text>
            </Box>
          </Center>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout noPadding>
      <Box className={classes.pageContainer}>
        {/* Fixed Chat Sidebar - attached to main layout sidebar */}
        <Box 
          className={`${classes.chatSidebarWrapper} ${sidebarCollapsed ? classes.collapsed : ''}`}
        >
          <ChatSidebar
            conversations={conversations}
            applications={applications}
            selectedConversationId={conversationId}
            favoriteIds={favoriteIds}
            isLoading={isLoadingConversations}
            isCollapsed={sidebarCollapsed}
            onCollapsedChange={handleSidebarCollapse}
            onNewChat={handleNewChat}
            onSelectConversation={handleSelectConversation}
            onToggleFavorite={handleToggleFavorite}
            onDeleteConversation={handleDeleteConversation}
          />
        </Box>

        {/* Main chat area - margin left adjusts based on sidebar state */}
        <Box 
          className={`${classes.mainArea} ${sidebarCollapsed ? classes.sidebarCollapsed : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          style={{ position: 'relative' }}
        >
          {/* Drop zone overlay */}
          <Box className={`${classes.dropZoneOverlay} ${isDragOver ? classes.active : ''}`}>
            <Box className={classes.dropZoneContent}>
              <IconUpload size={48} stroke={1.5} />
              <Text size="lg" fw={500}>Drop files here</Text>
              <Text size="sm" c="dimmed">Files will be attached to your message</Text>
            </Box>
          </Box>

          {/* Header */}
          <ChatHeader
            conversation={currentConversation}
            applications={applications}
            selectedApplicationId={selectedApplicationId}
            isNewChat={isNewChat}
            isFavorite={currentConversation ? favoriteIds.has(currentConversation.id) : false}
            onApplicationChange={handleApplicationChange}
            onShare={handleShare}
            onToggleFavorite={() => {
              if (currentConversation) {
                handleToggleFavorite(currentConversation.id);
              }
            }}
            onDelete={() => {
              if (currentConversation) {
                handleDeleteConversation(currentConversation.id);
              }
            }}
          />

          {/* Content */}
          <Box className={classes.contentArea}>
            <ChatContent
              messages={messages}
              isLoading={isLoadingMessages}
              isStreaming={isStreaming}
              streamingContent={streamingContent}
              streamingMessageId={streamingMessageId}
            />
          </Box>

          {/* Input */}
          <ChatInput
            ref={chatInputRef}
            onSend={handleSendMessage}
            isDisabled={!selectedApplicationId}
            isStreaming={isStreaming}
            placeholder={
              selectedApplicationId
                ? 'Type a message...'
                : 'Select a chat agent to start'
            }
          />
        </Box>
      </Box>
    </MainLayout>
  );
};
