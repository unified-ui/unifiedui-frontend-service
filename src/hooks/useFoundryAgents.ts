import { useState, useEffect, useCallback } from 'react';
import type { FoundryAgentInfo } from '../api/types';
import { useIdentity } from '../contexts';

export const useFoundryAgents = (projectEndpoint: string) => {
  const { apiClient, selectedTenant, getFoundryToken } = useIdentity();
  const tenantId = selectedTenant?.id;
  const [agents, setAgents] = useState<FoundryAgentInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAgents = useCallback(async () => {
    if (!apiClient || !tenantId || !projectEndpoint) {
      setAgents([]);
      return;
    }

    setIsLoading(true);
    try {
      const foundryToken = await getFoundryToken();
      const response = await apiClient.getFoundryAgents(tenantId, projectEndpoint, foundryToken ?? undefined);
      setAgents(response.agents);
    } catch {
      setAgents([]);
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, tenantId, projectEndpoint, getFoundryToken]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  return { agents, isLoading, refresh: fetchAgents };
};
