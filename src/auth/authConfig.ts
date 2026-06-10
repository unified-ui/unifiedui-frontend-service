import type { PopupRequest } from "@azure/msal-browser";

export type IdentityProviderType = 'microsoft' | 'google' | 'aws_cognito' | 'ldap' | 'kerberos' | 'saml' | 'okta' | 'oidc' | 'debug';

export const ALL_IDENTITY_PROVIDERS: IdentityProviderType[] = [
  'microsoft', 'google', 'aws_cognito', 'ldap', 'kerberos', 'saml', 'okta', 'oidc', 'debug',
];

export interface AuthConfig {
  microsoft?: {
    clientId: string;
    authority: string;
    apiScope: string;
  };
  google?: {
    clientId: string;
  };
  awsCognito?: {
    region: string;
    userPoolId: string;
    clientId: string;
    domain: string;
  };
  oidc?: {
    authority: string;
    clientId: string;
    redirectUri: string;
    scope: string;
  };
  ldap?: {
    apiBaseUrl: string;
  };
  debug?: {
    enabled: boolean;
    secret: string;
  };
}

const MSAL_CLIENT_ID = import.meta.env.VITE_MSAL_CLIENT_ID || '';
const MSAL_AUTHORITY = import.meta.env.VITE_MSAL_AUTHORITY || 'https://login.microsoftonline.com/common';
const MSAL_API_SCOPE = import.meta.env.VITE_MSAL_API_SCOPE || '';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const COGNITO_REGION = import.meta.env.VITE_COGNITO_REGION || '';
const COGNITO_USER_POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID || '';
const COGNITO_CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || '';
const COGNITO_DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN || '';

const OIDC_AUTHORITY = import.meta.env.VITE_OIDC_AUTHORITY || '';
const OIDC_CLIENT_ID = import.meta.env.VITE_OIDC_CLIENT_ID || '';
const OIDC_REDIRECT_URI = import.meta.env.VITE_OIDC_REDIRECT_URI || '';
const OIDC_SCOPE = import.meta.env.VITE_OIDC_SCOPE || 'openid profile email';

const LDAP_API_BASE_URL = import.meta.env.VITE_LDAP_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const DEBUG_BACK_DOOR_ENABLED = import.meta.env.VITE_ENABLE_DEBUG_BACK_DOOR === 'true';
const DEBUG_BACK_DOOR_SECRET = import.meta.env.VITE_DEBUG_BACK_DOOR_SECRET || '';

export const authConfig: AuthConfig = {
  microsoft: MSAL_CLIENT_ID
    ? {
        clientId: MSAL_CLIENT_ID,
        authority: MSAL_AUTHORITY,
        apiScope: MSAL_API_SCOPE,
      }
    : undefined,
  google: GOOGLE_CLIENT_ID
    ? {
        clientId: GOOGLE_CLIENT_ID,
      }
    : undefined,
  awsCognito:
    COGNITO_REGION && COGNITO_USER_POOL_ID && COGNITO_CLIENT_ID
      ? {
          region: COGNITO_REGION,
          userPoolId: COGNITO_USER_POOL_ID,
          clientId: COGNITO_CLIENT_ID,
          domain: COGNITO_DOMAIN,
        }
      : undefined,
  oidc:
    OIDC_AUTHORITY && OIDC_CLIENT_ID
      ? {
          authority: OIDC_AUTHORITY,
          clientId: OIDC_CLIENT_ID,
          redirectUri: OIDC_REDIRECT_URI || window.location.origin + '/auth/callback/oidc',
          scope: OIDC_SCOPE,
        }
      : undefined,
  ldap: {
    apiBaseUrl: LDAP_API_BASE_URL,
  },
  debug: DEBUG_BACK_DOOR_ENABLED
    ? {
        enabled: true,
        secret: DEBUG_BACK_DOOR_SECRET,
      }
    : undefined,
};

export const enabledProviders: IdentityProviderType[] = (() => {
  const providers: IdentityProviderType[] = [];
  if (authConfig.microsoft) providers.push('microsoft');
  if (authConfig.google) providers.push('google');
  if (authConfig.awsCognito) providers.push('aws_cognito');
  if (authConfig.oidc) providers.push('oidc');
  if (authConfig.ldap) providers.push('ldap');
  if (authConfig.debug?.enabled) providers.push('debug');
  return providers;
})();

export const msalConfig = {
  auth: {
    clientId: MSAL_CLIENT_ID || 'placeholder',
    authority: MSAL_AUTHORITY,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage" as const,
    storeAuthStateInCookie: false,
  },
  system: {
    allowNativeBroker: false,
    windowHashTimeout: 60000,
    iframeHashTimeout: 6000,
    loadFrameTimeout: 0,
  },
};

export const loginRequest: PopupRequest = {
  scopes: MSAL_API_SCOPE ? [MSAL_API_SCOPE] : [],
};
