import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import type { AccountInfo } from '@azure/msal-browser';
import { loginRequest } from './authConfig';
import type { IdentityProviderType } from './authConfig';
import { useLdapAuth } from './useLdapAuth';
import { useOidcAuth } from './useOidcAuth';

const ACTIVE_PROVIDER_KEY = 'active_auth_provider';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  account: AccountInfo | null;
  activeProvider: IdentityProviderType | null;
  loginWithProvider: (provider: IdentityProviderType) => Promise<void>;
  loginWithCredentials: (username: string, password: string) => Promise<void>;
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

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [activeProvider, setActiveProvider] = useState<IdentityProviderType | null>(
    () => sessionStorage.getItem(ACTIVE_PROVIDER_KEY) as IdentityProviderType | null
  );

  const { instance, accounts, inProgress } = useMsal();
  const msalIsAuthenticated = useIsAuthenticated();
  const ldapAuth = useLdapAuth();
  const oidcAuth = useOidcAuth();

  const msalIsLoading = inProgress !== 'none';

  const effectiveProvider = useMemo((): IdentityProviderType | null => {
    if (activeProvider) return activeProvider;
    if (ldapAuth.isAuthenticated) return 'ldap';
    if (oidcAuth.isAuthenticated) return 'oidc';
    if (msalIsAuthenticated) return 'microsoft';
    return null;
  }, [activeProvider, ldapAuth.isAuthenticated, oidcAuth.isAuthenticated, msalIsAuthenticated]);

  const isAuthenticated = msalIsAuthenticated || ldapAuth.isAuthenticated || oidcAuth.isAuthenticated;
  const isLoading = msalIsLoading || oidcAuth.isLoading || ldapAuth.isLoading;

  const account = useMemo((): AccountInfo | null => {
    switch (effectiveProvider) {
      case 'ldap':
        return ldapAuth.account;
      case 'oidc':
        return oidcAuth.account;
      case 'microsoft':
        return accounts[0] || null;
      default:
        if (ldapAuth.account) return ldapAuth.account;
        if (oidcAuth.account) return oidcAuth.account;
        return accounts[0] || null;
    }
  }, [effectiveProvider, ldapAuth.account, oidcAuth.account, accounts]);

  const loginWithProvider = useCallback(async (provider: IdentityProviderType) => {
    sessionStorage.setItem(ACTIVE_PROVIDER_KEY, provider);
    setActiveProvider(provider);

    switch (provider) {
      case 'ldap':
        break;
      case 'oidc':
        await oidcAuth.login();
        break;
      case 'microsoft':
      default:
        try {
          await instance.loginRedirect({ scopes: loginRequest.scopes });
        } catch (error) {
          console.error('Login failed:', error);
        }
        break;
    }
  }, [oidcAuth, instance]);

  const loginWithCredentials = useCallback(async (username: string, password: string) => {
    sessionStorage.setItem(ACTIVE_PROVIDER_KEY, 'ldap');
    setActiveProvider('ldap');
    await ldapAuth.loginWithCredentials(username, password);
  }, [ldapAuth]);

  const logout = useCallback(async () => {
    sessionStorage.removeItem(ACTIVE_PROVIDER_KEY);
    switch (effectiveProvider) {
      case 'ldap':
        await ldapAuth.logout();
        break;
      case 'oidc':
        await oidcAuth.logout();
        break;
      case 'microsoft':
      default:
        try {
          await instance.logoutRedirect();
        } catch (error) {
          console.error('Logout failed:', error);
        }
        break;
    }
    setActiveProvider(null);
  }, [effectiveProvider, ldapAuth, oidcAuth, instance]);

  const switchAccount = useCallback(async () => {
    if (effectiveProvider === 'microsoft') {
      try {
        await instance.loginRedirect({
          scopes: loginRequest.scopes,
          prompt: 'select_account',
        });
      } catch (error) {
        console.error('Switch account failed:', error);
      }
    } else {
      await logout();
    }
  }, [effectiveProvider, instance, logout]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    switch (effectiveProvider) {
      case 'ldap':
        return ldapAuth.getAccessToken();
      case 'oidc':
        return oidcAuth.getAccessToken();
      case 'microsoft': {
        if (!msalIsAuthenticated || accounts.length === 0) return null;
        try {
          const response = await instance.acquireTokenSilent({
            scopes: loginRequest.scopes,
            account: accounts[0],
          });
          return response.accessToken;
        } catch {
          try {
            const response = await instance.acquireTokenPopup({
              scopes: loginRequest.scopes,
              account: accounts[0],
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
  }, [effectiveProvider, ldapAuth, oidcAuth, msalIsAuthenticated, accounts, instance]);

  const getFoundryToken = useCallback(async (): Promise<string | null> => {
    if (effectiveProvider !== 'microsoft' || !msalIsAuthenticated || accounts.length === 0) return null;
    try {
      const response = await instance.acquireTokenSilent({
        scopes: ['https://ai.azure.com/.default'],
        account: accounts[0],
      });
      return response.accessToken;
    } catch {
      try {
        const response = await instance.acquireTokenPopup({
          scopes: ['https://ai.azure.com/.default'],
          account: accounts[0],
        });
        return response.accessToken;
      } catch {
        return null;
      }
    }
  }, [effectiveProvider, msalIsAuthenticated, accounts, instance]);

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    account,
    activeProvider: effectiveProvider,
    loginWithProvider,
    loginWithCredentials,
    logout,
    switchAccount,
    getAccessToken,
    getFoundryToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
