# Testing Instructions

## Stack

- **Vitest 4+** — Test runner (configured in `vite.config.ts`)
- **@testing-library/react** — Component rendering + queries
- **@testing-library/jest-dom** — DOM matchers (`toBeInTheDocument()`)
- **@testing-library/user-event** — User interaction simulation
- **MSW (Mock Service Worker)** — API mocking at network level
- **jsdom** — Browser environment simulation

---

## Quick Reference

```bash
npx vitest run          # Run all tests once
npx vitest              # Watch mode
npx vitest run --coverage  # Coverage report
```

---

## File Locations

| What           | Path                              |
| -------------- | --------------------------------- |
| Vitest config  | `vite.config.ts` → `test` section |
| Setup file     | `src/test/setup.ts`               |
| Test utils     | `src/test/utils.tsx`              |
| MSW handlers   | `src/test/mocks/handlers.ts`      |
| MSW server     | `src/test/mocks/server.ts`        |
| Test files     | `src/test/__tests__/*.test.tsx`   |
| i18n for tests | `src/i18n/i18nForTests.ts`        |

---

## Writing Tests

### Use `renderWithProviders()`

All component tests should use the helper from `src/test/utils.tsx`:

```typescript
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../utils';

renderWithProviders(<MyComponent />);
expect(screen.getByText('Expected text')).toBeInTheDocument();
```

This wraps components with `MantineProvider`, `I18nextProvider`, and `MemoryRouter`.

### Mocking Contexts

Components that use contexts (`useIdentity`, `useAuth`, `useSidebarData`, `useChatSidebar`, `useAuthContext`, `useTenantContext`, `useApiClient`, `useFavorites`, `useRecentVisits`) need vi.mock:

```typescript
vi.mock("../../contexts", () => ({
  useIdentity: vi.fn(),
  useSidebarData: vi.fn().mockReturnValue({
    /* defaults */
  }),
  useChatSidebar: vi.fn().mockReturnValue({
    isVisible: false,
    onSidebarHoverEnter: vi.fn(),
    onSidebarHoverLeave: vi.fn(),
  }),
}));

vi.mock("../../auth", () => ({
  useAuth: vi.fn().mockReturnValue({
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
    account: { username: "test@example.com" },
  }),
}));
```

### Testing Components with MainLayout

Components wrapped in `MainLayout` render Header + Sidebar + GlobalChatSidebar, which use `useAuth`, `useIdentity`, `useSidebarData`, and `useChatSidebar`. Mock ALL of these.

Text that appears in both Header and page content (e.g., user name, tenant name) will cause `getByText` to fail with "found multiple elements". Use `getAllByText` with `.length` assertion instead.

### Test Naming

| Pattern             | Example                                                    |
| ------------------- | ---------------------------------------------------------- |
| Test file           | `{component}.test.tsx`                                     |
| Describe block      | `describe('ComponentName', () => { ... })`                 |
| Test case           | `it('shows loading state', () => { ... })`                 |
| German string check | `it('does not contain any German strings', () => { ... })` |

### MSW Handlers

Add API mock handlers in `src/test/mocks/handlers.ts`. Use `http.get()`, `http.post()`, etc. from MSW.

---

## Rules

1. Tests go in `src/test/__tests__/`
2. Always use `renderWithProviders()` — never raw `render()`
3. Mock all context hooks used by the component tree
4. Use `screen` queries from `@testing-library/react`
5. Prefer `getByText`, `getByRole`, `getByPlaceholderText` over `querySelector`
6. Run `npx vitest run` after writing tests to verify they pass
7. Include a "no German strings" test for i18n-refactored components
