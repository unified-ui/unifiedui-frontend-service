/**
 * Branding Configuration
 *
 * Provides customizable branding options for the application.
 * Branding slug is configured via VITE_BRANDING_SLUG env var.
 * Login colors for default branding are derived from the active theme preset.
 */

import { activePreset } from '../theme/presets';
import type { BrandingConfig } from './branding.types';

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/** Active branding slug from environment variable */
export const ACTIVE_BRANDING: string = import.meta.env.VITE_BRANDING_SLUG || 'default';

/** App title from environment variable */
export const APP_TITLE: string = import.meta.env.VITE_APP_TITLE || 'unified-ui';

/** Whether to show the "powered by unified-ui" subtitle */
export const SHOW_PLATFORM_SUBTITLE: boolean = APP_TITLE.toLowerCase() !== 'unified-ui';

/** Resolve asset URL based on branding slug */
function getAssetUrl(assetName: 'icon' | 'logo' | 'favicon'): string {
  return `/branding/${ACTIVE_BRANDING}/${assetName}.svg`;
}

export const DEFAULT_BRANDING: BrandingConfig = {
  slug: 'default',
  displayName: APP_TITLE,
  logoUrl: getAssetUrl('logo'),
  iconUrl: getAssetUrl('icon'),
  faviconUrl: getAssetUrl('favicon'),

  login: {
    bgLeft: activePreset.login.bgLeft,
    bgRight: activePreset.login.bgRight,
    textColor: '#FFFFFF',
    heading: null,
    buttonBorderColor: 'rgba(255, 255, 255, 0.25)',
    buttonHoverBg: 'rgba(255, 255, 255, 0.08)',
  },

  app: {
    headerBg: 'var(--mantine-color-body)',
    headerTextColor: 'var(--mantine-color-text)',
    sidebarBg: 'var(--mantine-color-body)',
    sidebarTextColor: 'var(--mantine-color-text)',
    sidebarActiveBg: 'var(--mantine-primary-color-light)',
    sidebarActiveTextColor: 'var(--mantine-primary-color-filled)',
  },

  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    headingFontFamily: null,
    baseFontSize: 16,
  },

  enabledIdps: [
    'microsoft',
    'google',
    'aws_cognito',
    'ldap',
    'oidc',
  ],
};

// ─── Customer Brandings (Overrides) ──────────────────────────

export const TENANT_BRANDINGS: Record<string, DeepPartial<BrandingConfig>> = {
  // Example: emtec e.V. custom branding
  emtec: {
    displayName: 'emtec e.V.',
    logoUrl: '/branding/emtec/logo.svg',
    iconUrl: '/branding/emtec/icon.svg',

    login: {
      bgLeft: 'linear-gradient(160deg, #001A42 0%, #002B73 50%, #001A42 100%)',
      bgRight: 'linear-gradient(160deg, #002B73 0%, #003893 50%, #002B73 100%)',
      textColor: '#FFFFFF',
      heading: 'Erfahrung. Wissen. Innovation.',
      buttonBorderColor: 'rgba(255, 255, 255, 0.25)',
      buttonHoverBg: 'rgba(255, 255, 255, 0.08)',
    },

    enabledIdps: ['microsoft', 'oidc', 'ldap'],
  },

  // ─── Add your custom brandings below ─────────────────────────
  // mycompany: {
  //   displayName: 'My Company',
  //   logoUrl: '/branding/mycompany/logo.svg',
  //   iconUrl: '/branding/mycompany/icon.svg',
  //   login: {
  //     bgLeft: '#142E4A',
  //     bgRight: '#0C1F35',
  //   },
  // },
};

// ─── Resolver ────────────────────────────────────────────────

function deepMerge<T>(target: T, source: DeepPartial<T>): T {
  const result = { ...target } as Record<string, unknown>;
  const src = source as Record<string, unknown>;
  const tgt = target as Record<string, unknown>;

  for (const key in src) {
    const sourceVal = src[key];
    const targetVal = tgt[key];
    if (
      sourceVal !== undefined &&
      typeof sourceVal === 'object' &&
      sourceVal !== null &&
      !Array.isArray(sourceVal) &&
      typeof targetVal === 'object' &&
      targetVal !== null
    ) {
      result[key] = deepMerge(
        targetVal as Record<string, unknown>,
        sourceVal as DeepPartial<Record<string, unknown>>,
      );
    } else if (sourceVal !== undefined) {
      result[key] = sourceVal;
    }
  }
  return result as T;
}

/**
 * Returns the full branding config for a given tenant slug.
 * Unknown or missing slug → default unified-ui branding.
 */
function getBranding(slug: string): BrandingConfig {
  const override = TENANT_BRANDINGS[slug.toLowerCase()];
  if (!override) return DEFAULT_BRANDING;

  return deepMerge(DEFAULT_BRANDING, override);
}

export const activeBranding: BrandingConfig = getBranding(ACTIVE_BRANDING);
