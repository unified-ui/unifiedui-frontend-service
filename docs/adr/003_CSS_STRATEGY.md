# ADR-003: CSS Strategy — Modules + Custom Properties + Mantine

|                     |                 |
| ------------------- | --------------- |
| **Status**          | Accepted        |
| **Date**            | 2025-02-01      |
| **Decision Makers** | Enrico Goerlitz |

## Context

The frontend needs a consistent styling approach that supports:

- Dark mode / light mode switching
- Consistent design tokens across 60+ components
- Component-scoped styles (no global class name collisions)
- Integration with Mantine v8's theming system
- Developer ergonomics (easy to read, write, and maintain)

Options considered:

1. **CSS Modules + Custom Properties** (chosen)
2. CSS-in-JS (Emotion, styled-components)
3. Tailwind CSS
4. Plain CSS with BEM

## Decision

### Three-Layer Styling Architecture

```
Layer 1: CSS Custom Properties (Design Tokens)
  └── src/styles/variables.css (~320 lines)
  └── Defines: colors, backgrounds, text, borders, spacing, typography, shadows, transitions

Layer 2: Mantine Theme
  └── src/theme/mantineTheme.ts
  └── Maps design tokens to Mantine's theme API
  └── Configures: colors, spacing, radius, fonts, component defaults

Layer 3: CSS Modules (Component Styles)
  └── src/components/*/ComponentName.module.css
  └── Uses: var(--*) custom properties exclusively
  └── Scoped: class names are auto-hashed to prevent collisions
```

### Rules

1. **Never hardcode values** — always use `var(--color-*)`, `var(--spacing-*)`, etc.
2. **One `.module.css` per component** — co-located with the component file
3. **Mantine's `styles` prop** for overriding Mantine component internals
4. **No inline styles** except via Mantine's `styles` prop
5. **Semantic variable names** — `var(--color-bg-primary)` not `var(--white)`
6. **Dark mode via CSS** — custom properties automatically switch values based on `[data-mantine-color-scheme]`

### Custom Properties Structure

```css
/* Colors */
--color-text-primary, --color-text-secondary, --color-text-muted
--color-bg-primary, --color-bg-secondary, --color-bg-hover
--color-border-primary, --color-border-secondary
--color-accent-primary, --color-accent-secondary

/* Spacing (8px base) */
--spacing-xxs: 2px  → --spacing-xxl: 48px

/* Typography */
--font-family-primary: 'Inter', sans-serif
--font-family-code: 'Fira Code', monospace
--font-size-xs: 0.625rem → --font-size-xxl: 1.5rem
```

## Rationale

### Why CSS Modules (not CSS-in-JS)?

- Zero runtime overhead (styles are extracted at build time)
- Native CSS — no learning curve, works with any CSS tool
- Scoped by default (no class name collisions)
- Better performance than runtime CSS-in-JS solutions
- Vite has first-class CSS Module support

### Why Custom Properties (not Tailwind)?

- Semantic naming provides better readability (`var(--color-bg-hover)` vs `bg-slate-100 dark:bg-slate-800`)
- Single source of truth for design tokens
- Dark mode is handled by CSS, not by JavaScript
- Easier to maintain consistency in a 60+ component codebase
- Custom properties compose well with Mantine's theme system

### Why Not Pure Mantine Theming?

- Mantine's theme API covers components but not layout/spacing/custom styles
- Custom properties provide finer control for custom components
- CSS custom properties work in `.module.css` files without JS imports

## Consequences

### Positive

- Zero runtime styling overhead
- Dark mode works out of the box via CSS custom property switching
- Consistent design tokens across all components
- Easy to add new themes (swap variable values)

### Negative

- Two sources of design tokens (CSS custom properties + Mantine theme) — must be kept in sync
- Custom properties don't provide TypeScript auto-completion (mitigated by documentation)
- `variables.css` (320 lines) can grow large — consider splitting by category if it exceeds 500 lines
