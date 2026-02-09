import { createContext, useContext, useState, useMemo } from 'react';
import type { ReactNode, FC } from 'react';
import type { UnifiedUIAPIClient } from '../api/client';

interface ApiClientContextType {
  apiClient: UnifiedUIAPIClient | null;
  setApiClient: (client: UnifiedUIAPIClient | null) => void;
}

const ApiClientContext = createContext<ApiClientContextType | undefined>(undefined);

interface ApiClientProviderProps {
  children: ReactNode;
}

export const ApiClientProvider: FC<ApiClientProviderProps> = ({ children }) => {
  const [apiClient, setApiClient] = useState<UnifiedUIAPIClient | null>(null);

  const value = useMemo<ApiClientContextType>(() => ({
    apiClient,
    setApiClient,
  }), [apiClient]);

  return (
    <ApiClientContext.Provider value={value}>
      {children}
    </ApiClientContext.Provider>
  );
};

export const useApiClient = (): ApiClientContextType => {
  const context = useContext(ApiClientContext);
  if (context === undefined) {
    throw new Error('useApiClient must be used within an ApiClientProvider');
  }
  return context;
};
