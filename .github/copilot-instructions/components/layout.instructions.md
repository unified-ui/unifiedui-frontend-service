# Layout Components

## Composition Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│ MainLayout (.layout)                                    │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Header (.header)                  height: 70px      │ │
│ ├───────┬─────────────────────────────────────────────┤ │
│ │       │                                             │ │
│ │ Side  │  <main> (.content)                          │ │
│ │ bar   │  margin-top: 70px                           │ │
│ │       │  margin-left: 100px                         │ │
│ │ 100px │  height: calc(100vh - 70px)                 │ │
│ │       │  overflow: hidden                           │ │
│ │       │                                             │ │
│ │       │  ┌───────────────────────────────────┐      │ │
│ │       │  │ PageContainer (max-width: 1200px) │      │ │
│ │       │  │ height: 100%, overflow: hidden    │      │ │
│ │       │  │                                   │      │ │
│ │       │  │ Children handle their own scroll  │      │ │
│ │       │  └───────────────────────────────────┘      │ │
│ │       │                                             │ │
│ └───────┴─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Key Rule: `overflow: hidden` Chain

The layout chain (MainLayout → `.content` → PageContainer) keeps `overflow: hidden` at every level. **Page content must create its own scroll container** (e.g., DataTable's `.scrollArea` or the `tabPanelScrollArea` pattern).

---

## MainLayout

**File**: `src/components/layout/MainLayout/`

| Prop | Type | Default | Purpose |
|------|------|---------|---------|
| `children` | `ReactNode` | — | Page content |
| `noPadding` | `boolean` | `false` | Remove default `var(--spacing-xl)` padding from content area |

### CSS Classes

| Class | Rules |
|-------|-------|
| `.layout` | `width: 100vw`, `height: 100vh`, `display: flex`, `flex-direction: column`, `overflow: hidden` |
| `.content` | `margin-top: 70px`, `margin-left: 100px`, `height: calc(100vh - 70px)`, `overflow: hidden`, `display: flex`, `flex-direction: column`, `padding: var(--spacing-xl)` |
| `.noPadding` | Removes padding from `.content` |

### Mobile Breakpoint (`@576px`)

- Sidebar narrows to `60px`
- Content `margin-left: 60px`
- Padding shrinks to `var(--spacing-md)`

---

## Header

**File**: `src/components/layout/Header/` (~213 lines)

Fixed top bar (`height: 70px`, `z-index: var(--z-sticky)`).

**Contains**: Logo, search icon, notification icon, theme toggle (sun/moon), user avatar dropdown with tenant selector.

**Click-outside**: Uses `useRef` + `mousedown` listener, explicitly excludes Mantine portal elements (`[data-portal]`).

---

## Sidebar

**File**: `src/components/layout/Sidebar/` (~585 lines)

Fixed left rail (`width: 100px`, `top: 70px`, `z-index: var(--z-dropdown)`).

### Navigation Structure

```
Top section:
  Home (Dashboard)
  Conversations (has data list)
  Chat Agents / Applications (has data list)
  Autonomous Agents (has data list)
  Traces
─── divider ───
Bottom section:
  ReACT-Agent Development (has data list)
  Chat Widgets (has data list)
─── spacer ───
  Settings (Tenant Settings)
```

### Key Interfaces

```typescript
interface NavItem {
  icon: TablerIcon;
  iconFilled?: TablerIcon;
  label: string;
  path: string;
  hasDataList?: boolean;
  entityType?: string;
}

interface EntityConfig {
  title: string;
  icon: TablerIcon;
  addButtonLabel: string;
  fetchData: () => Promise<Entity[]>;
  getLink: (id: string) => string;
}
```

### Data List Panel

When clicking a nav item with `hasDataList: true`, an expandable `SidebarDataList` slides out showing entity items with search. State is persisted to `localStorage` via `SIDEBAR_EXPAND_KEY`.

### Active Indicator

Active nav item gets a blue left border (`border-left: 4px solid var(--color-primary-500)`) and bold label.

---

## PageContainer

**File**: `src/components/common/PageContainer/`

Width-constrained wrapper using Mantine `<Container>`.

| Prop | Type | Default | Purpose |
|------|------|---------|---------|
| `children` | `ReactNode` | — | Page content |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'lg'` | Max width |

### Size Map

| Size | Max Width |
|------|-----------|
| sm | 800px |
| md | 1000px |
| lg | 1200px |
| xl | 1400px |

### CSS

```css
.container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
```

---

## GlobalChatSidebar

**File**: `src/components/layout/GlobalChatSidebar/` (~143 lines)

Right-side hover panel for recent conversations. Controlled via `ChatSidebarContext`. Appears on hover, auto-hides on mouse leave.
