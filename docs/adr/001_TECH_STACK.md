# ADR-001: Tech Stack Selection

|                     |                 |
| ------------------- | --------------- |
| **Status**          | Accepted        |
| **Date**            | 2025-01-15      |
| **Decision Makers** | Enrico Goerlitz |

## Context

The unified-ui platform needs a frontend application that serves as the single interface for managing and interacting with heterogeneous AI agent systems. The frontend must support:

- Complex real-time chat interfaces with SSE streaming
- Rich data visualization (tracing graphs, canvas views)
- Enterprise authentication (Microsoft Entra ID, multi-tenant)
- Responsive design with dark mode support
- Rapid development with a mature component ecosystem
- Type safety for a large and growing codebase

## Decision

| Technology     | Choice                     | Alternatives Considered               |
| -------------- | -------------------------- | ------------------------------------- |
| **Framework**  | React 19                   | Vue 3, Angular 17, Svelte 5           |
| **Language**   | TypeScript 5.9 (strict)    | JavaScript                            |
| **Build Tool** | Vite 7                     | webpack 5, Turbopack, esbuild         |
| **UI Library** | Mantine v8                 | MUI, Ant Design, Chakra UI, shadcn/ui |
| **Icons**      | Tabler Icons               | Lucide, Heroicons, Material Icons     |
| **Routing**    | React Router v7            | TanStack Router, Next.js App Router   |
| **State**      | React Context              | Redux, Zustand, Jotai, MobX           |
| **Auth**       | MSAL (@azure/msal-browser) | Auth0, Clerk, Firebase Auth           |
| **i18n**       | i18next + react-i18next    | react-intl, LinguiJS                  |
| **Testing**    | Vitest + RTL + MSW         | Jest, Cypress, Playwright             |
| **Linting**    | ESLint 9 (flat config)     | Biome                                 |
| **Formatting** | Prettier                   | Biome                                 |

## Rationale

### React 19

- Largest ecosystem and community support
- Concurrent features (Suspense, transitions) benefit streaming UIs
- Deep integration with MSAL for Microsoft auth
- Mature tooling for complex SPAs

### TypeScript 5.9 (strict mode)

- Essential for a codebase with 200+ source files
- Strict mode catches bugs at compile time
- Better IDE support and refactoring confidence

### Vite 7

- Near-instant HMR for rapid frontend development
- Native ESM support, no bundler lock-in
- First-class TypeScript and React support
- Vitest shares the same config

### Mantine v8

- Rich component set covering 80%+ of UI needs out of the box
- CSS-in-JS-free (uses CSS modules + custom properties) — aligns with our styling strategy
- Excellent dark mode support with semantic token system
- Active maintenance and good TypeScript types

### React Context (over Redux/Zustand)

- Sufficient for the app's state patterns (auth, tenant, theme, sidebar)
- No additional dependencies
- Straightforward patterns for 10 contexts
- Server state is not globally cached (fetched per page)

### i18next

- Most mature i18n solution for React
- Namespace support aligns with our 12-namespace structure
- Easy to add new languages later
- Browser language detection built-in

## Consequences

### Positive

- Mature, well-documented tech stack with strong community
- Type safety reduces runtime errors
- Mantine components accelerate UI development
- Shared Vite config for build and test reduces configuration overhead

### Negative

- React Context can cause unnecessary re-renders with deep provider nesting (mitigated by careful context splitting)
- Mantine upgrade cycles require coordinated migration
- No Server-Side Rendering (acceptable for an enterprise SPA behind auth)

### Risks

- Mantine v8 is relatively new — potential for minor breaking changes in patch versions
- React 19 concurrent features require careful adoption
