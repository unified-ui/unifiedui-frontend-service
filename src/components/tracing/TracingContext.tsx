/**
 * TracingContext - Global state management for tracing visualization
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
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
// Provider Props
// ============================================================================

interface TracingProviderProps {
  children: ReactNode;
  traces: FullTraceResponse[];
  initialTraceId?: string;
}

// ============================================================================
// Provider Component
// ============================================================================

export const TracingProvider: FC<TracingProviderProps> = ({
  children,
  traces,
  initialTraceId,
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
  const [layoutDirection, setLayoutDirectionState] =
    useState<LayoutDirection>('horizontal');
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
