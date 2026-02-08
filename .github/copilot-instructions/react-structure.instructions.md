# React Project Structure

## Folder Overview

```
src/
├── main.tsx                    # Entry point (MantineProvider, AuthProvider, Router)
├── App.tsx                     # Root component
├── authConfig.ts               # MSAL configuration
│
├── api/                        # API layer
│   ├── client.ts               # UnifiedUIAPIClient (~110 methods)
│   ├── types.ts                # All API types + enums (~1000 lines)
│   └── index.ts                # Barrel export
│
├── auth/                       # Authentication
│   ├── authConfig.ts           # MSAL scopes + config
│   ├── AuthProvider.tsx         # MSAL context wrapper
│   └── index.ts
│
├── contexts/                   # Global state
│   ├── IdentityContext.tsx      # User, tenants, apiClient, selectedTenant
│   ├── SidebarDataContext.tsx   # Cached entity lists for sidebar
│   ├── ChatSidebarContext.tsx   # Global chat sidebar visibility
│   └── index.ts
│
├── hooks/                      # Custom hooks
│   ├── useDebounce.ts
│   └── useEntityPermissions.ts
│
├── routes/                     # Route definitions
│   ├── index.tsx               # All routes (BrowserRouter + Routes)
│   └── ProtectedRoute.tsx      # Auth guard wrapper
│
├── pages/                      # Page-level components
│   ├── ApplicationsPage/       # Chat agents list
│   ├── AutonomousAgentsPage/   # Autonomous agents list
│   ├── AutonomousAgentDetailsPage/  # Agent detail (tabs: traces + details)
│   ├── ConversationsPage/      # Conversations list + chat
│   ├── CredentialsPage/        # Credentials management (in TenantSettings)
│   ├── ChatWidgetsPage/        # Chat widget list
│   ├── TenantSettingsPage/     # Tenant config (tabs: general, IAM, groups, danger)
│   ├── DashboardPage/          # Home dashboard
│   ├── TracesPage/             # Standalone traces browser
│   ├── WidgetDesignerPage/     # Chat widget visual designer
│   ├── LoginPage/              # Login screen
│   ├── LoginTokenPage/         # Token-based login
│   ├── TracingDialogDevelopmentPage/  # Dev-only tracing test page
│   └── NotFoundPage/           # 404
│
├── components/
│   ├── common/                 # Reusable generic components
│   ├── dialogs/                # Modal dialogs (create/edit/share)
│   ├── layout/                 # App shell (MainLayout, Sidebar, Header)
│   └── tracing/                # Trace visualization system
│
├── styles/
│   └── variables.css           # CSS Custom Properties (design tokens)
│
└── theme/
    └── theme.ts                # Mantine theme configuration
```

---

## Components Catalog

### `components/common/`

| Component | Purpose |
|-----------|---------|
| `PageContainer` | Max-width wrapper (sm/md/lg/xl) for page content |
| `PageHeader` | Page title + description + action button |
| `DataTable` | Feature-rich list with search, sort, filter, infinite scroll → see [data-table.instructions.md](./components/data-table.instructions.md) |
| `DataTableToolbar` | Search bar + sort + filter popover (child of DataTable) |
| `DataTableRow` | Single row card in DataTable (child of DataTable) |
| `TracesTable` | Traces-specific table with date presets + sort (used in AutonomousAgentDetailsPage) |
| `SecretField` | Masked secret value with reveal/copy/rotate actions |
| `DelayedTooltip` | Tooltip with 1s open delay, multiline, max-width 400 |
| `DetailPageTabs` | Reusable tab container for detail pages |
| `TagInput` | Tag input with autocomplete |
| `ConfirmDeleteDialog` | Generic confirmation modal |
| `ManageAccessTable` | Resource permission management table |
| `ManageTenantAccessTable` | Tenant-level permission management |
| `AddPrincipalDialog` | Dialog for adding principals to resources |
| `EditRolesDialog` | Dialog for editing principal roles |
| `EntityDetailsForm` | Generic entity detail form |
| `GenerateWithAIButton` | Button that triggers AI-powered content generation |
| `MarkdownRenderer` | Renders markdown content with syntax highlighting |

### `components/dialogs/`

| Dialog | Purpose |
|--------|---------|
| `CreateApplicationDialog` | Create new chat agent |
| `EditApplicationDialog/` | Edit chat agent |
| `CreateAutonomousAgentDialog` | Create autonomous agent |
| `EditAutonomousAgentDialog/` | Edit autonomous agent |
| `CreateChatWidgetDialog` | Create chat widget |
| `EditChatWidgetDialog/` | Edit chat widget |
| `CreateCredentialDialog` | Create credential |
| `EditCredentialDialog/` | Edit credential |
| `CreateCustomGroupDialog` | Create custom group |
| `EditCustomGroupDialog/` | Edit custom group |
| `CreateToolDialog` | Create tool |
| `EditToolDialog/` | Edit tool |
| `CreateTenantDialog` | Create new tenant |
| `IntegrationDialog/` | API integration samples (POST/PUT payloads) |
| `AIModelDialog/` | Create/edit tenant AI model configuration |
| `AnalyzeErrorDialog/` | AI-powered trace error analysis dialog |
| `SearchConversationsDialog` | Conversation search modal |
| `ShareConversationDialog` | Share conversation modal |

### `components/layout/`

See [components/layout.instructions.md](./components/layout.instructions.md) for details.

| Component | Purpose |
|-----------|---------|
| `MainLayout` | App shell: Header + Sidebar + content area |
| `Sidebar` | Left nav rail with expandable entity lists |
| `Header` | Top bar: logo, tenant selector, theme toggle, user menu |
| `GlobalChatSidebar` | Right hover panel for recent conversations |

### `components/tracing/`

See [components/tracing.instructions.md](./components/tracing.instructions.md) for details.

| Component | Purpose |
|-----------|---------|
| `TracingVisualDialog` | Full-screen trace visualization modal |
| `TracingCanvasView` | ReactFlow-based interactive flow diagram |
| `TracingHierarchyView` | Tree sidebar for navigating trace nodes |
| `TracingDataSection` | Bottom panel with logs + input/output/metadata |
| `TracingSidebar` | Compact tracing sidebar for conversation pages |
| `TracingSubHeader` | Trace selector + layout controls |
| `TracingContext` | React Context for tracing state management |

---

## Pages

### Routes (from `src/routes/index.tsx`)

| Route | Page | Auth |
|-------|------|------|
| `/login` | LoginPage | Public |
| `/login/token` | LoginTokenPage | Public |
| `/dashboard` | DashboardPage | Protected |
| `/tenant-settings` | TenantSettingsPage | Protected |
| `/applications` | ApplicationsPage | Protected |
| `/conversations` | ConversationsPage | Protected |
| `/conversations/:conversationId` | ConversationsPage | Protected |
| `/autonomous-agents` | AutonomousAgentsPage | Protected |
| `/autonomous-agents/:agentId` | AutonomousAgentDetailsPage | Protected |
| `/traces` | TracesPage | Protected |
| `/chat-widgets` | ChatWidgetsPage | Protected |
| `/widget-designer` | WidgetDesignerPage | Protected |
| `/dev/tracing` | TracingDialogDevelopmentPage | Protected (dev) |
| `*` | NotFoundPage | — |

---

## Contexts

| Context | Key Exports | Purpose |
|---------|-------------|---------|
| `IdentityContext` | `useIdentity()` → `{ user, tenants, selectedTenant, apiClient, refreshIdentity, selectTenant, getFoundryToken }` | Global auth + API client |
| `SidebarDataContext` | `useSidebarData()` → `{ applications, autonomousAgents, chatWidgets, fetch*, refresh* }` | Cached sidebar entity lists |
| `ChatSidebarContext` | `useChatSidebar()` → `{ isVisible, onSidebarHoverEnter, onSidebarHoverLeave }` | Right chat sidebar visibility |

---

## Adding New Components

1. Create folder: `ComponentName/ComponentName.tsx` + `.module.css` + `index.ts`
2. Add to parent barrel `index.ts`
3. Use CSS Custom Properties for all styling
4. Export types if reused elsewhere
5. Follow component organization pattern (imports → types → constants → component)
