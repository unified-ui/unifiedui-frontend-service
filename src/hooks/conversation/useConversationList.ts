import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import {
  FavoriteResourceTypeEnum,
  type ConversationResponse,
  type ChatAgentResponse,
} from '../../api/types';
import type { UnifiedUIAPIClient } from '../../api/client';

const STORAGE_KEY_LAST_APP = 'unified-ui-last-chat-agent-id';
const STORAGE_KEY_SIDEBAR_COLLAPSED = 'unified-ui-sidebar-collapsed';
const PAGE_SIZE = 30;

interface UseConversationListParams {
  apiClient: UnifiedUIAPIClient | null;
  tenantId: string | undefined;
  userId: string | undefined;
  conversationId: string | undefined;
}

interface UseConversationListReturn {
  conversations: ConversationResponse[];
  setConversations: React.Dispatch<React.SetStateAction<ConversationResponse[]>>;
  chatAgents: ChatAgentResponse[];
  selectedChatAgentId: string | undefined;
  favoriteIds: Set<string>;
  isLoadingConversations: boolean;
  sidebarCollapsed: boolean;
  isNewChat: boolean;
  currentConversation: ConversationResponse | null;
  setCurrentConversation: React.Dispatch<React.SetStateAction<ConversationResponse | null>>;
  hasMoreConversations: boolean;
  sidebarSearchQuery: string;
  handleChatAgentChange: (chatAgentId: string) => void;
  handleSidebarCollapse: (collapsed: boolean) => void;
  handleNewChat: (abortController: React.RefObject<AbortController | null>, agentIdOverride?: string) => void;
  handleSelectConversation: (id: string, abortController: React.RefObject<AbortController | null>) => void;
  handleToggleFavorite: (id: string, name: string) => Promise<void>;
  handleRenameConversation: (id: string, newName: string) => void;
  handleDeleteConversation: (id: string) => Promise<void>;
  handleSidebarSearch: (query: string) => void;
  handleLoadMoreConversations: () => void;
  setSelectedChatAgentId: React.Dispatch<React.SetStateAction<string | undefined>>;
  resetStreamingState: () => void;
  handleChatAgentSearch: (query: string) => void;
}

export function useConversationList({
  apiClient,
  tenantId,
  userId,
  conversationId,
}: UseConversationListParams): UseConversationListReturn {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [chatAgents, setChatAgents] = useState<ChatAgentResponse[]>([]);
  const [allChatAgents, setAllChatAgents] = useState<ChatAgentResponse[]>([]);
  const [selectedChatAgentId, setSelectedChatAgentId] = useState<string | undefined>();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [currentConversation, setCurrentConversation] = useState<ConversationResponse | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [hasMoreConversations, setHasMoreConversations] = useState(true);
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY_SIDEBAR_COLLAPSED);
    return stored === 'true';
  });

  const isLoadingMoreRef = useRef(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const agentSearchDebounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const isNewChat = !conversationId;

  const fetchConversations = useCallback(async (
    skip: number,
    nameFilter?: string,
  ): Promise<ConversationResponse[]> => {
    if (!apiClient || !tenantId) return [];

    const params: Record<string, unknown> = {
      skip,
      limit: PAGE_SIZE,
      order_by: 'updated_at',
      order_direction: 'desc',
    };
    if (nameFilter) {
      params.name = nameFilter;
    }
    return apiClient.listConversations(tenantId, params as never) as Promise<ConversationResponse[]>;
  }, [apiClient, tenantId]);

  useEffect(() => {
    if (!apiClient || !tenantId || !userId) return;

    const loadInitialData = async () => {
      setIsLoadingConversations(true);
      try {
        const [convsData, appsData, favoritesData] = await Promise.all([
          fetchConversations(0),
          apiClient.listChatAgents(tenantId, {
            limit: 50,
            order_by: 'name',
            order_direction: 'asc',
            fields: 'id,name,type,is_active,greeting_messages',
          }) as Promise<ChatAgentResponse[]>,
          apiClient.listConversationFavorites(tenantId, userId),
        ]);

        setConversations(convsData);
        setHasMoreConversations(convsData.length >= PAGE_SIZE);
        setChatAgents(appsData);
        setAllChatAgents(appsData);
        setFavoriteIds(new Set(favoritesData.favorites.map(f => f.resource_id)));

        const queryAppId = searchParams.get('agent');
        const storedAppId = localStorage.getItem(STORAGE_KEY_LAST_APP);

        if (queryAppId) {
          setSelectedChatAgentId(queryAppId);
        } else if (storedAppId && appsData.some(a => a.id === storedAppId)) {
          setSelectedChatAgentId(storedAppId);
        } else if (appsData.length > 0) {
          const firstActive = appsData.find(a => a.is_active);
          if (firstActive) {
            setSelectedChatAgentId(firstActive.id);
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
  }, [apiClient, tenantId, userId]);

  useEffect(() => {
    if (conversationId) return;
    const queryAppId = searchParams.get('agent');
    if (queryAppId && queryAppId !== selectedChatAgentId) {
      setSelectedChatAgentId(queryAppId);
      localStorage.setItem(STORAGE_KEY_LAST_APP, queryAppId);
    }
  }, [searchParams, selectedChatAgentId, conversationId]);

  const resetStreamingState = useCallback(() => {
  }, []);

  const handleChatAgentChange = useCallback((chatAgentId: string) => {
    setSelectedChatAgentId(chatAgentId);
    localStorage.setItem(STORAGE_KEY_LAST_APP, chatAgentId);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('agent', chatAgentId);
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleSidebarCollapse = useCallback((collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    localStorage.setItem(STORAGE_KEY_SIDEBAR_COLLAPSED, String(collapsed));
  }, []);

  const handleNewChat = useCallback((abortController: React.RefObject<AbortController | null>, agentIdOverride?: string) => {
    if (abortController.current) {
      abortController.current.abort();
    }
    setCurrentConversation(null);

    const agentId = agentIdOverride || selectedChatAgentId;
    const params = new URLSearchParams(searchParams);
    if (agentId) {
      params.set('agent', agentId);
    }
    const qs = params.toString();
    navigate(`/conversations${qs ? `?${qs}` : ''}`);
  }, [navigate, selectedChatAgentId, searchParams]);

  const handleSelectConversation = useCallback((id: string, abortController: React.RefObject<AbortController | null>) => {
    if (abortController.current) {
      abortController.current.abort();
    }
    const qs = searchParams.toString();
    navigate(`/conversations/${id}${qs ? `?${qs}` : ''}`);
  }, [navigate, searchParams]);

  const handleToggleFavorite = useCallback(async (id: string, _name: string) => {
    if (!apiClient || !tenantId || !userId) return;

    const isFavorite = favoriteIds.has(id);

    try {
      await apiClient.toggleFavorite(
        tenantId,
        userId,
        FavoriteResourceTypeEnum.CONVERSATION,
        id,
        isFavorite
      );

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
  }, [apiClient, tenantId, userId, favoriteIds]);

  const handleRenameConversation = useCallback((id: string, newName: string) => {
    setConversations(prev => prev.map(c =>
      c.id === id ? { ...c, name: newName } : c
    ));

    if (currentConversation?.id === id) {
      setCurrentConversation(prev => prev ? { ...prev, name: newName } : null);
    }
  }, [currentConversation]);

  const handleDeleteConversation = useCallback(async (id: string) => {
    if (!apiClient || !tenantId) return;

    try {
      await apiClient.deleteConversation(tenantId, id);
      setConversations(prev => prev.filter(c => c.id !== id));

      if (currentConversation?.id === id) {
        setCurrentConversation(null);
        const params = new URLSearchParams(searchParams);
        if (selectedChatAgentId) {
          params.set('agent', selectedChatAgentId);
        }
        const qs = params.toString();
        navigate(`/conversations${qs ? `?${qs}` : ''}`);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to delete conversation',
        color: 'red',
      });
    }
  }, [apiClient, tenantId, currentConversation?.id, selectedChatAgentId, navigate, searchParams]);

  const handleSidebarSearch = useCallback((query: string) => {
    setSidebarSearchQuery(query);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(async () => {
      if (!apiClient || !tenantId) return;

      setIsLoadingConversations(true);
      try {
        const trimmed = query.trim();
        const results = await fetchConversations(0, trimmed || undefined);
        setConversations(results);
        setHasMoreConversations(results.length >= PAGE_SIZE);
      } catch (error) {
        console.error('Failed to search conversations:', error);
      } finally {
        setIsLoadingConversations(false);
      }
    }, 300);
  }, [apiClient, tenantId, fetchConversations]);

  const handleChatAgentSearch = useCallback((query: string) => {
    if (agentSearchDebounceRef.current) {
      clearTimeout(agentSearchDebounceRef.current);
    }

    const trimmed = query.trim();
    if (!trimmed) {
      setChatAgents(allChatAgents);
      return;
    }

    agentSearchDebounceRef.current = setTimeout(async () => {
      if (!apiClient || !tenantId) return;

      try {
        const results = await apiClient.listChatAgents(tenantId, {
          limit: 50,
          order_by: 'name',
          order_direction: 'asc',
          name: trimmed,
          fields: 'id,name,type,is_active,greeting_messages',
        }) as ChatAgentResponse[];
        setChatAgents(results);
      } catch (error) {
        console.error('Failed to search chat agents:', error);
      }
    }, 300);
  }, [apiClient, tenantId, allChatAgents]);

  const handleLoadMoreConversations = useCallback(async () => {
    if (!apiClient || !tenantId || !hasMoreConversations || isLoadingMoreRef.current) return;

    isLoadingMoreRef.current = true;
    try {
      const trimmed = sidebarSearchQuery.trim();
      const moreResults = await fetchConversations(
        conversations.length,
        trimmed || undefined,
      );
      setConversations(prev => [...prev, ...moreResults]);
      setHasMoreConversations(moreResults.length >= PAGE_SIZE);
    } catch (error) {
      console.error('Failed to load more conversations:', error);
    } finally {
      isLoadingMoreRef.current = false;
    }
  }, [apiClient, tenantId, hasMoreConversations, sidebarSearchQuery, conversations.length, fetchConversations]);

  return {
    conversations,
    setConversations,
    chatAgents,
    selectedChatAgentId,
    favoriteIds,
    isLoadingConversations,
    sidebarCollapsed,
    isNewChat,
    currentConversation,
    setCurrentConversation,
    hasMoreConversations,
    sidebarSearchQuery,
    handleChatAgentChange,
    handleSidebarCollapse,
    handleNewChat,
    handleSelectConversation,
    handleToggleFavorite,
    handleRenameConversation,
    handleDeleteConversation,
    handleSidebarSearch,
    handleLoadMoreConversations,
    setSelectedChatAgentId,
    resetStreamingState,
    handleChatAgentSearch,
  };
}
