---
applyTo: '**'
---

# unified-ui Frontend — Copilot Instructions

## Project Overview

**unified-ui** is a multi-tenant integration platform for AI agent systems with role-based access control (RBAC). This frontend provides management UIs for AI agents, conversations, credentials, tracing, and tenant settings.

**Tech Stack**: React 19 · TypeScript 5.9 · Vite 7 · Mantine v8 · React Router v7 · MSAL · CSS Modules · i18next · Vitest + RTL + MSW

---

## Instruction Files Index

Read the relevant instruction file **before** working in that area.

| File | Read when... |
|------|-------------|
| [react-structure.instructions.md](./react-structure.instructions.md) | Creating new pages, components, or modifying folder structure |
| [design-system.instructions.md](./design-system.instructions.md) | Styling anything — colors, spacing, typography, light/dark mode |
| [api-client.instructions.md](./api-client.instructions.md) | Adding API calls, new endpoints, or working with IdentityContext |
| [ui-patterns.instructions.md](./ui-patterns.instructions.md) | Implementing scrolling, tabs, dialogs, forms, lists, or detail pages |
| [instruction-management.instructions.md](./instruction-management.instructions.md) | After completing work — decides if/how to update docs |
| [components/layout.instructions.md](./components/layout.instructions.md) | Touching MainLayout, Sidebar, Header, or page shells |
| [components/data-table.instructions.md](./components/data-table.instructions.md) | Working with DataTable, list pages, infinite scroll, or search/filter |
| [components/tracing.instructions.md](./components/tracing.instructions.md) | Working with trace visualization, TracingVisualDialog, or canvas |
| [testing.instructions.md](./testing.instructions.md) | Writing tests, running tests, understanding test patterns |

---

## Golden Rules

1. **No comments** — Only add comments in absolutely critical cases where code intent is non-obvious. Default: zero comments.
2. **No business logic in routes** — Routes only call handlers/hooks. Logic lives in hooks, contexts, or utility functions.
3. **CSS Custom Properties only** — Never hardcode colors, spacing, or sizes. Always use `var(--*)` from `src/styles/variables.css`.
4. **Barrel exports** — Every component folder has an `index.ts`. Parent folders have barrel `index.ts` files.
5. **TypeScript strict** — Explicit types for props, state, API responses. No `any`.
6. **Functional components only** — `FC<Props>` pattern, hooks at top level.
7. **CSS Modules** — One `.module.css` per component. No inline styles except Mantine `styles` prop for component internals.
8. **Mantine first** — Use Mantine components before building custom ones.
9. **Dark mode aware** — Use semantic CSS variables. Test both modes.
10. **Keep files under 400 lines** — Split into sub-components if exceeding.
11. **i18n for all UI strings** — Never hardcode user-visible strings. Use `useTranslation()` from `react-i18next`. Keys in `src/i18n/locales/en-US/{namespace}.json`. Outside React components (callbacks, contexts), use `i18next.t('namespace:key')`.
12. **Run tests after changes** — After significant changes: `npx vitest run`. Write tests for new components/features using Vitest + RTL.

---

## Naming Conventions

| What | Pattern | Example |
|------|---------|---------|
| Page component | `{Name}Page/` | `ApplicationsPage/` |
| Detail page | `{Name}DetailsPage/` | `AutonomousAgentDetailsPage/` |
| Common component | `{Name}/` in `components/common/` | `DataTable/`, `SecretField/` |
| Dialog component | `{Name}Dialog` in `components/dialogs/` | `IntegrationDialog/` |
| Layout component | in `components/layout/` | `MainLayout/`, `Sidebar/` |
| CSS Module | `{ComponentName}.module.css` | `DataTable.module.css` |
| Context | `{Name}Context.tsx` in `contexts/` | `IdentityContext.tsx` |
| Hook | `use{Name}.ts` in `hooks/` | `useDebounce.ts` |
| Types | in `api/types.ts` (API) or co-located | — |
| Barrel export | `index.ts` | re-exports component + types |

---

## Component File Structure

```
ComponentName/
├── ComponentName.tsx          # Main component
├── ComponentName.module.css   # Styles
├── index.ts                   # Barrel export
└── SubComponent.tsx           # Optional sub-components
```

Standard component organization:

```typescript
import type { FC } from 'react';
// 1. External imports (react, mantine, icons)
// 2. Internal imports (components, contexts, api, types)
// 3. CSS module import

// Types/Interfaces (exported if reused)

// Constants

export const MyComponent: FC<Props> = ({ ... }) => {
  // Hooks (state, context, router, refs)
  // Derived state / memos
  // Event handlers
  // Effects
  // Early returns (loading, error)
  // Render
};
```

---

## Quick Reference

- **Dev server**: `npm run dev`
- **Run tests**: `npx vitest run`
- **Run tests (watch)**: `npx vitest`
- **Type check**: `npx tsc --noEmit`
- **Routes**: `src/routes/index.tsx`
- **API Client**: `src/api/client.ts` (~130 methods)
- **Types**: `src/api/types.ts` (~1370 lines, all enums + interfaces)
- **Design tokens**: `src/styles/variables.css`
- **Theme config**: `src/theme/theme.ts`
- **Contexts**: `src/contexts/` — IdentityContext (wraps AuthContext, TenantContext, ApiClientContext), SidebarDataContext, ChatSidebarContext, AICapabilitiesContext, FavoritesContext, RecentVisitsContext
- **i18n config**: `src/i18n/index.ts` (production), `src/i18n/i18nForTests.ts` (test)
- **Locales**: `src/i18n/locales/en-US/` (11 namespaces: common, dashboard, login, header, conversations, settings, tracing, credentials, token, widgetDesigner, reactAgent)
- **Command Palette**: `src/components/common/CommandPalette/` (cmdk library, `⌘K` shortcut)
- **Chat Components**: `src/components/chat/` (ChatView, ChatContent, ChatInput, ChatHeader, ChatEmptyState, FeedbackDialog)
- **Conversation Components**: `src/components/conversation/` (ConversationSidebar)
- **Chat Hooks**: `src/hooks/chat/` (useChat, useFileUpload)
- **Conversation Hooks**: `src/hooks/conversation/` (useConversationList, useConversationTracing)
- **Test setup**: `src/test/setup.ts` (MSW lifecycle, mocks)
- **Test utils**: `src/test/utils.tsx` (`renderWithProviders()`)

---

## Instruction Management (Summary)

After completing work, evaluate whether documentation needs updating. Full rules in [instruction-management.instructions.md](./instruction-management.instructions.md).

**Update docs when:**
- New reusable component created → add to `react-structure.instructions.md`
- New UI pattern established → add to `ui-patterns.instructions.md`
- New complex component → consider dedicated `components/*.instructions.md`
- Folder structure changed → update `react-structure.instructions.md`
- **New tenant role added** → update `usePermissions.ts` (CREATOR_ROLES, ADMIN_ROLES maps), `api/types.ts` (`TenantPermissionEnum`), RBAC section in `ui-patterns.instructions.md`, and notify platform-service to update `auth-permissions.instructions.md`

**Never update docs for:** bug fixes, simple prop changes, one-off page-specific code.
