---
applyTo: '.github/**'
---

# GitHub Pipelines — Frontend Service

## Workflow Naming Convention

All workflow files follow a prefix-based naming convention:

| Prefix | Purpose | Example |
|--------|---------|---------|
| `ci-` | Continuous Integration (lint, test, build) | `ci-tests-and-lint.yml` |
| `cd-` | Continuous Deployment (deploy to environments) | `cd-deploy-staging.yml` |
| `ci-int-tests-` | Integration test suites | `ci-int-tests-api.yml` |
| `ci-e2e-tests-` | End-to-end test suites | `ci-e2e-tests-playwright.yml` |

The `name:` field inside each workflow MUST match the filename (without `.yml`).

---

## Current Workflows

### ci-tests-and-lint.yml

**Triggers**: push/pull_request to `main`/`develop`, workflow_dispatch

| Job | What it does |
|-----|-------------|
| **lint** | `tsc --noEmit` + `npm run lint` (ESLint) |
| **test** | `vitest run --coverage` with coverage artifact upload |

**Coverage**: Reported but not enforced yet. Target is 80% — enforce once test coverage reaches that level.

### ci-pr-branch-check.yml

**Triggers**: pull_request to `main`

Validates that PRs to `main` originate from a `release/*` branch.

---

## Adding a New Workflow

1. Choose the correct prefix (`ci-`, `cd-`, `ci-int-tests-`, `ci-e2e-tests-`)
2. Create `.github/workflows/{prefix}{descriptive-name}.yml`
3. Set `name:` to match filename without extension
4. Add appropriate triggers (`on:`)
5. Update this instruction file

---

## Tool Versions

| Tool | Version | Config |
|------|---------|--------|
| Node.js | 22 | `setup-node@v4` |
| TypeScript | ~5.9 | `tsconfig.json` |
| ESLint | ≥9.39 | `eslint.config.js` |
| Vitest | ≥4.0 | `vite.config.ts` (`test` block) |
| @vitest/coverage-v8 | latest | Coverage provider |

---

## Coverage Policy

- **Target threshold**: 80% (not yet enforced — current coverage is low)
- **Run locally**: `npm run test:coverage` (generates `coverage/` directory)
- **Coverage config**: `vite.config.ts` → `test.coverage` block
- Once coverage reaches 80%, add threshold to `vite.config.ts`:
  ```typescript
  coverage: {
    // ...existing config
    thresholds: {
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
  },
  ```

---

## Dependencies

Coverage requires `@vitest/coverage-v8` as a devDependency (already installed).

---

## Secrets

No GitHub secrets are currently required. If adding Codecov integration later, set `CODECOV_TOKEN` as a repository secret.
