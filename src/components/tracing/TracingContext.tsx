/**
 * TracingContext - Global state management for tracing visualization
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type FC,
  type ReactNode,
} from 'react';
import type { FullTraceResponse, TraceNodeResponse } from '../../api/types';

// ============================================================================
// Types
// ============================================================================

export type LayoutDirection = 'horizontal' | 'vertical';

// LocalStorage Keys
const LOCALSTORAGE_KEY_HIERARCHY_VISIBLE = 'unified-ui-tracing-hierarchy-visible';
const LOCALSTORAGE_KEY_LAYOUT_DIRECTION = 'unified-ui-tracing-layout-direction';

interface TracingContextState {
  // Data
  traces: FullTraceResponse[];
  selectedTrace: FullTraceResponse | null;
  selectedNode: TraceNodeResponse | null;

  // UI State
  layoutDirection: LayoutDirection;
  hierarchyCollapsed: Set<string>;
  canvasCollapsed: Set<string>;
  hierarchyVisible: boolean;

  // Actions
  selectTrace: (traceId: string | null) => void;
  selectNode: (nodeId: string | null) => void;
  toggleHierarchyCollapse: (nodeId: string) => void;
  toggleCanvasCollapse: (nodeId: string) => void;
  setLayoutDirection: (dir: LayoutDirection) => void;
  centerOnNode: (nodeId: string) => void;
  resetCanvasView: () => void;
  toggleHierarchyVisible: () => void;
  
  // Message-to-Trace mapping
  /** Find a trace node by extMessageId (matches TraceNode.referenceId) */
  findNodeForMessage: (extMessageId: string) => TraceNodeResponse | null;
  /** Select a node by extMessageId and return true if found */
  selectNodeByExtMessageId: (extMessageId: string) => boolean;
}

// ============================================================================
// Context
// ============================================================================

const TracingContext = createContext<TracingContextState | null>(null);

// ============================================================================
// Helper: Find node by ID recursively
// ============================================================================

const findNodeById = (
  nodes: TraceNodeResponse[],
  nodeId: string
): TraceNodeResponse | null => {
  for (const node of nodes) {
    if (node.id === nodeId) {
      return node;
    }
    if (node.nodes && node.nodes.length > 0) {
      const found = findNodeById(node.nodes, nodeId);
      if (found) return found;
    }
  }
  return null;
};

// ============================================================================
// Helper: Find node by referenceId recursively (for message-to-trace mapping)
// ============================================================================

const findNodeByReferenceId = (
  nodes: TraceNodeResponse[],
  referenceId: string
): TraceNodeResponse | null => {
  for (const node of nodes) {
    if (node.referenceId === referenceId) {
      return node;
    }
    if (node.nodes && node.nodes.length > 0) {
      const found = findNodeByReferenceId(node.nodes, referenceId);
      if (found) return found;
    }
  }
  return null;
};

// ============================================================================
// Provider Props
// ============================================================================

interface TracingProviderProps {
  children: ReactNode;
  traces: FullTraceResponse[];
  initialTraceId?: string;
  /** Initial node to select by its referenceId (for message-to-trace mapping) */
  initialNodeReferenceId?: string;
}

// ============================================================================
// Provider Component
// ============================================================================

export const TracingProvider: FC<TracingProviderProps> = ({
  children,
  traces,
  initialTraceId,
  initialNodeReferenceId,
}) => {
  // Find initial trace
  const initialTrace = useMemo(() => {
    if (initialTraceId) {
      return traces.find((t) => t.id === initialTraceId) || traces[0] || null;
    }
    return traces[0] || null;
  }, [traces, initialTraceId]);

  // State
  const [selectedTrace, setSelectedTrace] = useState<FullTraceResponse | null>(
    initialTrace
  );
  const [selectedNode, setSelectedNode] = useState<TraceNodeResponse | null>(null);
  const [layoutDirection, setLayoutDirectionState] = useState<LayoutDirection>(() => {
    const stored = localStorage.getItem(LOCALSTORAGE_KEY_LAYOUT_DIRECTION);
    return (stored === 'horizontal' || stored === 'vertical') ? stored : 'horizontal';
  });
  const [hierarchyCollapsed, setHierarchyCollapsed] = useState<Set<string>>(
    new Set()
  );
  const [canvasCollapsed, setCanvasCollapsed] = useState<Set<string>>(new Set());
  const [hierarchyVisible, setHierarchyVisible] = useState<boolean>(() => {
    const stored = localStorage.getItem(LOCALSTORAGE_KEY_HIERARCHY_VISIBLE);
    return stored === null ? true : stored === 'true';
  });

  // Callback for centering on node (will be connected to canvas)
  const [, setCenterNodeId] = useState<string | null>(null);

  // Effect: Sync selectedTrace when traces prop changes (e.g. after refresh)
  // This is needed because useState only uses initialTrace on first mount
  useEffect(() => {
    if (traces.length > 0 && selectedTrace) {
      // Find the updated version of the currently selected trace
      const updatedTrace = traces.find((t) => t.id === selectedTrace.id);
      if (updatedTrace) {
        // Only update if the trace data actually changed (avoid infinite loops)
        if (JSON.stringify(updatedTrace) !== JSON.stringify(selectedTrace)) {
          setSelectedTrace(updatedTrace);
        }
      }
    } else if (traces.length > 0 && !selectedTrace) {
      // If no trace selected but traces available, select the first one
      setSelectedTrace(traces[0]);
    }
  }, [traces, selectedTrace]);

  // Effect: Auto-select node by referenceId when initialNodeReferenceId changes
  useEffect(() => {
    if (initialNodeReferenceId && selectedTrace) {
      const node = findNodeByReferenceId(selectedTrace.nodes, initialNodeReferenceId);
      if (node) {
        setSelectedNode(node);
      }
    }
  }, [initialNodeReferenceId, selectedTrace]);
  // Actions
  const selectTrace = useCallback(
    (traceId: string | null) => {
      if (traceId === null) {
        setSelectedTrace(null);
        setSelectedNode(null);
        return;
      }
      const trace = traces.find((t) => t.id === traceId);
      if (trace) {
        setSelectedTrace(trace);
        setSelectedNode(null); // Reset node selection when changing trace
      }
    },
    [traces]
  );

  const selectNode = useCallback(
    (nodeId: string | null) => {
      if (nodeId === null) {
        setSelectedNode(null);
        return;
      }
      if (!selectedTrace) return;

      const node = findNodeById(selectedTrace.nodes, nodeId);
      if (node) {
        setSelectedNode(node);
      }
    },
    [selectedTrace]
  );

  const toggleHierarchyCollapse = useCallback((nodeId: string) => {
    setHierarchyCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const toggleCanvasCollapse = useCallback((nodeId: string) => {
    setCanvasCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const setLayoutDirection = useCallback((dir: LayoutDirection) => {
    setLayoutDirectionState(dir);
    localStorage.setItem(LOCALSTORAGE_KEY_LAYOUT_DIRECTION, dir);
  }, []);

  const centerOnNode = useCallback((nodeId: string) => {
    setCenterNodeId(nodeId);
    // This will be consumed by the canvas component via a separate mechanism
    // For now, we just update state - the canvas will listen to selectedNode
  }, []);

  const resetCanvasView = useCallback(() => {
    setCanvasCollapsed(new Set());
    setCenterNodeId(null);
  }, []);

  const toggleHierarchyVisible = useCallback(() => {
    setHierarchyVisible((prev) => {
      const newValue = !prev;
      localStorage.setItem(LOCALSTORAGE_KEY_HIERARCHY_VISIBLE, String(newValue));
      return newValue;
    });
  }, []);

  // Find a trace node by extMessageId (matches TraceNode.referenceId)
  const findNodeForMessage = useCallback(
    (extMessageId: string): TraceNodeResponse | null => {
      if (!selectedTrace) return null;
      return findNodeByReferenceId(selectedTrace.nodes, extMessageId);
    },
    [selectedTrace]
  );

  // Select a node by extMessageId and return true if found
  const selectNodeByExtMessageId = useCallback(
    (extMessageId: string): boolean => {
      if (!selectedTrace) return false;
      const node = findNodeByReferenceId(selectedTrace.nodes, extMessageId);
      if (node) {
        setSelectedNode(node);
        return true;
      }
      return false;
    },
    [selectedTrace]
  );

  // Context value
  const value = useMemo<TracingContextState>(
    () => ({
      traces,
      selectedTrace,
      selectedNode,
      layoutDirection,
      hierarchyCollapsed,
      canvasCollapsed,
      hierarchyVisible,
      selectTrace,
      selectNode,
      toggleHierarchyCollapse,
      toggleCanvasCollapse,
      setLayoutDirection,
      centerOnNode,
      resetCanvasView,
      toggleHierarchyVisible,
      findNodeForMessage,
      selectNodeByExtMessageId,
    }),
    [
      traces,
      selectedTrace,
      selectedNode,
      layoutDirection,
      hierarchyCollapsed,
      canvasCollapsed,
      hierarchyVisible,
      selectTrace,
      selectNode,
      toggleHierarchyCollapse,
      toggleCanvasCollapse,
      setLayoutDirection,
      centerOnNode,
      resetCanvasView,
      toggleHierarchyVisible,
      findNodeForMessage,
      selectNodeByExtMessageId,
    ]
  );

  return (
    <TracingContext.Provider value={value}>{children}</TracingContext.Provider>
  );
};

// ============================================================================
// Hook
// ============================================================================

export const useTracing = (): TracingContextState => {
  const context = useContext(TracingContext);
  if (!context) {
    throw new Error('useTracing must be used within a TracingProvider');
  }
  return context;
};

export default TracingContext;
