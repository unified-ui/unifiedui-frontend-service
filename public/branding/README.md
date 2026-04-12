# Branding Assets

This folder contains branding assets (icons, logos) for different deployments.

## Folder Structure

```
branding/
├── default/           # Default unified-ui branding
│   ├── icon.svg      # Header icon (36x36)
│   ├── logo.svg      # Full logo for login page
│   └── favicon.svg   # Browser tab icon (optional, uses icon.svg)
├── emtec/            # Example: emtec e.V. custom branding
│   ├── icon.svg
│   └── logo.svg
└── mycompany/        # Your custom branding folder
    ├── icon.svg
    └── logo.svg
```

## Customization (OSS)

To customize branding for your deployment:

### Option 1: Override Default Assets

Simply replace files in `default/`:

1. Replace `icon.svg` with your own (36x36px recommended)
2. Replace `logo.svg` with your own (max-height 36px, max-width 180px)
3. The files are in `.gitignore` so your changes won't conflict with upstream

### Option 2: Custom Branding Folder

1. Create a new folder: `branding/mycompany/`
2. Add your `icon.svg` and `logo.svg`
3. Set `VITE_BRANDING_SLUG=mycompany` in `.env`
4. Add branding config in `src/config/branding.config.ts`:

```typescript
export const TENANT_BRANDINGS: Record<string, DeepPartial<BrandingConfig>> = {
  mycompany: {
    displayName: "My Company",
    logoUrl: "/branding/mycompany/logo.svg",
    iconUrl: "/branding/mycompany/icon.svg",
    login: {
      bgLeft: "linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)",
      bgRight: "linear-gradient(160deg, #16213e 0%, #0f3460 50%, #16213e 100%)",
    },
    enabledIdps: ["microsoft", "oidc"],
  },
};
```

## Environment Variables

| Variable             | Description                                                          | Default      |
| -------------------- | -------------------------------------------------------------------- | ------------ |
| `VITE_APP_TITLE`     | App title in header and browser tab                                  | `unified-ui` |
| `VITE_THEME_PRESET`  | Theme color preset: `default`, `ocean`, `forest`, `sunset`, `purple` | `default`    |
| `VITE_BRANDING_SLUG` | Folder name for assets                                               | `default`    |

## Theme Presets

Available theme presets affect primary colors and login page gradients:

| Preset    | Primary Color | Description                  |
| --------- | ------------- | ---------------------------- |
| `default` | Blue          | Standard unified-ui theme    |
| `ocean`   | Teal/Cyan     | Calming teal-based theme     |
| `forest`  | Green         | Nature-inspired green theme  |
| `sunset`  | Orange        | Warm, energetic orange theme |
| `purple`  | Purple        | Modern, creative feel        |

## Asset Guidelines

### Icon (`icon.svg`)

- Square format (36x36px recommended)
- Will be displayed in header and as login hero
- Use solid colors or simple gradients

### Logo (`logo.svg`)

- Max height: 36px
- Max width: 180px
- Horizontal format recommended
- Will appear on login page

## Platform Subtitle

When `VITE_APP_TITLE` is set to something other than `unified-ui`, a subtitle "powered by unified-ui" appears automatically in both:

- App header
- Login page header

This maintains brand attribution for OSS deployments.
