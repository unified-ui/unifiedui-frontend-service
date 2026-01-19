import type { FC } from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Loader, Center, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconUpload, IconMessageCircle } from '@tabler/icons-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { useIdentity, useChatSidebar } from '../../contexts';
import { ShareConversationDialog } from '../../components/dialogs/ShareConversationDialog';
import { SearchConversationsDialog } from '../../components/dialogs/SearchConversationsDialog';
import { TracingProvider, TracingSidebar, TracingVisualDialog } from '../../components/tracing';
import { ChatSidebar } from './components/ChatSidebar';
import { ChatHeader } from './components/ChatHeader';
import { ChatContent } from './components/ChatContent';
import { ChatInput, type ChatInputRef } from './components/ChatInput';
import {
  FavoriteResourceTypeEnum,
  ApplicationTypeEnum,
  type ConversationResponse,
  type ApplicationResponse,
  type MessageResponse,
  type FullTraceResponse,
} from '../../api/types';
import classes from './ConversationsPage.module.css';

// Local storage keys
const STORAGE_KEY_LAST_APP = 'unified-ui-last-application-id';
const STORAGE_KEY_SIDEBAR_COLLAPSED = 'unified-ui-sidebar-collapsed';

// Context data prefix for query parameters
const CONTEXT_DATA_PREFIX = 'ctx_';

/**
 * Extracts context data from URL search parameters.
 * Query params with 'ctx_' prefix are extracted and the prefix is removed from keys.
 * Example: ctx_imt_internal_id=728173 -> { imt_internal_id: '728173' }
 */
function extractContextDataFromSearchParams(
  searchParams: URLSearchParams
): Record<string, string> | undefined {
  const contextData: Record<string, string> = {};
  
  searchParams.forEach((value, key) => {
    if (key.startsWith(CONTEXT_DATA_PREFIX)) {
      // Remove prefix from key
      const cleanKey = key.slice(CONTEXT_DATA_PREFIX.length);
      if (cleanKey) {
        contextData[cleanKey] = value;
      }
    }
  });
  
  // Return undefined if no context data found (to avoid sending empty object)
  return Object.keys(contextData).length > 0 ? contextData : undefined;
}

export const ConversationsPage: FC = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { apiClient, selectedTenant, user, getFoundryToken } = useIdentity();
  const { onSidebarHoverEnter, onSidebarHoverLeave } = useChatSidebar();

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
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  
  // Tracing state
  const [tracingSidebarVisible, setTracingSidebarVisible] = useState(false);
  const [tracingDialogOpen, setTracingDialogOpen] = useState(false);
  const [traces, setTraces] = useState<FullTraceResponse[]>([]);
  /** The extMessageId to highlight in the trace hierarchy (set via message trace button click) */
  const [selectedNodeReferenceId, setSelectedNodeReferenceId] = useState<string | undefined>();
  /** The extMessageId to highlight in the chat (set when selecting a node in trace hierarchy) */
  const [highlightedMessageExtId, setHighlightedMessageExtId] = useState<string | null>(null);

  // Refs for abort controller
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatInputRef = useRef<ChatInputRef>(null);
  const justCreatedConversationRef = useRef<string | null>(null);

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

  // Update selectedApplicationId when query param changes (e.g., from sidebar navigation)
  useEffect(() => {
    const queryAppId = searchParams.get('chat-agent');
    if (queryAppId && queryAppId !== selectedApplicationId) {
      setSelectedApplicationId(queryAppId);
      localStorage.setItem(STORAGE_KEY_LAST_APP, queryAppId);
    }
  }, [searchParams, selectedApplicationId]);

  // Load conversation details and messages when conversationId changes
  useEffect(() => {
    if (!apiClient || !selectedTenant || !conversationId) {
      setCurrentConversation(null);
      setMessages([]);
      return;
    }

    // Skip loading if we just created this conversation (we already have the state from handleSendMessage)
    if (justCreatedConversationRef.current === conversationId) {
      justCreatedConversationRef.current = null;
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
        // Reverse messages to show oldest first
        setMessages([...messagesData.messages].reverse());
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

  // Refresh traces function - can be called manually
  const refreshTraces = useCallback(async () => {
    if (!apiClient || !selectedTenant || !conversationId) {
      return;
    }
    try {
      const tracesData = await apiClient.getConversationTraces(selectedTenant.id, conversationId);
      setTraces(tracesData.traces || []);
    } catch (error) {
      console.error('Failed to refresh traces:', error);
    }
  }, [apiClient, selectedTenant, conversationId]);

  // Load traces when conversation changes
  useEffect(() => {
    if (!apiClient || !selectedTenant || !conversationId) {
      setTraces([]);
      return;
    }
    refreshTraces();
  }, [apiClient, selectedTenant, conversationId, refreshTraces]);

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

  // Handle rename conversation (update local state)
  const handleRenameConversation = useCallback((id: string, newName: string) => {
    setConversations(prev => prev.map(c => 
      c.id === id ? { ...c, name: newName } : c
    ));
    
    // Also update current conversation if it's the renamed one
    if (currentConversation?.id === id) {
      setCurrentConversation(prev => prev ? { ...prev, name: newName } : null);
    }
  }, [currentConversation]);

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

    // Check if this is a Microsoft Foundry application and get token if needed (BEFORE any API calls)
    const selectedApp = applications.find(app => app.id === selectedApplicationId);
    const isFoundryApp = selectedApp?.type === ApplicationTypeEnum.MICROSOFT_FOUNDRY;
    let foundryToken: string | undefined;
    if (isFoundryApp) {
      const token = await getFoundryToken();
      foundryToken = token ?? undefined;
    }

    // Determine conversation ID and ext_conversation_id - create new conversation if needed
    let activeConversationId = conversationId;
    let activeExtConversationId = currentConversation?.ext_conversation_id;
    
    // If this is a new chat, create conversation first via platform service
    if (!activeConversationId) {
      try {
        const newConv = await apiClient.createConversation(
          selectedTenant.id,
          {
            application_id: selectedApplicationId,
            name: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
          },
          foundryToken // Pass Foundry token for Foundry apps
        );
        
        activeConversationId = newConv.id;
        // IMPORTANT: Use ext_conversation_id from create response for Foundry apps
        activeExtConversationId = newConv.ext_conversation_id;
        
        // Mark this conversation as just created to prevent useEffect from overwriting our state
        justCreatedConversationRef.current = newConv.id;
        
        // Navigate to the new conversation (this updates conversationId param and triggers selected state)
        navigate(`/conversations/${newConv.id}`, { replace: true });
        
        // Update state
        setCurrentConversation(newConv);
        setConversations(prev => [newConv, ...prev]);
      } catch (error) {
        console.error('Failed to create conversation:', error);
        notifications.show({
          title: 'Error',
          message: 'Failed to create conversation',
          color: 'red',
        });
        return;
      }
    }

    // Create optimistic user message
    const optimisticUserMessage: MessageResponse = {
      id: `temp-${Date.now()}`,
      type: 'user',
      conversationId: activeConversationId,
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
    let currentStreamingMessageId = '';

    try {
      // Process attachments if any (convert to base64 or upload)
      const attachmentUrls: string[] = [];
      if (attachments && attachments.length > 0) {
        // TODO: Implement file upload logic
        console.log('Attachments:', attachments);
      }

      // Send message via SSE stream to agent-service
      // Extract context data from URL query params (ctx_* prefix)
      const contextData = extractContextDataFromSearchParams(searchParams);
      
      const stream = apiClient.sendMessageStream(
        selectedTenant.id,
        {
          conversationId: activeConversationId,
          applicationId: selectedApplicationId,
          message: {
            content,
            attachments: attachmentUrls.length > 0 ? attachmentUrls : undefined,
          },
          // Include invoke config with context data if present
          invokeConfig: contextData ? { contextData } : undefined,
          // Include external conversation ID for Foundry apps (used for continuing threads)
          extConversationId: isFoundryApp ? activeExtConversationId : undefined,
        },
        // onStreamStart - called for first message AND after STREAM_NEW_MESSAGE for subsequent messages
        (messageId: string, _newConversationId: string, isNewMessage: boolean) => {
          if (isNewMessage) {
            // This is a new message after STREAM_NEW_MESSAGE
            // The current message's content was already saved by onNewMessage
            currentStreamingMessageId = messageId;
            setStreamingMessageId(messageId);
            
            // Add a new streaming assistant message to the messages array
            const newStreamingMessage: MessageResponse = {
              id: messageId,
              type: 'assistant',
              conversationId: activeConversationId || '',
              applicationId: selectedApplicationId,
              content: '',
              status: 'pending',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            
            setMessages(prev => [...prev, newStreamingMessage]);
          } else {
            // First message in the stream
            currentStreamingMessageId = messageId;
            setStreamingMessageId(messageId);
            
            // Add a streaming assistant message to the messages array
            const streamingAssistantMessage: MessageResponse = {
              id: messageId,
              type: 'assistant',
              conversationId: activeConversationId || '',
              applicationId: selectedApplicationId,
              content: '', // Will be updated via streamingContent
              status: 'pending',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            
            // Update optimistic user message to completed and add streaming assistant message
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
        // onTextChunk
        (chunk: string) => {
          accumulatedContent += chunk;
          setStreamingContent(accumulatedContent);
        },
        // onNewMessage - Called when STREAM_NEW_MESSAGE is received (before the new STREAM_START)
        // This signals: save current message content, reset accumulator, prepare for new message
        () => {
          // Save the current message's accumulated content before starting a new one
          if (currentStreamingMessageId && accumulatedContent) {
            const previousMessageId = currentStreamingMessageId;
            const previousContent = accumulatedContent;
            setMessages(prev => prev.map(m => 
              m.id === previousMessageId
                ? { ...m, content: previousContent, status: 'completed' as const }
                : m
            ));
          }
          
          // Reset accumulated content for the new message
          accumulatedContent = '';
          setStreamingContent('');
        },
        // onStreamEnd
        () => {
          setIsStreaming(false);
          
          // Update the streaming message with final content
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
        // onError
        (code: string, message: string, details: string) => {
          console.error('Stream error:', { code, message, details });
          setIsStreaming(false);
          setStreamingContent('');
          setStreamingMessageId(undefined);
          
          // Remove optimistic user message and streaming assistant message on error
          setMessages(prev => prev.filter(m => 
            m.id !== optimisticUserMessage.id && m.id !== currentStreamingMessageId
          ));
          
          notifications.show({
            title: 'Error',
            message: message || 'Failed to send message',
            color: 'red',
          });
        },
        // onMessageComplete - Called when the backend sends the complete saved message with all metadata
        (completedMessage: MessageResponse) => {
          // Update the message in state with the complete data from the backend
          // This includes extMessageId and other metadata populated during save
          setMessages(prev => prev.map(m => 
            m.id === completedMessage.id ? completedMessage : m
          ));
          
          // Always refresh traces after a message is complete
          // This ensures traces are up-to-date when opening the tracing sidebar
          // TODO: Remove delay after fixing backend race condition
          // Delay needed because traces are saved asynchronously in backend (JobQueue)
          setTimeout(() => {
            refreshTraces();
          }, 1500);
        },
        // Foundry token for Microsoft Foundry applications
        foundryToken
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
      
      // Remove optimistic user message and streaming assistant message on error
      setMessages(prev => prev.filter(m => 
        m.id !== optimisticUserMessage.id && m.id !== currentStreamingMessageId
      ));
      
      if ((error as Error).name !== 'AbortError') {
        notifications.show({
          title: 'Error',
          message: 'Failed to send message',
          color: 'red',
        });
      }
    }
  }, [apiClient, selectedTenant, selectedApplicationId, conversationId, applications, currentConversation, getFoundryToken, refreshTraces]);

  // Handle share
  const handleShare = useCallback(() => {
    setShareDialogOpen(true);
  }, []);

  // Handle search open
  const handleSearchOpen = useCallback(() => {
    setSearchDialogOpen(true);
  }, []);

  // Handle tracing sidebar toggle
  const handleToggleTracingSidebar = useCallback(() => {
    setTracingSidebarVisible(prev => !prev);
  }, []);

  // Helper: Find node by referenceId in traces (recursive)
  const findNodeByReferenceId = useCallback((
    nodes: FullTraceResponse['nodes'],
    referenceId: string
  ): boolean => {
    for (const node of nodes) {
      if (node.referenceId === referenceId) {
        return true;
      }
      if (node.nodes && node.nodes.length > 0) {
        if (findNodeByReferenceId(node.nodes, referenceId)) {
          return true;
        }
      }
    }
    return false;
  }, []);

  // Handle view trace button click on assistant messages
  const handleViewTrace = useCallback(async (extMessageId: string) => {
    if (extMessageId) {
      // Check if the extMessageId exists in current traces
      const existsInTraces = traces.some(trace => 
        findNodeByReferenceId(trace.nodes, extMessageId)
      );
      
      // If not found, refresh traces (fallback for race condition)
      if (!existsInTraces) {
        await refreshTraces();
      }
      
      // Set the referenceId to highlight in trace
      setSelectedNodeReferenceId(extMessageId);
      // Open tracing sidebar if not already open
      if (!tracingSidebarVisible) {
        setTracingSidebarVisible(true);
      }
    }
  }, [tracingSidebarVisible, traces, findNodeByReferenceId, refreshTraces]);

  // Handle tracing fullscreen dialog open
  const handleOpenTracingFullscreen = useCallback(() => {
    setTracingDialogOpen(true);
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
          onMouseEnter={onSidebarHoverEnter}
          onMouseLeave={onSidebarHoverLeave}
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
            onRenameConversation={handleRenameConversation}
            onDeleteConversation={handleDeleteConversation}
            onSearchOpen={handleSearchOpen}
          />
        </Box>

        {/* Main chat area - margin left adjusts based on sidebar state */}
        <Box 
          className={`${classes.mainArea} ${sidebarCollapsed ? classes.sidebarCollapsed : ''}`}
          style={{ position: 'relative' }}
        >
          {/* Chat + Tracing Layout */}
          <Box className={classes.chatTracingLayout}>
            {/* Chat Section */}
            <Box 
              className={`${classes.chatSection} ${tracingSidebarVisible && traces.length > 0 ? classes.withTracingSidebar : ''}`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
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
                tracingSidebarVisible={tracingSidebarVisible}
                hasTraces={traces.length > 0}
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
                onToggleTracingSidebar={handleToggleTracingSidebar}
              />

              {/* Content */}
              {isNewChat && messages.length === 0 ? (
                <>
                  <Box className={classes.contentArea}>
                    <Box className={classes.emptyState}>
                      <IconMessageCircle size={64} className={classes.emptyStateIcon} />
                      <Text className={classes.emptyStateTitle}>
                        Start a new conversation
                      </Text>
                      <Text className={classes.emptyStateDescription}>
                        {selectedApplicationId
                          ? 'Type your message below to begin chatting'
                          : 'Select a chat agent from the header to start'}
                      </Text>
                    </Box>
                  </Box>

                  {/* Input - same structure as existing chat */}
                  <ChatInput
                    ref={chatInputRef}
                    onSend={handleSendMessage}
                    isDisabled={!selectedApplicationId}
                    isStreaming={isStreaming}
                    placeholder={
                      selectedApplicationId
                        ? 'Type a message to start...'
                        : 'Select a chat agent to start'
                    }
                  />
                </>
              ) : (
                <>
                  <Box className={classes.contentArea}>
                    <ChatContent
                      messages={messages}
                      isLoading={isLoadingMessages}
                      isStreaming={isStreaming}
                      streamingContent={streamingContent}
                      streamingMessageId={streamingMessageId}
                      onViewTrace={handleViewTrace}
                      highlightedExtMessageId={highlightedMessageExtId}
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
                </>
              )}
            </Box>

            {/* Tracing Sidebar */}
            {tracingSidebarVisible && traces.length > 0 && (
              <TracingProvider 
                traces={traces}
                initialNodeReferenceId={selectedNodeReferenceId}
                onNodeReferenceIdChange={setHighlightedMessageExtId}
              >
                <Box className={classes.tracingSidebarWrapper}>
                  <TracingSidebar onOpenFullscreen={handleOpenTracingFullscreen} />
                </Box>
              </TracingProvider>
            )}
          </Box>
        </Box>
      </Box>

      {/* Share Dialog */}
      <ShareConversationDialog
        opened={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        conversation={currentConversation}
      />

      {/* Search Dialog */}
      <SearchConversationsDialog
        opened={searchDialogOpen}
        onClose={() => setSearchDialogOpen(false)}
        conversations={conversations}
        applications={applications}
      />

      {/* Tracing Dialog */}
      {tracingDialogOpen && traces.length > 0 && (
        <TracingVisualDialog
          opened={tracingDialogOpen}
          onClose={() => setTracingDialogOpen(false)}
          traces={traces}
        />
      )}
    </MainLayout>
  );
};
