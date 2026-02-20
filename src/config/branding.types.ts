/**
 * Branding Configuration Types
 *
 * Defines the shape of all customizable branding options.
 * Used for the login page and (future) app-wide theming.
 */

// ─── Login Page Branding ──────────────────────────────────────

export interface LoginBranding {
  /** Background CSS value for the left panel */
  bgLeft: string;
  /** Background CSS value for the right panel */
  bgRight: string;
  /** Text color on the left panel */
  textColor: string;
  /** Custom heading text. null = use i18n default */
  heading: string | null;
  /** Auth button border color (usually semi-transparent white) */
  buttonBorderColor: string;
  /** Auth button hover background */
  buttonHoverBg: string;
}

// ─── App-Wide Branding ────────────────────────────────────────

export interface AppBranding {
  /** Header background color/gradient */
  headerBg: string;
  /** Header text color */
  headerTextColor: string;
  /** Sidebar background color */
  sidebarBg: string;
  /** Sidebar text color */
  sidebarTextColor: string;
  /** Sidebar active item background */
  sidebarActiveBg: string;
  /** Sidebar active item text color */
  sidebarActiveTextColor: string;
}

// ─── Typography ───────────────────────────────────────────────

export interface BrandingTypography {
  /** Primary font family */
  fontFamily: string;
  /** Heading font family (falls back to fontFamily) */
  headingFontFamily: string | null;
  /** Base font size in px */
  baseFontSize: number;
}

// ─── Full Branding Config ─────────────────────────────────────

export interface BrandingConfig {
  /** Unique slug (used in URL ?tenant=<slug>) */
  slug: string;
  /** Display name shown on login page and app header */
  displayName: string;
  /** Small logo (top-left corner) — URL or path. null = use default icon */
  logoUrl: string | null;
  /** Large icon/emblem (right panel of login) — URL or path. null = use default icon */
  iconUrl: string | null;
  /** Browser favicon. null = keep default */
  faviconUrl: string | null;

  /** Login page specific branding */
  login: LoginBranding;
  /** App-wide branding (header, sidebar) — for future use */
  app: AppBranding;
  /** Typography settings */
  typography: BrandingTypography;
}
