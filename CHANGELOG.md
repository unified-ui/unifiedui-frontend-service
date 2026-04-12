# Changelog

All notable changes to the unified-ui Frontend Service will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Conventional Commits](https://www.conventionalcommits.org/).

## [Unreleased]

### Fixed

- Workflow runs table now uses IntersectionObserver for infinite scroll instead of a manual "Load more" button, matching the TracesTable pattern
- Added empty response guard to prevent infinite fetch loops when no more data is available

### Added

- Initial project setup with React 19, TypeScript 5.9, Vite 7, Mantine v8
- Multi-tenant architecture with organization and tenant-level RBAC
- Unified chat interface with SSE streaming support
- Multi-platform agent support (Microsoft Foundry, n8n, LangGraph, Copilot, custom)
- Widget designer for embeddable chat widgets
- Centralized tracing visualization (canvas + hierarchy views)
- Multi-provider authentication (Microsoft Entra ID, Google, AWS Cognito)
- ReACT Agent developer page with in-browser testing
- Internationalization (i18next, en-US)
- Dashboard with agent statistics and recent activity
- Credential management with encrypted secret storage
- Autonomous agent management with scheduling
- Conversation management with sidebar navigation
- CI/CD pipelines (tests, lint, CodeQL, dependency review)
- Pre-commit hooks (ESLint, Prettier, TypeScript, commitlint)
- Open source documentation (README, CONTRIBUTING, SECURITY, SPONSORS, TOOLING)
- Architecture Decision Records (ADRs)
