# Design System

## CSS Custom Properties

All styles reference tokens from `src/styles/variables.css`. **Never hardcode** colors, spacing, sizes, or shadows.

### Token Categories

| Category | Pattern | Example |
|----------|---------|---------|
| Primary Colors | `--color-primary-{50-900}` | `var(--color-primary-500)` |
| Secondary Colors | `--color-secondary-{50-900}` | `var(--color-secondary-600)` |
| Semantic Colors | `--color-{success,warning,error,info}-{50,500,600,700}` | `var(--color-error-500)` |
| Gray Scale | `--color-gray-{0-900}` | `var(--color-gray-200)` |
| Backgrounds | `--bg-{app,paper,elevated,overlay}` | `var(--bg-paper)` |
| Text | `--text-{primary,secondary,disabled,link,link-hover}` | `var(--text-secondary)` |
| Borders | `--border-{default,light,medium,focus,error}` | `var(--border-default)` |
| Interactive | `--bg-{hover,selected,selected-hover}` | `var(--bg-hover)` |
| Spacing | `--spacing-{xs,sm,md,lg,xl,2xl,3xl}` | `var(--spacing-md)` (16px) |
| Font Size | `--font-size-{xs,sm,md,lg,xl,2xl,3xl}` | `var(--font-size-sm)` (14px) |
| Font Weight | `--font-weight-{light,regular,medium,semibold,bold}` | `var(--font-weight-semibold)` |
| Line Height | `--line-height-{tight,normal,relaxed}` | `var(--line-height-normal)` |
| Radius | `--radius-{xs,sm,md,lg,xl,full}` | `var(--radius-md)` (8px) |
| Shadows | `--shadow-{xs,sm,md,lg,xl}` | `var(--shadow-sm)` |
| Transitions | `--transition-{fast,normal,slow}` | `var(--transition-fast)` (150ms) |
| Z-Index | `--z-{base,dropdown,sticky,overlay,modal,notification,max}` | `var(--z-modal)` |

### Spacing Scale

| Token | Value |
|-------|-------|
| `--spacing-xs` | 4px |
| `--spacing-sm` | 8px |
| `--spacing-md` | 16px |
| `--spacing-lg` | 24px |
| `--spacing-xl` | 32px |
| `--spacing-2xl` | 48px |
| `--spacing-3xl` | 64px |

---

## Dark Mode

Dark mode is controlled by Mantine's `[data-mantine-color-scheme='dark']` attribute on the root element.

### Rules

1. Use **semantic variables** (`--bg-paper`, `--text-primary`, `--border-default`) — they auto-switch between modes
2. Never use raw color tokens (`--color-gray-900`) for surfaces/text — use semantic aliases
3. Raw color tokens are allowed for decorative elements (badges, status dots)
4. Test both modes when adding new styles

### Semantic Variables (auto-switch)

| Variable | Light | Dark |
|----------|-------|------|
| `--bg-app` | `#fafafa` | `#242424` |
| `--bg-paper` | `#ffffff` | `gray-800` |
| `--bg-elevated` | `#ffffff` | `gray-700` |
| `--text-primary` | `gray-900` | `gray-50` |
| `--text-secondary` | `gray-600` | `gray-400` |
| `--border-default` | `gray-200` | `gray-700` |
| `--bg-hover` | `gray-100` | `rgba(blue, 0.1)` |
| `--bg-selected` | `primary-50` | `rgba(blue, 0.2)` |

---

## Mantine Theme Configuration

Defined in `src/theme/mantineTheme.ts`. Sets up Mantine component defaults that align with the CSS variables.

### Key Defaults

- **Default radius**: `md` (8px)
- **Primary color**: `primary` (blue)
- **Cursor type**: `pointer`
- **Font**: Inter

### Component Defaults

| Component | Defaults |
|-----------|----------|
| Button | `radius: md` |
| Paper | `shadow: sm, radius: md, p: md` |
| Card | `shadow: sm, radius: md, padding: lg` |
| Modal | `radius: lg, shadow: xl` |
| Input | `radius: sm` |

---

## Typography

- **Primary font**: Inter (fallback: system fonts)
- **Monospace font**: Fira Code (fallback: Monaco, Courier New)
- **Base size**: 14px (`--font-size-sm`) for body text
- **Headings**: Use Mantine `Title` component or `<h1>`–`<h6>` tags

---

## CSS Module Conventions

1. One `.module.css` per component
2. Use `composes` sparingly — prefer CSS Custom Properties
3. Class naming: camelCase (e.g., `.sectionCard`, `.tabPanelScrollArea`)
4. No global styles — only CSS Modules or `variables.css`
5. Use Mantine's `styles` prop for component internal overrides

### Common Pattern

```css
.container {
  background: var(--bg-paper);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
}

.title {
  color: var(--text-primary);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.subtitle {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}
```

---

## Using Mantine vs CSS

- **Mantine first**: Use Mantine `Stack`, `Group`, `Text`, `Paper`, etc. for layout and typography
- **CSS Modules**: Use for custom layout, animations, or complex styling
- **Mantine `styles` prop**: Use for overriding internal Mantine component styles
- **Never inline styles** except through Mantine's `styles` prop
