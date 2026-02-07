# Tracing Components

## Overview

The tracing system visualizes AI agent execution traces as interactive node graphs. Components live in `src/components/tracing/`.

---

## Architecture

```
TracingVisualDialog (Modal, full-screen)
└── TracingProvider (TracingContext)
    ├── TracingSubHeader (floating overlay: trace info, status, timing)
    └── Body (resizable panels)
        ├── TracingHierarchyView   (left, 15–40%, tree nav)
        │   └── Data panels (Logs, Input, Output, Metadata)
        ├── Vertical drag handle
        ├── TracingCanvasView      (center, ReactFlow graph)
        ├── Horizontal drag handle
        └── TracingDataSection     (bottom, 20–70%, logs + I/O tabs)

TracingSidebar (embedded in conversation pages)
└── TracingHierarchyView (compact variant, tree + data panels)
```

---

## TracingContext

**File**: `TracingContext.tsx` (~355 lines)

Central state for all tracing components.

### State Shape

| Field | Type | Purpose |
|-------|------|---------|
| `traces` | `FullTraceResponse[]` | All available traces |
| `selectedTrace` | `FullTraceResponse \| null` | Currently viewed trace |
| `selectedNode` | `TraceNodeResponse \| null` | Selected node in graph/tree |
| `layoutDirection` | `'horizontal' \| 'vertical'` | Canvas layout (persisted localStorage) |
| `hierarchyCollapsed` | `Set<string>` | Collapsed node IDs in tree view |
| `canvasCollapsed` | `Set<string>` | Collapsed node IDs in canvas |
| `hierarchyVisible` | `boolean` | Tree sidebar visibility (persisted localStorage) |

### Key Actions

| Action | Purpose |
|--------|---------|
| `selectTrace(id)` | Switch active trace |
| `selectNode(node)` | Highlight node in both views |
| `toggleHierarchyCollapse(id)` | Expand/collapse tree node |
| `toggleCanvasCollapse(id)` | Expand/collapse canvas node |
| `setLayoutDirection(dir)` | Switch horizontal/vertical layout |
| `centerOnNode(id)` | Pan canvas to specific node |
| `findNodeForMessage(messageId)` | Find trace node matching a chat message |
| `selectNodeByExtMessageId(id)` | Bidirectional message-trace linking |

### Provider Props

| Prop | Purpose |
|------|---------|
| `traces` | Trace data array |
| `initialTraceId` | Pre-select a trace on mount |
| `initialNodeReferenceId` | Pre-select a node by reference ID |
| `onNodeReferenceIdChange` | Callback when selected node changes (for message highlighting) |

---

## TracingVisualDialog

**File**: `TracingVisualDialog/` (~244 lines)

Full-screen `<Modal>` containing all tracing views.

### Resizable Panels

Two drag handles for panel resizing:

- **Horizontal handle**: Between canvas and data section (30–80% range, default 75% canvas)
- **Vertical handle**: Between hierarchy and canvas (15–40% range, default 20% hierarchy)

Implementation uses `mousedown` → `mousemove` → `mouseup` on `document`.

---

## TracingCanvasView

**File**: `TracingCanvasView/` (~967 lines)

Interactive flow graph built with `@xyflow/react` and `dagre` layout.

### Features

- **Dagre auto-layout**: Supports horizontal (LR) and vertical (TB) directions
- **Custom nodes**: Show icon + name + status badge, collapse/expand sub-trees
- **Custom edges**: Smooth step paths with animated status indicators
- **Controls**: Zoom, pan, fit view, minimap
- **Selection sync**: Clicking a node updates `selectedNode` in context

### Node Type Icons

| Node Type | Icon |
|-----------|------|
| `llm` | IconBrain |
| `tool` | IconTool |
| `agent` | IconRobot |
| `chain` | IconLink |
| `workflow` | IconArrowsShuffle |
| `custom` | IconBox |
| `other` | IconCircle |

### Status Icons

| Status | Icon | Color |
|--------|------|-------|
| `completed` | IconCheck | green |
| `failed` | IconX | red |
| `running` | IconLoader (animated) | yellow |
| `pending` | IconClock | gray |
| `cancelled` | IconPlayerStop | orange |

---

## TracingHierarchyView

**File**: `TracingHierarchyView/` (~780 lines)

VSCode-style tree with curved connection lines and collapsible data panels.

### Variants

| Variant | Usage |
|---------|-------|
| `full` | In TracingVisualDialog (left panel) |
| `compact` | In TracingSidebar (embedded in pages) |

### Data Panels

VS Code-style resizable panels at the bottom of the tree:

| Panel | Content |
|-------|---------|
| Logs | Trace log entries |
| Input | Selected node's input data |
| Output | Selected node's output data |
| Metadata | Node metadata (reference IDs, timing, etc.) |

Each panel has its own expand/collapse toggle and resize handle.

**Constants**: `PANEL_HEADER_HEIGHT=28px`, `PANEL_MIN_HEIGHT=80px`, `PANEL_DEFAULT_HEIGHT=150px`, `TREE_MIN_HEIGHT=100px`

### Node Type Badge Colors

Helper function `getTypeBadgeColor(type)` maps node types to Mantine badge colors (llm→blue, tool→orange, agent→violet, etc.).

---

## TracingDataSection

**File**: `TracingDataSection/` (~348 lines)

Bottom panel in the dialog showing detailed node data.

### Layout

```
┌────────────┬──────────────────────────────┐
│   Logs     │  Tabs: Input/Output | Meta   │
│   (1/4)    │  (3/4, resizable divider)    │
│            │                              │
└────────────┴──────────────────────────────┘
```

### JsonViewer (inner component)

Collapsible JSON renderer:
- Auto-expands payloads ≤ 5 lines
- Shows line count badge
- Toggleable expand/collapse all

---

## TracingSidebar

**File**: `TracingSidebar/` (~42 lines)

Thin wrapper: renders `<TracingHierarchyView variant="compact" showHeader showDataPanels />`.

Props: `onOpenFullscreen?: () => void`

---

## TracingSubHeader

**File**: `TracingSubHeader/` (~161 lines)

Floating info bar inside the canvas showing: trace selector dropdown, status icon, timing info, node counts, layout toggle, hierarchy toggle.
