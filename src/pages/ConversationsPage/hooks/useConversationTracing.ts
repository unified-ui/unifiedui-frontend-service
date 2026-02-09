import { useState, useCallback, useEffect } from 'react';
import type { FullTraceResponse } from '../../../api/types';
import type { UnifiedUIAPIClient } from '../../../api/client';

interface UseConversationTracingParams {
  apiClient: UnifiedUIAPIClient | null;
  tenantId: string | undefined;
  conversationId: string | undefined;
}

interface UseConversationTracingReturn {
  traces: FullTraceResponse[];
  tracingSidebarVisible: boolean;
  tracingDialogOpen: boolean;
  selectedNodeReferenceId: string | undefined;
  highlightedMessageExtId: string | null;
  setHighlightedMessageExtId: React.Dispatch<React.SetStateAction<string | null>>;
  refreshTraces: () => Promise<void>;
  handleToggleTracingSidebar: () => void;
  handleViewTrace: (extMessageId: string) => Promise<void>;
  handleOpenTracingFullscreen: () => void;
  setTracingDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Hook for managing conversation tracing state: traces, sidebar, node highlighting.
 */
export function useConversationTracing({
  apiClient,
  tenantId,
  conversationId,
}: UseConversationTracingParams): UseConversationTracingReturn {
  const [traces, setTraces] = useState<FullTraceResponse[]>([]);
  const [tracingSidebarVisible, setTracingSidebarVisible] = useState(false);
  const [tracingDialogOpen, setTracingDialogOpen] = useState(false);
  const [selectedNodeReferenceId, setSelectedNodeReferenceId] = useState<string | undefined>();
  const [highlightedMessageExtId, setHighlightedMessageExtId] = useState<string | null>(null);

  const refreshTraces = useCallback(async () => {
    if (!apiClient || !tenantId || !conversationId) return;
    try {
      const tracesData = await apiClient.getConversationTraces(tenantId, conversationId);
      setTraces(tracesData.traces || []);
    } catch (error) {
      console.error('Failed to refresh traces:', error);
    }
  }, [apiClient, tenantId, conversationId]);

  useEffect(() => {
    if (!apiClient || !tenantId || !conversationId) {
      setTraces([]);
      return;
    }
    refreshTraces();
  }, [apiClient, tenantId, conversationId, refreshTraces]);

  const handleToggleTracingSidebar = useCallback(() => {
    setTracingSidebarVisible(prev => {
      const newValue = !prev;
      if (!newValue) {
        setHighlightedMessageExtId(null);
      }
      return newValue;
    });
  }, []);

  const findNodeByReferenceId = useCallback((
    nodes: FullTraceResponse['nodes'],
    referenceId: string
  ): boolean => {
    for (const node of nodes) {
      if (node.referenceId === referenceId) return true;
      if (node.nodes && node.nodes.length > 0) {
        if (findNodeByReferenceId(node.nodes, referenceId)) return true;
      }
    }
    return false;
  }, []);

  const handleViewTrace = useCallback(async (extMessageId: string) => {
    if (!extMessageId) return;

    const existsInTraces = traces.some(trace =>
      findNodeByReferenceId(trace.nodes, extMessageId)
    );

    if (!existsInTraces) {
      await refreshTraces();
    }

    setSelectedNodeReferenceId(extMessageId);
    if (!tracingSidebarVisible) {
      setTracingSidebarVisible(true);
    }
  }, [tracingSidebarVisible, traces, findNodeByReferenceId, refreshTraces]);

  const handleOpenTracingFullscreen = useCallback(() => {
    setTracingDialogOpen(true);
  }, []);

  return {
    traces,
    tracingSidebarVisible,
    tracingDialogOpen,
    selectedNodeReferenceId,
    highlightedMessageExtId,
    setHighlightedMessageExtId,
    refreshTraces,
    handleToggleTracingSidebar,
    handleViewTrace,
    handleOpenTracingFullscreen,
    setTracingDialogOpen,
  };
}
