# DataTable Component

## Overview

**File**: `src/components/common/DataTable/` (~240 lines main, plus DataTableToolbar and DataTableRow)

Feature-rich list component with search, sort, filter, infinite scroll, and action menus.

---

## Architecture

```
DataTable
├── DataTableToolbar (search + sort + filter)
├── DataTableRow[]   (individual items)
├── Sentinel div     (IntersectionObserver for infinite scroll)
└── Loading/Error/Empty states
```

---

## Key Interfaces

```typescript
interface DataTableItem {
  id: string;
  name: string;
  description?: string;
  type?: string;
  tags?: string[];
  isActive?: boolean;
  isPinned?: boolean;
}

type SortOption = 'updated' | 'created' | 'name-asc' | 'name-desc';

interface FilterState {
  tags: string[];
  status: 'all' | 'active' | 'inactive';
}
```

---

## Dual Mode: Internal vs External

DataTable supports two filtering/sorting modes:

### Internal (client-side)

When no external handlers are provided, DataTable internally:
- Filters items by search text (name, description, type)
- Filters by tags and status
- Sorts by the selected sort option

### External (server-side)

When passing `searchValue`/`onSearchChange`, `sortBy`/`onSortChange`, `filters`/`onFilterChange`:
- DataTable delegates all filtering/sorting to the parent
- Parent is responsible for fetching filtered data from the API

---

## Infinite Scroll

Uses `IntersectionObserver` on a sentinel `<div>` at the bottom of the list:

- `rootMargin: '100px'` — triggers 100px before sentinel is visible
- When sentinel enters viewport → calls `onLoadMore()`
- Shows spinner while `isLoadingMore` is true
- Stops when `hasMore` is false

---

## Scrollbar Pattern

```css
.wrapper {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-right: calc(-1 * var(--spacing-md));
}

.scrollArea {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: var(--spacing-md);
}
```

The `margin-right: -md` / `padding-right: md` trick keeps the scrollbar outside the content area.

---

## DataTableToolbar

| Prop | Purpose |
|------|---------|
| `searchPlaceholder` | Placeholder text for search input |
| `searchValue` / `onSearchChange` | External search control |
| `sortBy` / `onSortChange` | External sort control |
| `availableTags` | Tag list for filter dropdown |
| `filters` / `onFilterChange` | External filter control |
| `showFilter` / `showSort` | Toggle visibility of sort/filter controls |

Contains: Search `TextInput`, Sort `Select`, Filter `Popover` with `MultiSelect` (tags) and radio buttons (status).

---

## DataTableRow

| Prop | Purpose |
|------|---------|
| `item` | The data item to display |
| `icon` | Custom icon ReactNode |
| `showStatus` | Show active/inactive toggle |
| `onStatusChange` | Callback for status toggle |
| `onOpen/onEdit/onShare/...` | Action callbacks (shown in context menu) |
| `onRowClick` | Click handler for the entire row |

**Tooltip thresholds**: Name > 25 chars, Description > 50 chars → show truncated with tooltip.

**Context menu**: 3-dot `ActionIcon` with Mantine `Menu` — Open, Edit, Manage Access, Duplicate, Pin/Unpin, Delete.

**Row layout**: Outer `Group wrap="nowrap" gap="lg"` contains:
1. Left group (`flex: 1, minWidth: 0, maxWidth: 600`) — checkbox, favorite, icon, name/description
2. Type text (`width: 180px, flex-shrink: 0`)
3. Tags group (`width: 200px, flex-shrink: 0`)
4. Right group (`marginLeft: auto, flexShrink: 0`) — status switch + menu dots

The left group uses `flex: 1` to fill available space (capped at 600px). The right group uses `marginLeft: auto` to always pin status and action dots to the right edge.

**Event propagation**: All interactive elements (switches, menu buttons) call `e.stopPropagation()` to prevent `onRowClick`.

---

## Responsive Breakpoints

| Breakpoint | Hidden |
|------------|--------|
| `< 992px` | Type column |
| `< 768px` | Tags column |

---

## Multi-Select / Bulk Actions

DataTable supports row selection with bulk action capabilities.

### Props

| Prop | Type | Purpose |
|------|------|---------|
| `enableSelection` | `boolean` | Show checkboxes on rows |
| `onBulkDelete` | `(ids: string[]) => void` | Callback for bulk delete action |
| `onBulkStatusToggle` | `(ids: string[], active: boolean) => void` | Callback for bulk status toggle |

### Behavior

- When `enableSelection` is true, each row shows a `Checkbox` before the favorite button
- A bulk action bar appears above the list when items are selected
- Bulk action bar shows: selected count, "Activate" / "Deactivate" buttons (if `onBulkStatusToggle`), "Delete" button (if `onBulkDelete`)
- Selection state (`selectedIds: Set<string>`) is managed internally by DataTable
- Selected rows get `.rowSelected` styling

### CSS Classes

| Class | Purpose |
|-------|---------|
| `.bulkActionBar` | Floating action bar above list |
| `.rowSelected` | Highlighted selected row background |
| `.rowCheckbox` | Checkbox alignment within row |

---

## Using DataTable

```tsx
<DataTable
  items={items}
  isLoading={isLoading}
  isLoadingMore={isLoadingMore}
  hasMore={hasMore}
  onLoadMore={handleLoadMore}
  searchPlaceholder="Search agents..."
  emptyMessage="No agents found"
  onRowClick={handleRowClick}
  onEdit={handleEdit}
  onDelete={handleDelete}
  renderIcon={(item) => <IconRobot />}
  enableSelection
  onBulkDelete={handleBulkDelete}
  onBulkStatusToggle={handleBulkStatusToggle}
/>
```
