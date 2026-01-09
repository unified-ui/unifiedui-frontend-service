/**
 * TracingCanvasView - @xyflow/react based canvas visualization
 * 
 * Displays trace nodes as a workflow diagram using React Flow.
 * Features:
 * - Automatic layout with dagre
 * - Custom node components with status indicators
 * - Arrows between nodes (sequential + hierarchical)
 * - Pan/zoom controls
 * - Layout direction toggle (horizontal/vertical)
 */

import { type FC, useMemo, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  type Node,
  type Edge,
  type NodeTypes,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Dagre from '@dagrejs/dagre';
import { Box, Group, ActionIcon, Tooltip, Text } from '@mantine/core';
import {
  IconRobot,
  IconTool,
  IconBrain,
  IconLink,
  IconWorldWww,
  IconCode,
  IconForms,
  IconChartDots,
  IconCheck,
  IconX,
  IconClock,
  IconPlayerSkipForward,
  IconBan,
  IconLayoutRows,
  IconLayoutColumns,
  IconZoomReset,
} from '@tabler/icons-react';
import type { TraceNodeResponse, TraceNodeStatus, TraceNodeType } from '../../api/types';
import { useTracing } from './TracingContext';
import classes from './TracingCanvasView.module.css';

// ============================================================================
// Types
// ============================================================================

// Must satisfy Record<string, unknown> for @xyflow/react
interface CanvasNodeData extends Record<string, unknown> {
  id: string;
  name: string;
  type: TraceNodeType | string;
  status: TraceNodeStatus | string;
  duration?: number;
  hasSubNodes: boolean;
  isSubNode: boolean;
  parentId?: string;
}

// ============================================================================
// Icon and Status Helpers
// ============================================================================

const getNodeTypeIcon = (type: TraceNodeType | string): React.ReactNode => {
  const iconProps = { size: 14 };
  const iconMap: Record<string, React.ReactNode> = {
    agent: <IconRobot {...iconProps} />,
    tool: <IconTool {...iconProps} />,
    llm: <IconBrain {...iconProps} />,
    chain: <IconLink {...iconProps} />,
    workflow: <IconChartDots {...iconProps} />,
    http: <IconWorldWww {...iconProps} />,
    code: <IconCode {...iconProps} />,
    custom: <IconForms {...iconProps} />,
    retriever: <IconChartDots {...iconProps} />,
    function: <IconCode {...iconProps} />,
    conditional: <IconLink {...iconProps} />,
    loop: <IconLink {...iconProps} />,
  };
  return iconMap[type] || <IconForms {...iconProps} />;
};

const getStatusColor = (status: TraceNodeStatus | string): string => {
  const colors: Record<string, string> = {
    completed: '#4caf50',
    failed: '#f44336',
    running: '#ff9800',
    pending: '#9e9e9e',
    skipped: '#757575',
    cancelled: '#616161',
  };
  return colors[status] || '#9e9e9e';
};

const getStatusIcon = (status: TraceNodeStatus | string): React.ReactNode => {
  const iconProps = { size: 12 };
  switch (status) {
    case 'completed':
      return <IconCheck {...iconProps} color="#4caf50" />;
    case 'failed':
      return <IconX {...iconProps} color="#f44336" />;
    case 'running':
      return <IconClock {...iconProps} color="#ff9800" />;
    case 'skipped':
      return <IconPlayerSkipForward {...iconProps} color="#757575" />;
    case 'cancelled':
      return <IconBan {...iconProps} color="#616161" />;
    default:
      return <IconClock {...iconProps} color="#9e9e9e" />;
  }
};

// ============================================================================
// Custom Node Component
// ============================================================================

interface CustomNodeProps {
  data: CanvasNodeData;
  selected: boolean;
}

const CustomNode: FC<CustomNodeProps> = ({ data, selected }) => {
  const statusColor = getStatusColor(data.status);
  
  return (
    <div
      className={`${classes.customNode} ${selected ? classes.selected : ''} ${data.isSubNode ? classes.subNode : ''}`}
      style={{ borderColor: statusColor }}
    >
      {/* Handles for connections */}
      <Handle type="target" position={Position.Left} className={classes.handle} />
      <Handle type="source" position={Position.Right} className={classes.handle} />
      <Handle type="target" position={Position.Top} className={classes.handleTop} />
      <Handle type="source" position={Position.Bottom} className={classes.handleBottom} />
      
      <div className={classes.nodeContent}>
        <div className={classes.nodeHeader}>
          <div
            className={classes.statusDot}
            style={{ backgroundColor: statusColor }}
          />
          <span className={classes.nodeIcon}>{getNodeTypeIcon(data.type)}</span>
          <span className={classes.nodeName}>{data.name}</span>
        </div>
        <div className={classes.nodeFooter}>
          {data.duration !== undefined && (
            <span className={classes.duration}>{data.duration.toFixed(2)}s</span>
          )}
          <span className={classes.statusIcon}>{getStatusIcon(data.status)}</span>
        </div>
      </div>
      
      {data.hasSubNodes && (
        <div className={classes.subNodeIndicator}>
          <IconChartDots size={10} />
        </div>
      )}
    </div>
  );
};

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

// ============================================================================
// Dagre Layout
// ============================================================================

const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  direction: 'LR' | 'TB'
): { nodes: Node[]; edges: Edge[] } => {
  const dagreGraph = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 60,
    ranksep: 80,
    edgesep: 30,
    marginx: 20,
    marginy: 20,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 180, height: 50 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  Dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 90, // Center the node
        y: nodeWithPosition.y - 25,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

// ============================================================================
// Transform Trace Data to React Flow
// ============================================================================

const transformTraceToFlow = (
  traceNodes: TraceNodeResponse[],
  collapsedNodes: Set<string>
): { nodes: Node<CanvasNodeData>[]; edges: Edge[] } => {
  const flowNodes: Node<CanvasNodeData>[] = [];
  const flowEdges: Edge[] = [];

  const processNodes = (
    nodes: TraceNodeResponse[],
    parentId?: string,
    isSubNode = false
  ) => {
    nodes.forEach((node, index) => {
      const hasSubNodes = node.nodes && node.nodes.length > 0;
      const isCollapsed = collapsedNodes.has(node.id);

      // Create flow node
      flowNodes.push({
        id: node.id,
        type: 'custom',
        position: { x: 0, y: 0 }, // Will be calculated by dagre
        data: {
          id: node.id,
          name: node.name,
          type: node.type,
          status: node.status,
          duration: node.duration,
          hasSubNodes: hasSubNodes ?? false,
          isSubNode,
          parentId,
        },
      });

      // Create edge from previous sibling (sequential connection)
      if (index > 0 && !isSubNode) {
        const prevNode = nodes[index - 1];
        flowEdges.push({
          id: `seq-${prevNode.id}-${node.id}`,
          source: prevNode.id,
          target: node.id,
          type: 'smoothstep',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#42a5f5',
            width: 20,
            height: 20,
          },
          style: { stroke: '#42a5f5', strokeWidth: 2 },
          animated: node.status === 'running',
        });
      }

      // Create edge from parent (hierarchical connection)
      if (parentId) {
        flowEdges.push({
          id: `parent-${parentId}-${node.id}`,
          source: parentId,
          target: node.id,
          type: 'smoothstep',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#9e9e9e',
            width: 16,
            height: 16,
          },
          style: { stroke: '#9e9e9e', strokeWidth: 1.5 },
          animated: node.status === 'running',
          label: String(index + 1),
          labelStyle: { fill: '#757575', fontSize: 10, fontWeight: 600 },
          labelBgStyle: { fill: '#fff', stroke: '#9e9e9e' },
          labelBgPadding: [4, 4] as [number, number],
          labelBgBorderRadius: 8,
        });
      }

      // Recursively process sub-nodes if not collapsed
      if (hasSubNodes && !isCollapsed) {
        processNodes(node.nodes!, node.id, true);
      }
    });
  };

  processNodes(traceNodes);

  return { nodes: flowNodes, edges: flowEdges };
};

// ============================================================================
// Inner Canvas Component (needs ReactFlow context)
// ============================================================================

interface CanvasInnerProps {
  width?: string | number;
  height?: string | number;
}

const CanvasInner: FC<CanvasInnerProps> = ({ width = '100%', height = '100%' }) => {
  const {
    selectedTrace,
    selectNode,
    layoutDirection,
    setLayoutDirection,
    canvasCollapsed,
  } = useTracing();

  const { fitView } = useReactFlow();

  // Transform trace data to React Flow format
  const { initialNodes, initialEdges } = useMemo(() => {
    if (!selectedTrace?.nodes) {
      return { initialNodes: [], initialEdges: [] };
    }

    const { nodes, edges } = transformTraceToFlow(
      selectedTrace.nodes,
      canvasCollapsed ?? new Set<string>()
    );

    // Apply layout
    const direction = layoutDirection === 'horizontal' ? 'LR' : 'TB';
    const layouted = getLayoutedElements(nodes, edges, direction);

    return { initialNodes: layouted.nodes, initialEdges: layouted.edges };
  }, [selectedTrace, canvasCollapsed, layoutDirection]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes/edges when trace changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    
    // Fit view after nodes are set
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 300 });
    }, 50);
  }, [initialNodes, initialEdges, setNodes, setEdges, fitView]);

  // Handle node click
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  // Handle pane click (deselect)
  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  // Toggle layout direction
  const toggleLayout = () => {
    setLayoutDirection(layoutDirection === 'horizontal' ? 'vertical' : 'horizontal');
  };

  // Handle fit view
  const handleFitView = () => {
    fitView({ padding: 0.2, duration: 300 });
  };

  if (!selectedTrace) {
    return (
      <Box className={classes.container} style={{ width, height }}>
        <Box className={classes.emptyState}>
          <Text c="dimmed">Kein Trace ausgewählt</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box className={classes.container} style={{ width, height }}>
      {/* Toolbar */}
      <Group className={classes.toolbar} gap="xs">
        <Tooltip label={layoutDirection === 'horizontal' ? 'Vertikal' : 'Horizontal'}>
          <ActionIcon variant="subtle" size="sm" onClick={toggleLayout}>
            {layoutDirection === 'horizontal' ? (
              <IconLayoutRows size={16} />
            ) : (
              <IconLayoutColumns size={16} />
            )}
          </ActionIcon>
        </Tooltip>

        <Tooltip label="Ansicht zurücksetzen">
          <ActionIcon variant="subtle" size="sm" onClick={handleFitView}>
            <IconZoomReset size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
        }}
        proOptions={{ hideAttribution: true }}
        className={classes.reactFlow}
      >
        <Background color="#e0e0e0" gap={16} />
        <Controls showInteractive={false} className={classes.controls} />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as CanvasNodeData | undefined;
            return data ? getStatusColor(data.status) : '#9e9e9e';
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
          className={classes.minimap}
        />
      </ReactFlow>
    </Box>
  );
};

// ============================================================================
// Main Component (wraps with ReactFlowProvider)
// ============================================================================

interface TracingCanvasViewProps {
  width?: string | number;
  height?: string | number;
}

export const TracingCanvasView: FC<TracingCanvasViewProps> = (props) => {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
};

export default TracingCanvasView;
