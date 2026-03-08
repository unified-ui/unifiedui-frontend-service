# ADR-006: Testing Strategy

|                     |                 |
| ------------------- | --------------- |
| **Status**          | Accepted        |
| **Date**            | 2025-03-01      |
| **Decision Makers** | Enrico Goerlitz |

## Context

The frontend application needs a testing strategy that:

- Catches regressions before deployment
- Tests components in realistic conditions (with providers, routing, etc.)
- Mocks external dependencies (API calls, authentication)
- Runs fast enough for CI and developer workflow
- Achieves meaningful coverage (target: 80%)

## Decision

### Test Stack

| Tool                            | Purpose                               |
| ------------------------------- | ------------------------------------- |
| **Vitest**                      | Test runner (shared Vite config)      |
| **React Testing Library (RTL)** | Component rendering and interaction   |
| **@testing-library/jest-dom**   | Custom DOM matchers                   |
| **@testing-library/user-event** | Realistic user interaction simulation |
| **MSW (Mock Service Worker)**   | API mocking at the network level      |
| **jsdom**                       | Browser environment simulation        |

### Test Structure

```
src/
├── test/
│   ├── setup.ts                    # MSW lifecycle, global mocks
│   ├── utils.tsx                   # renderWithProviders()
│   └── mocks/
│       └── handlers.ts             # MSW request handlers
└── **/*.test.tsx                    # Co-located component tests
```

### Patterns

#### 1. Component Tests (Primary)

```typescript
import { renderWithProviders } from '../test/utils';

describe('ChatAgentCard', () => {
  it('renders agent name and status', () => {
    renderWithProviders(<ChatAgentCard agent={mockAgent} />);
    expect(screen.getByText('Test Agent')).toBeInTheDocument();
  });
});
```

#### 2. API Mocking (MSW)

```typescript
// MSW intercepts fetch calls at the network level
server.use(
  http.get("/api/agents", () => {
    return HttpResponse.json({ items: [mockAgent] });
  }),
);
```

#### 3. Context Mocking

```typescript
// renderWithProviders wraps components with all necessary providers
renderWithProviders(<AgentsPage />, {
  identity: { currentTenant: mockTenant },
});
```

### Rules

1. **Co-locate tests** — `Component.test.tsx` next to `Component.tsx`
2. **Test behavior, not implementation** — assert on visible output, not internal state
3. **Use `renderWithProviders()`** — never render components without the provider wrapper
4. **MSW for API mocks** — no manual fetch mocking
5. **Descriptive test names** — `it('shows error message when API call fails')`
6. **No snapshot tests** — they break on any UI change and provide little value
7. **Coverage target: 80%** — enforced in CI when reached

### Coverage Configuration

```typescript
// vite.config.ts
test: {
  coverage: {
    provider: 'v8',
    reporter: ['text', 'html', 'lcov'],
    include: ['src/**/*.{ts,tsx}'],
    exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/main.tsx', 'src/vite-env.d.ts'],
  },
}
```

## Rationale

### Why Vitest (not Jest)?

- Shares Vite configuration — one config for build and test
- Native ESM support (no CJS/ESM interop issues)
- Compatible with Jest API — easy migration
- Faster than Jest for Vite-based projects

### Why RTL (not Enzyme / direct DOM testing)?

- Tests user-visible behavior, not component implementation details
- Encourages accessible component design (query by role, label, text)
- Industry standard for React testing

### Why MSW (not axios-mock-adapter / fetch mock)?

- Mocks at the network level — works regardless of HTTP client used
- Realistic: components make real fetch calls, only the network response is mocked
- Reusable handlers across tests
- Can be used for both unit and integration tests

## Consequences

### Positive

- Realistic testing environment (providers, routing, API mocking)
- Fast test execution (Vitest + jsdom)
- Tests don't break when implementations change (behavior-focused)
- Shared test utilities reduce boilerplate

### Negative

- Current coverage is low (~10 test files for 223 source files) — significant effort needed to reach 80%
- Provider-heavy test setup can be slow for large component trees
- MSW setup requires maintaining mock handlers alongside API changes

### Action Items

- Priority 1: Add tests for critical paths (auth, chat, API client)
- Priority 2: Add tests for all pages (basic rendering + key interactions)
- Priority 3: Add tests for shared components (DataTable, dialogs)
- Enable 80% threshold in CI once coverage reaches that level
