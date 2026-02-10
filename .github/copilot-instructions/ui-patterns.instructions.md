# UI Patterns

## Scrolling

### Core Problem

Mantine `<Tabs>` renders internal wrapper `<div>` elements that **break the CSS flex chain**. You cannot use `flex: 1; min-height: 0; overflow-y: auto` through Mantine Tabs — the internal wrappers don't propagate flex properties.

### Solution: `max-height: calc(100vh - Xpx)`

Always use calculated max-height on scroll containers inside tabs:

```css
.tabPanelScrollWrapper {
  margin-right: calc(-1 * var(--spacing-md));
  overflow: hidden;
}

.tabPanelScrollArea {
  max-height: calc(100vh - 400px);
  min-height: 200px;
  overflow-y: auto;
  padding-right: var(--spacing-md);
}
```

```tsx
<Tabs.Panel value="details">
  <div className={classes.tabPanelScrollWrapper}>
    <div className={classes.tabPanelScrollArea}>
      {/* scrollable content */}
    </div>
  </div>
</Tabs.Panel>
```

### Scrollbar Offset Pattern

To prevent the scrollbar from overlaying content (same pattern as DataTable):

1. **Outer wrapper**: `margin-right: calc(-1 * var(--spacing-md))` + `overflow: hidden`
2. **Inner scroll area**: `padding-right: var(--spacing-md)` + `overflow-y: auto`

This pushes the scrollbar into the negative-margin space, keeping content alignment clean.

### calc() Offset Values

Adjust the offset based on what is above the scroll area:

| Context | Offset | Accounts for |
|---------|--------|-------------|
| Detail page tab | `400px` | Header (70px) + page header + tabs + padding |
| Modal tab | `320px` | Modal chrome + tabs + padding |
| DataTable | Dynamic | Passed as prop or calculated |

### Rules

- **Never** use `flex: 1; overflow-y: auto` through Mantine Tabs
- **Always** use `max-height: calc(100vh - Xpx)` for scrollable areas inside tabs
- **Always** add `min-height: 200px` to prevent collapse
- **Always** use the scrollbar offset wrapper pattern

---

## Tab Pages

Used for detail pages and settings pages with multiple sections.

```tsx
<Tabs defaultValue="details" className={classes.tabs}>
  <Tabs.List>
    <Tabs.Tab value="details">Details</Tabs.Tab>
    <Tabs.Tab value="settings">Settings</Tabs.Tab>
  </Tabs.List>

  <Tabs.Panel value="details" className={classes.tabPanel}>
    <div className={classes.tabPanelScrollWrapper}>
      <div className={classes.tabPanelScrollArea}>
        {/* content */}
      </div>
    </div>
  </Tabs.Panel>
</Tabs>
```

---

## Detail Pages

Standard layout for entity detail pages (e.g., AutonomousAgentDetailsPage):

```
MainLayout
├── Breadcrumbs (e.g., "Agents > Agent Name")
├── Header section (EntityAvatar, title, actions)
├── Tabs
│   ├── Tab 1 (e.g., Traces) → scrollWrapper > scrollArea > TracesTable
│   └── Tab 2 (e.g., Details) → scrollWrapper > scrollArea > sectionCards
```

### Section Cards

Group related fields into visual sections:

```tsx
<Paper className={classes.sectionCard}>
  <Text className={classes.sectionTitle}>Section Name</Text>
  <Stack gap="sm">
    {/* form fields or display values */}
  </Stack>
</Paper>
```

---

## Dialogs (Modals)

### Standard Dialog Pattern

```tsx
<Modal
  opened={opened}
  onClose={onClose}
  title="Dialog Title"
  size="lg"
>
  {/* form content */}
  <Group justify="flex-end" mt="xl">
    <Button variant="subtle" onClick={onClose}>Cancel</Button>
    <Button onClick={handleSubmit}>Save</Button>
  </Group>
</Modal>
```

### Tabbed Dialogs

When a dialog has tabs, apply the same scrolling pattern as pages but with a smaller calc offset (~320px for modal chrome).

---

## DataTable / List Pages

List pages follow a standard pattern:

```
MainLayout
├── PageHeader (title + "Create" button)
└── DataTable (search + sort + filter + infinite scroll)
```

List pages use the `useEntityList<T>` hook which extracts all common logic (state, pagination, search, sort, filter, tags, CRUD, edit dialog URL state). Pages only define entity-specific config and render.

See [components/data-table.instructions.md](./components/data-table.instructions.md) for DataTable internals.

---

## Infinite Scroll

DataTable uses `IntersectionObserver` on a sentinel element at the bottom:

1. When sentinel enters viewport → call `onLoadMore()`
2. Show loading spinner while fetching
3. Append new items to existing list
4. Stop when `hasMore` is false

---

## Event Propagation in Nested Interactives

When placing buttons/links inside clickable rows, prevent the row click from firing:

```tsx
<ActionIcon onClick={(e) => { e.stopPropagation(); handleAction(); }}>
  <IconEdit />
</ActionIcon>
```

Always call `e.stopPropagation()` on interactive elements nested inside clickable containers.

---

## Loading & Error States

### Delayed Loading with Skeletons (CRITICAL)

To prevent loading indicator flashing on fast responses, **always** use the `useDelayedLoading` hook. The loading skeleton is only shown after a delay (default 500ms). If data loads faster, no loading indicator appears at all.

```tsx
import { useDelayedLoading } from '../../../hooks';

const showLoadingSkeleton = useDelayedLoading(isLoading, 500);

// In render:
{showLoadingSkeleton ? (
  <Stack gap="xs">
    {Array.from({ length: 5 }).map((_, i) => (
      <Group key={i} /* skeleton row styles */>
        <Skeleton circle width={40} height={40} />
        <Stack gap={6} style={{ flex: 1 }}>
          <Skeleton height={14} width="40%" radius="sm" />
          <Skeleton height={10} width="70%" radius="sm" />
        </Stack>
      </Group>
    ))}
  </Stack>
) : (
  /* actual content */
)}
```

### Rules for Loading in Tables

1. **Use Skeleton placeholders** (not `Loader` spinner) — skeletons mimic the shape of the actual content
2. **Always use `useDelayedLoading`** — show skeleton only after 500ms delay, never immediately
3. **Never hide the table header** during loading — the `<Table.Thead>` must always remain visible
4. Only the `<Table.Tbody>` content is replaced with skeleton rows
5. For "load more" (infinite scroll), use a small `<Loader size="sm" />` at the bottom — this is acceptable since it indicates incremental loading, not initial load

### Empty State

Show a centered message when no data:

```tsx
if (items.length === 0) {
  return (
    <Text c="dimmed" ta="center" py="xl">
      No items found
    </Text>
  );
}
```

### Error Handling

Errors from `apiClient` trigger the `onError` callback in IdentityContext, which shows a Mantine notification. Individual pages do not need manual error display unless custom handling is needed.
