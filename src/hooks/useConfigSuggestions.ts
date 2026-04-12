import { useState, useEffect, useCallback } from 'react';
import { useIdentity } from '../contexts';

export const useConfigSuggestions = (type: string) => {
  const { apiClient, selectedTenant } = useIdentity();
  const tenantId = selectedTenant?.id;
  const [suggestions, setSuggestions] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchSuggestions = useCallback(async () => {
    if (!apiClient || !tenantId || !type) {
      setSuggestions({});
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.getConfigSuggestions(tenantId, type);
      setSuggestions(response.suggestions);
    } catch {
      setSuggestions({});
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, tenantId, type]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  return { suggestions, isLoading };
};
