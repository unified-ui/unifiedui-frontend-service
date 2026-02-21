import { createContext, useContext, useState, useCallback, useEffect, useRef, type FC, type ReactNode } from 'react';
import i18next from 'i18next';
import type { QuickListItemResponse, ConversationQuickListItemResponse } from '../api/types';
import { useIdentity } from './IdentityContext';

export type EntityType = 'chat-agents' | 'autonomous-agents' | 'chat-widgets' | 're-act-agents' | 'conversations';

interface SidebarDataState {
  chatAgents: QuickListItemResponse[];
  autonomousAgents: QuickListItemResponse[];
  chatWidgets: QuickListItemResponse[];
  reActAgents: QuickListItemResponse[];
  conversations: ConversationQuickListItemResponse[];
}

interface LoadingState {
  'chat-agents': boolean;
  'autonomous-agents': boolean;
  'chat-widgets': boolean;
  're-act-agents': boolean;
  conversations: boolean;
}

interface ErrorState {
  'chat-agents': string | null;
  'autonomous-agents': string | null;
  'chat-widgets': string | null;
  're-act-agents': string | null;
  conversations: string | null;
}

interface FetchedState {
  'chat-agents': boolean;
  'autonomous-agents': boolean;
  'chat-widgets': boolean;
  're-act-agents': boolean;
  conversations: boolean;
}

interface SidebarDataContextType {
  chatAgents: QuickListItemResponse[];
  autonomousAgents: QuickListItemResponse[];
  chatWidgets: QuickListItemResponse[];
  reActAgents: QuickListItemResponse[];
  conversations: ConversationQuickListItemResponse[];
  loadingStates: LoadingState;
  errorStates: ErrorState;
  fetchChatAgents: () => Promise<void>;
  fetchAutonomousAgents: () => Promise<void>;
  fetchChatWidgets: () => Promise<void>;
  fetchReActAgents: () => Promise<void>;
  fetchConversations: () => Promise<void>;
  fetchEntityData: (entityType: EntityType) => Promise<void>;
  refreshChatAgents: () => Promise<void>;
  refreshAutonomousAgents: () => Promise<void>;
  refreshChatWidgets: () => Promise<void>;
  refreshReActAgents: () => Promise<void>;
  refreshConversations: () => Promise<void>;
  refreshEntityData: (entityType: EntityType) => Promise<void>;
  hasFetched: (entityType: EntityType) => boolean;
  clearCache: () => void;
}

const SidebarDataContext = createContext<SidebarDataContextType | undefined>(undefined);

interface SidebarDataProviderProps {
  children: ReactNode;
}

export const SidebarDataProvider: FC<SidebarDataProviderProps> = ({ children }) => {
  const { apiClient, selectedTenant } = useIdentity();
  
  const [data, setData] = useState<SidebarDataState>({
    chatAgents: [],
    autonomousAgents: [],
    chatWidgets: [],
    reActAgents: [],
    conversations: [],
  });
  
  const [loadingStates, setLoadingStates] = useState<LoadingState>({
    'chat-agents': false,
    'autonomous-agents': false,
    'chat-widgets': false,
    're-act-agents': false,
    conversations: false,
  });
  
  const [errorStates, setErrorStates] = useState<ErrorState>({
    'chat-agents': null,
    'autonomous-agents': null,
    'chat-widgets': null,
    're-act-agents': null,
    conversations: null,
  });
  
  const [fetchedStates, setFetchedStates] = useState<FetchedState>({
    'chat-agents': false,
    'autonomous-agents': false,
    'chat-widgets': false,
    're-act-agents': false,
    conversations: false,
  });

  const previousTenantIdRef = useRef(selectedTenant?.id);
  const fetchedStatesRef = useRef(fetchedStates);
  const dataRef = useRef(data);

  useEffect(() => {
    fetchedStatesRef.current = fetchedStates;
  }, [fetchedStates]);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    if (selectedTenant?.id && selectedTenant.id !== previousTenantIdRef.current) {
      previousTenantIdRef.current = selectedTenant.id;
      setData({ chatAgents: [], autonomousAgents: [], chatWidgets: [], reActAgents: [], conversations: [] });
      setFetchedStates({ 'chat-agents': false, 'autonomous-agents': false, 'chat-widgets': false, 're-act-agents': false, conversations: false });
      setErrorStates({ 'chat-agents': null, 'autonomous-agents': null, 'chat-widgets': null, 're-act-agents': null, conversations: null });
    }
  }, [selectedTenant?.id]);

  const fetchChatAgents = useCallback(async (noCache = false) => {
    if (!apiClient || !selectedTenant) return;
    
    if (!noCache && fetchedStatesRef.current['chat-agents'] && dataRef.current.chatAgents.length > 0) {
      return;
    }
    
    setLoadingStates(prev => ({ ...prev, 'chat-agents': true }));
    setErrorStates(prev => ({ ...prev, 'chat-agents': null }));
    
    try {
      const result = await apiClient.listChatAgents(
        selectedTenant.id, 
        { limit: 999, view: 'quick-list', order_by: 'name', order_direction: 'asc' },
        noCache ? { noCache: true } : undefined
      );
      if (Array.isArray(result)) {
        setData(prev => ({ ...prev, chatAgents: result as QuickListItemResponse[] }));
        setFetchedStates(prev => ({ ...prev, 'chat-agents': true }));
      }
    } catch (error) {
      setErrorStates(prev => ({ ...prev, 'chat-agents': i18next.t('common:errorLoadingChatAgents') }));
      console.error('Error fetching chat agents:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, 'chat-agents': false }));
    }
  }, [apiClient, selectedTenant]);
  
  const fetchAutonomousAgents = useCallback(async (noCache = false) => {
    if (!apiClient || !selectedTenant) return;
    
    if (!noCache && fetchedStatesRef.current['autonomous-agents'] && dataRef.current.autonomousAgents.length > 0) {
      return;
    }
    
    setLoadingStates(prev => ({ ...prev, 'autonomous-agents': true }));
    setErrorStates(prev => ({ ...prev, 'autonomous-agents': null }));
    
    try {
      const result = await apiClient.listAutonomousAgents(
        selectedTenant.id, 
        { limit: 999, view: 'quick-list', order_by: 'name', order_direction: 'asc' },
        noCache ? { noCache: true } : undefined
      );
      if (Array.isArray(result)) {
        setData(prev => ({ ...prev, autonomousAgents: result as QuickListItemResponse[] }));
        setFetchedStates(prev => ({ ...prev, 'autonomous-agents': true }));
      }
    } catch (error) {
      setErrorStates(prev => ({ ...prev, 'autonomous-agents': i18next.t('common:errorLoadingAutonomousAgents') }));
      console.error('Error fetching autonomous agents:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, 'autonomous-agents': false }));
    }
  }, [apiClient, selectedTenant]);

  const fetchChatWidgets = useCallback(async (noCache = false) => {
    if (!apiClient || !selectedTenant) return;
    
    if (!noCache && fetchedStatesRef.current['chat-widgets'] && dataRef.current.chatWidgets.length > 0) {
      return;
    }
    
    setLoadingStates(prev => ({ ...prev, 'chat-widgets': true }));
    setErrorStates(prev => ({ ...prev, 'chat-widgets': null }));
    
    try {
      const result = await apiClient.listChatWidgets(
        selectedTenant.id, 
        { limit: 999, view: 'quick-list', order_by: 'name', order_direction: 'asc' },
        noCache ? { noCache: true } : undefined
      );
      if (Array.isArray(result)) {
        setData(prev => ({ ...prev, chatWidgets: result as QuickListItemResponse[] }));
        setFetchedStates(prev => ({ ...prev, 'chat-widgets': true }));
      }
    } catch (error) {
      setErrorStates(prev => ({ ...prev, 'chat-widgets': i18next.t('common:errorLoadingChatWidgets') }));
      console.error('Error fetching chat widgets:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, 'chat-widgets': false }));
    }
  }, [apiClient, selectedTenant]);

  const fetchReActAgents = useCallback(async (noCache = false) => {
    if (!apiClient || !selectedTenant) return;
    
    if (!noCache && fetchedStatesRef.current['re-act-agents'] && dataRef.current.reActAgents.length > 0) {
      return;
    }
    
    setLoadingStates(prev => ({ ...prev, 're-act-agents': true }));
    setErrorStates(prev => ({ ...prev, 're-act-agents': null }));
    
    try {
      const result = await apiClient.listReActAgents(
        selectedTenant.id, 
        { limit: 999, view: 'quick-list', order_by: 'name', order_direction: 'asc' },
        noCache ? { noCache: true } : undefined
      );
      if (Array.isArray(result)) {
        setData(prev => ({ ...prev, reActAgents: result as QuickListItemResponse[] }));
        setFetchedStates(prev => ({ ...prev, 're-act-agents': true }));
      }
    } catch (error) {
      setErrorStates(prev => ({ ...prev, 're-act-agents': i18next.t('common:errorLoadingReActAgents') }));
      console.error('Error fetching ReACT agents:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, 're-act-agents': false }));
    }
  }, [apiClient, selectedTenant]);

  const fetchConversations = useCallback(async (noCache = false) => {
    if (!apiClient || !selectedTenant) return;
    
    if (!noCache && fetchedStatesRef.current.conversations && dataRef.current.conversations.length > 0) {
      return;
    }
    
    setLoadingStates(prev => ({ ...prev, conversations: true }));
    setErrorStates(prev => ({ ...prev, conversations: null }));
    
    try {
      const result = await apiClient.listConversations(
        selectedTenant.id, 
        { limit: 999, view: 'quick-list', order_by: 'updated_at', order_direction: 'desc' },
        noCache ? { noCache: true } : undefined
      );
      if (Array.isArray(result)) {
        setData(prev => ({ ...prev, conversations: result as ConversationQuickListItemResponse[] }));
        setFetchedStates(prev => ({ ...prev, conversations: true }));
      }
    } catch (error) {
      setErrorStates(prev => ({ ...prev, conversations: i18next.t('common:errorLoadingConversations') }));
      console.error('Error fetching conversations:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, conversations: false }));
    }
  }, [apiClient, selectedTenant]);

  const fetchEntityData = useCallback(async (entityType: EntityType) => {
    switch (entityType) {
      case 'chat-agents':
        await fetchChatAgents(false);
        break;
      case 'autonomous-agents':
        await fetchAutonomousAgents(false);
        break;
      case 'chat-widgets':
        await fetchChatWidgets(false);
        break;
      case 're-act-agents':
        await fetchReActAgents(false);
        break;
      case 'conversations':
        await fetchConversations(false);
        break;
    }
  }, [fetchChatAgents, fetchAutonomousAgents, fetchChatWidgets, fetchReActAgents, fetchConversations]);
  
  const refreshChatAgents = useCallback(async () => {
    await fetchChatAgents(true);
  }, [fetchChatAgents]);
  
  const refreshAutonomousAgents = useCallback(async () => {
    await fetchAutonomousAgents(true);
  }, [fetchAutonomousAgents]);

  const refreshChatWidgets = useCallback(async () => {
    await fetchChatWidgets(true);
  }, [fetchChatWidgets]);

  const refreshReActAgents = useCallback(async () => {
    await fetchReActAgents(true);
  }, [fetchReActAgents]);

  const refreshConversations = useCallback(async () => {
    await fetchConversations(true);
  }, [fetchConversations]);

  const refreshEntityData = useCallback(async (entityType: EntityType) => {
    switch (entityType) {
      case 'chat-agents':
        await refreshChatAgents();
        break;
      case 'autonomous-agents':
        await refreshAutonomousAgents();
        break;
      case 'chat-widgets':
        await refreshChatWidgets();
        break;
      case 're-act-agents':
        await refreshReActAgents();
        break;
      case 'conversations':
        await refreshConversations();
        break;
    }
  }, [refreshChatAgents, refreshAutonomousAgents, refreshChatWidgets, refreshReActAgents, refreshConversations]);
  
  const hasFetched = useCallback((entityType: EntityType): boolean => {
    return fetchedStatesRef.current[entityType] || false;
  }, []);
  
  const clearCache = useCallback(() => {
    setData({
      chatAgents: [],
      autonomousAgents: [],
      chatWidgets: [],
      reActAgents: [],
      conversations: [],
    });
    setFetchedStates({
      'chat-agents': false,
      'autonomous-agents': false,
      'chat-widgets': false,
      're-act-agents': false,
      conversations: false,
    });
    setErrorStates({
      'chat-agents': null,
      'autonomous-agents': null,
      'chat-widgets': null,
      're-act-agents': null,
      conversations: null,
    });
  }, []);

  const stableFetchChatAgents = useCallback(() => fetchChatAgents(false), [fetchChatAgents]);
  const stableFetchAutonomousAgents = useCallback(() => fetchAutonomousAgents(false), [fetchAutonomousAgents]);
  const stableFetchChatWidgets = useCallback(() => fetchChatWidgets(false), [fetchChatWidgets]);
  const stableFetchReActAgents = useCallback(() => fetchReActAgents(false), [fetchReActAgents]);
  const stableFetchConversations = useCallback(() => fetchConversations(false), [fetchConversations]);

  const value: SidebarDataContextType = {
    chatAgents: data.chatAgents,
    autonomousAgents: data.autonomousAgents,
    chatWidgets: data.chatWidgets,
    reActAgents: data.reActAgents,
    conversations: data.conversations,
    loadingStates,
    errorStates,
    fetchChatAgents: stableFetchChatAgents,
    fetchAutonomousAgents: stableFetchAutonomousAgents,
    fetchChatWidgets: stableFetchChatWidgets,
    fetchReActAgents: stableFetchReActAgents,
    fetchConversations: stableFetchConversations,
    fetchEntityData,
    refreshChatAgents,
    refreshAutonomousAgents,
    refreshChatWidgets,
    refreshReActAgents,
    refreshConversations,
    refreshEntityData,
    hasFetched,
    clearCache,
  };

  return (
    <SidebarDataContext.Provider value={value}>
      {children}
    </SidebarDataContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSidebarData = (): SidebarDataContextType => {
  const context = useContext(SidebarDataContext);
  if (!context) {
    throw new Error('useSidebarData must be used within a SidebarDataProvider');
  }
  return context;
};
