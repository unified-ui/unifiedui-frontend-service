import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode, FC } from 'react';
import type { RecentVisitItem, RecentVisitResponse } from '../api/types';
import { useIdentity } from './IdentityContext';

const STORAGE_KEY_PREFIX = 'unified-ui-recent-visits';
const MAX_VISITS = 50;
const SYNC_INTERVAL_MS = 5 * 60 * 1000;
const ALLOWED_RESOURCE_TYPES = new Set(['chat_agent', 'workflow', 'external_app', 'chat_widget']);

interface RecentVisitsContextType {
  recentVisits: RecentVisitResponse[];
  isLoading: boolean;
  trackVisit: (item: RecentVisitItem) => void;
  refreshRecentVisits: () => Promise<void>;
}

const RecentVisitsContext = createContext<RecentVisitsContextType | undefined>(undefined);

interface RecentVisitsProviderProps {
  children: ReactNode;
}

const getStorageKey = (tenantId: string): string => `${STORAGE_KEY_PREFIX}-${tenantId}`;

const loadFromStorage = (tenantId: string): RecentVisitItem[] => {
  try {
    const stored = localStorage.getItem(getStorageKey(tenantId));
    if (!stored) return [];
    const parsed = JSON.parse(stored) as RecentVisitItem[];
    // Filter out invalid resource types (e.g., old "conversation" entries)
    return parsed.filter(v => ALLOWED_RESOURCE_TYPES.has(v.resource_type));
  } catch {
    return [];
  }
};

const saveToStorage = (tenantId: string, visits: RecentVisitItem[]): void => {
  try {
    localStorage.setItem(getStorageKey(tenantId), JSON.stringify(visits));
  } catch {
    // storage full or unavailable
  }
};

export const RecentVisitsProvider: FC<RecentVisitsProviderProps> = ({ children }) => {
  const { apiClient, user, selectedTenant } = useIdentity();
  const [recentVisits, setRecentVisits] = useState<RecentVisitResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const pendingVisitsRef = useRef<RecentVisitItem[]>([]);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const syncToBackend = useCallback(async () => {
    if (!apiClient || !user || !selectedTenant) return;
    if (pendingVisitsRef.current.length === 0) return;

    const visitsToSync = [...pendingVisitsRef.current];
    pendingVisitsRef.current = [];

    try {
      const response = await apiClient.syncRecentVisits(
        selectedTenant.id,
        user.id,
        { visits: visitsToSync }
      );
      setRecentVisits(response.visits);
    } catch (error) {
      pendingVisitsRef.current = [...visitsToSync, ...pendingVisitsRef.current];
      console.error('Failed to sync recent visits:', error);
    }
  }, [apiClient, user, selectedTenant]);

  const fetchRecentVisits = useCallback(async () => {
    if (!apiClient || !user || !selectedTenant) return;
    setIsLoading(true);
    try {
      const response = await apiClient.listRecentVisits(selectedTenant.id, user.id);
      setRecentVisits(response.visits);
    } catch (error) {
      console.error('Failed to fetch recent visits:', error);
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, user, selectedTenant]);

  const refreshRecentVisits = useCallback(async () => {
    await syncToBackend();
    await fetchRecentVisits();
  }, [syncToBackend, fetchRecentVisits]);

  useEffect(() => {
    if (!apiClient || !user || !selectedTenant) {
      setRecentVisits([]);
      pendingVisitsRef.current = [];
      return;
    }

    pendingVisitsRef.current = loadFromStorage(selectedTenant.id);

    if (pendingVisitsRef.current.length > 0) {
      syncToBackend().then(fetchRecentVisits);
    } else {
      fetchRecentVisits();
    }

    syncIntervalRef.current = setInterval(syncToBackend, SYNC_INTERVAL_MS);

    const handleBeforeUnload = () => {
      if (pendingVisitsRef.current.length > 0 && selectedTenant) {
        saveToStorage(selectedTenant.id, pendingVisitsRef.current);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (pendingVisitsRef.current.length > 0 && selectedTenant) {
        saveToStorage(selectedTenant.id, pendingVisitsRef.current);
      }
    };
  }, [apiClient, user, selectedTenant, syncToBackend, fetchRecentVisits]);

  const trackVisit = useCallback((item: RecentVisitItem) => {
    if (!selectedTenant) return;
    // Only track allowed resource types
    if (!ALLOWED_RESOURCE_TYPES.has(item.resource_type)) return;

    pendingVisitsRef.current = [
      item,
      ...pendingVisitsRef.current.filter(
        v => !(v.resource_type === item.resource_type && v.resource_id === item.resource_id)
      ),
    ].slice(0, MAX_VISITS);

    saveToStorage(selectedTenant.id, pendingVisitsRef.current);
  }, [selectedTenant]);

  const value: RecentVisitsContextType = {
    recentVisits,
    isLoading,
    trackVisit,
    refreshRecentVisits,
  };

  return (
    <RecentVisitsContext.Provider value={value}>
      {children}
    </RecentVisitsContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useRecentVisits = (): RecentVisitsContextType => {
  const context = useContext(RecentVisitsContext);
  if (context === undefined) {
    throw new Error('useRecentVisits must be used within a RecentVisitsProvider');
  }
  return context;
};
