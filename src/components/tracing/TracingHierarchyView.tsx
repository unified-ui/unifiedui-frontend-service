/**
 * TracingHierarchyView - Tree Sidebar für Navigation
 * 
 * Features:
 * - Baum-Struktur mit curved Verbindungslinien (VSCode-Style)
 * - Type Badge + Name + Status Icon
 * - Expand/Collapse für Nodes mit Kindern
 * - Klick = Selektion → Canvas + DataSection update
 */

import { useCallback, useMemo } from 'react';
import type { FC } from 'react';
import { Text, ScrollArea, Badge, UnstyledButton } from '@mantine/core';
import {
  IconChevronDown,
  IconChevronRight,
  // Status Icons
  IconCheck,
  IconX,
  IconLoader2,
  IconClock,
  IconMinus,
} from '@tabler/icons-react';
import { useTracing } from './TracingContext';
import type { TraceNodeResponse, FullTraceResponse } from '../../api/types';
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

export const TracingHierarchyView: FC = () => {
  const {
    traces,
    selectedTrace,
    selectedNode,
    hierarchyCollapsed,
    selectTrace,
    selectNode,
    toggleHierarchyCollapse,
  } = useTracing();

  // Wenn keine Traces, leeren State zeigen
  if (!traces || traces.length === 0) {
    return (
      <div className={classes.emptyContainer}>
        <Text size="sm" c="dimmed">Keine Traces verfügbar</Text>
      </div>
    );
  }

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <Text size="sm" fw={600}>Hierarchie</Text>
      </div>
      <ScrollArea className={classes.scrollArea} type="auto">
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
    </div>
  );
};

export default TracingHierarchyView;
