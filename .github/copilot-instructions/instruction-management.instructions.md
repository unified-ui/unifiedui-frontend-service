# Instruction Management

## When to Update Instructions

### DO update when:

| Trigger | Action |
|---------|--------|
| New reusable component created | Add to `react-structure.instructions.md` component catalog |
| New UI pattern established | Add to `ui-patterns.instructions.md` |
| New complex component (>300 lines, multiple files) | Consider dedicated `components/*.instructions.md` |
| Folder structure changed | Update `react-structure.instructions.md` |
| New API resource added | Update `api-client.instructions.md` |
| Design tokens added/changed | Update `design-system.instructions.md` |
| New context created | Update `react-structure.instructions.md` contexts table |
| New route added | Update `react-structure.instructions.md` routes table |

### NEVER update for:

- Bug fixes
- Simple prop changes
- One-off page-specific code
- Refactors that don't change public API
- Style tweaks within existing patterns

---

## Review Checklist

After completing work, ask yourself:

1. Did I create a new component that other pages might reuse? → Document it
2. Did I solve a tricky problem with a pattern that should be repeated? → Document the pattern
3. Did I change folder structure? → Update structure docs
4. Did I add a new route? → Update routes table
5. Is the component complex enough for its own instruction file? → 300+ lines, multiple sub-components, non-obvious state management

---

## File Responsibilities

| File | Covers |
|------|--------|
| `copilot-instructions.md` | Project overview, golden rules, naming, quick reference |
| `react-structure.instructions.md` | Folder structure, component catalog, routes, contexts |
| `design-system.instructions.md` | CSS tokens, dark mode, Mantine theme, CSS Module conventions |
| `api-client.instructions.md` | API client architecture, adding endpoints, types patterns |
| `ui-patterns.instructions.md` | Scrolling, tabs, dialogs, lists, event handling |
| `instruction-management.instructions.md` | This file — when/how to update docs |
| `components/layout.instructions.md` | MainLayout, Sidebar, Header |
| `components/data-table.instructions.md` | DataTable, toolbar, infinite scroll, filtering |
| `components/tracing.instructions.md` | Trace visualization, canvas, hierarchy, context |

---

## Principles

- Keep instructions **concise** — patterns and rules, not prose
- Use **tables** for catalogs and mappings
- Include **code snippets** only for non-obvious patterns
- Reference file paths so readers can find the source
- English language in all instruction files
