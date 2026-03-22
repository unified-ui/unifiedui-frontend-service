import { useState, useCallback } from 'react';
import type { ReactNode, FC } from 'react';
import type { AccountInfo } from '@azure/msal-browser';
import { authConfig } from './authConfig';
import { LdapAuthContext } from './useLdapAuth';
import type { LdapAuthContextType } from './useLdapAuth';

interface LdapAuthProviderProps {
  children: ReactNode;
}

const LDAP_TOKEN_KEY = 'ldap_access_token';
const LDAP_ACCOUNT_KEY = 'ldap_account';

const getApiBaseUrl = (): string => {
  return authConfig.ldap?.apiBaseUrl || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
};

const parseJwt = (token: string): Record<string, string> => {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    window
      .atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
};

const isTokenExpired = (token: string): boolean => {
  try {
    const claims = parseJwt(token);
    const exp = parseInt(claims.exp, 10);
    return exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};

const buildAccountFromToken = (token: string): AccountInfo => {
  const claims = parseJwt(token);
  return {
    homeAccountId: claims.sub || claims.uid || '',
    localAccountId: claims.sub || claims.uid || '',
    environment: 'ldap',
    tenantId: claims.o || claims.dn || '',
    username: claims.mail || claims.uid || '',
    name: claims.cn || '',
  } as AccountInfo;
};

export const LdapAuthProvider: FC<LdapAuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const token = sessionStorage.getItem(LDAP_TOKEN_KEY);
    return !!token && !isTokenExpired(token);
  });
  const [isLoading, setIsLoading] = useState(false);
  const [account, setAccount] = useState<AccountInfo | null>(() => {
    const saved = sessionStorage.getItem(LDAP_ACCOUNT_KEY);
    if (saved) {
      try {
        return JSON.parse(saved) as AccountInfo;
      } catch {
        return null;
      }
    }
    return null;
  });

  const loginWithCredentials = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/platform-service/auth/login/ldap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Login failed' }));
        throw new Error(error.detail || 'Login failed');
      }

      const data = await response.json();
      const token: string = data.access_token;

      sessionStorage.setItem(LDAP_TOKEN_KEY, token);
      const acc = buildAccountFromToken(token);
      sessionStorage.setItem(LDAP_ACCOUNT_KEY, JSON.stringify(acc));

      setAccount(acc);
      setIsAuthenticated(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async () => {
    // no-op: LDAP uses loginWithCredentials
  }, []);

  const logout = useCallback(async () => {
    sessionStorage.removeItem(LDAP_TOKEN_KEY);
    sessionStorage.removeItem(LDAP_ACCOUNT_KEY);
    setIsAuthenticated(false);
    setAccount(null);
  }, []);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const token = sessionStorage.getItem(LDAP_TOKEN_KEY);
    if (!token || isTokenExpired(token)) {
      setIsAuthenticated(false);
      setAccount(null);
      return null;
    }
    return token;
  }, []);

  const getFoundryToken = useCallback(async (): Promise<string | null> => {
    return null;
  }, []);

  const value: LdapAuthContextType = {
    isAuthenticated,
    isLoading,
    account,
    login,
    loginWithCredentials,
    logout,
    getAccessToken,
    getFoundryToken,
  };

  return <LdapAuthContext.Provider value={value}>{children}</LdapAuthContext.Provider>;
};
