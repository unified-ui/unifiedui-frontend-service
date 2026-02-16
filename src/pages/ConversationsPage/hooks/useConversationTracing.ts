import { useState, useCallback, useEffect, useRef } from 'react';
import type { FullTraceResponse, TraceNodeResponse, MessageResponse } from '../../../api/types';
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
  highlightedUserMessageId: string | null;
  setHighlightedMessageExtId: React.Dispatch<React.SetStateAction<string | null>>;
  handleNodeReferenceIdChange: (referenceId: string | null) => void;
  setMessagesRef: (messages: MessageResponse[]) => void;
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
  const [highlightedUserMessageId, setHighlightedUserMessageId] = useState<string | null>(null);
  const messagesRef = useRef<MessageResponse[]>([]);

  const setMessagesRef = useCallback((messages: MessageResponse[]) => {
    messagesRef.current = messages;
  }, []);

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
        setHighlightedUserMessageId(null);
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

  const findSiblingAssistantRefId = useCallback((
    nodes: TraceNodeResponse[],
    userRefId: string
  ): string | null => {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].referenceId === userRefId) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (nodes[j].referenceId) return nodes[j].referenceId;
        }
        return null;
      }
      if (nodes[i].nodes && nodes[i].nodes!.length > 0) {
        const result = findSiblingAssistantRefId(nodes[i].nodes!, userRefId);
        if (result) return result;
      }
    }
    return null;
  }, []);

  const handleNodeReferenceIdChange = useCallback((referenceId: string | null) => {
    if (!referenceId) {
      setHighlightedMessageExtId(null);
      setHighlightedUserMessageId(null);
      return;
    }

    const currentMessages = messagesRef.current;

    const isAssistantMessage = currentMessages.some(
      (m) => m.type !== 'user' && m.metadata?.extMessageId === referenceId
    );

    if (isAssistantMessage) {
      setHighlightedMessageExtId(referenceId);
      setHighlightedUserMessageId(null);
      return;
    }

    setHighlightedMessageExtId(null);

    for (const trace of traces) {
      const assistantRefId = findSiblingAssistantRefId(trace.nodes, referenceId);
      if (assistantRefId) {
        const assistantMsg = currentMessages.find(
          (m) => m.type !== 'user' && m.metadata?.extMessageId === assistantRefId
        );
        if (assistantMsg?.userMessageId) {
          setHighlightedUserMessageId(assistantMsg.userMessageId);
          return;
        }
      }
    }

    setHighlightedUserMessageId(null);
  }, [traces, findSiblingAssistantRefId]);

  return {
    traces,
    tracingSidebarVisible,
    tracingDialogOpen,
    selectedNodeReferenceId,
    highlightedMessageExtId,
    highlightedUserMessageId,
    setHighlightedMessageExtId,
    handleNodeReferenceIdChange,
    setMessagesRef,
    refreshTraces,
    handleToggleTracingSidebar,
    handleViewTrace,
    handleOpenTracingFullscreen,
    setTracingDialogOpen,
  };
}
