---
applyTo: "**/dialogs/**,**/components/common/UnifiedDialog/**"
---

# UnifiedDialog — Reusable Dialog Component

## Overview

`UnifiedDialog` is the **mandatory shared dialog component** for ALL modal dialogs in the application. It provides consistent styling, scroll behavior, tab support, and action buttons.

**Location**: `src/components/common/UnifiedDialog/`
**Import**: `import { UnifiedDialog } from '../../common';`

## When to Use

Use `UnifiedDialog` for **every** modal/overlay dialog in the application:

- Create dialogs (CreateChatAgentDialog, CreateCredentialDialog, etc.)
- Edit dialogs (EditChatAgentDialog, EditCredentialDialog, etc.)
- Detail/view dialogs (IntegrationDialog, AnalyzeErrorDialog, etc.)

**Never** use Mantine `<Modal>` directly. Always wrap content in `UnifiedDialog`.

## Props

| Prop                  | Type                      | Default  | Description                                    |
| --------------------- | ------------------------- | -------- | ---------------------------------------------- |
| `opened`              | `boolean`                 | required | Controls visibility                            |
| `onClose`             | `() => void`              | required | Close handler                                  |
| `title`               | `string`                  | required | Dialog title                                   |
| `icon`                | `React.ReactNode`         | required | Icon in gradient header (e.g. `<IconRobot />`) |
| `children`            | `React.ReactNode`         | required | Dialog body content                            |
| `size`                | `string`                  | `'xl'`   | Mantine Modal size                             |
| `scrollable`          | `boolean`                 | `false`  | Enables scroll wrapper around content          |
| `scrollOffset`        | `number`                  | `320`    | `calc(100vh - Xpx)` offset for scroll area     |
| `isLoading`           | `boolean`                 | `false`  | Shows LoadingOverlay                           |
| `actions`             | `UnifiedDialogAction[]`   | `[]`     | Bottom action buttons                          |
| `tabs`                | `{ value, label }[]`      | —        | SegmentedControl tab definitions               |
| `activeTab`           | `string`                  | —        | Currently active tab                           |
| `onTabChange`         | `(value: string) => void` | —        | Tab change handler                             |
| `formId`              | `string`                  | —        | Links submit button to a `<form id>`           |
| `minHeight`           | `number`                  | —        | Minimum content height (px)                    |
| `closeOnClickOutside` | `boolean`                 | `true`   | Close on backdrop click                        |
| `closeOnEscape`       | `boolean`                 | `true`   | Close on Escape key                            |

### UnifiedDialogAction

```tsx
interface UnifiedDialogAction {
  label: string;
  onClick?: () => void;
  variant?: string;
  color?: string;
  type?: "button" | "submit";
  form?: string;
  disabled?: boolean;
  loading?: boolean;
}
```

## Usage Examples

### Simple Dialog (no scroll)

```tsx
<UnifiedDialog
  opened={opened}
  onClose={close}
  title="Create Credential"
  icon={<IconKey size={20} />}
  actions={[
    { label: t("common:cancel"), onClick: close, variant: "default" },
    { label: t("common:create"), type: "submit", form: "create-credential" },
  ]}
>
  <form id="create-credential" onSubmit={handleSubmit}>
    <Stack>{/* form fields */}</Stack>
  </form>
</UnifiedDialog>
```

### Tabbed Dialog with Scroll

```tsx
<UnifiedDialog
  opened={opened}
  onClose={close}
  title={agent.name}
  icon={<IconRobot size={20} />}
  scrollable
  scrollOffset={320}
  tabs={[
    { value: "details", label: t("common:details") },
    { value: "access", label: t("common:access") },
  ]}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  isLoading={isLoading}
  actions={[
    { label: t("common:cancel"), onClick: close, variant: "default" },
    { label: t("common:save"), onClick: handleSave },
  ]}
>
  {activeTab === "details" && <DetailsContent />}
  {activeTab === "access" && <AccessContent />}
</UnifiedDialog>
```

## Scroll Behavior

UnifiedDialog follows the project scroll-guide pattern:

- **Offset 320px** (default): For modal dialogs
- **Offset 400px**: For detail pages (not inside modals)
- Uses the scrollbar-offset CSS pattern: wrapper with `margin-right: -var(--spacing-md)` + area with `padding-right: var(--spacing-md)` to prevent scrollbar overlay

The offset is applied via CSS custom property `--unified-dialog-scroll-offset`.

## Styling

All styles are in `UnifiedDialog.module.css`. Key classes:

- `.modalContent` — border-radius
- `.titleIcon` — gradient background for icon
- `.segmentedControl` — tab styling with dark mode
- `.scrollWrapper` / `.scrollArea` — scroll container
- `.actions` — bottom button bar

**Do NOT duplicate these styles** in individual dialog CSS modules. Use `UnifiedDialog` instead.
