# Branding System

## Overview

The branding system provides per-tenant customization of the login page (and future app-wide theming) — **purely frontend**, no backend/DB involved.

Active branding is set via `ACTIVE_BRANDING` in `src/config/branding.config.ts`. Change this single string to switch the entire app's branding.

---

## File Structure

```
src/config/
├── branding.types.ts        # BrandingConfig, LoginBranding, AppBranding, BrandingTypography
├── branding.config.ts       # ACTIVE_BRANDING + DEFAULT_BRANDING + TENANT_BRANDINGS + activeBranding
└── index.ts                 # Barrel export

src/hooks/
└── useBranding.ts           # Hook: reads ?tenant= → returns full BrandingConfig

public/branding/
├── default/
│   ├── logo.svg             # Default unified-ui logo (brain icon)
│   └── icon.svg             # Default hero icon (neural network)
└── asklepios/
    ├── logo.svg             # Asklepios logo + text
    └── icon.svg             # Rod of Asclepius
```

---

## BrandingConfig Structure

```typescript
interface BrandingConfig {
  slug: string;
  displayName: string;
  logoUrl: string | null; // Small logo top-left (null = fallback icon)
  iconUrl: string | null; // Large icon right panel (null = default/icon.svg)
  faviconUrl: string | null; // Browser favicon

  login: LoginBranding; // Login page colors + text
  app: AppBranding; // Header/sidebar colors (future use)
  typography: BrandingTypography; // Font family/size (future use)
}
```

### LoginBranding

| Field               | Type             | Purpose                              |
| ------------------- | ---------------- | ------------------------------------ |
| `bgLeft`            | `string`         | CSS background for left panel        |
| `bgRight`           | `string`         | CSS background for right panel       |
| `textColor`         | `string`         | Text color on left panel             |
| `heading`           | `string \| null` | Custom heading (null = i18n default) |
| `buttonBorderColor` | `string`         | Auth button border                   |
| `buttonHoverBg`     | `string`         | Auth button hover background         |

### AppBranding (future)

| Field                                        | Purpose             |
| -------------------------------------------- | ------------------- |
| `headerBg` / `headerTextColor`               | Header colors       |
| `sidebarBg` / `sidebarTextColor`             | Sidebar colors      |
| `sidebarActiveBg` / `sidebarActiveTextColor` | Active sidebar item |

### BrandingTypography (future)

| Field               | Purpose                             |
| ------------------- | ----------------------------------- |
| `fontFamily`        | Primary font                        |
| `headingFontFamily` | Heading font (fallback: fontFamily) |
| `baseFontSize`      | Base font size in px                |

---

## How to Add a New Customer Branding

### Step 1: Add assets

```bash
public/branding/<slug>/logo.svg   # Small logo (~40px height)
public/branding/<slug>/icon.svg   # Large hero icon for right panel
```

### Step 2: Add config entry

In `src/config/branding.config.ts`, add to `TENANT_BRANDINGS`:

```typescript
neuerkunde: {
  displayName: 'Neuer Kunde',
  logoUrl: '/branding/neuerkunde/logo.svg',
  iconUrl: '/branding/neuerkunde/icon.svg',
  login: {
    bgLeft: '#1A2B3C',
    bgRight: '#0F1E2D',
  },
},
```

Only override fields that differ from `DEFAULT_BRANDING`. The `deepMerge()` resolver fills in everything else.

### Step 3: Set active & deploy

In `src/config/branding.config.ts`:

```typescript
const ACTIVE_BRANDING: string = "neuerkunde";
```

Deploy — done.

---

## How to Modify Existing Branding

- **Switch active branding**: Change `ACTIVE_BRANDING` in `branding.config.ts` (e.g. `'default'` → `'asklepios'`)
- **Change default**: Edit `DEFAULT_BRANDING` in `branding.config.ts`
- **Change customer**: Edit the entry in `TENANT_BRANDINGS`
- **Change assets**: Replace SVG/PNG files in `public/branding/<slug>/`

---

## useBranding() Hook

```typescript
const branding = useBranding();
// Synchronous — returns the resolved activeBranding from config
```

Used in `LoginPage`. Returns full `BrandingConfig` (merged default + active override).

---

## Login Page Layout

Split-screen: left panel (2/3) has brand header + login content, right panel (1/3) has large hero icon.

- Left: logo + displayName top-left, heading + auth buttons centered
- Right: large icon, semi-transparent
- Mobile (<768px): right panel hidden

All colors/backgrounds applied via inline styles from `BrandingConfig.login`.

---

## Rules

1. **No backend** — branding is 100% frontend config
2. **Single active branding** — set `ACTIVE_BRANDING` in `branding.config.ts`, one value per deployment
3. **Partial overrides only** — customer entries use `DeepPartial<BrandingConfig>`, only specify what differs
4. **Assets in public/** — served statically at `/branding/<slug>/filename`
5. **Null = fallback** — `logoUrl: null` shows a gradient fallback icon, `iconUrl: null` shows `default/icon.svg`
6. **i18n headings** — `heading: null` uses the i18n key `login:loginHeading`; set a string to override
