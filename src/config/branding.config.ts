import type { BrandingConfig } from './branding.types';

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

//const ACTIVE_BRANDING: string = 'default';
//const ACTIVE_BRANDING: string = 'asklepios';
const ACTIVE_BRANDING: string = 'emtec';

const DEFAULT_BRANDING: BrandingConfig = {
  slug: 'default',
  displayName: 'unified-ui',
  logoUrl: null,
  iconUrl: null,
  faviconUrl: null,

  login: {
    bgLeft: 'linear-gradient(160deg, #0a1628 0%, #0f2035 50%, #0a1628 100%)',
    bgRight: 'linear-gradient(160deg, #0f2035 0%, #162a4a 50%, #0f2035 100%)',
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
    // 'kerberos',
    // 'saml',
    // 'okta',
    'oidc',
  ],
};

// ─── Customer Brandings (Overrides) ──────────────────────────

const TENANT_BRANDINGS: Record<string, DeepPartial<BrandingConfig>> = {
  asklepios: {
    displayName: 'Asklepios',
    logoUrl: '/branding/asklepios/logo.svg',
    iconUrl: '/branding/asklepios/icon.svg',

    login: {
      bgLeft: '#0c2e2e',
      bgRight: '#091f1f',
      textColor: '#FFFFFF',
      buttonBorderColor: 'rgba(255, 255, 255, 0.2)',
      buttonHoverBg: 'rgba(255, 255, 255, 0.06)',
    },
  },

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
  },

  // ─── Example: Muster-Bank AG ────────────────────────────────
  // musterbank: {
  //   displayName: 'Muster-Bank',
  //   logoUrl: '/branding/musterbank/logo.png',
  //   iconUrl: '/branding/musterbank/shield.svg',
  //   login: {
  //     bgLeft: '#142E4A',
  //     bgRight: '#0C1F35',
  //     textColor: '#E8E8E8',
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

export { DEFAULT_BRANDING, TENANT_BRANDINGS, ACTIVE_BRANDING };
