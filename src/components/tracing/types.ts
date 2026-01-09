/**
 * Tracing Visualization Types
 * 
 * This file contains type definitions for the modular tracing visualization components.
 */

import type { FullTraceResponse, TraceNodeResponse, TraceNodeType, TraceNodeStatus } from '../../api/types';

// ========== Selection State ==========

/** Represents the currently selected item in the tracing view */
export interface TracingSelection {
  /** The selected trace (root) */
  trace: FullTraceResponse | null;
  /** The selected node (or null if root is selected) */
  node: TraceNodeResponse | null;
  /** Full path of node IDs from root to selected node */
  nodePath: string[];
}

// ========== Canvas Layout ==========

/** Layout direction for the canvas */
export type CanvasLayoutDirection = 'horizontal' | 'vertical';

/** Node position in the canvas */
export interface CanvasNodePosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Collapsed state for nodes (by node ID) */
export type CollapsedNodes = Set<string>;

// ========== Hierarchy View ==========

/** Item in the hierarchy view */
export interface HierarchyItem {
  id: string;
  name: string;
  type: string;
  status?: TraceNodeStatus | string;
  isRoot: boolean;
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
  traceId: string;
  nodeRef: TraceNodeResponse | null;
}

// ========== Context ==========

/** Tracing visualization context value */
export interface TracingContextValue {
  /** All traces loaded */
  traces: FullTraceResponse[];
  /** Currently selected trace */
  selectedTrace: FullTraceResponse | null;
  /** Currently selected node (null = root selected) */
  selectedNode: TraceNodeResponse | null;
  /** Selection path from root to current node */
  selectionPath: string[];
  /** Select a trace (root) */
  selectTrace: (traceId: string) => void;
  /** Select a node within the current trace */
  selectNode: (nodeId: string | null, path?: string[]) => void;
  /** Collapsed nodes in hierarchy view */
  hierarchyCollapsed: Set<string>;
  /** Toggle hierarchy node collapse */
  toggleHierarchyCollapse: (nodeId: string) => void;
  /** Collapsed nodes in canvas view */
  canvasCollapsed: Set<string>;
  /** Toggle canvas node collapse */
  toggleCanvasCollapse: (nodeId: string) => void;
  /** Canvas layout direction */
  layoutDirection: CanvasLayoutDirection;
  /** Set layout direction */
  setLayoutDirection: (direction: CanvasLayoutDirection) => void;
  /** Zoom level for canvas */
  zoomLevel: number;
  /** Set zoom level */
  setZoomLevel: (level: number) => void;
  /** Reset canvas view to center/default */
  resetCanvasView: () => void;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
}

// ========== Component Props ==========

/** Props for TracingHierarchyView */
export interface TracingHierarchyViewProps {
  /** Optional: Override default height */
  height?: string | number;
  /** Optional: Show trace selector when multiple traces */
  showTraceSelector?: boolean;
  /** Optional: Callback when node is selected */
  onNodeSelect?: (node: TraceNodeResponse | null, trace: FullTraceResponse) => void;
}

/** Props for TracingCanvasView */
export interface TracingCanvasViewProps {
  /** Optional: Override default dimensions */
  width?: string | number;
  height?: string | number;
  /** Optional: Show controls (zoom, layout toggle) */
  showControls?: boolean;
  /** Optional: Callback when node is clicked */
  onNodeClick?: (node: TraceNodeResponse | null) => void;
}

/** Props for TracingDataSection */
export interface TracingDataSectionProps {
  /** Optional: Override default height */
  height?: string | number;
  /** Optional: Initial logs panel width fraction (0-1) */
  initialLogsPanelWidth?: number;
}

/** Props for TracingVisualDialog */
export interface TracingVisualDialogProps {
  /** Whether the dialog is open */
  opened: boolean;
  /** Callback to close the dialog */
  onClose: () => void;
  /** Traces to display */
  traces: FullTraceResponse[];
  /** Optional: Initial selected trace ID */
  initialTraceId?: string;
  /** Optional: Initial selected node ID */
  initialNodeId?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Error message */
  error?: string | null;
}

// ========== Utility Types ==========

/** Get icon name based on node type */
export function getNodeTypeIcon(type: TraceNodeType | string): string {
  const iconMap: Record<string, string> = {
    agent: 'robot',
    tool: 'tool',
    llm: 'brain',
    chain: 'link',
    retriever: 'search',
    workflow: 'git-branch',
    function: 'code',
    http: 'world',
    code: 'terminal',
    conditional: 'git-merge',
    loop: 'repeat',
    custom: 'puzzle',
  };
  return iconMap[type] || 'circle';
}

/** Check if status indicates success */
export function isSuccessStatus(status: TraceNodeStatus | string | undefined): boolean {
  if (!status) return false;
  return status === 'completed' || status === 'success';
}

/** Check if status indicates failure */
export function isFailureStatus(status: TraceNodeStatus | string | undefined): boolean {
  if (!status) return false;
  return status === 'failed' || status === 'error' || status === 'cancelled';
}

/** Check if status indicates running */
export function isRunningStatus(status: TraceNodeStatus | string | undefined): boolean {
  if (!status) return false;
  return status === 'running' || status === 'pending';
}

/** Format duration in seconds to human-readable string */
export function formatDuration(seconds: number | undefined): string {
  if (seconds === undefined || seconds === null) return '-';
  if (seconds < 0.001) return '<1ms';
  if (seconds < 1) return `${Math.round(seconds * 1000)}ms`;
  if (seconds < 60) return `${seconds.toFixed(2)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  return `${mins}m ${secs}s`;
}

/** Format ISO timestamp to human-readable string */
export function formatTimestamp(isoString: string | undefined): string {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return isoString;
  }
}

/** Find a node by ID recursively in the node tree */
export function findNodeById(
  nodes: TraceNodeResponse[],
  nodeId: string,
  path: string[] = []
): { node: TraceNodeResponse; path: string[] } | null {
  for (const node of nodes) {
    const currentPath = [...path, node.id];
    if (node.id === nodeId) {
      return { node, path: currentPath };
    }
    if (node.nodes && node.nodes.length > 0) {
      const found = findNodeById(node.nodes, nodeId, currentPath);
      if (found) return found;
    }
  }
  return null;
}

/** Count total nodes in a trace (including nested) */
export function countNodes(nodes: TraceNodeResponse[]): number {
  let count = 0;
  for (const node of nodes) {
    count++;
    if (node.nodes && node.nodes.length > 0) {
      count += countNodes(node.nodes);
    }
  }
  return count;
}
