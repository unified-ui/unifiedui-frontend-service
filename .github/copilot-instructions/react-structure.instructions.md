# React Project Structure

## Folder Overview

```
src/
├── main.tsx                    # Entry point (MantineProvider, I18nextProvider, AuthProvider, Router)
├── App.tsx                     # Root component (renders AppRoutes)
├── authConfig.ts               # MSAL configuration
│
├── api/                        # API layer
│   ├── client.ts               # UnifiedUIAPIClient (~130 methods)
│   ├── types.ts                # All API types + enums (~1370 lines)
│   └── index.ts                # Barrel export
│
├── auth/                       # Authentication
│   ├── authConfig.ts           # MSAL scopes + config
│   ├── AuthProvider.tsx         # MSAL context wrapper
│   └── index.ts
│
├── i18n/                       # Internationalization
│   ├── index.ts                # Production i18n config (LanguageDetector, 12 namespaces)
│   ├── i18nForTests.ts         # Test i18n config (no detection, hardcoded en-US)
│   └── locales/
│       └── en-US/              # English locale files
│           ├── common.json     # Shared strings (search, CRUD, errors)
│           ├── dashboard.json  # Dashboard page strings
│           ├── login.json      # Login page strings
│           ├── header.json     # Header/tenant selector strings
│           ├── conversations.json
│           ├── settings.json
│           ├── tracing.json    # Trace visualization strings
│           ├── credentials.json
│           ├── token.json      # Token page strings
│           ├── widgetDesigner.json  # Widget designer page strings
│           └── reactAgent.json # ReACT agent developer strings
│
├── test/                       # Test infrastructure
│   ├── setup.ts                # Vitest setup (MSW lifecycle, matchMedia/ResizeObserver mocks)
│   ├── utils.tsx               # renderWithProviders() helper
│   ├── mocks/
│   │   ├── handlers.ts         # MSW request handlers
│   │   ├── server.ts           # MSW server instance
│   │   └── index.ts
│   └── __tests__/              # Test files
│       ├── setup.test.tsx      # Smoke tests
│       ├── i18n.test.tsx       # i18n namespace validation
│       ├── dashboard.test.tsx  # DashboardPage tests
│       └── header.test.tsx     # Header tests
│
├── contexts/                   # Global state
│   ├── IdentityContext.tsx      # Composite provider (wraps AuthContext, TenantContext, ApiClientContext)
│   ├── AuthContext.tsx          # User authentication state + setters
│   ├── TenantContext.tsx        # Tenant selection + persistence
│   ├── ApiClientContext.tsx     # API client instance
│   ├── AICapabilitiesContext.tsx # AI model capabilities for current tenant
│   ├── FavoritesContext.tsx     # User favorites management
│   ├── RecentVisitsContext.tsx  # Recent visits tracking + sync
│   ├── SidebarDataContext.tsx   # Cached entity lists for sidebar
│   ├── ChatSidebarContext.tsx   # Global chat sidebar visibility
│   └── index.ts
│
├── hooks/                      # Custom hooks
│   ├── useDelayedLoading.ts      # Delayed loading state (show skeleton only after N ms)
│   ├── useEntityList.ts          # Shared list page logic (pagination, search, sort, filter, CRUD)
│   ├── useEntityPermissions.ts   # Permission methods per entity type
│   ├── usePermissions.ts         # Tenant-role + resource-permission checks (RBAC)
│   ├── useFormDirtyGuard.ts      # beforeunload guard for Mantine useForm-based dialogs
│   ├── useKeyboardShortcuts.ts   # Global keyboard shortcut bindings
│   └── useUnsavedChanges.ts      # Dirty tracking + beforeunload for useState-based pages
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
│   ├── WidgetDesignerPage/     # Chat widget visual designer (drag & drop fields)
│   ├── ReActAgentDeveloperPage/ # ReACT agent config + playground
│   ├── EmbedChatPage/          # Standalone embed chat (no sidebar/header)
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
| `PageHeader` | Page title + description + action button |
| `EntityAvatar` | Hash-based colored initials avatar for entities |
| `Breadcrumbs` | Navigation breadcrumbs for detail pages |
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
| `ChatPanel` | Dual-mode chat panel (conversation + playground) for pages |
| `CommandPalette` | Global command palette (cmdk, `⌘K` shortcut) |
| `PermissionGate` | Declarative permission-based rendering (hide/disable by role or resource permission) |
| `SkeletonLoaders` | Skeleton loading placeholders for list/detail pages |

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
| `Header` | Top bar: logo, search (CommandPalette), notifications, theme toggle, user menu |
| `GlobalChatSidebar` | Right hover panel for recent conversations |
| `NotificationPanel` | Right slide-out drawer for notifications (Mantine Drawer) |

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
| `/chat-widgets` | ChatWidgetsPage | Protected |
| `/widget-designer` | WidgetDesignerPage | Protected |
| `/re-act-agents` | ReActAgentDeveloperPage | Protected |
| `/dev/tracing` | TracingDialogDevelopmentPage | Protected (dev) |
| `/embed/chat/:agentId` | EmbedChatPage | Public |
| `*` | NotFoundPage | — |

---

## Contexts

| Context | Key Exports | Purpose |
|---------|-------------|---------|
| `IdentityContext` | `useIdentity()` → `{ user, tenants, selectedTenant, selectedTenantRoles, apiClient, refreshIdentity, selectTenant, getFoundryToken }` | Composite provider wrapping Auth + Tenant + ApiClient; exposes `selectedTenantRoles: TenantPermissionEnum[]` |
| `AuthContext` | `useAuthContext()` → `{ user, isLoading, setUser, setIsLoading }` | User authentication state |
| `TenantContext` | `useTenantContext()` → `{ tenants, selectedTenant, selectTenant, setTenants }` | Tenant selection + persistence |
| `ApiClientContext` | `useApiClient()` → `UnifiedUIAPIClient` | API client instance |
| `AICapabilitiesContext` | `useAICapabilities()` → `{ aiModels, isLoading }` | AI model data for current tenant |
| `FavoritesContext` | `useFavorites()` → `{ favorites, toggleFavorite, isFavorite }` | User favorites management (applications, autonomous-agents, chat-widgets, conversations, re-act-agents) |
| `NotificationsContext` | `useNotifications()` → `{ notifications, unreadCount, markAsRead, markAllRead, deleteNotification }` | Notification polling + state |
| `RecentVisitsContext` | `useRecentVisits()` → `{ recentVisits, trackVisit, syncVisits }` | Recent visit tracking |
| `SidebarDataContext` | `useSidebarData()` → `{ applications, autonomousAgents, chatWidgets, fetch*, refresh* }` | Cached sidebar entity lists |
| `ChatSidebarContext` | `useChatSidebar()` → `{ isVisible, onSidebarHoverEnter, onSidebarHoverLeave }` | Right chat sidebar visibility |

---

## Adding New Components

1. Create folder: `ComponentName/ComponentName.tsx` + `.module.css` + `index.ts`
2. Add to parent barrel `index.ts`
3. Use CSS Custom Properties for all styling
4. Export types if reused elsewhere
5. Follow component organization pattern (imports → types → constants → component)
