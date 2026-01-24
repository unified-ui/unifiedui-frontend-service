/**
 * TracingHierarchyView - Tree Sidebar für Navigation
 * 
 * Features:
 * - Baum-Struktur mit curved Verbindungslinien (VSCode-Style)
 * - Type Badge + Name + Status Icon
 * - Expand/Collapse für Nodes mit Kindern
 * - Klick = Selektion → Canvas + DataSection update
 * - variant: 'full' | 'compact' - Für Dialog vs Sidebar
 * - showDataPanels: VS Code-style resizable Panels (Logs, Input, Output, Metadata)
 * 
 * Data Panels (VS Code Style):
 * - Jedes Panel ist individuell expand/collapse
 * - Jedes expandierte Panel hat eigenen Resize-Handle
 * - Jedes Panel hat eigene ScrollArea
 * - Collapsed Panels sind am unteren Rand angeheftet
 */

import { useCallback, useMemo, useState, useRef } from 'react';
import type { FC } from 'react';
import { Text, ScrollArea, Badge, UnstyledButton, ActionIcon, Tooltip, Code, Collapse } from '@mantine/core';
import {
  IconChevronDown,
  IconChevronRight,
  IconMaximize,
  IconNote,
  IconBraces,
  IconArrowDown,
  IconArrowUp,
  // Status Icons
  IconCheck,
  IconX,
  IconLoader2,
  IconClock,
  IconMinus,
} from '@tabler/icons-react';
import { useTracing } from './TracingContext';
import type { TraceNodeResponse, FullTraceResponse, TraceNodeDataIO } from '../../api/types';
import classes from './TracingHierarchyView.module.css';

// ============================================================================
// CONSTANTS
// ============================================================================

const PANEL_HEADER_HEIGHT = 28;
const PANEL_MIN_HEIGHT = 80;
const PANEL_DEFAULT_HEIGHT = 150;
const TREE_MIN_HEIGHT = 100;

// ============================================================================
// HELPER: Get Type Badge Color
// ============================================================================

const getTypeBadgeColor = (type: string): string => {
  switch (type?.toLowerCase()) {
    case 'llm':
      return 'blue';
    case 'tool':
      return 'orange';
    case 'agent':
      return 'grape';
    case 'workflow':
      return 'teal';
    case 'chain':
      return 'indigo';
    case 'http':
      return 'cyan';
    case 'code':
    case 'function':
      return 'pink';
    case 'conditional':
      return 'yellow';
    case 'loop':
      return 'lime';
    case 'conversation':
      return 'blue';
    case 'autonomous_agent':
      return 'grape';
    default:
      return 'gray';
  }
};

// ============================================================================
// HELPER: Get Status Icon
// ============================================================================

const getStatusIcon = (status: string, size = 14) => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return <IconCheck size={size} style={{ color: 'var(--color-success-500)' }} />;
    case 'failed':
      return <IconX size={size} style={{ color: 'var(--color-error-500)' }} />;
    case 'running':
      return <IconLoader2 size={size} className={classes.spinningIcon} style={{ color: 'var(--color-warning-500)' }} />;
    case 'pending':
      return <IconClock size={size} style={{ color: 'var(--color-gray-400)' }} />;
    case 'skipped':
    case 'cancelled':
      return <IconMinus size={size} style={{ color: 'var(--color-gray-500)' }} />;
    default:
      return <IconCheck size={size} style={{ color: 'var(--color-gray-400)' }} />;
  }
};

// ============================================================================
// JSON VIEWER (for Data Panels)
// ============================================================================

interface JsonViewerProps {
  data: unknown;
  initialCollapsed?: boolean;
}

const JsonViewer: FC<JsonViewerProps> = ({ data, initialCollapsed = true }) => {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  if (data === null || data === undefined) {
    return <Text size="xs" c="dimmed" fs="italic">null</Text>;
  }

  if (typeof data !== 'object') {
    return <Code block className={classes.codeBlock}>{String(data)}</Code>;
  }

  const jsonString = JSON.stringify(data, null, 2);
  const lineCount = jsonString.split('\n').length;
  const isLarge = lineCount > 5;

  if (!isLarge) {
    return <Code block className={classes.codeBlock}>{jsonString}</Code>;
  }

  return (
    <div className={classes.jsonViewer}>
      <UnstyledButton
        className={classes.jsonToggle}
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <IconChevronRight size={14} /> : <IconChevronDown size={14} />}
        <Text size="xs" c="dimmed">{lineCount} lines</Text>
      </UnstyledButton>
      <Collapse in={!collapsed}>
        <Code block className={classes.codeBlock}>{jsonString}</Code>
      </Collapse>
      {collapsed && (
        <Code block className={classes.codeBlockPreview}>
          {jsonString.split('\n').slice(0, 3).join('\n')}...
        </Code>
      )}
    </div>
  );
};

// ============================================================================
// RESIZABLE PANEL (VS Code Style - NEW IMPLEMENTATION)
// ============================================================================

interface ResizablePanelProps {
  title: string;
  icon: React.ReactNode;
  badge?: number;
  isExpanded: boolean;
  height: number;
  onToggle: () => void;
  onHeightChange: (newHeight: number) => void;
  children: React.ReactNode;
  hasContent?: boolean;
}

const ResizablePanel: FC<ResizablePanelProps> = ({
  title,
  icon,
  badge,
  isExpanded,
  height,
  onToggle,
  onHeightChange,
  children,
  hasContent = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizing.current = true;
    
    const startY = e.clientY;
    const startHeight = height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizing.current) return;
      
      // Bewegung nach oben = Panel wird größer (deltaY negativ)
      const deltaY = startY - moveEvent.clientY;
      const newHeight = Math.max(PANEL_MIN_HEIGHT, startHeight + deltaY);
      
      // Direkte Höhenänderung ohne requestAnimationFrame für responsive resize
      onHeightChange(newHeight);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  }, [height, onHeightChange]);

  const panelHeight = isExpanded ? height : PANEL_HEADER_HEIGHT;

  return (
    <div 
      ref={containerRef}
      className={`${classes.resizablePanel} ${isExpanded ? classes.panelExpanded : classes.panelCollapsed}`}
      style={{ height: panelHeight }}
    >
      {/* Resize Handle - nur wenn expanded */}
      {isExpanded && (
        <div 
          className={classes.panelResizeHandle}
          onMouseDown={handleResizeStart}
        />
      )}
      
      {/* Panel Header */}
      <UnstyledButton
        className={classes.panelHeader}
        onClick={onToggle}
      >
        <span className={classes.panelChevron}>
          {isExpanded ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
        </span>
        <span className={classes.panelIcon}>{icon}</span>
        <Text size="xs" fw={600} className={classes.panelTitle}>{title}</Text>
        {badge !== undefined && badge > 0 && (
          <Badge size="xs" variant="light" className={classes.panelBadge}>{badge}</Badge>
        )}
        {!hasContent && (
          <Text size="xs" c="dimmed" className={classes.panelNoContent}>–</Text>
        )}
      </UnstyledButton>
      
      {/* Panel Content mit eigener ScrollArea */}
      {isExpanded && (
        <ScrollArea 
          className={classes.panelScrollArea} 
          type="auto" 
          offsetScrollbars
          style={{ height: height - PANEL_HEADER_HEIGHT }}
        >
          <div className={classes.panelContent}>
            {children}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

// ============================================================================
// DATA PANELS CONTAINER (VS Code Style - NEW IMPLEMENTATION)
// ============================================================================

type PanelId = 'logs' | 'input' | 'output' | 'metadata';

interface DataPanelsContainerProps {
  maxHeight?: number;
}

const DataPanelsContainer: FC<DataPanelsContainerProps> = ({ maxHeight: _maxHeight = 600 }) => {
  const { selectedTrace, selectedNode } = useTracing();
  
  // Gemeinsame aktive Höhe - wird bei Panel-Wechsel übernommen
  const [activeHeight, setActiveHeight] = useState(PANEL_DEFAULT_HEIGHT);
  
  // Panel states - alle initial collapsed, teilen sich activeHeight
  const [expandedPanel, setExpandedPanel] = useState<PanelId | null>(null);

  const isRoot = selectedNode === null;
  
  // Data extraction
  const logs = useMemo(() => {
    if (isRoot) return selectedTrace?.logs;
    return selectedNode?.logs;
  }, [isRoot, selectedTrace, selectedNode]);
  
  const inputData = selectedNode?.data?.input;
  const outputData = selectedNode?.data?.output;
  
  const metadata = useMemo(() => {
    if (isRoot) return selectedTrace?.referenceMetadata;
    return selectedNode?.metadata;
  }, [isRoot, selectedTrace, selectedNode]);

  // Toggle Panel - Accordion behavior: nur ein Panel gleichzeitig offen
  const togglePanel = useCallback((panelId: PanelId) => {
    setExpandedPanel(prev => prev === panelId ? null : panelId);
  }, []);

  // Change Panel Height - ändert die gemeinsame activeHeight
  const changePanelHeight = useCallback((newHeight: number) => {
    setActiveHeight(newHeight);
  }, []);

  // Render Data Content Helper
  const renderDataContent = (data: TraceNodeDataIO | null | undefined, title: string) => {
    if (!data) {
      return <Text size="xs" c="dimmed" fs="italic">Keine {title}-Daten</Text>;
    }
    
    const { text, arguments: args, extraData, metadata: dataMeta, ...rest } = data;
    const hasContent = text || args || dataMeta || extraData || Object.keys(rest).length > 0;
    
    if (!hasContent) {
      return <Text size="xs" c="dimmed" fs="italic">Keine {title}-Daten</Text>;
    }
    
    return (
      <div className={classes.dataContent}>
        {text && (
          <div className={classes.dataTextSection}>
            <Text size="xs" fw={500} mb={4}>Text:</Text>
            <Code block className={classes.codeBlock}>
              {typeof text === 'string' ? text : JSON.stringify(text, null, 2)}
            </Code>
          </div>
        )}
        {args && Object.keys(args).length > 0 && (
          <div className={classes.dataSubSection}>
            <Text size="xs" fw={500} c="dimmed">Arguments:</Text>
            <JsonViewer data={args} initialCollapsed={false} />
          </div>
        )}
        {dataMeta && Object.keys(dataMeta).length > 0 && (
          <div className={classes.dataSubSection}>
            <Text size="xs" fw={500} c="dimmed">Metadata:</Text>
            <JsonViewer data={dataMeta} initialCollapsed={true} />
          </div>
        )}
        {extraData && Object.keys(extraData).length > 0 && (
          <div className={classes.dataSubSection}>
            <Text size="xs" fw={500} c="dimmed">Extra Data:</Text>
            <JsonViewer data={extraData} initialCollapsed={true} />
          </div>
        )}
        {Object.keys(rest).length > 0 && (
          <div className={classes.dataSubSection}>
            <Text size="xs" fw={500} c="dimmed">Other:</Text>
            <JsonViewer data={rest} initialCollapsed={true} />
          </div>
        )}
      </div>
    );
  };

  // Check if data exists
  const hasLogs = logs && Array.isArray(logs) && logs.length > 0;
  const hasInput = inputData && Object.keys(inputData).length > 0;
  const hasOutput = outputData && Object.keys(outputData).length > 0;
  const hasMetadata = metadata && Object.keys(metadata).length > 0;

  return (
    <div className={classes.dataPanelsContainer}>
      {/* INPUT Panel - nur wenn Node ausgewählt (nicht Root) */}
      {!isRoot && (
        <ResizablePanel
          title="INPUT"
          icon={<IconArrowDown size={14} />}
          isExpanded={expandedPanel === 'input'}
          height={activeHeight}
          onToggle={() => togglePanel('input')}
          onHeightChange={changePanelHeight}
          hasContent={hasInput ?? false}
        >
          {renderDataContent(inputData, 'Input')}
        </ResizablePanel>
      )}

      {/* OUTPUT Panel - nur wenn Node ausgewählt (nicht Root) */}
      {!isRoot && (
        <ResizablePanel
          title="OUTPUT"
          icon={<IconArrowUp size={14} />}
          isExpanded={expandedPanel === 'output'}
          height={activeHeight}
          onToggle={() => togglePanel('output')}
          onHeightChange={changePanelHeight}
          hasContent={hasOutput ?? false}
        >
          {renderDataContent(outputData, 'Output')}
        </ResizablePanel>
      )}

      {/* LOGS Panel */}
      <ResizablePanel
        title="LOGS"
        icon={<IconNote size={14} />}
        badge={Array.isArray(logs) ? logs.length : undefined}
        isExpanded={expandedPanel === 'logs'}
        height={activeHeight}
        onToggle={() => togglePanel('logs')}
        onHeightChange={changePanelHeight}
        hasContent={hasLogs}
      >
        {hasLogs ? (
          <div className={classes.logsContainer}>
            {logs.map((log, index) => (
              <div key={index} className={classes.logEntry}>
                {typeof log === 'string' ? (
                  <Text size="xs">{log}</Text>
                ) : (
                  <JsonViewer data={log} initialCollapsed={true} />
                )}
              </div>
            ))}
          </div>
        ) : (
          <Text size="xs" c="dimmed" fs="italic">Keine Logs</Text>
        )}
      </ResizablePanel>

      {/* METADATA Panel */}
      <ResizablePanel
        title="METADATA"
        icon={<IconBraces size={14} />}
        isExpanded={expandedPanel === 'metadata'}
        height={activeHeight}
        onToggle={() => togglePanel('metadata')}
        onHeightChange={changePanelHeight}
        hasContent={hasMetadata}
      >
        {hasMetadata ? (
          <JsonViewer data={metadata} initialCollapsed={false} />
        ) : (
          <Text size="xs" c="dimmed" fs="italic">Keine Metadata</Text>
        )}
      </ResizablePanel>
    </div>
  );
};

// ============================================================================
// TREE ITEM COMPONENT
// ============================================================================

interface TreeItemProps {
  node: TraceNodeResponse;
  depth: number;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: (nodeId: string) => void;
  onToggle: (nodeId: string) => void;
}

const TreeItem: FC<TreeItemProps> = ({
  node,
  depth,
  isSelected,
  isExpanded,
  onSelect,
  onToggle,
}) => {
  const hasChildren = node.nodes && node.nodes.length > 0;

  const handleClick = useCallback(() => {
    onSelect(node.id);
  }, [node.id, onSelect]);

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(node.id);
  }, [node.id, onToggle]);

  const truncatedName = useMemo(() => {
    if (node.name.length > 25) {
      return `${node.name.slice(0, 22)}...`;
    }
    return node.name;
  }, [node.name]);

  return (
    <>
      {/* Tree Item Row */}
      <UnstyledButton
        className={`${classes.treeItem} ${isSelected ? classes.treeItemSelected : ''}`}
        onClick={handleClick}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {/* Expand/Collapse Icon */}
        {hasChildren ? (
          <span className={classes.expandIcon} onClick={handleToggle}>
            {isExpanded ? (
              <IconChevronDown size={14} />
            ) : (
              <IconChevronRight size={14} />
            )}
          </span>
        ) : (
          <span className={classes.expandIconPlaceholder} />
        )}

        {/* Type Badge */}
        <Badge
          size="xs"
          variant="light"
          color={getTypeBadgeColor(node.type)}
          className={classes.typeBadge}
        >
          {node.type}
        </Badge>

        {/* Name */}
        <Text size="xs" className={classes.nodeName} title={node.name}>
          {truncatedName}
        </Text>

        {/* Status Icon */}
        <span className={classes.statusIcon}>
          {getStatusIcon(node.status)}
        </span>
      </UnstyledButton>

      {/* Children (wenn expanded) */}
      {hasChildren && isExpanded && (
        <div className={classes.childrenContainer}>
          {/* Vertikale Linie */}
          <div
            className={classes.treeLine}
            style={{ left: `${depth * 20 + 15}px` }}
          />
          {node.nodes!.map((childNode) => (
            <TreeItemWrapper
              key={childNode.id}
              node={childNode}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </>
  );
};

// ============================================================================
// TREE ITEM WRAPPER (Connected to Context)
// ============================================================================

interface TreeItemWrapperProps {
  node: TraceNodeResponse;
  depth: number;
}

const TreeItemWrapper: FC<TreeItemWrapperProps> = ({ node, depth }) => {
  const {
    selectedNode,
    hierarchyCollapsed,
    selectNode,
    toggleHierarchyCollapse,
  } = useTracing();

  const isSelected = selectedNode?.id === node.id;
  const isExpanded = !hierarchyCollapsed.has(node.id);

  return (
    <TreeItem
      node={node}
      depth={depth}
      isSelected={isSelected}
      isExpanded={isExpanded}
      onSelect={selectNode}
      onToggle={toggleHierarchyCollapse}
    />
  );
};

// ============================================================================
// TRACE ROOT ITEM
// ============================================================================

interface TraceRootItemProps {
  trace: FullTraceResponse;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onToggle: () => void;
}

const TraceRootItem: FC<TraceRootItemProps> = ({
  trace,
  isSelected,
  isExpanded,
  onSelect,
  onToggle,
}) => {
  const hasNodes = trace.nodes && trace.nodes.length > 0;

  const truncatedName = useMemo(() => {
    const name = trace.referenceName || 'Trace';
    if (name.length > 22) {
      return `${name.slice(0, 19)}...`;
    }
    return name;
  }, [trace.referenceName]);

  return (
    <>
      {/* Root Item Row */}
      <UnstyledButton
        className={`${classes.treeItem} ${classes.traceRoot} ${isSelected ? classes.treeItemSelected : ''}`}
        onClick={onSelect}
      >
        {/* Expand/Collapse Icon */}
        {hasNodes ? (
          <span className={classes.expandIcon} onClick={(e) => { e.stopPropagation(); onToggle(); }}>
            {isExpanded ? (
              <IconChevronDown size={14} />
            ) : (
              <IconChevronRight size={14} />
            )}
          </span>
        ) : (
          <span className={classes.expandIconPlaceholder} />
        )}

        {/* Context Type Badge */}
        <Badge
          size="xs"
          variant="light"
          color={getTypeBadgeColor(trace.contextType || '')}
          className={classes.typeBadge}
        >
          {trace.contextType === 'autonomous_agent' ? 'agent' : trace.contextType}
        </Badge>

        {/* Name */}
        <Text size="xs" className={classes.nodeName} title={trace.referenceName || 'Trace'}>
          {truncatedName}
        </Text>

        {/* Status based on first node or default */}
        <span className={classes.statusIcon}>
          {getStatusIcon(trace.nodes?.[0]?.status || 'completed')}
        </span>
      </UnstyledButton>

      {/* Nodes (wenn expanded) */}
      {hasNodes && isExpanded && (
        <div className={classes.childrenContainer}>
          {/* Vertikale Linie */}
          <div className={classes.treeLine} style={{ left: '15px' }} />
          {trace.nodes.map((node) => (
            <TreeItemWrapper
              key={node.id}
              node={node}
              depth={1}
            />
          ))}
        </div>
      )}
    </>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface TracingHierarchyViewProps {
  /** Variant: 'full' for dialog, 'compact' for sidebar */
  variant?: 'full' | 'compact';
  /** Show header with title */
  showHeader?: boolean;
  /** Show VS Code-style data panels at bottom */
  showDataPanels?: boolean;
  /** Callback for fullscreen button */
  onOpenFullscreen?: () => void;
}

export const TracingHierarchyView: FC<TracingHierarchyViewProps> = ({
  variant = 'full',
  showHeader = true,
  showDataPanels = false,
  onOpenFullscreen,
}) => {
  const {
    traces,
    selectedTrace,
    selectedNode,
    hierarchyCollapsed,
    selectTrace,
    selectNode,
    toggleHierarchyCollapse,
  } = useTracing();

  const containerRef = useRef<HTMLDivElement>(null);

  // Wenn keine Traces, leeren State zeigen
  if (!traces || traces.length === 0) {
    return (
      <div className={classes.emptyContainer}>
        <Text size="sm" c="dimmed">Keine Traces verfügbar</Text>
      </div>
    );
  }

  const isCompact = variant === 'compact';

  return (
    <div 
      ref={containerRef}
      className={`${classes.container} ${isCompact ? classes.containerCompact : ''} ${showDataPanels ? classes.containerWithPanels : ''}`}
    >
      {/* Header */}
      {showHeader && (
        <div className={classes.header}>
          <Text size="sm" fw={600}>Tracing Hierarchie</Text>
          {onOpenFullscreen && (
            <Tooltip label="Vollbild">
              <ActionIcon
                variant="subtle"
                size="sm"
                onClick={onOpenFullscreen}
                className={classes.fullscreenButton}
              >
                <IconMaximize size={16} />
              </ActionIcon>
            </Tooltip>
          )}
        </div>
      )}
      
      {/* Tree Area - flexibles Wachstum */}
      <ScrollArea 
        className={classes.scrollArea} 
        type="auto"
        style={showDataPanels ? { flex: 1, minHeight: TREE_MIN_HEIGHT } : undefined}
      >
        <div className={classes.treeContainer}>
          {traces.map((trace) => {
            // Root ist selektiert wenn selectedNode null ist und dieser Trace selektiert
            const isRootSelected = selectedTrace?.id === trace.id && selectedNode === null;
            // Root ist expanded wenn trace.id NICHT in hierarchyCollapsed ist
            // Wir verwenden hier einen speziellen Key für die Trace-Root
            const traceRootKey = `trace-root-${trace.id}`;
            const isExpanded = !hierarchyCollapsed.has(traceRootKey);

            return (
              <TraceRootItem
                key={trace.id}
                trace={trace}
                isSelected={isRootSelected}
                isExpanded={isExpanded}
                onSelect={() => {
                  selectTrace(trace.id);
                  selectNode(null);
                }}
                onToggle={() => toggleHierarchyCollapse(traceRootKey)}
              />
            );
          })}
        </div>
      </ScrollArea>
      
      {/* Data Panels (VS Code Style - NEW) */}
      {showDataPanels && <DataPanelsContainer />}
    </div>
  );
};

export default TracingHierarchyView;
