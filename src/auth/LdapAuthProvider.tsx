import { useState, useCallback, useEffect, useRef } from 'react';
import type { ReactNode, FC } from 'react';
import type { AccountInfo } from '@azure/msal-browser';
import { authConfig } from './authConfig';
import { LdapAuthContext } from './useLdapAuth';
import type { LdapAuthContextType } from './useLdapAuth';

interface LdapAuthProviderProps {
  children: ReactNode;
}

const LDAP_TOKEN_KEY = 'ldap_access_token';
const LDAP_REFRESH_TOKEN_KEY = 'ldap_refresh_token';
const LDAP_ACCOUNT_KEY = 'ldap_account';
const REFRESH_BUFFER_MS = 60_000;

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

const getTokenExpiryMs = (token: string): number => {
  try {
    const claims = parseJwt(token);
    return parseInt(claims.exp, 10) * 1000;
  } catch {
    return 0;
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

const hasValidSession = (): boolean => {
  const accessToken = sessionStorage.getItem(LDAP_TOKEN_KEY);
  const refreshToken = sessionStorage.getItem(LDAP_REFRESH_TOKEN_KEY);

  if (accessToken && !isTokenExpired(accessToken)) return true;
  if (refreshToken && !isTokenExpired(refreshToken)) return true;
  return false;
};

export const LdapAuthProvider: FC<LdapAuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(hasValidSession);
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    const accessToken = sessionStorage.getItem(LDAP_TOKEN_KEY);
    const refreshToken = sessionStorage.getItem(LDAP_REFRESH_TOKEN_KEY);
    return !!(accessToken && isTokenExpired(accessToken) && refreshToken && !isTokenExpired(refreshToken));
  });
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

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRefreshingRef = useRef(false);

  const clearSession = useCallback(() => {
    sessionStorage.removeItem(LDAP_TOKEN_KEY);
    sessionStorage.removeItem(LDAP_REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(LDAP_ACCOUNT_KEY);
    setIsAuthenticated(false);
    setAccount(null);
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const storeTokens = useCallback((accessToken: string, refreshToken: string) => {
    sessionStorage.setItem(LDAP_TOKEN_KEY, accessToken);
    sessionStorage.setItem(LDAP_REFRESH_TOKEN_KEY, refreshToken);
    const acc = buildAccountFromToken(accessToken);
    sessionStorage.setItem(LDAP_ACCOUNT_KEY, JSON.stringify(acc));
    setAccount(acc);
    setIsAuthenticated(true);
  }, []);

  const performRefresh = useCallback(async (): Promise<boolean> => {
    if (isRefreshingRef.current) return false;
    isRefreshingRef.current = true;

    const refreshToken = sessionStorage.getItem(LDAP_REFRESH_TOKEN_KEY);
    if (!refreshToken || isTokenExpired(refreshToken)) {
      isRefreshingRef.current = false;
      clearSession();
      return false;
    }

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/platform-service/auth/refresh/ldap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        clearSession();
        return false;
      }

      const data = await response.json();
      storeTokens(data.access_token, data.refresh_token);
      return true;
    } catch {
      clearSession();
      return false;
    } finally {
      isRefreshingRef.current = false;
    }
  }, [clearSession, storeTokens]);

  const scheduleRefresh = useCallback(
    (accessToken: string) => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }

      const expiryMs = getTokenExpiryMs(accessToken);
      const delay = Math.max(expiryMs - Date.now() - REFRESH_BUFFER_MS, 0);

      refreshTimerRef.current = setTimeout(async () => {
        const success = await performRefresh();
        if (success) {
          const newToken = sessionStorage.getItem(LDAP_TOKEN_KEY);
          if (newToken) scheduleRefresh(newToken);
        }
      }, delay);
    },
    [performRefresh]
  );

  useEffect(() => {
    const accessToken = sessionStorage.getItem(LDAP_TOKEN_KEY);
    const refreshToken = sessionStorage.getItem(LDAP_REFRESH_TOKEN_KEY);

    if (accessToken && !isTokenExpired(accessToken)) {
      scheduleRefresh(accessToken);
    } else if (refreshToken && !isTokenExpired(refreshToken)) {
      performRefresh().then((success) => {
        if (success) {
          const newToken = sessionStorage.getItem(LDAP_TOKEN_KEY);
          if (newToken) scheduleRefresh(newToken);
        }
        setIsLoading(false);
      });
    } else if (accessToken || refreshToken) {
      clearSession();
    }

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [scheduleRefresh, performRefresh, clearSession]);

  const loginWithCredentials = useCallback(
    async (username: string, password: string) => {
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
        storeTokens(data.access_token, data.refresh_token);
        scheduleRefresh(data.access_token);
      } finally {
        setIsLoading(false);
      }
    },
    [storeTokens, scheduleRefresh]
  );

  const login = useCallback(async () => {}, []);

  const logout = useCallback(async () => {
    clearSession();
  }, [clearSession]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const token = sessionStorage.getItem(LDAP_TOKEN_KEY);
    if (token && !isTokenExpired(token)) return token;

    const success = await performRefresh();
    if (success) return sessionStorage.getItem(LDAP_TOKEN_KEY);

    return null;
  }, [performRefresh]);

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
