# ADR-004: State Management — React Context Pattern

|                     |                 |
| ------------------- | --------------- |
| **Status**          | Accepted        |
| **Date**            | 2025-02-01      |
| **Decision Makers** | Enrico Goerlitz |

## Context

The frontend application needs to share state across components for:

- Authentication (user identity, tokens, login/logout)
- Tenant selection (current organization and tenant)
- API client (pre-configured fetch wrapper)
- Sidebar data (navigation structure, favorites, recent visits)
- AI capabilities (feature flags per agent type)
- Chat state (active conversations, streaming)
- Theme (light/dark mode — handled by Mantine)

Options considered:

1. **React Context** (chosen)
2. Redux Toolkit
3. Zustand
4. Jotai / Recoil

## Decision

Use **React Context** with a composition pattern of 10 focused contexts:

| Context                 | Scope            | Key State                            |
| ----------------------- | ---------------- | ------------------------------------ |
| `AuthContext`           | Authentication   | user, token, login(), logout()       |
| `TenantContext`         | Tenant selection | currentOrg, currentTenant, switch()  |
| `ApiClientContext`      | API access       | pre-configured client instance       |
| `IdentityContext`       | Composite        | Wraps Auth + Tenant + ApiClient      |
| `SidebarDataContext`    | Navigation       | agent lists, navigation items        |
| `ChatSidebarContext`    | Chat navigation  | conversations, active chat           |
| `AICapabilitiesContext` | Feature flags    | per-agent-type capabilities          |
| `FavoritesContext`      | User favorites   | favorited agents/conversations       |
| `RecentVisitsContext`   | Recent items     | recently visited pages               |
| `TracingContext`        | Tracing views    | trace data, selected node, view mode |

### Provider Hierarchy

```
MantineProvider (theme)
  └── I18nextProvider (translations)
      └── IdpWrapper (auth provider selection)
          └── AuthProvider
              └── IdentityProvider (= Auth + Tenant + ApiClient)
                  └── AICapabilitiesProvider
                      └── FavoritesProvider
                          └── RecentVisitsProvider
                              └── SidebarDataProvider
                                  └── App
```

### Data Fetching Pattern

Server state is **not** stored in global contexts. Each page fetches its own data:

```typescript
// Page-level data fetching (not global)
const AgentsPage: FC = () => {
  const { apiClient } = useIdentity();
  const { items, loading } = useEntityList(() => apiClient.getAgents());
  // ...
};
```

## Rationale

### Why React Context (not Redux/Zustand)?

- **Simplicity**: 10 contexts with clear boundaries are simpler than a global store
- **No additional dependencies**: React Context is built-in
- **Sufficient for our patterns**: auth, tenant, and navigation state rarely causes performance issues
- **Server state is page-scoped**: we don't need global caching (no TanStack Query / SWR pattern needed yet)

### Why Not Zustand?

- Zustand shines for complex cross-cutting state — our state is naturally tree-shaped
- Adding Zustand would introduce a new pattern alongside existing contexts
- The performance benefits are negligible for our use case (10 contexts, most rarely update)

### Why Composition (IdentityContext)?

- `IdentityContext` wraps 3 closely related contexts (Auth, Tenant, ApiClient)
- Components use `useIdentity()` instead of 3 separate hooks
- Reduces provider nesting while keeping contexts internally separate

## Consequences

### Positive

- Zero additional dependencies for state management
- Clear ownership: each context has one responsibility
- Easy to understand: state flows top-down through the component tree
- Testable: `renderWithProviders()` wraps components with mock contexts

### Negative

- Deep provider nesting (8+ levels) can obscure the component tree
- Context updates trigger re-renders for all consumers (mitigated by context splitting)
- No built-in devtools (Redux DevTools, Zustand devtools)
- Manual caching for server data (no automatic revalidation like SWR / TanStack Query)

### Future Considerations

- If server state caching becomes a pain point, consider adding TanStack Query for API data
- If re-render performance becomes an issue, consider Zustand for high-frequency state (e.g., chat streaming)
