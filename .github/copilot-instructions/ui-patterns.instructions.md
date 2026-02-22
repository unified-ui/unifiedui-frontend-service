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
    <div className={classes.tabPanelScrollArea}>{/* scrollable content */}</div>
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

| Context         | Offset  | Accounts for                                 |
| --------------- | ------- | -------------------------------------------- |
| Detail page tab | `400px` | Header (70px) + page header + tabs + padding |
| Modal tab       | `320px` | Modal chrome + tabs + padding                |
| DataTable       | Dynamic | Passed as prop or calculated                 |

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
      <div className={classes.tabPanelScrollArea}>{/* content */}</div>
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
  <Stack gap="sm">{/* form fields or display values */}</Stack>
</Paper>
```

---

## Dialogs (Modals)

### Standard Dialog Pattern

```tsx
<Modal opened={opened} onClose={onClose} title="Dialog Title" size="lg">
  {/* form content */}
  <Group justify="flex-end" mt="xl">
    <Button variant="subtle" onClick={onClose}>
      Cancel
    </Button>
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
<ActionIcon
  onClick={(e) => {
    e.stopPropagation();
    handleAction();
  }}
>
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

---

## Truncated Text Tooltips (CRITICAL)

Whenever text may be truncated (via `truncate`, `lineClamp={1}`, `text-overflow: ellipsis`, or CSS line-clamp), **always** wrap it in a `DelayedTooltip` so users can read the full text on hover.

```tsx
import { DelayedTooltip } from "../DelayedTooltip"; // or from '../../components/common'

<DelayedTooltip label={item.name}>
  <Text size="sm" truncate>
    {item.name}
  </Text>
</DelayedTooltip>;
```

### Rules

1. **Always use `DelayedTooltip`** (not plain `Tooltip`) — it has `openDelay={1000}` (1s), `multiline`, `maw={400}`, and `withArrow` built in
2. The `label` prop must contain the **full untruncated text**
3. Apply to: names, titles, descriptions, emails, IDs — anywhere text is clipped
4. **Exception: Tag tooltips** — tag badges with `+N more` popover keep their own pattern, do not wrap in `DelayedTooltip`
5. If `DelayedTooltip` cannot be imported (e.g., non-React context), use `<Tooltip openDelay={1000} multiline maw={400} withArrow>` directly

### Where to apply

- **DataTable rows**: name, description columns (done via `DataTableRow`)
- **Sidebar lists**: item name, subtitle
- **Entity cards**: name fields (Dashboard favorites, recent visits)
- **Chat sidebars**: conversation name, chat agent name
- **Chat header**: app name, app description
- **Trace views**: node names, trace IDs, reference names
- **Dialog lists**: names, descriptions in search results and selection dialogs
- **Access tables**: principal names, emails

---

## Dirty Tracking & Unsaved Changes

### Two Hook Approach

| Hook                                             | Use when...                                                        |
| ------------------------------------------------ | ------------------------------------------------------------------ |
| `useFormDirtyGuard(form.isDirty())`              | Mantine `useForm`-based dialogs — registers `beforeunload` handler |
| `useUnsavedChanges(currentValue, baselineValue)` | `useState`-based pages — deep comparison + `beforeunload`          |

### useForm-Based Dialogs (EditChatAgentDialog, EditToolDialog, etc.)

```tsx
import { useFormDirtyGuard } from '../../../hooks';

const form = useForm({ initialValues: { ... } });
useFormDirtyGuard(form.isDirty());

// After loading data into form:
form.setValues(data);
form.resetDirty();  // Mark current values as "clean"

// After successful save:
form.resetDirty();  // Reset dirty state before closing
onSuccess?.();

// Save button:
<Button disabled={!form.isDirty()} onClick={handleSave}>Save</Button>
```

### useState-Based Pages (ReActAgentDeveloperPage, WidgetDesignerPage)

```tsx
import { useUnsavedChanges } from "../../hooks";

const [config, setConfig] = useState(DEFAULT_CONFIG);
const [savedConfig, setSavedConfig] = useState<Config | undefined>(undefined);
const { hasChanges, resetBaseline } = useUnsavedChanges(config, savedConfig);

// After loading data:
const loadedConfig = { ...apiData };
setConfig(loadedConfig);
setSavedConfig(structuredClone(loadedConfig));

// After successful save:
resetBaseline(config);

// Save button:
<Button disabled={!hasChanges} onClick={handleSave}>
  Save
</Button>;
```

### Rules

1. **Every edit dialog** must use `useFormDirtyGuard` + `disabled={!form.isDirty()}` on save button
2. **Every edit page** must use `useUnsavedChanges` + `disabled={!hasChanges}` on save button
3. Always call `form.resetDirty()` / `resetBaseline()` **after loading data** and **after successful save**
4. For create/edit dual-mode dialogs (e.g., AIModelDialog), only disable in edit mode: `disabled={isEdit && !form.isDirty()}`

---

## RBAC / Permission Gating

### Overview

The frontend enforces RBAC at two levels:

1. **Tenant-level roles** — checked via `usePermissions()` hook (e.g., `isGlobalAdmin`, `canCreate('chat-agents')`)
2. **Resource-level permissions** — checked via `my_permission` field on API response objects (`'ADMIN'` | `'WRITE'` | `'READ'` | `undefined`)

When `my_permission` is `undefined`/`null`, all actions remain visible (backward compatibility).

### `usePermissions()` Hook

```tsx
import { usePermissions } from "../../hooks";

const { isGlobalAdmin, canCreate, hasRole } = usePermissions();
```

| Method                    | Purpose                                                   |
| ------------------------- | --------------------------------------------------------- |
| `isGlobalAdmin`           | `true` if user has `GLOBAL_ADMIN` role                    |
| `canCreate(resourceType)` | `true` if user can create entities of that type           |
| `canAdmin(resourceType)`  | `true` if user has admin for that resource type           |
| `hasRole(role)`           | `true` if user has a specific `TenantPermissionEnum` role |
| `hasAnyRole(roles)`       | `true` if user has at least one of the given roles        |

### List Pages — Gating Create Buttons

```tsx
const { canCreate } = usePermissions();
const canCreateApp = canCreate('chat-agents');

<PageHeader onAction={canCreateApp ? handleCreate : undefined} />
<DataTable onEmptyAction={canCreateApp ? handleCreate : undefined} />
```

Pass `undefined` instead of the callback to hide the button entirely.

### DataTable — Row-Level Permission Gating

`DataTableItem` includes `my_permission?: string`. DataTableRow derives:

```tsx
const perm = item.my_permission;
const canWriteItem = perm === "ADMIN" || perm === "WRITE";
const canAdminItem = perm === "ADMIN";
const hasPermission = perm != null;
```

| Action                 | Condition                                      |
| ---------------------- | ---------------------------------------------- |
| Open / Pin             | Always visible                                 |
| Edit / Duplicate       | Hidden when `hasPermission && !canWriteItem`   |
| Status toggle          | Disabled when `hasPermission && !canWriteItem` |
| Manage Access / Delete | Hidden when `hasPermission && !canAdminItem`   |

Map `my_permission` through in `mapToTableItem`:

```tsx
const mapToTableItem = (entity: EntityResponse): DataTableItem => ({
  id: entity.id,
  name: entity.name,
  my_permission: entity.my_permission,
  // ...
});
```

### Edit Dialogs — IAM Tab Visibility

```tsx
const { isGlobalAdmin } = usePermissions();
const showIamTab =
  isGlobalAdmin || !initialData || initialData.my_permission === "ADMIN";

{
  showIamTab && (
    <Box>
      <SegmentedControl /* ... */ />
    </Box>
  );
}
```

### Sidebar — Add Button Gating

```tsx
const { canCreate } = usePermissions();
const canAddEntity = activeEntity ? canCreate(activeEntity) : false;

<SidebarDataList onAdd={canAddEntity ? handleAddClick : undefined} />;
```

When `onAdd` is `undefined`, the add button is hidden entirely.

### TenantSettingsPage — Admin Gating

- IAM tab, settings form fields, save button, danger zone: gated by `isGlobalAdmin`
- Create buttons: gated by `canCreate(resourceType)` per entity
- AI Models create: `isGlobalAdmin || hasRole(TenantPermissionEnum.TENANT_AI_MODELS_ADMIN)`

### ConversationsPage — Resource Permission Gating

```tsx
const convPerm = conversation?.my_permission;
const canWriteConversation =
  !convPerm || convPerm === "ADMIN" || convPerm === "WRITE";
const canAdminConv = !convPerm || convPerm === "ADMIN";
```

- Chat input disabled when `!canWriteConversation`
- Edit/delete message callbacks set to `undefined` when `!canWriteConversation`
- Share/delete conversation hidden when `!canAdminConv`

### Rules

1. **Backward compatibility** — when `my_permission` is `null`/`undefined`, all actions remain visible
2. **Hide, don't disable** — prefer hiding inaccessible actions over disabling them (except status toggle)
3. **Pass `undefined` to hide** — set callback props to `undefined` to hide associated UI elements
4. **Tenant roles for create** — use `canCreate(resourceType)` from `usePermissions()`
5. **Resource permissions for CRUD** — use `my_permission` from API response objects
6. **When adding new tenant roles** — update `usePermissions.ts` (CREATOR_ROLES, ADMIN_ROLES maps), `api/types.ts` (`TenantPermissionEnum`), and document in these instruction files
