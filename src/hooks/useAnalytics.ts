import { useCallback, useEffect, useState } from 'react';
import { useIdentity } from '../contexts';
import { buildPresetRange } from '../components/common/AnalyticsRangePicker';
import type { AnalyticsRange } from '../components/common/AnalyticsRangePicker';
import type {
  ChatAgentAnalyticsResponse,
  WorkflowAnalyticsResponse,
} from '../api/types';

export interface UseAnalyticsState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  range: AnalyticsRange;
  agentIds: string[];
  setRange: (range: AnalyticsRange) => void;
  setAgentIds: (ids: string[]) => void;
  refresh: () => void;
}

interface UseAnalyticsOptions {
  resource: 'chat-agents' | 'workflows';
  initialRangePreset?: '7d' | '30d' | '90d';
  initialAgentIds?: string[];
}

export function useAnalytics<T = ChatAgentAnalyticsResponse | WorkflowAnalyticsResponse>(
  options: UseAnalyticsOptions
): UseAnalyticsState<T> {
  const { resource, initialRangePreset = '30d', initialAgentIds = [] } = options;
  const { selectedTenant, apiClient } = useIdentity();

  const [range, setRange] = useState<AnalyticsRange>(() => buildPresetRange(initialRangePreset));
  const [agentIds, setAgentIds] = useState<string[]>(initialAgentIds);
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshToken, setRefreshToken] = useState<number>(0);

  const refresh = useCallback((): void => {
    setRefreshToken((t) => t + 1);
  }, []);

  useEffect(() => {
    const tenantId = selectedTenant?.id;
    if (!tenantId || !apiClient) return;
    if (!range.from || !range.to) return;

    let cancelled = false;
    const load = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const response =
          resource === 'chat-agents'
            ? await apiClient.getChatAgentAnalytics(tenantId, {
                from: range.from,
                to: range.to,
                agent_ids: agentIds.length > 0 ? agentIds : undefined,
              })
            : await apiClient.getWorkflowAnalytics(tenantId, {
                from: range.from,
                to: range.to,
                workflow_ids: agentIds.length > 0 ? agentIds : undefined,
              });
        if (!cancelled) setData(response as T);
      } catch (err) {
        if (!cancelled) setError(err as Error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [selectedTenant?.id, apiClient, resource, range, agentIds, refreshToken]);

  return {
    data,
    isLoading,
    error,
    range,
    agentIds,
    setRange,
    setAgentIds,
    refresh,
  };
}
