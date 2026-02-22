import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode, FC } from 'react';
import type { AccountInfo } from '@azure/msal-browser';
import { authConfig } from './authConfig';

interface CognitoAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  account: AccountInfo | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  getFoundryToken: () => Promise<string | null>;
}

const CognitoAuthContext = createContext<CognitoAuthContextType | undefined>(undefined);

export const useCognitoAuth = (): CognitoAuthContextType => {
  const context = useContext(CognitoAuthContext);
  if (!context) {
    throw new Error('useCognitoAuth must be used within CognitoAuthProvider');
  }
  return context;
};

interface CognitoAuthProviderProps {
  children: ReactNode;
}

const COGNITO_TOKEN_KEY = 'cognito_id_token';
const COGNITO_ACCESS_TOKEN_KEY = 'cognito_access_token';

const buildCognitoAuthUrl = (): string => {
  const config = authConfig.awsCognito;
  if (!config) throw new Error('AWS Cognito configuration is missing');

  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    scope: 'openid profile email',
    redirect_uri: window.location.origin + '/auth/callback/cognito',
  });

  return `https://${config.domain}/oauth2/authorize?${params.toString()}`;
};

const exchangeCodeForTokens = async (code: string): Promise<{ id_token: string; access_token: string }> => {
  const config = authConfig.awsCognito;
  if (!config) throw new Error('AWS Cognito configuration is missing');

  const response = await fetch(`https://${config.domain}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.clientId,
      code,
      redirect_uri: window.location.origin + '/auth/callback/cognito',
    }),
  });

  if (!response.ok) {
    throw new Error('Cognito token exchange failed');
  }

  return response.json();
};

export const CognitoAuthProvider: FC<CognitoAuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [tokens, setTokens] = useState<{ idToken: string; accessToken: string } | null>(null);

  const parseJwt = useCallback((token: string): Record<string, string> => {
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
  }, []);

  const setAuthFromTokens = useCallback(
    (idToken: string, accessToken: string) => {
      const claims = parseJwt(idToken);
      setTokens({ idToken, accessToken });
      setIsAuthenticated(true);
      setAccount({
        homeAccountId: claims.sub || '',
        localAccountId: claims.sub || '',
        environment: 'cognito',
        tenantId: claims.iss?.split('/').pop() || '',
        username: claims.email || claims['cognito:username'] || '',
        name: claims.name,
      } as AccountInfo);
      sessionStorage.setItem(COGNITO_TOKEN_KEY, idToken);
      sessionStorage.setItem(COGNITO_ACCESS_TOKEN_KEY, accessToken);
    },
    [parseJwt]
  );

  useEffect(() => {
    const existingIdToken = sessionStorage.getItem(COGNITO_TOKEN_KEY);
    const existingAccessToken = sessionStorage.getItem(COGNITO_ACCESS_TOKEN_KEY);

    if (existingIdToken && existingAccessToken) {
      try {
        const claims = parseJwt(existingIdToken);
        const exp = parseInt(claims.exp, 10);
        if (exp * 1000 > Date.now()) {
          setAuthFromTokens(existingIdToken, existingAccessToken);
        } else {
          sessionStorage.removeItem(COGNITO_TOKEN_KEY);
          sessionStorage.removeItem(COGNITO_ACCESS_TOKEN_KEY);
        }
      } catch {
        sessionStorage.removeItem(COGNITO_TOKEN_KEY);
        sessionStorage.removeItem(COGNITO_ACCESS_TOKEN_KEY);
      }
    }

    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    if (code && url.pathname === '/auth/callback/cognito') {
      exchangeCodeForTokens(code)
        .then(({ id_token, access_token }) => {
          setAuthFromTokens(id_token, access_token);
          window.history.replaceState({}, '', '/');
        })
        .catch((error) => {
          console.error('Cognito token exchange failed:', error);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [parseJwt, setAuthFromTokens]);

  const login = useCallback(async () => {
    setIsLoading(true);
    try {
      window.location.href = buildCognitoAuthUrl();
    } catch (error) {
      console.error('Cognito login failed:', error);
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      sessionStorage.removeItem(COGNITO_TOKEN_KEY);
      sessionStorage.removeItem(COGNITO_ACCESS_TOKEN_KEY);
      setIsAuthenticated(false);
      setAccount(null);
      setTokens(null);

      const config = authConfig.awsCognito;
      if (config?.domain) {
        const logoutUrl = `https://${config.domain}/logout?client_id=${config.clientId}&logout_uri=${encodeURIComponent(window.location.origin)}`;
        window.location.href = logoutUrl;
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    return tokens?.idToken || null;
  }, [tokens]);

  const getFoundryToken = useCallback(async (): Promise<string | null> => {
    return null;
  }, []);

  const value: CognitoAuthContextType = {
    isAuthenticated,
    isLoading,
    account,
    login,
    logout,
    getAccessToken,
    getFoundryToken,
  };

  return <CognitoAuthContext.Provider value={value}>{children}</CognitoAuthContext.Provider>;
};
