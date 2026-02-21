# Layout Components

## Composition Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│ MainLayout (.layout)                                    │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Header (.header)                  height: 56px      │ │
│ ├───────┬─────────────────────────────────────────────┤ │
│ │       │                                             │ │
│ │ Side  │  <main> (.content)                          │ │
│ │ bar   │  margin-top: var(--header-height) [56px]    │ │
│ │       │  margin-left: var(--sidebar-width) [80px]   │ │
│ │  80px │  height: calc(100vh - var(--header-height)) │ │
│ │       │  overflow: hidden                           │ │
│ │       │  padding: var(--content-padding-y/x)        │ │
│ │       │                                             │ │
│ │       │  Children handle their own scroll            │ │
│ │       │                                             │ │
│ └───────┴─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Key Rule: `overflow: hidden` Chain

The layout chain (MainLayout → `.content`) keeps `overflow: hidden`. **Page content must create its own scroll container** (e.g., DataTable's `.scrollArea` or the `tabPanelScrollArea` pattern).

### CSS Variables (defined in `src/styles/variables.css`)

| Variable | Value | Purpose |
|----------|-------|---------|
| `--header-height` | `56px` | Header fixed height |
| `--sidebar-width` | `80px` | Sidebar fixed width |
| `--sidebar-width-mobile` | `56px` | Sidebar width on mobile |
| `--content-padding-y` | `24px` | Content vertical padding |
| `--content-padding-x` | `32px` | Content horizontal padding |

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
| `.content` | `margin-top: var(--header-height)`, `margin-left: var(--sidebar-width)`, `height: calc(100vh - var(--header-height))`, `overflow: hidden`, `display: flex`, `flex-direction: column`, `padding: var(--content-padding-y) var(--content-padding-x)` |
| `.noPadding` | Removes padding from `.content` |

### Tablet Breakpoint (`@768px`)

- Sidebar narrows to `var(--sidebar-width-mobile)` (56px), labels hidden
- Content `margin-left: var(--sidebar-width-mobile)`
- Padding shrinks to `var(--spacing-md)`

---

## Header

**File**: `src/components/layout/Header/` (~213 lines)

Fixed top bar (`height: var(--header-height)` [56px], `z-index: var(--z-sticky)`).

**Contains**: Logo, search icon (opens CommandPalette `⌘K`), notification bell (opens NotificationPanel), theme toggle (sun/moon), user avatar dropdown with tenant selector.

**Click-outside**: Uses `useRef` + `mousedown` listener, explicitly excludes Mantine portal elements (`[data-portal]`).

---

## NotificationPanel

**File**: `src/components/layout/NotificationPanel/`

Right slide-out drawer (Mantine `Drawer`) displaying user notifications. Opened by clicking the notification bell in Header.

- Uses `NotificationsContext` for data + actions
- Shows unread count badge on the bell icon
- Supports mark-as-read, mark-all-read, delete

---

## Sidebar

**File**: `src/components/layout/Sidebar/` (~585 lines)

Fixed left rail (`width: var(--sidebar-width)` [80px], `top: var(--header-height)`, `z-index: var(--z-dropdown)`).

### Navigation Structure

```
Top section (mainNavItemsTop):
  Home (Dashboard)
  Chats / Conversations (data list, no entity type — special handling)
  Agents / Chat Agents (has data list, entityType: chat-agents)
  Auto / Autonomous Agents (has data list, entityType: autonomous-agents)
─── divider ───
Middle section (mainNavItemsBottom):
  ReACT / ReACT Agents (has data list, entityType: re-act-agents)
  Widgets / Chat Widgets (has data list, entityType: chat-widgets)
─── spacer ───
Bottom section (bottomNavItems):
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

### Favorites in Data Lists

`SidebarDataList` supports toggleable favorites via `onToggleFavorite` prop. Each item shows a star icon — filled for favorites, outline for non-favorites. Clicking the star toggles the favorite state (optimistic update via `FavoritesContext`). Favorites sort to the top within each data list.

The `ENTITY_TO_FAVORITE_TYPE` mapping in `Sidebar.tsx` maps entity types to `FavoriteResourceTypeEnum` values:

```typescript
{
  'chat-agents': FavoriteResourceTypeEnum.CHAT_AGENT,
  'autonomous-agents': FavoriteResourceTypeEnum.AUTONOMOUS_AGENT,
  'chat-widgets': FavoriteResourceTypeEnum.CHAT_WIDGET,
  conversations: FavoriteResourceTypeEnum.CONVERSATION,
  're-act-agents': FavoriteResourceTypeEnum.RE_ACT_AGENT,
}
```

### Conversations Data List

Conversations use `order_by=updated_at, order_direction=desc` (most recently used first). Other entity types use `order_by=name, order_direction=asc`.

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
