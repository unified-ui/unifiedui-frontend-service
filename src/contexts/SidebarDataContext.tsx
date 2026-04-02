import { createContext, useContext, useState, useCallback, useEffect, useRef, type FC, type ReactNode } from 'react';
import i18next from 'i18next';
import type { QuickListItemResponse, ConversationQuickListItemResponse } from '../api/types';
import { useIdentity } from './IdentityContext';

export type EntityType = 'chat-agents' | 'autonomous-agents' | 'chat-widgets' | 'external-apps' | 'conversations';

interface SidebarDataState {
  chatAgents: QuickListItemResponse[];
  workflows: QuickListItemResponse[];
  chatWidgets: QuickListItemResponse[];
  externalApps: QuickListItemResponse[];
  conversations: ConversationQuickListItemResponse[];
}

interface LoadingState {
  'chat-agents': boolean;
  'autonomous-agents': boolean;
  'chat-widgets': boolean;
  'external-apps': boolean;
  conversations: boolean;
}

interface ErrorState {
  'chat-agents': string | null;
  'autonomous-agents': string | null;
  'chat-widgets': string | null;
  'external-apps': string | null;
  conversations: string | null;
}

interface FetchedState {
  'chat-agents': boolean;
  'autonomous-agents': boolean;
  'chat-widgets': boolean;
  'external-apps': boolean;
  conversations: boolean;
}

interface SidebarDataContextType {
  chatAgents: QuickListItemResponse[];
  workflows: QuickListItemResponse[];
  chatWidgets: QuickListItemResponse[];
  externalApps: QuickListItemResponse[];
  conversations: ConversationQuickListItemResponse[];
  loadingStates: LoadingState;
  errorStates: ErrorState;
  fetchChatAgents: () => Promise<void>;
  fetchWorkflows: () => Promise<void>;
  fetchChatWidgets: () => Promise<void>;
  fetchExternalApps: () => Promise<void>;
  fetchConversations: () => Promise<void>;
  fetchEntityData: (entityType: EntityType) => Promise<void>;
  refreshChatAgents: () => Promise<void>;
  refreshWorkflows: () => Promise<void>;
  refreshChatWidgets: () => Promise<void>;
  refreshExternalApps: () => Promise<void>;
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
    workflows: [],
    chatWidgets: [],
    externalApps: [],
    conversations: [],
  });

  const [loadingStates, setLoadingStates] = useState<LoadingState>({
    'chat-agents': false,
    'autonomous-agents': false,
    'chat-widgets': false,
    'external-apps': false,
    conversations: false,
  });

  const [errorStates, setErrorStates] = useState<ErrorState>({
    'chat-agents': null,
    'autonomous-agents': null,
    'chat-widgets': null,
    'external-apps': null,
    conversations: null,
  });

  const [fetchedStates, setFetchedStates] = useState<FetchedState>({
    'chat-agents': false,
    'autonomous-agents': false,
    'chat-widgets': false,
    'external-apps': false,
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
      setData({ chatAgents: [], workflows: [], chatWidgets: [], externalApps: [], conversations: [] });
      setFetchedStates({ 'chat-agents': false, 'autonomous-agents': false, 'chat-widgets': false, 'external-apps': false, conversations: false });
      setErrorStates({ 'chat-agents': null, 'autonomous-agents': null, 'chat-widgets': null, 'external-apps': null, conversations: null });
    }
  }, [selectedTenant?.id]);

  const fetchChatAgents = useCallback(async (noCache = false) => {
    if (!apiClient || !selectedTenant) return;

    if (!noCache && fetchedStatesRef.current['chat-agents']) {
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

  const fetchWorkflows = useCallback(async (noCache = false) => {
    if (!apiClient || !selectedTenant) return;

    if (!noCache && fetchedStatesRef.current['autonomous-agents']) {
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
        setData(prev => ({ ...prev, workflows: result as QuickListItemResponse[] }));
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

    if (!noCache && fetchedStatesRef.current['chat-widgets']) {
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

  const fetchExternalApps = useCallback(async (noCache = false) => {
    if (!apiClient || !selectedTenant) return;

    if (!noCache && fetchedStatesRef.current['external-apps']) {
      return;
    }

    setLoadingStates(prev => ({ ...prev, 'external-apps': true }));
    setErrorStates(prev => ({ ...prev, 'external-apps': null }));

    try {
      const result = await apiClient.listExternalApps(
        selectedTenant.id,
        { limit: 999, view: 'quick-list', order_by: 'name', order_direction: 'asc' },
        noCache ? { noCache: true } : undefined
      );
      if (Array.isArray(result)) {
        setData(prev => ({ ...prev, externalApps: result as QuickListItemResponse[] }));
        setFetchedStates(prev => ({ ...prev, 'external-apps': true }));
      }
    } catch (error) {
      setErrorStates(prev => ({ ...prev, 'external-apps': i18next.t('common:errorLoadingExternalApps') }));
      console.error('Error fetching external apps:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, 'external-apps': false }));
    }
  }, [apiClient, selectedTenant]);

  const fetchConversations = useCallback(async (noCache = false) => {
    if (!apiClient || !selectedTenant) return;

    if (!noCache && fetchedStatesRef.current.conversations) {
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
        await fetchWorkflows(false);
        break;
      case 'chat-widgets':
        await fetchChatWidgets(false);
        break;
      case 'external-apps':
        await fetchExternalApps(false);
        break;
      case 'conversations':
        await fetchConversations(false);
        break;
    }
  }, [fetchChatAgents, fetchWorkflows, fetchChatWidgets, fetchExternalApps, fetchConversations]);

  const refreshChatAgents = useCallback(async () => {
    await fetchChatAgents(true);
  }, [fetchChatAgents]);

  const refreshWorkflows = useCallback(async () => {
    await fetchWorkflows(true);
  }, [fetchWorkflows]);

  const refreshChatWidgets = useCallback(async () => {
    await fetchChatWidgets(true);
  }, [fetchChatWidgets]);

  const refreshExternalApps = useCallback(async () => {
    await fetchExternalApps(true);
  }, [fetchExternalApps]);

  const refreshConversations = useCallback(async () => {
    await fetchConversations(true);
  }, [fetchConversations]);

  const refreshEntityData = useCallback(async (entityType: EntityType) => {
    switch (entityType) {
      case 'chat-agents':
        await refreshChatAgents();
        break;
      case 'autonomous-agents':
        await refreshWorkflows();
        break;
      case 'chat-widgets':
        await refreshChatWidgets();
        break;
      case 'external-apps':
        await refreshExternalApps();
        break;
      case 'conversations':
        await refreshConversations();
        break;
    }
  }, [refreshChatAgents, refreshWorkflows, refreshChatWidgets, refreshExternalApps, refreshConversations]);

  const hasFetched = useCallback((entityType: EntityType): boolean => {
    return fetchedStatesRef.current[entityType] || false;
  }, []);

  const clearCache = useCallback(() => {
    setData({
      chatAgents: [],
      workflows: [],
      chatWidgets: [],
      externalApps: [],
      conversations: [],
    });
    setFetchedStates({
      'chat-agents': false,
      'autonomous-agents': false,
      'chat-widgets': false,
      'external-apps': false,
      conversations: false,
    });
    setErrorStates({
      'chat-agents': null,
      'autonomous-agents': null,
      'chat-widgets': null,
      'external-apps': null,
      conversations: null,
    });
  }, []);

  const stableFetchChatAgents = useCallback(() => fetchChatAgents(false), [fetchChatAgents]);
  const stableFetchWorkflows = useCallback(() => fetchWorkflows(false), [fetchWorkflows]);
  const stableFetchChatWidgets = useCallback(() => fetchChatWidgets(false), [fetchChatWidgets]);
  const stableFetchExternalApps = useCallback(() => fetchExternalApps(false), [fetchExternalApps]);
  const stableFetchConversations = useCallback(() => fetchConversations(false), [fetchConversations]);

  const value: SidebarDataContextType = {
    chatAgents: data.chatAgents,
    workflows: data.workflows,
    chatWidgets: data.chatWidgets,
    externalApps: data.externalApps,
    conversations: data.conversations,
    loadingStates,
    errorStates,
    fetchChatAgents: stableFetchChatAgents,
    fetchWorkflows: stableFetchWorkflows,
    fetchChatWidgets: stableFetchChatWidgets,
    fetchExternalApps: stableFetchExternalApps,
    fetchConversations: stableFetchConversations,
    fetchEntityData,
    refreshChatAgents,
    refreshWorkflows,
    refreshChatWidgets,
    refreshExternalApps,
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
