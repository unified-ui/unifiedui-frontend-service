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
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
} from '@xyflow/react';
import type { Node, Edge, ReactFlowInstance, EdgeProps } from '@xyflow/react';
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
  IconPlus,
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
  // Collapse functionality
  hasChildren?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const TraceCustomNode: FC<{ data: TraceNodeData }> = ({ data }) => {
  const { 
    label, type, status, isFirst, isLast, isSelected, onClick,
    sourcePosition = Position.Right,
    targetPosition = Position.Left,
    hasChildren = false,
    isCollapsed = false,
    onToggleCollapse,
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

  const handleCollapseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleCollapse?.();
  };

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
      
      {/* Collapse/Expand button - shown when node has children */}
      {hasChildren && (
        <div 
          className={classes.collapseButton}
          onClick={handleCollapseClick}
          style={{
            // Position based on source handle direction
            ...(sourcePosition === Position.Right && { right: -30, top: '50%', transform: 'translateY(-50%)' }),
            ...(sourcePosition === Position.Bottom && { bottom: -30, left: '50%', transform: 'translateX(-50%)' }),
            ...(sourcePosition === Position.Left && { left: -30, top: '50%', transform: 'translateY(-50%)' }),
            ...(sourcePosition === Position.Top && { top: -30, left: '50%', transform: 'translateX(-50%)' }),
          }}
        >
          {isCollapsed ? <IconPlus size={14} /> : <IconMinus size={14} />}
        </div>
      )}
    </>
  );
};

// Invisible node - renders only handles (no visual content)
const InvisibleNode: FC<{ data: { sourcePosition?: Position; targetPosition?: Position } }> = ({ data }) => {
  const { sourcePosition = Position.Right, targetPosition = Position.Left } = data;
  return (
    <>
      <Handle type="target" position={targetPosition} style={{ opacity: 0 }} />
      <Handle type="source" position={sourcePosition} style={{ opacity: 0 }} />
    </>
  );
};

const nodeTypes = {
  traceNode: TraceCustomNode,
  invisibleNode: InvisibleNode,
};

// ============================================================================
// CUSTOM EDGE WITH COLLAPSE BUTTON
// ============================================================================

interface CollapsibleEdgeData {
  hasChildren: boolean;
  isCollapsed: boolean;
  sourceNodeId: string;
  onToggleCollapse: (nodeId: string) => void;
}

const CollapsibleEdge: FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  data,
}) => {
  const edgeData = data as CollapsibleEdgeData | undefined;
  const hasChildren = edgeData?.hasChildren ?? false;
  const isCollapsed = edgeData?.isCollapsed ?? false;
  const sourceNodeId = edgeData?.sourceNodeId ?? '';
  const onToggleCollapse = edgeData?.onToggleCollapse;

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleCollapse && sourceNodeId) {
      onToggleCollapse(sourceNodeId);
    }
  };

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
      {hasChildren && (
        <EdgeLabelRenderer>
          <div
            className={classes.edgeButton}
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            onClick={handleClick}
          >
            {isCollapsed ? (
              <IconPlus size={14} />
            ) : (
              <IconMinus size={14} />
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

// ============================================================================
// INDEXED EDGE - Edge mit Index-Badge am Target-Ende
// ============================================================================

interface IndexedEdgeData {
  localIndex: number;
  edgeColor: string;
  depth: number;
  isSelected?: boolean;
}

const IndexedEdge: FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  data,
}) => {
  const edgeData = data as IndexedEdgeData | undefined;
  const localIndex = edgeData?.localIndex ?? 0;
  const edgeColor = edgeData?.edgeColor ?? '#666';
  const isSelected = edgeData?.isSelected ?? false;
  
  // Bei Selektion: Blau verwenden
  const displayColor = isSelected ? '#1e88e5' : edgeColor;

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Position für Index-Badge: Fester Offset vom Target, basierend auf Eingangsrichtung
  // SmoothStep-Pfade haben gestufte Wege, daher nicht lineare Interpolation verwenden!
  // Stattdessen: Offset vom Target in Richtung, aus der der Pfeil kommt
  const BADGE_OFFSET = 24; // Abstand vom Target-Punkt (vor dem Pfeil)
  
  let badgeX = targetX;
  let badgeY = targetY;
  
  // Offset basierend auf targetPosition (wohin der Pfeil zeigt)
  switch (targetPosition) {
    case Position.Left:
      // Pfeil kommt von links → Badge links vom Target
      badgeX = targetX - BADGE_OFFSET;
      break;
    case Position.Right:
      // Pfeil kommt von rechts → Badge rechts vom Target
      badgeX = targetX + BADGE_OFFSET;
      break;
    case Position.Top:
      // Pfeil kommt von oben → Badge über dem Target
      badgeY = targetY - BADGE_OFFSET;
      break;
    case Position.Bottom:
      // Pfeil kommt von unten → Badge unter dem Target
      badgeY = targetY + BADGE_OFFSET;
      break;
  }

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
      <EdgeLabelRenderer>
        <div
          className={classes.edgeIndexBadge}
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${badgeX}px, ${badgeY}px)`,
            color: displayColor,
            pointerEvents: 'none',
          }}
        >
          {localIndex + 1}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

const edgeTypes = {
  collapsible: CollapsibleEdge,
  indexedEdge: IndexedEdge,
};

// ============================================================================
// COLUMN-BASED LAYOUT ALGORITHM (Spaltenbasiert)
// ============================================================================
// 
// Grundprinzip:
// - Das Canvas wird als TABELLE betrachtet
// - Spalten (columns) = horizontale Stufen (Root-Nodes N1, N2, N3 definieren Spalte 0, 1, 2)
// - Zeilen (rows) = vertikale Positionen (lückenlos gefüllt)
// - Row 0 ist AUSSCHLIESSLICH für Root-Nodes reserviert
// - SubNodes beginnen ab Row 1 (NIEMALS Row 0)
// - SubNodes dürfen NIE höher als ihr Parent sein (row >= parent.row)
// 
// Sortierung pro Spalte:
// 1. isRoot = true ZUERST (alle Root-Nodes kommen vor SubNodes)
// 2. parent.row ASC (SubNodes nach Y-Position des Parents)
// 3. localIndex ASC (Geschwister-Reihenfolge)
// ============================================================================

interface LayoutResult {
  nodes: Node[];
  edges: Edge[];
}

// Layout constants
// Node-Größe: 120px breit, 80px hoch

// Horizontal Layout: Spalten → X, Zeilen → Y
const H_COL_GAP = 250;   // Abstand zwischen Spalten (X-Richtung) - muss > 120px (NODE_WIDTH) sein
const H_ROW_GAP = 120;   // Abstand zwischen Zeilen (Y-Richtung) - muss > 80px (NODE_HEIGHT) sein

// Vertical Layout: Zeilen → X, Spalten → Y
const V_ROW_GAP = 200;   // Abstand zwischen Rows (X-Richtung) - muss > 120px (NODE_WIDTH) sein
const V_COL_GAP = 140;   // Abstand zwischen Spalten (Y-Richtung) - muss > 80px (NODE_HEIGHT) sein

// LayoutNode - Erweiterte Node-Struktur für Layout-Berechnung
interface LayoutNode {
  id: string;
  column: number;        // Spalte (0 = erste Root-Spalte)
  row: number;           // Zeile (0 = Root-Zeile, 1+ = SubNode-Zeilen)
  x: number;             // Berechnete X-Koordinate
  y: number;             // Berechnete Y-Koordinate
  parentId: string | null;
  localIndex: number;    // Index unter Geschwistern
  depth: number;         // Hierarchie-Tiefe (0 = Root, 1 = erste SubNode-Ebene, etc.)
  isRoot: boolean;       // Ist dies ein Root-Node?
  hasChildren: boolean;
  isCollapsed: boolean;
  originalNode: TraceNodeResponseLike;
}

// Farbpalette für SubNode-Ebenen (Depth 1-10+)
const DEPTH_COLORS = [
  '#42a5f5', // Depth 0: Root-Chain (blau) - wird separat behandelt
  '#66bb6a', // Depth 1: Grün
  '#ab47bc', // Depth 2: Lila
  '#ff7043', // Depth 3: Orange
  '#26a69a', // Depth 4: Teal
  '#ec407a', // Depth 5: Pink
  '#7e57c2', // Depth 6: Deep Purple
  '#5c6bc0', // Depth 7: Indigo
  '#29b6f6', // Depth 8: Light Blue
  '#9ccc65', // Depth 9: Light Green
  '#ffca28', // Depth 10+: Amber
];

const getDepthColor = (depth: number): string => {
  if (depth <= 0) return DEPTH_COLORS[0];
  if (depth >= DEPTH_COLORS.length) return DEPTH_COLORS[DEPTH_COLORS.length - 1];
  return DEPTH_COLORS[depth];
};

// Type for trace node (simplified for layout)
interface TraceNodeResponseLike {
  id: string;
  name: string;
  type: string;
  status: string;
  nodes?: TraceNodeResponseLike[];
}

/**
 * Hauptfunktion: Erstellt spaltenbasiertes Layout
 */
const createColumnBasedLayout = (
  trace: FullTraceResponse,
  direction: 'horizontal' | 'vertical',
  selectedNodeId: string | null,
  onNodeClick: (nodeId: string) => void,
  collapsedNodes: Set<string>,
  onToggleCollapse: (nodeId: string) => void
): LayoutResult => {
  const isHorizontal = direction === 'horizontal';
  
  // Handle positions based on direction
  const sourcePos = isHorizontal ? Position.Right : Position.Bottom;
  const targetPos = isHorizontal ? Position.Left : Position.Top;

  // ========================================================================
  // SCHRITT 1: Flache Liste aller sichtbaren Nodes erstellen
  // ========================================================================
  const flatNodes: LayoutNode[] = [];
  const nodeMap = new Map<string, LayoutNode>();
  
  // Set zur Überprüfung, ob ein Node sichtbar ist (nicht durch collapsed Parent versteckt)
  const visibleNodeIds = new Set<string>();
  
  // Rekursive Funktion zum Sammeln aller Nodes
  const collectNodes = (
    node: TraceNodeResponseLike,
    parentId: string | null,
    column: number,
    localIndex: number,
    depth: number,       // Hierarchie-Tiefe
    isVisible: boolean
  ): void => {
    const hasChildren = node.nodes && node.nodes.length > 0;
    const isCollapsed = collapsedNodes.has(node.id);
    const isRoot = parentId === null;
    
    // Node ist sichtbar wenn:
    // - Es ein Root-Node ist, ODER
    // - Sein Parent sichtbar ist UND Parent nicht collapsed ist
    if (isVisible) {
      visibleNodeIds.add(node.id);
    }
    
    const layoutNode: LayoutNode = {
      id: node.id,
      column,
      row: -1,  // Wird später berechnet
      x: 0,
      y: 0,
      parentId,
      localIndex,
      depth,
      isRoot,
      hasChildren: hasChildren || false,
      isCollapsed,
      originalNode: node,
    };
    
    flatNodes.push(layoutNode);
    nodeMap.set(node.id, layoutNode);
    
    // Rekursiv Kinder verarbeiten
    if (hasChildren) {
      node.nodes!.forEach((childNode, childIndex) => {
        // Kind ist sichtbar wenn Parent sichtbar UND Parent nicht collapsed
        const childVisible = isVisible && !isCollapsed;
        collectNodes(childNode, node.id, column + 1, childIndex, depth + 1, childVisible);
      });
    }
  };
  
  // Root-Nodes sammeln (column = rootIndex, localIndex = rootIndex, depth = 0)
  trace.nodes.forEach((rootNode, rootIndex) => {
    collectNodes(rootNode, null, rootIndex, rootIndex, 0, true);
  });
  
  // Nur sichtbare Nodes für Layout verwenden
  const visibleNodes = flatNodes.filter(n => visibleNodeIds.has(n.id));
  
  // ========================================================================
  // SCHRITT 2: Nodes nach Spalten gruppieren
  // ========================================================================
  const columnGroups = new Map<number, LayoutNode[]>();
  
  for (const node of visibleNodes) {
    if (!columnGroups.has(node.column)) {
      columnGroups.set(node.column, []);
    }
    columnGroups.get(node.column)!.push(node);
  }
  
  // ========================================================================
  // SCHRITT 3 + 4 KOMBINIERT: Spaltenweise Sortierung + Row-Zuweisung
  // ========================================================================
  // WICHTIG: Wir müssen Spalte für Spalte vorgehen!
  // - Erst Spalte 0 sortieren + Rows zuweisen
  // - DANN Spalte 1 sortieren (jetzt kennen wir parent.row!) + Rows zuweisen
  // - DANN Spalte 2, usw.
  //
  // Sortierregel pro Spalte:
  // 1. isRoot = true ZUERST (Root-Nodes vor SubNodes)
  // 2. parent.row ASC (SubNodes nach Y-Position des Parents)
  // 3. localIndex ASC (Geschwister-Reihenfolge)
  //
  // Row-Zuweisung:
  // - Root-Nodes: IMMER Row 0
  // - SubNodes: row = MAX(nextAvailableRow, parent.row) - Kein Hochrutschen!
  
  const sortedColumns = Array.from(columnGroups.keys()).sort((a, b) => a - b);
  
  for (const col of sortedColumns) {
    const nodesInColumn = columnGroups.get(col)!;
    
    // --- SORTIERUNG (parent.row ist jetzt bekannt aus vorheriger Spalte!) ---
    nodesInColumn.sort((a, b) => {
      // Regel 1: Root-Nodes zuerst
      if (a.isRoot && !b.isRoot) return -1;
      if (!a.isRoot && b.isRoot) return 1;
      
      // Beide sind Root-Nodes → nach localIndex
      if (a.isRoot && b.isRoot) {
        return a.localIndex - b.localIndex;
      }
      
      // Beide sind SubNodes → nach parent.row, dann localIndex
      const parentA = a.parentId ? nodeMap.get(a.parentId) : null;
      const parentB = b.parentId ? nodeMap.get(b.parentId) : null;
      
      const parentRowA = parentA?.row ?? 0;
      const parentRowB = parentB?.row ?? 0;
      
      if (parentRowA !== parentRowB) {
        return parentRowA - parentRowB;
      }
      
      return a.localIndex - b.localIndex;
    });
    
    // --- ROW-ZUWEISUNG (direkt nach Sortierung dieser Spalte!) ---
    let nextAvailableRow = 0;
    
    for (const node of nodesInColumn) {
      if (node.isRoot) {
        // Root-Nodes bekommen IMMER Row 0
        node.row = 0;
        nextAvailableRow = 1; // SubNodes starten ab Row 1
      } else {
        // SubNode: Minimum ist parent.row (Kein Hochrutschen!)
        const parent = node.parentId ? nodeMap.get(node.parentId) : null;
        const minRow = parent ? parent.row : 1;
        
        // Row = MAX(nächste verfügbare Row, parent.row)
        node.row = Math.max(nextAvailableRow, minRow);
        nextAvailableRow = node.row + 1;
      }
    }
  }
  
  // ========================================================================
  // SCHRITT 5: Koordinaten berechnen
  // ========================================================================
  for (const node of visibleNodes) {
    if (isHorizontal) {
      // Horizontal: Spalten → X-Achse, Zeilen → Y-Achse
      node.x = node.column * H_COL_GAP;
      node.y = node.row * H_ROW_GAP;
    } else {
      // Vertikal: Zeilen → X-Achse, Spalten → Y-Achse
      // WICHTIG: Nodes sind breiter als hoch (120x80), daher mehr X-Abstand nötig!
      node.x = node.row * V_ROW_GAP;
      node.y = node.column * V_COL_GAP;
    }
  }
  
  // ========================================================================
  // SCHRITT 6: ReactFlow Nodes erstellen
  // ========================================================================
  const nodes: Node[] = visibleNodes.map((layoutNode, _idx, allNodes) => {
    const { id, x, y, isRoot, hasChildren, isCollapsed, localIndex, originalNode } = layoutNode;
    const isSelected = selectedNodeId === id;
    
    // Bestimme isFirst und isLast für Root-Nodes
    const rootNodes = allNodes.filter(n => n.isRoot);
    const isFirst = isRoot && localIndex === 0;
    const isLast = isRoot && localIndex === rootNodes.length - 1;
    
    return {
      id,
      type: 'traceNode',
      position: { x, y },
      data: {
        label: originalNode.name,
        type: originalNode.type,
        status: originalNode.status,
        isFirst,
        isLast: isLast && !hasChildren,
        isSelected,
        onClick: () => onNodeClick(id),
        sourcePosition: sourcePos,
        targetPosition: targetPos,
        hasChildren,
        isCollapsed,
        onToggleCollapse: hasChildren ? () => onToggleCollapse(id) : undefined,
      },
      sourcePosition: sourcePos,
      targetPosition: targetPos,
    };
  });
  
  // ========================================================================
  // SCHRITT 7: Edges erstellen
  // ========================================================================
  const edges: Edge[] = [];
  const visibleNodeIdSet = new Set(visibleNodes.map(n => n.id));
  
  // Root-Chain: N1 → N2 → N3 (nur sichtbare)
  const visibleRoots = visibleNodes.filter(n => n.isRoot).sort((a, b) => a.localIndex - b.localIndex);
  for (let i = 0; i < visibleRoots.length - 1; i++) {
    const sourceNode = visibleRoots[i];
    const targetNode = visibleRoots[i + 1];
    
    edges.push({
      id: `root-${sourceNode.id}-${targetNode.id}`,
      source: sourceNode.id,
      target: targetNode.id,
      type: 'smoothstep',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#42a5f5', // Primary blue for root chain
      },
      style: {
        stroke: '#42a5f5',
        strokeWidth: 2,
      },
      animated: targetNode.originalNode.status === 'running',
    });
  }
  
  // Parent → Child Edges (nur für sichtbare Nodes)
  for (const node of visibleNodes) {
    if (node.parentId && visibleNodeIdSet.has(node.parentId)) {
      // Farbe basierend auf der Tiefe des CHILD-Nodes
      const edgeColor = getDepthColor(node.depth);
      
      edges.push({
        id: `${node.parentId}-${node.id}`,
        source: node.parentId,
        target: node.id,
        type: 'indexedEdge', // Custom edge type mit Index-Badge
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeColor,
        },
        style: {
          stroke: edgeColor,
          strokeWidth: 2,
        },
        animated: node.originalNode.status === 'running',
        data: { 
          depth: node.depth,
          localIndex: node.localIndex, // Index für Badge
          edgeColor, // Farbe für Badge
        },
      });
    }
  }
  
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
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [layoutVersion, setLayoutVersion] = useState(0); // Trigger für Layout-Neuberechnung
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // Toggle collapse state for a node
  // Bei EXPAND: Layout neu berechnen, bei COLLAPSE: Nur visuell ausblenden
  const handleToggleCollapse = useCallback((nodeId: string) => {
    setCollapsedNodes(prev => {
      const newSet = new Set(prev);
      const wasCollapsed = newSet.has(nodeId);
      
      if (wasCollapsed) {
        // EXPAND: Node wird eingeblendet → Layout neu berechnen
        newSet.delete(nodeId);
        setLayoutVersion(v => v + 1);
      } else {
        // COLLAPSE: Node wird ausgeblendet → NUR visuell, kein Re-Layout
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  // Calculate layout when trace, direction, layoutVersion changes
  // NICHT bei collapsedNodes-Änderung (nur visuell filtern)
  useEffect(() => {
    if (!selectedTrace) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const { nodes: layoutNodes, edges: layoutEdges } = createColumnBasedLayout(
      selectedTrace,
      layoutDirection,
      selectedNode?.id || null,
      (nodeId) => selectNode(nodeId),
      collapsedNodes,
      handleToggleCollapse
    );

    // Apply selected edge highlighting
    const highlightedEdges = layoutEdges.map(edge => {
      if (edge.id === selectedEdgeId) {
        return {
          ...edge,
          style: {
            ...edge.style,
            stroke: '#1e88e5', // Primary blue (same as root chain)
            strokeWidth: 4,    // Dicker
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#1e88e5',
            // Keine width/height → normale Pfeilgröße
          },
          data: {
            ...edge.data,
            isSelected: true, // Badge soll auch blau werden
          },
          zIndex: 1000, // Bring to front
        };
      }
      return edge;
    });

    setNodes(layoutNodes);
    setEdges(highlightedEdges);
  }, [selectedTrace, layoutDirection, selectedNode, selectNode, setNodes, setEdges, collapsedNodes, handleToggleCollapse, layoutVersion, selectedEdgeId]);

  // Fit view on load
  const onInit = useCallback((instance: ReactFlowInstance) => {
    setReactFlowInstance(instance);
    setTimeout(() => {
      instance.fitView({ padding: 0.1 });
    }, 100);
  }, []);

  // Handle "Adjust view" - Reset view AND trigger layout recalculation
  const handleAdjustView = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.1 });
    }
    setLayoutVersion(v => v + 1); // Layout neu berechnen
    resetCanvasView();
  }, [reactFlowInstance, resetCanvasView]);

  // Handle edge click - highlight selected edge
  const handleEdgeClick = useCallback((_event: React.MouseEvent, edge: Edge) => {
    setSelectedEdgeId(prev => prev === edge.id ? null : edge.id);
  }, []);

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
          <Tooltip label="Adjust view">
            <ActionIcon variant="light" onClick={handleAdjustView}>
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
        onEdgeClick={handleEdgeClick}
        onInit={onInit}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
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
