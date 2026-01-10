/**
 * TracingCanvasView - @xyflow/react Canvas für Trace-Visualisierung
 * 
 * Features:
 * - Nodes mit Icon, Name, Status
 * - Verbindungen mit smoothstep Edges
 * - Dagre Layout für automatische Positionierung
 * - Zoom, Pan, Reset
 * - Horizontal/Vertical Layout Toggle
 */

import { useCallback, useEffect, useState } from 'react';
import type { FC } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
  ConnectionLineType,
  Handle,
} from '@xyflow/react';
import type { Node, Edge, ReactFlowInstance } from '@xyflow/react';
import { ActionIcon, Group, Tooltip } from '@mantine/core';
import {
  IconArrowsHorizontal,
  IconArrowsVertical,
  IconFocusCentered,
  // Node Type Icons
  IconBrain,
  IconTool,
  IconRobot,
  IconLink,
  IconCode,
  IconGitBranch,
  IconRepeat,
  IconMessage,
  IconCloud,
  IconSettings,
  // Status Icons
  IconCheck,
  IconX,
  IconLoader2,
  IconClock,
  IconMinus,
} from '@tabler/icons-react';
import { useTracing } from './TracingContext';
import { TracingSubHeader } from './TracingSubHeader';
import type { FullTraceResponse } from '../../api/types';
import classes from './TracingCanvasView.module.css';
import '@xyflow/react/dist/style.css';

// ============================================================================
// HELPER: Get Node Type Icon
// ============================================================================

const getTypeIcon = (type: string, size = 24) => {
  const iconProps = { size };
  switch (type?.toLowerCase()) {
    case 'llm':
      return <IconBrain {...iconProps} />;
    case 'tool':
      return <IconTool {...iconProps} />;
    case 'agent':
      return <IconRobot {...iconProps} />;
    case 'chain':
      return <IconLink {...iconProps} />;
    case 'code':
    case 'function':
      return <IconCode {...iconProps} />;
    case 'workflow':
      return <IconSettings {...iconProps} />;
    case 'conditional':
      return <IconGitBranch {...iconProps} />;
    case 'loop':
      return <IconRepeat {...iconProps} />;
    case 'http':
      return <IconCloud {...iconProps} />;
    case 'message':
      return <IconMessage {...iconProps} />;
    default:
      return <IconSettings {...iconProps} />;
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
// HELPER: Get Border Color by Status
// ============================================================================

const getStatusBorderColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'var(--color-success-500)';
    case 'failed':
      return 'var(--color-error-500)';
    case 'running':
      return 'var(--color-warning-500)';
    case 'pending':
      return 'var(--color-gray-400)';
    case 'skipped':
    case 'cancelled':
      return 'var(--color-gray-500)';
    default:
      return 'var(--color-gray-300)';
  }
};

// ============================================================================
// CUSTOM NODE COMPONENT
// ============================================================================

interface TraceNodeData {
  label: string;
  type: string;
  status: string;
  isFirst?: boolean;
  isLast?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  sourcePosition?: Position;
  targetPosition?: Position;
}

const TraceCustomNode: FC<{ data: TraceNodeData }> = ({ data }) => {
  const { 
    label, type, status, isFirst, isLast, isSelected, onClick,
    sourcePosition = Position.Right,
    targetPosition = Position.Left,
  } = data;

  // Determine border radius
  let borderRadius = 'var(--radius-md)';
  if (isFirst && isLast) {
    borderRadius = 'var(--radius-xl)';
  } else if (isFirst) {
    borderRadius = 'var(--radius-xl) var(--radius-md) var(--radius-md) var(--radius-xl)';
  } else if (isLast) {
    borderRadius = 'var(--radius-md) var(--radius-xl) var(--radius-xl) var(--radius-md)';
  }

  return (
    <>
      {/* Dynamic handles based on layout direction */}
      <Handle type="target" position={targetPosition} />
      <div
        className={`${classes.customNode} ${isSelected ? classes.customNodeSelected : ''}`}
        style={{
          borderRadius,
          borderColor: getStatusBorderColor(status),
        }}
        onClick={onClick}
      >
        <div className={classes.nodeIcon}>
          {getTypeIcon(type, 28)}
        </div>
        <div className={classes.nodeLabel} title={label}>
          {label.length > 18 ? `${label.slice(0, 16)}...` : label}
        </div>
        <div className={classes.nodeStatus}>
          {getStatusIcon(status, 16)}
        </div>
      </div>
      <Handle type="source" position={sourcePosition} />
    </>
  );
};

const nodeTypes = {
  traceNode: TraceCustomNode,
};

// ============================================================================
// DAGRE LAYOUT
// ============================================================================

interface LayoutResult {
  nodes: Node[];
  edges: Edge[];
}

// Layout constants
const ROOT_GAP = 280;           // Gap between root nodes in main direction
const SUB_NODE_GAP = 160;       // Gap between sub-nodes  
const SUB_NODE_OFFSET = 160;    // Offset from parent for sub-nodes (perpendicular direction)

// Type for tracking node positions
interface NodePosition {
  id: string;
  x: number;
  y: number;
  subNodeCount: number;  // Total count of all descendants
}

// Helper: Count all descendants recursively
const countAllDescendants = (node: { nodes?: { nodes?: unknown[] }[] }): number => {
  if (!node.nodes || node.nodes.length === 0) return 0;
  let count = node.nodes.length;
  for (const child of node.nodes) {
    count += countAllDescendants(child as { nodes?: { nodes?: unknown[] }[] });
  }
  return count;
};

const createDagreLayout = (
  trace: FullTraceResponse,
  direction: 'horizontal' | 'vertical',
  selectedNodeId: string | null,
  onNodeClick: (nodeId: string) => void
): LayoutResult => {
  const isHorizontal = direction === 'horizontal';
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Handle positions based on direction
  const sourcePos = isHorizontal ? Position.Right : Position.Bottom;
  const targetPos = isHorizontal ? Position.Left : Position.Top;

  // Calculate root node positions (fixed gap, no extra space for sub-nodes)
  const rootPositions: NodePosition[] = trace.nodes.map((node, index) => {
    const x = isHorizontal ? index * ROOT_GAP : 0;
    const y = isHorizontal ? 0 : index * ROOT_GAP;
    return { id: node.id, x, y, subNodeCount: countAllDescendants(node) };
  });

  // Recursive function to process nodes and their children
  const processNode = (
    node: { 
      id: string; 
      name: string; 
      type: string; 
      status: string; 
      nodes?: typeof node[] 
    },
    parentId: string | null,
    baseX: number,
    baseY: number,
    depth: number,           // Depth level (0 = root, 1 = first sub-level, etc.)
    _siblingIndex: number,   // Index among siblings (unused but kept for API consistency)
    isRootFirst: boolean,
    isRootLast: boolean
  ): void => {
    const isSelected = selectedNodeId === node.id;
    const isRoot = depth === 0;

    // Add node
    nodes.push({
      id: node.id,
      type: 'traceNode',
      position: { x: baseX, y: baseY },
      data: {
        label: node.name,
        type: node.type,
        status: node.status,
        isFirst: isRoot && isRootFirst,
        isLast: isRoot && isRootLast && (!node.nodes || node.nodes.length === 0),
        isSelected,
        onClick: () => onNodeClick(node.id),
        sourcePosition: sourcePos,
        targetPosition: targetPos,
      },
      sourcePosition: sourcePos,
      targetPosition: targetPos,
    });

    // Edge from parent to this node
    if (parentId) {
      edges.push({
        id: `${parentId}-${node.id}`,
        source: parentId,
        target: node.id,
        type: 'smoothstep',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: depth === 1 ? '#66bb6a' : '#9c27b0', // Green for level 1, purple for deeper
        },
        style: {
          stroke: depth === 1 ? '#66bb6a' : '#9c27b0',
          strokeWidth: 2,
        },
        animated: node.status === 'running',
      });
    }

    // Process sub-nodes recursively
    if (node.nodes && node.nodes.length > 0) {
      node.nodes.forEach((subNode, subIndex) => {
        let subX: number, subY: number;

        if (isHorizontal) {
          // Horizontal: Sub-nodes go DOWN from parent, stacked vertically
          // Each depth level adds more offset to the right
          subX = baseX + SUB_NODE_OFFSET + (depth * SUB_NODE_OFFSET);
          subY = baseY + SUB_NODE_OFFSET + (subIndex * SUB_NODE_GAP);
        } else {
          // Vertical: Sub-nodes go RIGHT from parent, stacked horizontally
          subX = baseX + SUB_NODE_OFFSET + (subIndex * SUB_NODE_GAP);
          subY = baseY + SUB_NODE_OFFSET + (depth * SUB_NODE_OFFSET);
        }

        processNode(
          subNode,
          node.id,
          subX,
          subY,
          depth + 1,
          subIndex,
          false,
          false
        );
      });
    }
  };

  // Process all root nodes
  trace.nodes.forEach((node, index, array) => {
    const pos = rootPositions[index];
    const isFirst = index === 0;
    const isLast = index === array.length - 1;

    // Process this root node and all its descendants
    processNode(node, null, pos.x, pos.y, 0, index, isFirst, isLast);

    // Edge to next root node
    if (index < array.length - 1) {
      const nextNode = array[index + 1];
      edges.push({
        id: `root-${node.id}-${nextNode.id}`,
        source: node.id,
        target: nextNode.id,
        type: 'smoothstep',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#42a5f5',
        },
        style: {
          stroke: '#42a5f5',
          strokeWidth: 2,
        },
        animated: nextNode.status === 'running',
      });
    }
  });

  return { nodes, edges };
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const TracingCanvasView: FC = () => {
  const {
    selectedTrace,
    selectedNode,
    layoutDirection,
    selectNode,
    setLayoutDirection,
    resetCanvasView,
  } = useTracing();

  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Calculate layout when trace or direction changes
  useEffect(() => {
    if (!selectedTrace) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const { nodes: layoutNodes, edges: layoutEdges } = createDagreLayout(
      selectedTrace,
      layoutDirection,
      selectedNode?.id || null,
      (nodeId) => selectNode(nodeId)
    );

    setNodes(layoutNodes);
    setEdges(layoutEdges);
  }, [selectedTrace, layoutDirection, selectedNode, selectNode, setNodes, setEdges]);

  // Fit view on load
  const onInit = useCallback((instance: ReactFlowInstance) => {
    setReactFlowInstance(instance);
    setTimeout(() => {
      instance.fitView({ padding: 0.1 });
    }, 100);
  }, []);

  // Handle reset view
  const handleResetView = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.1 });
    }
    resetCanvasView();
  }, [reactFlowInstance, resetCanvasView]);

  // Handle layout toggle
  const handleLayoutToggle = useCallback(() => {
    setLayoutDirection(layoutDirection === 'horizontal' ? 'vertical' : 'horizontal');
  }, [layoutDirection, setLayoutDirection]);

  // MiniMap node color
  const miniMapNodeColor = useCallback((node: Node) => {
    const status = node.data?.status as string;
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'var(--color-success-500)';
      case 'failed':
        return 'var(--color-error-500)';
      case 'running':
        return 'var(--color-warning-500)';
      default:
        return 'var(--color-gray-400)';
    }
  }, []);

  if (!selectedTrace) {
    return (
      <div className={classes.emptyContainer}>
        <p>Kein Trace ausgewählt</p>
      </div>
    );
  }

  return (
    <div className={classes.container}>
      {/* SubHeader */}
      <TracingSubHeader />

      {/* Canvas Controls */}
      <div className={classes.controls}>
        <Group gap="xs">
          <Tooltip label={layoutDirection === 'horizontal' ? 'Zu Vertikal wechseln' : 'Zu Horizontal wechseln'}>
            <ActionIcon variant="light" onClick={handleLayoutToggle}>
              {layoutDirection === 'horizontal' ? (
                <IconArrowsVertical size={18} />
              ) : (
                <IconArrowsHorizontal size={18} />
              )}
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Ansicht zurücksetzen">
            <ActionIcon variant="light" onClick={handleResetView}>
              <IconFocusCentered size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </div>

      {/* ReactFlow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={onInit}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={16} size={1} color="var(--color-gray-200)" />
        <Controls showInteractive={false} className={classes.flowControls} />
        <MiniMap
          nodeColor={miniMapNodeColor}
          className={classes.miniMap}
          zoomable
          pannable
        />
      </ReactFlow>
    </div>
  );
};

export default TracingCanvasView;
