/**
 * TracingHierarchyView - Tree Sidebar für Navigation
 * 
 * Features:
 * - Baum-Struktur mit curved Verbindungslinien (VSCode-Style)
 * - Type Badge + Name + Status Icon
 * - Expand/Collapse für Nodes mit Kindern
 * - Klick = Selektion → Canvas + DataSection update
 * - variant: 'full' | 'compact' - Für Dialog vs Sidebar
 * - showDataPanels: VS Code-style collapsible Panels (Logs, I/O, Metadata)
 */

import { useCallback, useMemo, useState, useRef } from 'react';
import type { FC } from 'react';
import { Text, ScrollArea, Badge, UnstyledButton, ActionIcon, Tooltip, Collapse, Code } from '@mantine/core';
import {
  IconChevronDown,
  IconChevronRight,
  IconMaximize,
  IconNote,
  IconFileText,
  IconBraces,
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
// COLLAPSIBLE PANEL (VS Code Style)
// ============================================================================

interface CollapsiblePanelProps {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: number;
}

const CollapsiblePanel: FC<CollapsiblePanelProps> = ({
  title,
  icon,
  defaultOpen = false,
  children,
  badge,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={classes.collapsiblePanel}>
      <UnstyledButton
        className={classes.panelHeader}
        onClick={() => setOpen(!open)}
      >
        <span className={classes.panelChevron}>
          {open ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
        </span>
        <span className={classes.panelIcon}>{icon}</span>
        <Text size="xs" fw={600} className={classes.panelTitle}>{title}</Text>
        {badge !== undefined && badge > 0 && (
          <Badge size="xs" variant="light" className={classes.panelBadge}>{badge}</Badge>
        )}
      </UnstyledButton>
      <Collapse in={open}>
        <ScrollArea className={classes.panelContent} type="auto" offsetScrollbars>
          {children}
        </ScrollArea>
      </Collapse>
    </div>
  );
};

// ============================================================================
// DATA PANELS SECTION
// ============================================================================

interface DataPanelsSectionProps {
  panelsHeight: number;
  onResizeStart: (e: React.MouseEvent) => void;
}

const DataPanelsSection: FC<DataPanelsSectionProps> = ({ panelsHeight, onResizeStart }) => {
  const { selectedTrace, selectedNode } = useTracing();
  
  const isRoot = selectedNode === null;
  
  // Logs
  const logs = useMemo(() => {
    if (isRoot) return selectedTrace?.logs;
    return selectedNode?.logs;
  }, [isRoot, selectedTrace, selectedNode]);
  
  // Input/Output
  const inputData = selectedNode?.data?.input;
  const outputData = selectedNode?.data?.output;
  
  // Metadata
  const metadata = useMemo(() => {
    if (isRoot) return selectedTrace?.referenceMetadata;
    return selectedNode?.metadata;
  }, [isRoot, selectedTrace, selectedNode]);

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

  return (
    <div className={classes.dataPanelsSection} style={{ height: panelsHeight }}>
      {/* Resize Handle */}
      <div className={classes.panelsResizeHandle} onMouseDown={onResizeStart} />
      
      {/* Panels Container */}
      <div className={classes.panelsContainer}>
        {/* Logs Panel */}
        <CollapsiblePanel
          title="Logs"
          icon={<IconNote size={14} />}
          badge={logs?.length}
          defaultOpen={false}
        >
          {(!logs || logs.length === 0) ? (
            <Text size="xs" c="dimmed" fs="italic">Keine Logs</Text>
          ) : (
            <div className={classes.logsList}>
              {logs.map((log, idx) => (
                <div key={idx} className={classes.logEntry}>
                  {typeof log === 'string' ? (
                    <Text size="xs" className={classes.logText}>{log}</Text>
                  ) : (
                    <JsonViewer data={log} initialCollapsed={true} />
                  )}
                </div>
              ))}
            </div>
          )}
        </CollapsiblePanel>
        
        {/* Input/Output Panel (nur wenn Node ausgewählt) */}
        {!isRoot && (
          <CollapsiblePanel
            title="Input / Output"
            icon={<IconFileText size={14} />}
            defaultOpen={true}
          >
            <div className={classes.ioContainer}>
              <div className={classes.ioSection}>
                <Text size="xs" fw={600} c="dimmed" mb="xs" tt="uppercase" style={{ letterSpacing: 1 }}>Input</Text>
                {renderDataContent(inputData, 'Input')}
              </div>
              <div className={classes.ioDivider} />
              <div className={classes.ioSection}>
                <Text size="xs" fw={600} c="dimmed" mb="xs" tt="uppercase" style={{ letterSpacing: 1 }}>Output</Text>
                {renderDataContent(outputData, 'Output')}
              </div>
            </div>
          </CollapsiblePanel>
        )}
        
        {/* Metadata Panel */}
        <CollapsiblePanel
          title="Metadata"
          icon={<IconBraces size={14} />}
          defaultOpen={false}
        >
          {metadata ? (
            <JsonViewer data={metadata} initialCollapsed={false} />
          ) : (
            <Text size="xs" c="dimmed" fs="italic">Keine Metadata</Text>
          )}
        </CollapsiblePanel>
      </div>
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

  // Panels height state (for resizable panels)
  const [panelsHeight, setPanelsHeight] = useState(200);
  const containerRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  // Resize handler for panels
  const handlePanelsResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizing.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newHeight = rect.bottom - moveEvent.clientY;
      setPanelsHeight(Math.min(Math.max(newHeight, 100), rect.height - 100));
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

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
      className={`${classes.container} ${isCompact ? classes.containerCompact : ''}`}
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
      
      {/* Tree Area */}
      <ScrollArea 
        className={classes.scrollArea} 
        type="auto"
        style={showDataPanels ? { flex: 1, minHeight: 0 } : undefined}
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
      
      {/* Data Panels (VS Code Style) */}
      {showDataPanels && (
        <DataPanelsSection
          panelsHeight={panelsHeight}
          onResizeStart={handlePanelsResizeStart}
        />
      )}
    </div>
  );
};

export default TracingHierarchyView;
