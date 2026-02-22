import type { PopupRequest } from "@azure/msal-browser";

export type IdentityProviderType = 'microsoft' | 'google' | 'aws_cognito' | 'ldap' | 'kerberos' | 'saml' | 'okta' | 'oidc';

export const ALL_IDENTITY_PROVIDERS: IdentityProviderType[] = [
  'microsoft', 'google', 'aws_cognito', 'ldap', 'kerberos', 'saml', 'okta', 'oidc',
];

export interface AuthConfig {
  provider: IdentityProviderType;
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
}

const VITE_AUTH_PROVIDER = (import.meta.env.VITE_AUTH_PROVIDER as IdentityProviderType) || 'microsoft';

const MSAL_CLIENT_ID = import.meta.env.VITE_MSAL_CLIENT_ID || '';
const MSAL_AUTHORITY = import.meta.env.VITE_MSAL_AUTHORITY || 'https://login.microsoftonline.com/common';
const MSAL_API_SCOPE = import.meta.env.VITE_MSAL_API_SCOPE || '';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const COGNITO_REGION = import.meta.env.VITE_COGNITO_REGION || '';
const COGNITO_USER_POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID || '';
const COGNITO_CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || '';
const COGNITO_DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN || '';

export const authConfig: AuthConfig = {
  provider: VITE_AUTH_PROVIDER,
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
};

export const enabledProviders: IdentityProviderType[] = (() => {
  const providers: IdentityProviderType[] = [];
  if (authConfig.microsoft) providers.push('microsoft');
  if (authConfig.google) providers.push('google');
  if (authConfig.awsCognito) providers.push('aws_cognito');
  return providers.length > 0 ? providers : [authConfig.provider];
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
