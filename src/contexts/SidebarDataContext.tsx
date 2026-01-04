import { createContext, useContext, useState, useCallback, type FC, type ReactNode } from 'react';
import type { QuickListItemResponse } from '../api/types';
import { useIdentity } from './IdentityContext';

// ========== Types ==========

export type EntityType = 'applications' | 'autonomous-agents' | 'credentials' | 'chat-widgets' | 'development-platforms';

interface SidebarDataState {
  applications: QuickListItemResponse[];
  autonomousAgents: QuickListItemResponse[];
  credentials: QuickListItemResponse[];
  chatWidgets: QuickListItemResponse[];
  developmentPlatforms: QuickListItemResponse[];
}

interface LoadingState {
  applications: boolean;
  'autonomous-agents': boolean;
  credentials: boolean;
  'chat-widgets': boolean;
  'development-platforms': boolean;
}

interface ErrorState {
  applications: string | null;
  'autonomous-agents': string | null;
  credentials: string | null;
  'chat-widgets': string | null;
  'development-platforms': string | null;
}

interface FetchedState {
  applications: boolean;
  'autonomous-agents': boolean;
  credentials: boolean;
  'chat-widgets': boolean;
  'development-platforms': boolean;
}

interface SidebarDataContextType {
  // Data
  applications: QuickListItemResponse[];
  autonomousAgents: QuickListItemResponse[];
  credentials: QuickListItemResponse[];
  chatWidgets: QuickListItemResponse[];
  developmentPlatforms: QuickListItemResponse[];
  
  // Loading & Error states
  loadingStates: LoadingState;
  errorStates: ErrorState;
  
  // Fetch functions (uses cache by default)
  fetchApplications: () => Promise<void>;
  fetchAutonomousAgents: () => Promise<void>;
  fetchCredentials: () => Promise<void>;
  fetchChatWidgets: () => Promise<void>;
  fetchDevelopmentPlatforms: () => Promise<void>;
  fetchEntityData: (entityType: EntityType) => Promise<void>;
  
  // Refresh functions (bypasses cache)
  refreshApplications: () => Promise<void>;
  refreshAutonomousAgents: () => Promise<void>;
  refreshCredentials: () => Promise<void>;
  refreshChatWidgets: () => Promise<void>;
  refreshDevelopmentPlatforms: () => Promise<void>;
  refreshEntityData: (entityType: EntityType) => Promise<void>;
  
  // Check if data has been fetched
  hasFetched: (entityType: EntityType) => boolean;
  
  // Clear cache
  clearCache: () => void;
}

// ========== Context ==========

const SidebarDataContext = createContext<SidebarDataContextType | undefined>(undefined);

// ========== Provider ==========

interface SidebarDataProviderProps {
  children: ReactNode;
}

export const SidebarDataProvider: FC<SidebarDataProviderProps> = ({ children }) => {
  const { apiClient, selectedTenant } = useIdentity();
  
  // Data state
  const [data, setData] = useState<SidebarDataState>({
    applications: [],
    autonomousAgents: [],
    credentials: [],
    chatWidgets: [],
    developmentPlatforms: [],
  });
  
  // Loading states
  const [loadingStates, setLoadingStates] = useState<LoadingState>({
    applications: false,
    'autonomous-agents': false,
    credentials: false,
    'chat-widgets': false,
    'development-platforms': false,
  });
  
  // Error states
  const [errorStates, setErrorStates] = useState<ErrorState>({
    applications: null,
    'autonomous-agents': null,
    credentials: null,
    'chat-widgets': null,
    'development-platforms': null,
  });
  
  // Track if data has been fetched (to avoid refetching on every hover)
  const [fetchedStates, setFetchedStates] = useState<FetchedState>({
    applications: false,
    'autonomous-agents': false,
    credentials: false,
    'chat-widgets': false,
    'development-platforms': false,
  });

  // ========== Fetch Functions (with cache) ==========
  
  const fetchApplications = useCallback(async (noCache = false) => {
    if (!apiClient || !selectedTenant) return;
    
    // Skip if already fetched and not forcing refresh
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
      // Type guard: Ensure result is QuickListItemResponse[]
      if (Array.isArray(result)) {
        setData(prev => ({ ...prev, applications: result as QuickListItemResponse[] }));
        setFetchedStates(prev => ({ ...prev, applications: true }));
      }
    } catch (error) {
      setErrorStates(prev => ({ ...prev, applications: 'Fehler beim Laden der Chat Agents' }));
      console.error('Error fetching applications:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, applications: false }));
    }
  }, [apiClient, selectedTenant, fetchedStates.applications, data.applications.length]);
  
  const fetchAutonomousAgents = useCallback(async (noCache = false) => {
    if (!apiClient || !selectedTenant) return;
    
    // Skip if already fetched and not forcing refresh
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
      // Type guard: Ensure result is QuickListItemResponse[]
      if (Array.isArray(result)) {
        setData(prev => ({ ...prev, autonomousAgents: result as QuickListItemResponse[] }));
        setFetchedStates(prev => ({ ...prev, 'autonomous-agents': true }));
      }
    } catch (error) {
      setErrorStates(prev => ({ ...prev, 'autonomous-agents': 'Fehler beim Laden der Autonomous Agents' }));
      console.error('Error fetching autonomous agents:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, 'autonomous-agents': false }));
    }
  }, [apiClient, selectedTenant, fetchedStates['autonomous-agents'], data.autonomousAgents.length]);
  
  const fetchCredentials = useCallback(async (noCache = false) => {
    if (!apiClient || !selectedTenant) return;
    
    // Skip if already fetched and not forcing refresh
    if (!noCache && fetchedStates.credentials && data.credentials.length > 0) {
      return;
    }
    
    setLoadingStates(prev => ({ ...prev, credentials: true }));
    setErrorStates(prev => ({ ...prev, credentials: null }));
    
    try {
      const result = await apiClient.listCredentials(
        selectedTenant.id, 
        { limit: 999, view: 'quick-list', order_by: 'name', order_direction: 'asc' },
        noCache ? { noCache: true } : undefined
      );
      // Type guard: Ensure result is QuickListItemResponse[]
      if (Array.isArray(result)) {
        setData(prev => ({ ...prev, credentials: result as QuickListItemResponse[] }));
        setFetchedStates(prev => ({ ...prev, credentials: true }));
      }
    } catch (error) {
      setErrorStates(prev => ({ ...prev, credentials: 'Fehler beim Laden der Credentials' }));
      console.error('Error fetching credentials:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, credentials: false }));
    }
  }, [apiClient, selectedTenant, fetchedStates.credentials, data.credentials.length]);

  const fetchChatWidgets = useCallback(async (noCache = false) => {
    if (!apiClient || !selectedTenant) return;
    
    // Skip if already fetched and not forcing refresh
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
      // Type guard: Ensure result is QuickListItemResponse[]
      if (Array.isArray(result)) {
        setData(prev => ({ ...prev, chatWidgets: result as QuickListItemResponse[] }));
        setFetchedStates(prev => ({ ...prev, 'chat-widgets': true }));
      }
    } catch (error) {
      setErrorStates(prev => ({ ...prev, 'chat-widgets': 'Fehler beim Laden der Chat Widgets' }));
      console.error('Error fetching chat widgets:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, 'chat-widgets': false }));
    }
  }, [apiClient, selectedTenant, fetchedStates['chat-widgets'], data.chatWidgets.length]);

  const fetchDevelopmentPlatforms = useCallback(async (noCache = false) => {
    if (!apiClient || !selectedTenant) return;
    
    // Skip if already fetched and not forcing refresh
    if (!noCache && fetchedStates['development-platforms'] && data.developmentPlatforms.length > 0) {
      return;
    }
    
    setLoadingStates(prev => ({ ...prev, 'development-platforms': true }));
    setErrorStates(prev => ({ ...prev, 'development-platforms': null }));
    
    try {
      const result = await apiClient.listDevelopmentPlatforms(
        selectedTenant.id, 
        { limit: 999, view: 'quick-list', order_by: 'name', order_direction: 'asc' },
        noCache ? { noCache: true } : undefined
      );
      // Type guard: Ensure result is QuickListItemResponse[]
      if (Array.isArray(result)) {
        setData(prev => ({ ...prev, developmentPlatforms: result as QuickListItemResponse[] }));
        setFetchedStates(prev => ({ ...prev, 'development-platforms': true }));
      }
    } catch (error) {
      setErrorStates(prev => ({ ...prev, 'development-platforms': 'Fehler beim Laden der Development Platforms' }));
      console.error('Error fetching development platforms:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, 'development-platforms': false }));
    }
  }, [apiClient, selectedTenant, fetchedStates['development-platforms'], data.developmentPlatforms.length]);

  // Generic fetch function
  const fetchEntityData = useCallback(async (entityType: EntityType) => {
    switch (entityType) {
      case 'applications':
        await fetchApplications(false);
        break;
      case 'autonomous-agents':
        await fetchAutonomousAgents(false);
        break;
      case 'credentials':
        await fetchCredentials(false);
        break;
      case 'chat-widgets':
        await fetchChatWidgets(false);
        break;
      case 'development-platforms':
        await fetchDevelopmentPlatforms(false);
        break;
    }
  }, [fetchApplications, fetchAutonomousAgents, fetchCredentials, fetchChatWidgets, fetchDevelopmentPlatforms]);

  // ========== Refresh Functions (bypass cache) ==========
  
  const refreshApplications = useCallback(async () => {
    await fetchApplications(true);
  }, [fetchApplications]);
  
  const refreshAutonomousAgents = useCallback(async () => {
    await fetchAutonomousAgents(true);
  }, [fetchAutonomousAgents]);
  
  const refreshCredentials = useCallback(async () => {
    await fetchCredentials(true);
  }, [fetchCredentials]);

  const refreshChatWidgets = useCallback(async () => {
    await fetchChatWidgets(true);
  }, [fetchChatWidgets]);

  const refreshDevelopmentPlatforms = useCallback(async () => {
    await fetchDevelopmentPlatforms(true);
  }, [fetchDevelopmentPlatforms]);

  // Generic refresh function
  const refreshEntityData = useCallback(async (entityType: EntityType) => {
    switch (entityType) {
      case 'applications':
        await refreshApplications();
        break;
      case 'autonomous-agents':
        await refreshAutonomousAgents();
        break;
      case 'credentials':
        await refreshCredentials();
        break;
      case 'chat-widgets':
        await refreshChatWidgets();
        break;
      case 'development-platforms':
        await refreshDevelopmentPlatforms();
        break;
    }
  }, [refreshApplications, refreshAutonomousAgents, refreshCredentials, refreshChatWidgets, refreshDevelopmentPlatforms]);

  // ========== Helper Functions ==========
  
  const hasFetched = useCallback((entityType: EntityType): boolean => {
    return fetchedStates[entityType] || false;
  }, [fetchedStates]);
  
  const clearCache = useCallback(() => {
    setData({
      applications: [],
      autonomousAgents: [],
      credentials: [],
      chatWidgets: [],
      developmentPlatforms: [],
    });
    setFetchedStates({
      applications: false,
      'autonomous-agents': false,
      credentials: false,
      'chat-widgets': false,
      'development-platforms': false,
    });
    setErrorStates({
      applications: null,
      'autonomous-agents': null,
      credentials: null,
      'chat-widgets': null,
      'development-platforms': null,
    });
  }, []);

  // ========== Context Value ==========
  
  const value: SidebarDataContextType = {
    // Data
    applications: data.applications,
    autonomousAgents: data.autonomousAgents,
    credentials: data.credentials,
    chatWidgets: data.chatWidgets,
    developmentPlatforms: data.developmentPlatforms,
    
    // States
    loadingStates,
    errorStates,
    
    // Fetch functions
    fetchApplications: () => fetchApplications(false),
    fetchAutonomousAgents: () => fetchAutonomousAgents(false),
    fetchCredentials: () => fetchCredentials(false),
    fetchChatWidgets: () => fetchChatWidgets(false),
    fetchDevelopmentPlatforms: () => fetchDevelopmentPlatforms(false),
    fetchEntityData,
    
    // Refresh functions
    refreshApplications,
    refreshAutonomousAgents,
    refreshCredentials,
    refreshChatWidgets,
    refreshDevelopmentPlatforms,
    refreshEntityData,
    
    // Helpers
    hasFetched,
    clearCache,
  };

  return (
    <SidebarDataContext.Provider value={value}>
      {children}
    </SidebarDataContext.Provider>
  );
};

// ========== Hook ==========

export const useSidebarData = (): SidebarDataContextType => {
  const context = useContext(SidebarDataContext);
  if (!context) {
    throw new Error('useSidebarData must be used within a SidebarDataProvider');
  }
  return context;
};
