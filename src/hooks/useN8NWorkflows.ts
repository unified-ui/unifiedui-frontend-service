import { useState, useCallback } from 'react';
import type { N8NWorkflowInfo } from '../api/types';
import { useIdentity } from '../contexts';

export const useN8NWorkflows = () => {
  const { apiClient, selectedTenant } = useIdentity();
  const tenantId = selectedTenant?.id;
  const [workflows, setWorkflows] = useState<N8NWorkflowInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchWorkflows = useCallback(
    async (host: string, credentialId: string) => {
      if (!apiClient || !tenantId || !host || !credentialId) {
        setWorkflows([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await apiClient.getN8NWorkflows(tenantId, host, credentialId);
        setWorkflows(response.workflows);
      } catch {
        setWorkflows([]);
      } finally {
        setIsLoading(false);
      }
    },
    [apiClient, tenantId],
  );

  return { workflows, isLoading, fetchWorkflows };
};
