/**
 * TracingHierarchyView - Hierarchical tree view of trace nodes
 * 
 * Displays a collapsible tree structure of traces and their nodes.
 * Supports selection and navigation.
 */

import { type FC, useCallback } from 'react';
import { Box, Text, Badge, ActionIcon, Stack, Group, ScrollArea, Collapse, Tooltip } from '@mantine/core';
import {
  IconChevronDown,
  IconChevronRight,
  IconCircleCheck,
  IconCircleX,
  IconClock,
  IconRobot,
  IconTool,
  IconBrain,
  IconLink,
  IconSearch,
  IconGitBranch,
  IconCode,
  IconWorld,
  IconTerminal,
  IconGitMerge,
  IconRepeat,
  IconPuzzle,
  IconCircle,
  IconMessage,
} from '@tabler/icons-react';
import type { FullTraceResponse, TraceNodeResponse, TraceNodeStatus } from '../../api/types';
import { useTracing } from './TracingContext';
import type { TracingHierarchyViewProps } from './types';
import classes from './TracingHierarchyView.module.css';

// ========== Icon Mapping ==========

const getNodeIcon = (type: string, size = 14): React.ReactNode => {
  const iconProps = { size, stroke: 1.5 };
  const iconMap: Record<string, React.ReactNode> = {
    agent: <IconRobot {...iconProps} />,
    tool: <IconTool {...iconProps} />,
    llm: <IconBrain {...iconProps} />,
    chain: <IconLink {...iconProps} />,
    retriever: <IconSearch {...iconProps} />,
    workflow: <IconGitBranch {...iconProps} />,
    function: <IconCode {...iconProps} />,
    http: <IconWorld {...iconProps} />,
    code: <IconTerminal {...iconProps} />,
    conditional: <IconGitMerge {...iconProps} />,
    loop: <IconRepeat {...iconProps} />,
    custom: <IconPuzzle {...iconProps} />,
    conversation: <IconMessage {...iconProps} />,
    autonomous_agent: <IconRobot {...iconProps} />,
  };
  return iconMap[type.toLowerCase()] || <IconCircle {...iconProps} />;
};

const getStatusIcon = (status: TraceNodeStatus | string | undefined) => {
  if (!status) return null;
  const statusLower = status.toLowerCase();
  if (statusLower === 'completed' || statusLower === 'success') {
    return <IconCircleCheck size={12} style={{ color: 'var(--color-success-500)' }} />;
  }
  if (statusLower === 'failed' || statusLower === 'error' || statusLower === 'cancelled') {
    return <IconCircleX size={12} style={{ color: 'var(--color-error-500)' }} />;
  }
  if (statusLower === 'running' || statusLower === 'pending') {
    return <IconClock size={12} style={{ color: 'var(--color-warning-500)' }} />;
  }
  return null;
};

// ========== HierarchyNode Component ==========

interface HierarchyNodeProps {
  node: TraceNodeResponse;
  depth: number;
  traceId: string;
  isSelected: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
}

const HierarchyNode: FC<HierarchyNodeProps> = ({
  node,
  depth,
  traceId,
  isSelected,
  isExpanded,
  onToggle,
  onSelect,
}) => {
  const hasChildren = node.nodes && node.nodes.length > 0;

  const handleNodeClick = useCallback(() => {
    onSelect();
  }, [onSelect]);

  const handleToggleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle();
  }, [onToggle]);

  return (
    <Box>
      <Group
        gap="xs"
        className={`${classes.nodeItem} ${isSelected ? classes.selected : ''}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleNodeClick}
      >
        {/* Expand/Collapse Toggle */}
        <ActionIcon
          size="xs"
          variant="subtle"
          color="gray"
          onClick={handleToggleClick}
          style={{ visibility: hasChildren ? 'visible' : 'hidden' }}
        >
          {isExpanded ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
        </ActionIcon>

        {/* Type Badge with Icon */}
        <Badge
          size="xs"
          variant="light"
          color="gray"
          leftSection={getNodeIcon(node.type, 10)}
          className={classes.typeBadge}
        >
          {node.type}
        </Badge>

        {/* Node Name */}
        <Tooltip label={node.name} disabled={node.name.length < 25}>
          <Text size="xs" className={classes.nodeName} lineClamp={1}>
            {node.name}
          </Text>
        </Tooltip>

        {/* Status Icon */}
        {getStatusIcon(node.status)}
      </Group>

      {/* Children */}
      {hasChildren && (
        <Collapse in={isExpanded}>
          {node.nodes!.map((childNode) => (
            <HierarchyNodeWrapper
              key={childNode.id}
              node={childNode}
              depth={depth + 1}
              traceId={traceId}
            />
          ))}
        </Collapse>
      )}
    </Box>
  );
};

// Wrapper component to connect to context
interface HierarchyNodeWrapperProps {
  node: TraceNodeResponse;
  depth: number;
  traceId: string;
}

const HierarchyNodeWrapper: FC<HierarchyNodeWrapperProps> = ({ node, depth, traceId }) => {
  const { selectedNode, selectNode, hierarchyCollapsed, toggleHierarchyCollapse } = useTracing();

  const isSelected = selectedNode?.id === node.id;
  const isExpanded = !hierarchyCollapsed.has(node.id);

  const handleSelect = useCallback(() => {
    selectNode(node.id);
  }, [selectNode, node.id]);

  const handleToggle = useCallback(() => {
    toggleHierarchyCollapse(node.id);
  }, [toggleHierarchyCollapse, node.id]);

  return (
    <HierarchyNode
      node={node}
      depth={depth}
      traceId={traceId}
      isSelected={isSelected}
      isExpanded={isExpanded}
      onToggle={handleToggle}
      onSelect={handleSelect}
    />
  );
};

// ========== TraceRoot Component ==========

interface TraceRootProps {
  trace: FullTraceResponse;
  isSelected: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
}

const TraceRoot: FC<TraceRootProps> = ({
  trace,
  isSelected,
  isExpanded,
  onToggle,
  onSelect,
}) => {
  const hasChildren = trace.nodes && trace.nodes.length > 0;

  const handleClick = useCallback(() => {
    onSelect();
  }, [onSelect]);

  const handleToggleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle();
  }, [onToggle]);

  return (
    <Box>
      <Group
        gap="xs"
        className={`${classes.nodeItem} ${classes.rootItem} ${isSelected ? classes.selected : ''}`}
        onClick={handleClick}
      >
        {/* Expand/Collapse Toggle */}
        <ActionIcon
          size="xs"
          variant="subtle"
          color="gray"
          onClick={handleToggleClick}
          style={{ visibility: hasChildren ? 'visible' : 'hidden' }}
        >
          {isExpanded ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
        </ActionIcon>

        {/* Context Type Badge */}
        <Badge
          size="xs"
          variant="filled"
          color={trace.contextType === 'conversation' ? 'blue' : 'grape'}
          leftSection={getNodeIcon(trace.contextType, 10)}
        >
          {trace.contextType === 'conversation' ? 'Conversation' : 'Autonomous Agent'}
        </Badge>

        {/* Reference Name */}
        <Tooltip label={trace.referenceName || 'Trace'} disabled={(trace.referenceName || 'Trace').length < 20}>
          <Text size="xs" className={classes.nodeName} fw={500} lineClamp={1}>
            {trace.referenceName || 'Trace'}
          </Text>
        </Tooltip>
      </Group>

      {/* Nodes */}
      {hasChildren && (
        <Collapse in={isExpanded}>
          {trace.nodes.map((node) => (
            <HierarchyNodeWrapper
              key={node.id}
              node={node}
              depth={1}
              traceId={trace.id}
            />
          ))}
        </Collapse>
      )}
    </Box>
  );
};

// ========== Main Component ==========

export const TracingHierarchyView: FC<TracingHierarchyViewProps> = ({
  height = '100%',
  onNodeSelect,
}) => {
  const {
    traces,
    selectedTrace,
    selectedNode,
    selectTrace,
    selectNode,
    hierarchyCollapsed,
    toggleHierarchyCollapse,
  } = useTracing();

  // Check if root (trace) is selected (no node selected)
  const isRootSelected = selectedNode === null;

  // Toggle for trace root
  const handleRootToggle = useCallback((traceId: string) => {
    toggleHierarchyCollapse(`root-${traceId}`);
  }, [toggleHierarchyCollapse]);

  // Select root (clear node selection)
  const handleRootSelect = useCallback((traceId: string) => {
    selectTrace(traceId);
    selectNode(null);
    if (onNodeSelect && selectedTrace) {
      onNodeSelect(null, selectedTrace);
    }
  }, [selectTrace, selectNode, onNodeSelect, selectedTrace]);

  return (
    <Box className={classes.container} style={{ height }}>
      <Box className={classes.header}>
        <Text size="xs" fw={600} c="dimmed" tt="uppercase">
          Hierarchy
        </Text>
      </Box>
      <ScrollArea className={classes.scrollArea}>
        <Stack gap={0}>
          {traces.map((trace) => (
            <TraceRoot
              key={trace.id}
              trace={trace}
              isSelected={selectedTrace?.id === trace.id && isRootSelected}
              isExpanded={!hierarchyCollapsed.has(`root-${trace.id}`)}
              onToggle={() => handleRootToggle(trace.id)}
              onSelect={() => handleRootSelect(trace.id)}
            />
          ))}
        </Stack>
      </ScrollArea>
    </Box>
  );
};

export default TracingHierarchyView;
