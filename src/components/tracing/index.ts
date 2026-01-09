/**
 * Tracing Components - Barrel Exports
 * 
 * Modular tracing visualization system for UnifiedUI
 * 
 * Main Components:
 * - TracingVisualDialog: Main dialog/container component
 * - TracingCanvasView: React Flow based workflow visualization
 * - TracingHierarchyView: Collapsible tree view
 * - TracingDataSection: Logs, I/O, metadata display
 * 
 * Context:
 * - TracingProvider: State management provider
 * - useTracing: Hook to access tracing state
 * 
 * Types:
 * - TracingSelection, HierarchyItem, CanvasLayoutDirection, etc.
 */

// Main Components
export { TracingVisualDialog } from './TracingVisualDialog';
export type { TracingVisualDialogProps } from './TracingVisualDialog';

export { TracingCanvasView } from './TracingCanvasView';
export { TracingHierarchyView } from './TracingHierarchyView';
export { TracingDataSection } from './TracingDataSection';

// Context & Hooks
export { TracingProvider, useTracing } from './TracingContext';
export type { TracingProviderProps } from './TracingContext';

// Types & Utilities
export {
  getNodeTypeIcon,
  isSuccessStatus,
  isFailureStatus,
  isRunningStatus,
  formatDuration,
  formatTimestamp,
  findNodeById,
  countNodes,
} from './types';
export type {
  TracingSelection,
  TracingContextValue,
  HierarchyItem,
  CanvasLayoutDirection,
} from './types';
