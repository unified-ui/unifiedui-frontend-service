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
} from '@xyflow/react';
import type { Node, Edge, ReactFlowInstance } from '@xyflow/react';
import dagre from '@dagrejs/dagre';
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
import type { TraceNodeResponse, FullTraceResponse } from '../../api/types';
import classes from './TracingCanvasView.module.css';
import '@xyflow/react/dist/style.css';

// ============================================================================
// CONSTANTS
// ============================================================================

const NODE_WIDTH = 140;
const NODE_HEIGHT = 90;

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
}

const TraceCustomNode: FC<{ data: TraceNodeData }> = ({ data }) => {
  const { label, type, status, isFirst, isLast, isSelected, onClick } = data;

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

const createDagreLayout = (
  trace: FullTraceResponse,
  direction: 'horizontal' | 'vertical',
  selectedNodeId: string | null,
  onNodeClick: (nodeId: string) => void
): LayoutResult => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === 'horizontal';
  dagreGraph.setGraph({
    rankdir: isHorizontal ? 'LR' : 'TB',
    nodesep: 40,
    ranksep: 80,
  });

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Recursive function to process nodes
  const processNode = (
    node: TraceNodeResponse,
    parentId: string | null,
    index: number,
    siblings: TraceNodeResponse[]
  ) => {
    const nodeId = node.id;
    const isFirst = index === 0;
    const isLast = index === siblings.length - 1;
    const isSelected = selectedNodeId === nodeId;

    // Add to dagre
    dagreGraph.setNode(nodeId, { width: NODE_WIDTH, height: NODE_HEIGHT });

    // Add to xyflow nodes
    nodes.push({
      id: nodeId,
      type: 'traceNode',
      position: { x: 0, y: 0 }, // Will be set by dagre
      data: {
        label: node.name,
        type: node.type,
        status: node.status,
        isFirst: isFirst && !parentId, // Only first at root level
        isLast: isLast && !parentId,   // Only last at root level
        isSelected,
        onClick: () => onNodeClick(nodeId),
      },
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
    });

    // Create edge from parent
    if (parentId) {
      dagreGraph.setEdge(parentId, nodeId);
      edges.push({
        id: `${parentId}-${nodeId}`,
        source: parentId,
        target: nodeId,
        type: 'smoothstep',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: 'var(--color-primary-400)',
        },
        style: {
          stroke: 'var(--color-primary-400)',
          strokeWidth: 2,
        },
        animated: node.status === 'running',
      });
    }

    // Process sub-nodes
    if (node.nodes && node.nodes.length > 0) {
      node.nodes.forEach((subNode, subIndex) => {
        processNode(subNode, nodeId, subIndex, node.nodes!);
      });
    }
  };

  // Process all root nodes and create edges between sequential root nodes
  trace.nodes.forEach((node, index, array) => {
    processNode(node, null, index, array);

    // Create edge to next root node (sequential flow)
    if (index < array.length - 1) {
      const nextNode = array[index + 1];
      dagreGraph.setEdge(node.id, nextNode.id);
      edges.push({
        id: `${node.id}-${nextNode.id}`,
        source: node.id,
        target: nextNode.id,
        type: 'smoothstep',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: 'var(--color-primary-400)',
        },
        style: {
          stroke: 'var(--color-primary-400)',
          strokeWidth: 2,
        },
        animated: nextNode.status === 'running',
      });
    }
  });

  // Run dagre layout
  dagre.layout(dagreGraph);

  // Apply calculated positions
  nodes.forEach((node) => {
    const dagreNode = dagreGraph.node(node.id);
    if (dagreNode) {
      node.position = {
        x: dagreNode.x - NODE_WIDTH / 2,
        y: dagreNode.y - NODE_HEIGHT / 2,
      };
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
