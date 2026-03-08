# Contributing to unified-ui Frontend

Thank you for your interest in contributing! 🎉

## Development Setup

```bash
# Clone the repository
git clone https://github.com/unified-ui/unified-ui-frontend-service.git
cd unified-ui-frontend-service

# Install dependencies
npm install

# Install pre-commit hooks
pre-commit install
pre-commit install --hook-type commit-msg

# Start development server
npm run dev
```

## Development Workflow

1. **Fork** the repository
2. **Create a branch** following the naming convention: `<type>/<description>`
   - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
   - Example: `feat/add-widget-designer`
3. **Make your changes** and write tests
4. **Run quality checks** locally:
   ```bash
   npx tsc --noEmit            # Type check
   npm run lint                # Lint
   npx vitest run              # Tests
   pre-commit run --all-files  # All hooks
   ```
5. **Commit** using [Conventional Commits](https://www.conventionalcommits.org/):
   ```
   feat(components): add ChatAgentCard component
   fix(auth): handle MSAL token refresh errors
   ```
6. **Push** and open a Pull Request

## Code Standards

- **TypeScript strict mode** — explicit types for all props, state, and API responses
- **No `any`** — use proper types or generics
- **Functional components** — `FC<Props>` pattern, hooks at top level
- **CSS Modules** — one `.module.css` per component, no inline styles
- **CSS Custom Properties** — never hardcode colors, spacing, or sizes
- **Mantine first** — use Mantine components before building custom ones
- **i18n** — all user-visible strings via `useTranslation()`
- **No comments** — code must be self-documenting (docstrings on complex utilities are OK)
- **Keep files under 400 lines** — split into sub-components if exceeding
- **Test coverage** target: **80%**

## PR Rules

- PRs to `main` must come from `develop` or `hotfix/*`
- PRs to `develop` must come from `feat/*`, `fix/*`, `docs/*`, `refactor/*`, `test/*`, `ci/*`, `chore/*`, or `hotfix/*`
- All PRs require passing CI (lint, type check, tests, build)
- Squash merge feature/fix branches for a clean history

## Reporting Issues

- Use GitHub Issues
- Include: browser, OS, steps to reproduce, expected vs. actual behavior, console errors, screenshots

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
