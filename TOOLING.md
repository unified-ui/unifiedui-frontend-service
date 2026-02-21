# Tooling Guide — Frontend Service

This document describes the development tooling, workflows, and quality gates for the unified-ui Frontend Service.

## Prerequisites

| Tool       | Version | Installation                                                     |
| ---------- | ------- | ---------------------------------------------------------------- |
| Node.js    | 22+     | [nodejs.org](https://nodejs.org/)                                |
| npm        | 10+     | Included with Node.js                                            |
| pre-commit | latest  | `pip install pre-commit`                                         |
| commitlint | latest  | `npm install -g @commitlint/cli @commitlint/config-conventional` |

## Quick Commands

```bash
# Development
npm run dev                  # Start dev server with HMR
npm run build                # Production build
npm run preview              # Preview production build

# Testing
npx vitest run               # Run all tests
npx vitest                   # Run tests in watch mode
npx vitest run --coverage    # Run tests with coverage

# Code Quality
npm run lint                 # ESLint
npx tsc --noEmit             # TypeScript type check

# Dependencies
npm install                  # Install dependencies
npm ci                       # Clean install (CI)
npm update                   # Update dependencies
```

## Pre-commit Hooks

Install hooks once per clone:

```bash
pre-commit install
pre-commit install --hook-type commit-msg
```

Hooks run automatically on `git commit`. Manual run:

```bash
pre-commit run --all-files
```

## Commit Convention

Commits must follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

**Examples**:

```
feat(components): add ChatAgentCard component
fix(auth): handle MSAL token refresh errors
docs(readme): update development setup instructions
chore(deps): update mantine to v8.1.0
```

## Code Quality Gates

### Linting (ESLint)

Configuration: `eslint.config.js`

Key rules enforced:

- React hooks rules
- TypeScript strict checks
- Import ordering
- No unused variables/imports

### Type Checking (TypeScript)

Configuration: `tsconfig.json` / `tsconfig.app.json`

Strict mode enabled with:

- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noFallthroughCasesInSwitch: true`

### Testing (Vitest + RTL)

- Test location: `src/**/*.test.tsx` and `src/test/`
- Naming: `{ComponentName}.test.tsx`
- Coverage target: **80%**
- Utilities: `renderWithProviders()` in `src/test/utils.tsx`

## CI/CD Workflows

| Workflow                 | Trigger        | Job                            |
| ------------------------ | -------------- | ------------------------------ |
| `ci-tests-and-lint.yml`  | push/PR        | Tests, lint, type check, build |
| `ci-pr-branch-check.yml` | PR             | Branch naming check            |
| `codeql.yml`             | push/PR/weekly | Security scanning              |

## Security

- **Dependabot** updates dependencies weekly (Mondays 09:00 CET)
- **CodeQL** scans for vulnerabilities on every push and weekly
- **npm audit** should be run periodically: `npm audit`

## IDE Configuration

### VS Code

Recommended extensions:

- `dbaeumer.vscode-eslint`
- `esbenp.prettier-vscode`
- `EditorConfig.EditorConfig`
- `bradlc.vscode-tailwindcss` (if using Tailwind)

Settings (`.vscode/settings.json`):

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ]
}
```

### WebStorm

- Enable ESLint integration
- Set Prettier as default formatter
- Enable EditorConfig support

## Styling

### CSS Custom Properties

All colors, spacing, and typography defined in `src/styles/variables.css`.

**Never hardcode values** — always use `var(--*)`:

```css
.component {
  color: var(--color-text-primary);
  padding: var(--spacing-md);
}
```

### CSS Modules

One `.module.css` per component. Import as:

```tsx
import styles from "./MyComponent.module.css";
```

### Dark Mode

Use semantic CSS variables that automatically switch between light/dark themes. Test both modes during development.
