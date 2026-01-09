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
            {/* Sequential connections between root nodes */}
            {selectedTrace?.nodes && selectedTrace.nodes.length > 1 && 
              selectedTrace.nodes.slice(0, -1).map((node, index) => {
                const currentPos = nodePositions.find((p) => p.node.id === node.id);
                const nextNode = selectedTrace.nodes[index + 1];
                const nextPos = nodePositions.find((p) => p.node.id === nextNode.id);
                if (!currentPos || !nextPos) return null;
                return (
                  <line
                    key={`seq-${node.id}-${nextNode.id}`}
                    x1={currentPos.x}
                    y1={currentPos.y}
                    x2={nextPos.x}
                    y2={nextPos.y}
                    stroke="var(--color-primary-400)"
                    strokeWidth={2}
                  />
                );
              })
            }
            {/* Parent-to-child connections */}
            {nodePositions.map(({ node, x, y }) => {
              // Draw connections to children (sub-nodes)
              if (node.nodes && node.nodes.length > 0) {
                return node.nodes.map((child) => {
                  const childPos = nodePositions.find((p) => p.node.id === child.id);
                  if (!childPos) return null;
                  return (
                    <line
                      key={`${node.id}-${child.id}`}
                      x1={x}
                      y1={y}
                      x2={childPos.x}
                      y2={childPos.y}
                      stroke="var(--border-default)"
                      strokeWidth={1.5}
                    />
                  );
                });
              }
              return null;
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
