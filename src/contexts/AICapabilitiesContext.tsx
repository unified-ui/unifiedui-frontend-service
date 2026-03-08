import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode, FC } from 'react';
import type { AICapabilitiesResponse } from '../api/types';
import { useIdentity } from './IdentityContext';

interface AICapabilitiesContextType {
  capabilities: AICapabilitiesResponse | null;
  isLoading: boolean;
  refreshCapabilities: () => Promise<void>;
}

const defaultCapabilities: AICapabilitiesResponse = {
  title_generation: false,
  description_generation: false,
  trace_analysis: false,
  summarization: false,
};

const AICapabilitiesContext = createContext<AICapabilitiesContextType | undefined>(undefined);

interface AICapabilitiesProviderProps {
  children: ReactNode;
}

export const AICapabilitiesProvider: FC<AICapabilitiesProviderProps> = ({ children }) => {
  const { apiClient, selectedTenant } = useIdentity();
  const [capabilities, setCapabilities] = useState<AICapabilitiesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCapabilities = useCallback(async () => {
    if (!apiClient || !selectedTenant) {
      setCapabilities(null);
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiClient.getAICapabilities(selectedTenant.id);
      setCapabilities(result);
    } catch {
      setCapabilities(defaultCapabilities);
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, selectedTenant]);

  useEffect(() => {
    fetchCapabilities();
  }, [fetchCapabilities]);

  return (
    <AICapabilitiesContext.Provider
      value={{
        capabilities,
        isLoading,
        refreshCapabilities: fetchCapabilities,
      }}
    >
      {children}
    </AICapabilitiesContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAICapabilities = (): AICapabilitiesContextType => {
  const context = useContext(AICapabilitiesContext);
  if (!context) {
    throw new Error('useAICapabilities must be used within an AICapabilitiesProvider');
  }
  return context;
};
