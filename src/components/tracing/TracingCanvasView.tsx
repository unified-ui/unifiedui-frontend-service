/**
 * TracingCanvasView - Simple Canvas-based workflow visualization
 * 
 * Displays trace nodes in a canvas with pan/zoom, connections between nodes.
 * This is a simplified version that does not require @xyflow/react.
 * 
 * NOTE: To enable full React Flow features, install @xyflow/react:
 * npm install @xyflow/react
 */

import { type FC, useState, useRef, useMemo, useCallback } from 'react';
import {
  Box,
  Text,
  Group,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
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
  IconZoomIn,
  IconZoomOut,
  IconZoomReset,
} from '@tabler/icons-react';
import type { TraceNodeResponse, TraceNodeStatus, TraceNodeType } from '../../api/types';
import { useTracing } from './TracingContext';
import classes from './TracingCanvasView.module.css';

/**
 * Icon mapping for node types
 */
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

/**
 * Status color mapping
 */
const getStatusColor = (status: TraceNodeStatus | string): string => {
  const colors: Record<string, string> = {
    completed: 'var(--color-success-500)',
    failed: 'var(--color-error-500)',
    running: 'var(--color-warning-500)',
    pending: 'var(--color-gray-400)',
    skipped: 'var(--color-gray-500)',
    cancelled: 'var(--color-gray-600)',
  };
  return colors[status] || 'var(--color-gray-400)';
};

/**
 * Status icon mapping
 */
const getStatusIcon = (status: TraceNodeStatus | string): React.ReactNode => {
  const iconProps = { size: 12 };
  switch (status) {
    case 'completed':
      return <IconCheck {...iconProps} color="var(--color-success-500)" />;
    case 'failed':
      return <IconX {...iconProps} color="var(--color-error-500)" />;
    case 'running':
      return <IconClock {...iconProps} color="var(--color-warning-500)" />;
    case 'skipped':
      return <IconPlayerSkipForward {...iconProps} color="var(--color-gray-500)" />;
    case 'cancelled':
      return <IconBan {...iconProps} color="var(--color-gray-600)" />;
    default:
      return <IconClock {...iconProps} color="var(--color-gray-400)" />;
  }
};

interface CanvasNodeProps {
  node: TraceNodeResponse;
  x: number;
  y: number;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Canvas Node Component
 */
const CanvasNode: FC<CanvasNodeProps> = ({ node, x, y, isSelected, onClick }) => {
  return (
    <div
      className={`${classes.flowNode} ${isSelected ? classes.flowNodeSelected : ''}`}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <Group gap="xs" wrap="nowrap" className={classes.nodeContent}>
        <Box
          className={classes.statusIndicator}
          style={{ backgroundColor: getStatusColor(node.status) }}
        />
        <Group gap={4} wrap="nowrap">
          {getNodeTypeIcon(node.type)}
          <Text size="xs" fw={500} className={classes.nodeLabel} truncate>
            {node.name}
          </Text>
        </Group>
        <Group gap={4} wrap="nowrap" ml="auto">
          {node.duration !== undefined && (
            <Text size="xs" c="dimmed">
              {node.duration.toFixed(2)}s
            </Text>
          )}
          {getStatusIcon(node.status)}
        </Group>
      </Group>
    </div>
  );
};

interface TracingCanvasViewProps {
  /** Width of the canvas */
  width?: string | number;
  /** Height of the canvas */
  height?: string | number;
}

interface NodePosition {
  node: TraceNodeResponse;
  x: number;
  y: number;
}

export const TracingCanvasView: FC<TracingCanvasViewProps> = ({
  width = '100%',
  height = '100%',
}) => {
  const {
    selectedTrace,
    selectedNode,
    selectNode,
    layoutDirection,
    setLayoutDirection,
    zoomLevel,
    setZoomLevel,
  } = useTracing();

  const [pan, setPan] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const isHorizontal = layoutDirection === 'horizontal';

  /**
   * Calculate node positions
   */
  const nodePositions = useMemo((): NodePosition[] => {
    if (!selectedTrace?.nodes) return [];

    const positions: NodePosition[] = [];
    const nodeWidth = 200;
    const nodeHeight = 50;
    const horizontalGap = 80;
    const verticalGap = 100;

    const calculatePositions = (
      nodes: TraceNodeResponse[],
      startX: number,
      startY: number,
      depth: number
    ): void => {
      nodes.forEach((node, index) => {
        const x = isHorizontal
          ? startX + depth * (nodeWidth + horizontalGap)
          : startX + index * (nodeWidth + horizontalGap);
        const y = isHorizontal
          ? startY + index * (nodeHeight + verticalGap)
          : startY + depth * (nodeHeight + verticalGap);

        positions.push({ node, x, y });

        if (node.nodes && node.nodes.length > 0) {
          calculatePositions(
            node.nodes,
            isHorizontal ? x : x + 20,
            isHorizontal ? y + 20 : y,
            depth + 1
          );
        }
      });
    };

    calculatePositions(selectedTrace.nodes, 100, 100, 0);
    return positions;
  }, [selectedTrace, isHorizontal]);

  /**
   * Handle mouse events for panning
   */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  /**
   * Handle wheel for zoom
   */
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoomLevel(Math.max(0.1, Math.min(2, zoomLevel + delta)));
  }, [zoomLevel, setZoomLevel]);

  /**
   * Toggle layout direction
   */
  const toggleLayout = () => {
    setLayoutDirection(isHorizontal ? 'vertical' : 'horizontal');
  };

  /**
   * Zoom controls
   */
  const zoomIn = () => setZoomLevel(Math.min(2, zoomLevel + 0.2));
  const zoomOut = () => setZoomLevel(Math.max(0.1, zoomLevel - 0.2));
  const resetZoom = () => {
    setZoomLevel(1);
    setPan({ x: 50, y: 50 });
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
        <Tooltip label={isHorizontal ? 'Vertikal' : 'Horizontal'}>
          <ActionIcon variant="subtle" size="sm" onClick={toggleLayout}>
            {isHorizontal ? <IconLayoutRows size={16} /> : <IconLayoutColumns size={16} />}
          </ActionIcon>
        </Tooltip>

        <ActionIcon variant="subtle" size="sm" onClick={zoomOut}>
          <IconZoomOut size={16} />
        </ActionIcon>

        <Text size="xs" c="dimmed" style={{ minWidth: 45, textAlign: 'center' }}>
          {Math.round(zoomLevel * 100)}%
        </Text>

        <ActionIcon variant="subtle" size="sm" onClick={zoomIn}>
          <IconZoomIn size={16} />
        </ActionIcon>

        <ActionIcon variant="subtle" size="sm" onClick={resetZoom}>
          <IconZoomReset size={16} />
        </ActionIcon>
      </Group>

      {/* Canvas */}
      <Box
        ref={containerRef}
        className={classes.canvas}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <Box
          className={classes.canvasContent}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})`,
            transformOrigin: '0 0',
          }}
        >
          {/* SVG for connections */}
          <svg className={classes.connectionsSvg}>
            {/* Define arrow markers */}
            <defs>
              <marker
                id="arrowhead-primary"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#42a5f5" />
              </marker>
              <marker
                id="arrowhead-secondary"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#9e9e9e" />
              </marker>
            </defs>

            {/* Sequential connections between root nodes */}
            {selectedTrace?.nodes && selectedTrace.nodes.length > 1 && 
              selectedTrace.nodes.slice(0, -1).map((node, index) => {
                const currentPos = nodePositions.find((p) => p.node.id === node.id);
                const nextNode = selectedTrace.nodes[index + 1];
                const nextPos = nodePositions.find((p) => p.node.id === nextNode.id);
                if (!currentPos || !nextPos) return null;
                
                // Calculate direction and endpoint at node edge (not center)
                // Node dimensions: 200px wide, 50px high (centered at position)
                const nodeHalfWidth = 100;
                const nodeHalfHeight = 25;
                const arrowPadding = 8; // Extra padding for arrow visibility
                
                const dx = nextPos.x - currentPos.x;
                const dy = nextPos.y - currentPos.y;
                
                // Determine start and end points at node edges
                let startX = currentPos.x;
                let startY = currentPos.y;
                let endX = nextPos.x;
                let endY = nextPos.y;
                
                if (Math.abs(dx) > Math.abs(dy)) {
                  // Primarily horizontal connection
                  if (dx > 0) {
                    startX = currentPos.x + nodeHalfWidth;
                    endX = nextPos.x - nodeHalfWidth - arrowPadding;
                  } else {
                    startX = currentPos.x - nodeHalfWidth;
                    endX = nextPos.x + nodeHalfWidth + arrowPadding;
                  }
                } else {
                  // Primarily vertical connection
                  if (dy > 0) {
                    startY = currentPos.y + nodeHalfHeight;
                    endY = nextPos.y - nodeHalfHeight - arrowPadding;
                  } else {
                    startY = currentPos.y - nodeHalfHeight;
                    endY = nextPos.y + nodeHalfHeight + arrowPadding;
                  }
                }
                
                return (
                  <line
                    key={`seq-${node.id}-${nextNode.id}`}
                    x1={startX}
                    y1={startY}
                    x2={endX}
                    y2={endY}
                    stroke="#42a5f5"
                    strokeWidth={2}
                    markerEnd="url(#arrowhead-primary)"
                  />
                );
              })
            }

            {/* Parent-to-child connections with curved paths and labels */}
            {nodePositions.map(({ node, x, y }) => {
              if (!node.nodes || node.nodes.length === 0) return null;
              
              return node.nodes.map((child, childIndex) => {
                const childPos = nodePositions.find((p) => p.node.id === child.id);
                if (!childPos) return null;
                
                // Node dimensions: 200px wide, 50px high (centered at position)
                const nodeHalfWidth = 100;
                const nodeHalfHeight = 25;
                const arrowPadding = 6;
                
                const dx = childPos.x - x;
                const dy = childPos.y - y;
                
                // Calculate start and end at node edges
                let startX = x;
                let startY = y;
                let endX = childPos.x;
                let endY = childPos.y;
                
                if (Math.abs(dx) > Math.abs(dy)) {
                  // Primarily horizontal
                  if (dx > 0) {
                    startX = x + nodeHalfWidth;
                    endX = childPos.x - nodeHalfWidth - arrowPadding;
                  } else {
                    startX = x - nodeHalfWidth;
                    endX = childPos.x + nodeHalfWidth + arrowPadding;
                  }
                } else {
                  // Primarily vertical
                  if (dy > 0) {
                    startY = y + nodeHalfHeight;
                    endY = childPos.y - nodeHalfHeight - arrowPadding;
                  } else {
                    startY = y - nodeHalfHeight;
                    endY = childPos.y + nodeHalfHeight + arrowPadding;
                  }
                }
                
                // Calculate midpoint for label
                const midX = (startX + endX) / 2;
                const midY = (startY + endY) / 2;
                
                // Create bezier curve from edge to edge
                const isVertical = Math.abs(dy) > Math.abs(dx);
                const controlOffset = 30;
                
                let path: string;
                if (isVertical) {
                  const cpY = startY + (dy > 0 ? controlOffset : -controlOffset);
                  path = `M ${startX} ${startY} Q ${startX} ${cpY}, ${midX} ${midY} T ${endX} ${endY}`;
                } else {
                  const cpX = startX + (dx > 0 ? controlOffset : -controlOffset);
                  path = `M ${startX} ${startY} Q ${cpX} ${startY}, ${midX} ${midY} T ${endX} ${endY}`;
                }
                
                return (
                  <g key={`${node.id}-${child.id}`}>
                    {/* Curved path with arrow */}
                    <path
                      d={path}
                      fill="none"
                      stroke="#9e9e9e"
                      strokeWidth={1.5}
                      markerEnd="url(#arrowhead-secondary)"
                    />
                    {/* Index label in circle */}
                    <circle
                      cx={midX}
                      cy={midY}
                      r={10}
                      fill="#ffffff"
                      stroke="#9e9e9e"
                      strokeWidth={1}
                    />
                    <text
                      x={midX}
                      y={midY}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={10}
                      fontWeight={600}
                      fill="#757575"
                    >
                      {childIndex + 1}
                    </text>
                  </g>
                );
              });
            })}
          </svg>

          {/* Render nodes */}
          {nodePositions.map(({ node, x, y }) => (
            <CanvasNode
              key={node.id}
              node={node}
              x={x}
              y={y}
              isSelected={selectedNode?.id === node.id}
              onClick={() => selectNode(node.id)}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default TracingCanvasView;
