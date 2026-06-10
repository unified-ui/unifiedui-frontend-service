import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import type { AccountInfo } from '@azure/msal-browser';
import { authConfig, enabledProviders, loginRequest } from './authConfig';
import type { IdentityProviderType } from './authConfig';
import { useLdapAuth } from './useLdapAuth';
import { useOidcAuth } from './useOidcAuth';
import { useDebugAuth } from './useDebugAuth';
import type { DebugLoginParams } from './useDebugAuth';

const ACTIVE_PROVIDER_KEY = 'active_auth_provider';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  account: AccountInfo | null;
  activeProvider: IdentityProviderType | null;
  loginWithProvider: (provider: IdentityProviderType) => Promise<void>;
  loginWithCredentials: (username: string, password: string) => Promise<void>;
  loginWithDebugBackdoor: (params: DebugLoginParams) => Promise<void>;
  logout: () => Promise<void>;
  switchAccount: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  getFoundryToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

type MicrosoftAuthState = {
  instance: ReturnType<typeof useMsal>['instance'] | null;
  accounts: AccountInfo[];
  inProgress: string;
  isAuthenticated: boolean;
};

const disabledMicrosoftAuth: MicrosoftAuthState = {
  instance: null,
  accounts: [],
  inProgress: 'none',
  isAuthenticated: false,
};

const AuthProviderWithMsal = ({ children }: AuthProviderProps) => {
  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  return (
    <AuthProviderCore
      microsoftAuth={{ instance, accounts, inProgress, isAuthenticated }}
    >
      {children}
    </AuthProviderCore>
  );
};

const AuthProviderCore = ({
  children,
  microsoftAuth,
}: AuthProviderProps & { microsoftAuth: MicrosoftAuthState }) => {
  const [activeProvider, setActiveProvider] = useState<IdentityProviderType | null>(
    () => {
      const stored = sessionStorage.getItem(ACTIVE_PROVIDER_KEY) as IdentityProviderType | null;
      return stored && enabledProviders.includes(stored) ? stored : null;
    }
  );

  const ldapAuth = useLdapAuth();
  const oidcAuth = useOidcAuth();
  const debugAuth = useDebugAuth();

  const msalIsLoading = microsoftAuth.inProgress !== 'none';

  const effectiveProvider = useMemo((): IdentityProviderType | null => {
    if (activeProvider && enabledProviders.includes(activeProvider)) return activeProvider;
    if (debugAuth.isAuthenticated) return 'debug';
    if (ldapAuth.isAuthenticated) return 'ldap';
    if (oidcAuth.isAuthenticated) return 'oidc';
    if (microsoftAuth.isAuthenticated) return 'microsoft';
    return null;
  }, [activeProvider, debugAuth.isAuthenticated, ldapAuth.isAuthenticated, oidcAuth.isAuthenticated, microsoftAuth.isAuthenticated]);

  const isAuthenticated = microsoftAuth.isAuthenticated || ldapAuth.isAuthenticated || oidcAuth.isAuthenticated || debugAuth.isAuthenticated;
  const isLoading = msalIsLoading || oidcAuth.isLoading || ldapAuth.isLoading || debugAuth.isLoading;

  const account = useMemo((): AccountInfo | null => {
    switch (effectiveProvider) {
      case 'debug':
        return debugAuth.account;
      case 'ldap':
        return ldapAuth.account;
      case 'oidc':
        return oidcAuth.account;
      case 'microsoft':
        return microsoftAuth.accounts[0] || null;
      default:
        if (debugAuth.account) return debugAuth.account;
        if (ldapAuth.account) return ldapAuth.account;
        if (oidcAuth.account) return oidcAuth.account;
        return microsoftAuth.accounts[0] || null;
    }
  }, [effectiveProvider, debugAuth.account, ldapAuth.account, oidcAuth.account, microsoftAuth.accounts]);

  const loginWithProvider = useCallback(async (provider: IdentityProviderType) => {
    if (!enabledProviders.includes(provider)) {
      throw new Error(`Identity provider "${provider}" is not configured`);
    }

    sessionStorage.setItem(ACTIVE_PROVIDER_KEY, provider);
    setActiveProvider(provider);

    switch (provider) {
      case 'ldap':
        break;
      case 'oidc':
        await oidcAuth.login();
        break;
      case 'microsoft':
        if (!microsoftAuth.instance) return;
        try {
          await microsoftAuth.instance.loginRedirect({ scopes: loginRequest.scopes });
        } catch (error) {
          console.error('Login failed:', error);
        }
        break;
      default:
        break;
    }
  }, [oidcAuth, microsoftAuth.instance]);

  const loginWithCredentials = useCallback(async (username: string, password: string) => {
    sessionStorage.setItem(ACTIVE_PROVIDER_KEY, 'ldap');
    setActiveProvider('ldap');
    await ldapAuth.loginWithCredentials(username, password);
  }, [ldapAuth]);

  const loginWithDebugBackdoor = useCallback(async (params: DebugLoginParams) => {
    sessionStorage.setItem(ACTIVE_PROVIDER_KEY, 'debug');
    setActiveProvider('debug');
    await debugAuth.login(params);
  }, [debugAuth]);

  const logout = useCallback(async () => {
    sessionStorage.removeItem(ACTIVE_PROVIDER_KEY);
    switch (effectiveProvider) {
      case 'debug':
        await debugAuth.logout();
        break;
      case 'ldap':
        await ldapAuth.logout();
        break;
      case 'oidc':
        await oidcAuth.logout();
        break;
      case 'microsoft':
        if (!microsoftAuth.instance) break;
        try {
          await microsoftAuth.instance.logoutRedirect();
        } catch (error) {
          console.error('Logout failed:', error);
        }
        break;
      default:
        break;
    }
    setActiveProvider(null);
  }, [effectiveProvider, debugAuth, ldapAuth, oidcAuth, microsoftAuth.instance]);

  const switchAccount = useCallback(async () => {
    if (effectiveProvider === 'microsoft' && microsoftAuth.instance) {
      try {
        await microsoftAuth.instance.loginRedirect({
          scopes: loginRequest.scopes,
          prompt: 'select_account',
        });
      } catch (error) {
        console.error('Switch account failed:', error);
      }
    } else {
      await logout();
    }
  }, [effectiveProvider, microsoftAuth.instance, logout]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    switch (effectiveProvider) {
      case 'debug':
        return debugAuth.getAccessToken();
      case 'ldap':
        return ldapAuth.getAccessToken();
      case 'oidc':
        return oidcAuth.getAccessToken();
      case 'microsoft': {
        if (!microsoftAuth.instance || !microsoftAuth.isAuthenticated || microsoftAuth.accounts.length === 0) return null;
        try {
          const response = await microsoftAuth.instance.acquireTokenSilent({
            scopes: loginRequest.scopes,
            account: microsoftAuth.accounts[0],
          });
          return response.accessToken;
        } catch {
          try {
            const response = await microsoftAuth.instance.acquireTokenPopup({
              scopes: loginRequest.scopes,
              account: microsoftAuth.accounts[0],
            });
            return response.accessToken;
          } catch {
            return null;
          }
        }
      }
      default:
        return null;
    }
  }, [effectiveProvider, debugAuth, ldapAuth, oidcAuth, microsoftAuth]);

  const getFoundryToken = useCallback(async (): Promise<string | null> => {
    if (effectiveProvider !== 'microsoft' || !microsoftAuth.instance || !microsoftAuth.isAuthenticated || microsoftAuth.accounts.length === 0) return null;
    try {
      const response = await microsoftAuth.instance.acquireTokenSilent({
        scopes: ['https://ai.azure.com/.default'],
        account: microsoftAuth.accounts[0],
      });
      return response.accessToken;
    } catch {
      try {
        const response = await microsoftAuth.instance.acquireTokenPopup({
          scopes: ['https://ai.azure.com/.default'],
          account: microsoftAuth.accounts[0],
        });
        return response.accessToken;
      } catch {
        return null;
      }
    }
  }, [effectiveProvider, microsoftAuth]);

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    account,
    activeProvider: effectiveProvider,
    loginWithProvider,
    loginWithCredentials,
    loginWithDebugBackdoor,
    logout,
    switchAccount,
    getAccessToken,
    getFoundryToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const AuthProvider = ({ children }: AuthProviderProps) =>
  authConfig.microsoft ? (
    <AuthProviderWithMsal>{children}</AuthProviderWithMsal>
  ) : (
    <AuthProviderCore microsoftAuth={disabledMicrosoftAuth}>
      {children}
    </AuthProviderCore>
  );
