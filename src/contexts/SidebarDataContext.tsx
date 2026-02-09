import { createContext, useContext, useState, useCallback, useEffect, useRef, type FC, type ReactNode } from 'react';
import i18next from 'i18next';
import type { QuickListItemResponse } from '../api/types';
import { useIdentity } from './IdentityContext';

export type EntityType = 'applications' | 'autonomous-agents' | 'chat-widgets' | 're-act-agents';

interface SidebarDataState {
  applications: QuickListItemResponse[];
  autonomousAgents: QuickListItemResponse[];
  chatWidgets: QuickListItemResponse[];
  reActAgents: QuickListItemResponse[];
}

interface LoadingState {
  applications: boolean;
  'autonomous-agents': boolean;
  'chat-widgets': boolean;
  're-act-agents': boolean;
}

interface ErrorState {
  applications: string | null;
  'autonomous-agents': string | null;
  'chat-widgets': string | null;
  're-act-agents': string | null;
}

interface FetchedState {
  applications: boolean;
  'autonomous-agents': boolean;
  'chat-widgets': boolean;
  're-act-agents': boolean;
}

interface SidebarDataContextType {
  applications: QuickListItemResponse[];
  autonomousAgents: QuickListItemResponse[];
  chatWidgets: QuickListItemResponse[];
  reActAgents: QuickListItemResponse[];
  loadingStates: LoadingState;
  errorStates: ErrorState;
  fetchApplications: () => Promise<void>;
  fetchAutonomousAgents: () => Promise<void>;
  fetchChatWidgets: () => Promise<void>;
  fetchReActAgents: () => Promise<void>;
  fetchEntityData: (entityType: EntityType) => Promise<void>;
  refreshApplications: () => Promise<void>;
  refreshAutonomousAgents: () => Promise<void>;
  refreshChatWidgets: () => Promise<void>;
  refreshReActAgents: () => Promise<void>;
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
    reActAgents: [],
  });
  
  const [loadingStates, setLoadingStates] = useState<LoadingState>({
    applications: false,
    'autonomous-agents': false,
    'chat-widgets': false,
    're-act-agents': false,
  });
  
  const [errorStates, setErrorStates] = useState<ErrorState>({
    applications: null,
    'autonomous-agents': null,
    'chat-widgets': null,
    're-act-agents': null,
  });
  
  const [fetchedStates, setFetchedStates] = useState<FetchedState>({
    applications: false,
    'autonomous-agents': false,
    'chat-widgets': false,
    're-act-agents': false,
  });

  const previousTenantIdRef = useRef(selectedTenant?.id);

  useEffect(() => {
    if (selectedTenant?.id && selectedTenant.id !== previousTenantIdRef.current) {
      previousTenantIdRef.current = selectedTenant.id;
      setData({ applications: [], autonomousAgents: [], chatWidgets: [], reActAgents: [] });
      setFetchedStates({ applications: false, 'autonomous-agents': false, 'chat-widgets': false, 're-act-agents': false });
      setErrorStates({ applications: null, 'autonomous-agents': null, 'chat-widgets': null, 're-act-agents': null });
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

  const fetchReActAgents = useCallback(async (noCache = false) => {
    if (!apiClient || !selectedTenant) return;
    
    if (!noCache && fetchedStates['re-act-agents'] && data.reActAgents.length > 0) {
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
  }, [apiClient, selectedTenant, fetchedStates['re-act-agents'], data.reActAgents.length]);

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
      case 're-act-agents':
        await fetchReActAgents(false);
        break;
    }
  }, [fetchApplications, fetchAutonomousAgents, fetchChatWidgets, fetchReActAgents]);
  
  const refreshApplications = useCallback(async () => {
    await fetchApplications(true);
  }, [fetchApplications]);
  
  const refreshAutonomousAgents = useCallback(async () => {
    await fetchAutonomousAgents(true);
  }, [fetchAutonomousAgents]);

  const refreshChatWidgets = useCallback(async () => {
    await fetchChatWidgets(true);
  }, [fetchChatWidgets]);

  const refreshReActAgents = useCallback(async () => {
    await fetchReActAgents(true);
  }, [fetchReActAgents]);

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
      case 're-act-agents':
        await refreshReActAgents();
        break;
    }
  }, [refreshApplications, refreshAutonomousAgents, refreshChatWidgets, refreshReActAgents]);
  
  const hasFetched = useCallback((entityType: EntityType): boolean => {
    return fetchedStates[entityType] || false;
  }, [fetchedStates]);
  
  const clearCache = useCallback(() => {
    setData({
      applications: [],
      autonomousAgents: [],
      chatWidgets: [],
      reActAgents: [],
    });
    setFetchedStates({
      applications: false,
      'autonomous-agents': false,
      'chat-widgets': false,
      're-act-agents': false,
    });
    setErrorStates({
      applications: null,
      'autonomous-agents': null,
      'chat-widgets': null,
      're-act-agents': null,
    });
  }, []);

  const value: SidebarDataContextType = {
    applications: data.applications,
    autonomousAgents: data.autonomousAgents,
    chatWidgets: data.chatWidgets,
    reActAgents: data.reActAgents,
    loadingStates,
    errorStates,
    fetchApplications: () => fetchApplications(false),
    fetchAutonomousAgents: () => fetchAutonomousAgents(false),
    fetchChatWidgets: () => fetchChatWidgets(false),
    fetchReActAgents: () => fetchReActAgents(false),
    fetchEntityData,
    refreshApplications,
    refreshAutonomousAgents,
    refreshChatWidgets,
    refreshReActAgents,
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
