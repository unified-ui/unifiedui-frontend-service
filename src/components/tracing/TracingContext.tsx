/**
 * TracingContext - Global state for tracing visualization
 * 
 * This context manages the state for the tracing visualization components,
 * including trace/node selection, collapse states, and canvas settings.
 */

import { createContext, useContext, useState, useCallback, useMemo, type FC, type ReactNode } from 'react';
import type { FullTraceResponse, TraceNodeResponse } from '../../api/types';
import type { TracingContextValue, CanvasLayoutDirection } from './types';
import { findNodeById } from './types';

const TracingContext = createContext<TracingContextValue | null>(null);

export interface TracingProviderProps {
  children: ReactNode;
  /** Traces to display */
  traces: FullTraceResponse[];
  /** Initial selected trace ID */
  initialTraceId?: string;
  /** Initial selected node ID */
  initialNodeId?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Error message */
  error?: string | null;
}

export const TracingProvider: FC<TracingProviderProps> = ({
  children,
  traces,
  initialTraceId,
  initialNodeId,
  isLoading = false,
  error = null,
}) => {
  // Selected trace
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(
    initialTraceId || (traces.length > 0 ? traces[0].id : null)
  );

  // Selected node
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(initialNodeId || null);
  const [selectionPath, setSelectionPath] = useState<string[]>([]);

  // Collapse states
  const [hierarchyCollapsed, setHierarchyCollapsed] = useState<Set<string>>(new Set());
  const [canvasCollapsed, setCanvasCollapsed] = useState<Set<string>>(new Set());

  // Canvas settings
  const [layoutDirection, setLayoutDirection] = useState<CanvasLayoutDirection>('horizontal');
  const [zoomLevel, setZoomLevel] = useState(1);

  // Get selected trace object
  const selectedTrace = useMemo(() => {
    if (!selectedTraceId) return traces[0] || null;
    return traces.find(t => t.id === selectedTraceId) || traces[0] || null;
  }, [traces, selectedTraceId]);

  // Get selected node object
  const selectedNode = useMemo((): TraceNodeResponse | null => {
    if (!selectedTrace || !selectedNodeId) return null;
    const result = findNodeById(selectedTrace.nodes, selectedNodeId);
    return result?.node || null;
  }, [selectedTrace, selectedNodeId]);

  // Select a trace
  const selectTrace = useCallback((traceId: string) => {
    setSelectedTraceId(traceId);
    setSelectedNodeId(null);
    setSelectionPath([]);
  }, []);

  // Select a node
  const selectNode = useCallback((nodeId: string | null, path?: string[]) => {
    setSelectedNodeId(nodeId);
    if (path) {
      setSelectionPath(path);
    } else if (nodeId && selectedTrace) {
      // Calculate path if not provided
      const result = findNodeById(selectedTrace.nodes, nodeId);
      setSelectionPath(result?.path || []);
    } else {
      setSelectionPath([]);
    }
  }, [selectedTrace]);

  // Toggle hierarchy collapse
  const toggleHierarchyCollapse = useCallback((nodeId: string) => {
    setHierarchyCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  // Toggle canvas collapse
  const toggleCanvasCollapse = useCallback((nodeId: string) => {
    setCanvasCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  // Reset canvas view
  const resetCanvasView = useCallback(() => {
    setZoomLevel(1);
    setCanvasCollapsed(new Set());
  }, []);

  const contextValue: TracingContextValue = useMemo(() => ({
    traces,
    selectedTrace,
    selectedNode,
    selectionPath,
    selectTrace,
    selectNode,
    hierarchyCollapsed,
    toggleHierarchyCollapse,
    canvasCollapsed,
    toggleCanvasCollapse,
    layoutDirection,
    setLayoutDirection,
    zoomLevel,
    setZoomLevel,
    resetCanvasView,
    isLoading,
    error,
  }), [
    traces,
    selectedTrace,
    selectedNode,
    selectionPath,
    selectTrace,
    selectNode,
    hierarchyCollapsed,
    toggleHierarchyCollapse,
    canvasCollapsed,
    toggleCanvasCollapse,
    layoutDirection,
    zoomLevel,
    resetCanvasView,
    isLoading,
    error,
  ]);

  return (
    <TracingContext.Provider value={contextValue}>
      {children}
    </TracingContext.Provider>
  );
};

export const useTracing = (): TracingContextValue => {
  const context = useContext(TracingContext);
  if (!context) {
    throw new Error('useTracing must be used within a TracingProvider');
  }
  return context;
};

export default TracingContext;
