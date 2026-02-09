import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import {
  FavoriteResourceTypeEnum,
  type ConversationResponse,
  type ApplicationResponse,
} from '../../../api/types';
import type { UnifiedUIAPIClient } from '../../../api/client';

const STORAGE_KEY_LAST_APP = 'unified-ui-last-application-id';
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
  applications: ApplicationResponse[];
  selectedApplicationId: string | undefined;
  favoriteIds: Set<string>;
  isLoadingConversations: boolean;
  sidebarCollapsed: boolean;
  isNewChat: boolean;
  currentConversation: ConversationResponse | null;
  setCurrentConversation: React.Dispatch<React.SetStateAction<ConversationResponse | null>>;
  hasMoreConversations: boolean;
  sidebarSearchQuery: string;
  handleApplicationChange: (applicationId: string) => void;
  handleSidebarCollapse: (collapsed: boolean) => void;
  handleNewChat: (abortController: React.RefObject<AbortController | null>) => void;
  handleSelectConversation: (id: string, abortController: React.RefObject<AbortController | null>) => void;
  handleToggleFavorite: (id: string) => Promise<void>;
  handleRenameConversation: (id: string, newName: string) => void;
  handleDeleteConversation: (id: string) => Promise<void>;
  handleSidebarSearch: (query: string) => void;
  handleLoadMoreConversations: () => void;
  setSelectedApplicationId: React.Dispatch<React.SetStateAction<string | undefined>>;
  resetStreamingState: () => void;
}

/**
 * Hook for managing the conversation list, sidebar state, favorites, and CRUD operations.
 */
export function useConversationList({
  apiClient,
  tenantId,
  userId,
  conversationId,
}: UseConversationListParams): UseConversationListReturn {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [applications, setApplications] = useState<ApplicationResponse[]>([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | undefined>();
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
    return apiClient.listConversations(tenantId, params as never);
  }, [apiClient, tenantId]);

  useEffect(() => {
    if (!apiClient || !tenantId || !userId) return;

    const loadInitialData = async () => {
      setIsLoadingConversations(true);
      try {
        const [convsData, appsData, favoritesData] = await Promise.all([
          fetchConversations(0),
          apiClient.listApplications(tenantId, {
            limit: 100,
            order_by: 'name',
            order_direction: 'asc',
          }) as Promise<ApplicationResponse[]>,
          apiClient.listConversationFavorites(tenantId, userId),
        ]);

        setConversations(convsData);
        setHasMoreConversations(convsData.length >= PAGE_SIZE);
        setApplications(appsData);
        setFavoriteIds(new Set(favoritesData.favorites.map(f => f.resource_id)));

        const queryAppId = searchParams.get('chat-agent');
        const storedAppId = localStorage.getItem(STORAGE_KEY_LAST_APP);

        if (queryAppId) {
          setSelectedApplicationId(queryAppId);
        } else if (storedAppId && appsData.some(a => a.id === storedAppId)) {
          setSelectedApplicationId(storedAppId);
        } else if (appsData.length > 0) {
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
  }, [apiClient, tenantId, userId]);

  useEffect(() => {
    const queryAppId = searchParams.get('chat-agent');
    if (queryAppId && queryAppId !== selectedApplicationId) {
      setSelectedApplicationId(queryAppId);
      localStorage.setItem(STORAGE_KEY_LAST_APP, queryAppId);
    }
  }, [searchParams, selectedApplicationId]);

  const resetStreamingState = useCallback(() => {
    // Intentionally empty — caller handles streaming state reset
    // This is a coordination point for handleNewChat/handleSelectConversation
  }, []);

  const handleApplicationChange = useCallback((applicationId: string) => {
    setSelectedApplicationId(applicationId);
    localStorage.setItem(STORAGE_KEY_LAST_APP, applicationId);
    setSearchParams({ 'chat-agent': applicationId });
  }, [setSearchParams]);

  const handleSidebarCollapse = useCallback((collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    localStorage.setItem(STORAGE_KEY_SIDEBAR_COLLAPSED, String(collapsed));
  }, []);

  const handleNewChat = useCallback((abortController: React.RefObject<AbortController | null>) => {
    if (abortController.current) {
      abortController.current.abort();
    }
    setCurrentConversation(null);

    if (selectedApplicationId) {
      navigate(`/conversations?chat-agent=${selectedApplicationId}`);
    } else {
      navigate('/conversations');
    }
  }, [navigate, selectedApplicationId]);

  const handleSelectConversation = useCallback((id: string, abortController: React.RefObject<AbortController | null>) => {
    if (abortController.current) {
      abortController.current.abort();
    }
    navigate(`/conversations/${id}`);
  }, [navigate]);

  const handleToggleFavorite = useCallback(async (id: string) => {
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
        if (selectedApplicationId) {
          navigate(`/conversations?chat-agent=${selectedApplicationId}`);
        } else {
          navigate('/conversations');
        }
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to delete conversation',
        color: 'red',
      });
    }
  }, [apiClient, tenantId, currentConversation?.id, selectedApplicationId, navigate]);

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
    applications,
    selectedApplicationId,
    favoriteIds,
    isLoadingConversations,
    sidebarCollapsed,
    isNewChat,
    currentConversation,
    setCurrentConversation,
    hasMoreConversations,
    sidebarSearchQuery,
    handleApplicationChange,
    handleSidebarCollapse,
    handleNewChat,
    handleSelectConversation,
    handleToggleFavorite,
    handleRenameConversation,
    handleDeleteConversation,
    handleSidebarSearch,
    handleLoadMoreConversations,
    setSelectedApplicationId,
    resetStreamingState,
  };
}
