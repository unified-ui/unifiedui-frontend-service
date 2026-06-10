import { useState, useCallback } from 'react';
import type { ReactNode, FC } from 'react';
import type { AccountInfo } from '@azure/msal-browser';
import { authConfig } from './authConfig';
import { DebugAuthContext } from './useDebugAuth';
import type { DebugAuthContextType, DebugLoginParams } from './useDebugAuth';

interface DebugAuthProviderProps {
  children: ReactNode;
}

const DEBUG_TOKEN_KEY = 'debug_access_token';
const DEBUG_ACCOUNT_KEY = 'debug_account';

const getApiBaseUrl = (): string =>
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const buildAccount = (params: DebugLoginParams): AccountInfo =>
  ({
    homeAccountId: params.userId,
    localAccountId: params.userId,
    environment: 'debug-backdoor',
    tenantId: 'debug',
    username: params.upn,
    name: params.name || 'Debug User',
  }) as AccountInfo;

const loadAccount = (): AccountInfo | null => {
  const raw = sessionStorage.getItem(DEBUG_ACCOUNT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AccountInfo;
  } catch {
    return null;
  }
};

export const DebugAuthProvider: FC<DebugAuthProviderProps> = ({ children }) => {
  const [account, setAccount] = useState<AccountInfo | null>(loadAccount);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => !!sessionStorage.getItem(DEBUG_TOKEN_KEY),
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const login = useCallback(async (params: DebugLoginParams): Promise<void> => {
    if (!authConfig.debug?.enabled) {
      throw new Error('Debug backdoor is not enabled');
    }
    if (!authConfig.debug.secret) {
      throw new Error('VITE_DEBUG_BACK_DOOR_SECRET not configured');
    }
    setIsLoading(true);
    try {
      const url = `${getApiBaseUrl()}/api/v1/platform-service/auth/debug-backdoor`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: authConfig.debug.secret,
          user_id: params.userId,
          upn: params.upn,
          name: params.name || 'Debug User',
          groups: params.groups || [],
        }),
      });
      if (!resp.ok) {
        const detail = await resp.text();
        throw new Error(`Debug login failed (${resp.status}): ${detail}`);
      }
      const data = (await resp.json()) as { access_token: string };
      sessionStorage.setItem(DEBUG_TOKEN_KEY, data.access_token);
      const acc = buildAccount(params);
      sessionStorage.setItem(DEBUG_ACCOUNT_KEY, JSON.stringify(acc));
      setAccount(acc);
      setIsAuthenticated(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    sessionStorage.removeItem(DEBUG_TOKEN_KEY);
    sessionStorage.removeItem(DEBUG_ACCOUNT_KEY);
    setAccount(null);
    setIsAuthenticated(false);
  }, []);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    return sessionStorage.getItem(DEBUG_TOKEN_KEY);
  }, []);

  const getFoundryToken = useCallback(async (): Promise<string | null> => {
    return null;
  }, []);

  const value: DebugAuthContextType = {
    isAuthenticated,
    isLoading,
    account,
    login,
    logout,
    getAccessToken,
    getFoundryToken,
  };

  return <DebugAuthContext.Provider value={value}>{children}</DebugAuthContext.Provider>;
};
