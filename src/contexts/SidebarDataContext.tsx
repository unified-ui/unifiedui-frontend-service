import { createContext, useContext, useState, useCallback, useEffect, useRef, type FC, type ReactNode } from 'react';
import i18next from 'i18next';
import type { QuickListItemResponse } from '../api/types';
import { useIdentity } from './IdentityContext';

export type EntityType = 'applications' | 'autonomous-agents' | 'chat-widgets';

interface SidebarDataState {
  applications: QuickListItemResponse[];
  autonomousAgents: QuickListItemResponse[];
  chatWidgets: QuickListItemResponse[];
}

interface LoadingState {
  applications: boolean;
  'autonomous-agents': boolean;
  'chat-widgets': boolean;
}

interface ErrorState {
  applications: string | null;
  'autonomous-agents': string | null;
  'chat-widgets': string | null;
}

interface FetchedState {
  applications: boolean;
  'autonomous-agents': boolean;
  'chat-widgets': boolean;
}

interface SidebarDataContextType {
  applications: QuickListItemResponse[];
  autonomousAgents: QuickListItemResponse[];
  chatWidgets: QuickListItemResponse[];
  loadingStates: LoadingState;
  errorStates: ErrorState;
  fetchApplications: () => Promise<void>;
  fetchAutonomousAgents: () => Promise<void>;
  fetchChatWidgets: () => Promise<void>;
  fetchEntityData: (entityType: EntityType) => Promise<void>;
  refreshApplications: () => Promise<void>;
  refreshAutonomousAgents: () => Promise<void>;
  refreshChatWidgets: () => Promise<void>;
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
    applications: [],
    autonomousAgents: [],
    chatWidgets: [],
  });
  
  const [loadingStates, setLoadingStates] = useState<LoadingState>({
    applications: false,
    'autonomous-agents': false,
    'chat-widgets': false,
  });
  
  const [errorStates, setErrorStates] = useState<ErrorState>({
    applications: null,
    'autonomous-agents': null,
    'chat-widgets': null,
  });
  
  const [fetchedStates, setFetchedStates] = useState<FetchedState>({
    applications: false,
    'autonomous-agents': false,
    'chat-widgets': false,
  });

  const previousTenantIdRef = useRef(selectedTenant?.id);

  useEffect(() => {
    if (selectedTenant?.id && selectedTenant.id !== previousTenantIdRef.current) {
      previousTenantIdRef.current = selectedTenant.id;
      setData({ applications: [], autonomousAgents: [], chatWidgets: [] });
      setFetchedStates({ applications: false, 'autonomous-agents': false, 'chat-widgets': false });
      setErrorStates({ applications: null, 'autonomous-agents': null, 'chat-widgets': null });
    }
  }, [selectedTenant?.id]);

  const fetchApplications = useCallback(async (noCache = false) => {
    if (!apiClient || !selectedTenant) return;
    
    if (!noCache && fetchedStates.applications && data.applications.length > 0) {
      return;
    }
    
    setLoadingStates(prev => ({ ...prev, applications: true }));
    setErrorStates(prev => ({ ...prev, applications: null }));
    
    try {
      const result = await apiClient.listApplications(
        selectedTenant.id, 
        { limit: 999, view: 'quick-list', order_by: 'name', order_direction: 'asc' },
        noCache ? { noCache: true } : undefined
      );
      if (Array.isArray(result)) {
        setData(prev => ({ ...prev, applications: result as QuickListItemResponse[] }));
        setFetchedStates(prev => ({ ...prev, applications: true }));
      }
    } catch (error) {
      setErrorStates(prev => ({ ...prev, applications: i18next.t('common:errorLoadingApplications') }));
      console.error('Error fetching applications:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, applications: false }));
    }
  }, [apiClient, selectedTenant, fetchedStates.applications, data.applications.length]);
  
  const fetchAutonomousAgents = useCallback(async (noCache = false) => {
    if (!apiClient || !selectedTenant) return;
    
    if (!noCache && fetchedStates['autonomous-agents'] && data.autonomousAgents.length > 0) {
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
  }, [apiClient, selectedTenant, fetchedStates['autonomous-agents'], data.autonomousAgents.length]);

  const fetchChatWidgets = useCallback(async (noCache = false) => {
    if (!apiClient || !selectedTenant) return;
    
    if (!noCache && fetchedStates['chat-widgets'] && data.chatWidgets.length > 0) {
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
  }, [apiClient, selectedTenant, fetchedStates['chat-widgets'], data.chatWidgets.length]);

  const fetchEntityData = useCallback(async (entityType: EntityType) => {
    switch (entityType) {
      case 'applications':
        await fetchApplications(false);
        break;
      case 'autonomous-agents':
        await fetchAutonomousAgents(false);
        break;
      case 'chat-widgets':
        await fetchChatWidgets(false);
        break;
    }
  }, [fetchApplications, fetchAutonomousAgents, fetchChatWidgets]);
  
  const refreshApplications = useCallback(async () => {
    await fetchApplications(true);
  }, [fetchApplications]);
  
  const refreshAutonomousAgents = useCallback(async () => {
    await fetchAutonomousAgents(true);
  }, [fetchAutonomousAgents]);

  const refreshChatWidgets = useCallback(async () => {
    await fetchChatWidgets(true);
  }, [fetchChatWidgets]);

  const refreshEntityData = useCallback(async (entityType: EntityType) => {
    switch (entityType) {
      case 'applications':
        await refreshApplications();
        break;
      case 'autonomous-agents':
        await refreshAutonomousAgents();
        break;
      case 'chat-widgets':
        await refreshChatWidgets();
        break;
    }
  }, [refreshApplications, refreshAutonomousAgents, refreshChatWidgets]);
  
  const hasFetched = useCallback((entityType: EntityType): boolean => {
    return fetchedStates[entityType] || false;
  }, [fetchedStates]);
  
  const clearCache = useCallback(() => {
    setData({
      applications: [],
      autonomousAgents: [],
      chatWidgets: [],
    });
    setFetchedStates({
      applications: false,
      'autonomous-agents': false,
      'chat-widgets': false,
    });
    setErrorStates({
      applications: null,
      'autonomous-agents': null,
      'chat-widgets': null,
    });
  }, []);

  const value: SidebarDataContextType = {
    applications: data.applications,
    autonomousAgents: data.autonomousAgents,
    chatWidgets: data.chatWidgets,
    loadingStates,
    errorStates,
    fetchApplications: () => fetchApplications(false),
    fetchAutonomousAgents: () => fetchAutonomousAgents(false),
    fetchChatWidgets: () => fetchChatWidgets(false),
    fetchEntityData,
    refreshApplications,
    refreshAutonomousAgents,
    refreshChatWidgets,
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

export const useSidebarData = (): SidebarDataContextType => {
  const context = useContext(SidebarDataContext);
  if (!context) {
    throw new Error('useSidebarData must be used within a SidebarDataProvider');
  }
  return context;
};
