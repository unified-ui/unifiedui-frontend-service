import { useState, useCallback, useEffect } from 'react';
import type { ReactNode, FC } from 'react';
import type { AccountInfo } from '@azure/msal-browser';
import { authConfig } from './authConfig';
import { GoogleAuthContext } from './useGoogleAuth';
import type { GoogleAuthContextType } from './useGoogleAuth';

interface GoogleAuthProviderProps {
  children: ReactNode;
}

const GOOGLE_TOKEN_KEY = 'google_id_token';
const GOOGLE_CREDENTIAL_KEY = 'google_credential';

export const GoogleAuthProvider: FC<GoogleAuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);

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

  const setAuthState = useCallback(
    (credential: string) => {
      const claims = parseJwt(credential);
      setIdToken(credential);
      setIsAuthenticated(true);
      setAccount({
        homeAccountId: claims.sub || '',
        localAccountId: claims.sub || '',
        environment: 'accounts.google.com',
        tenantId: claims.hd || '',
        username: claims.email || '',
        name: claims.name,
      } as AccountInfo);
      sessionStorage.setItem(GOOGLE_TOKEN_KEY, credential);
    },
    [parseJwt]
  );

  useEffect(() => {
    const existingToken = sessionStorage.getItem(GOOGLE_TOKEN_KEY);
    if (existingToken) {
      try {
        const claims = parseJwt(existingToken);
        const exp = parseInt(claims.exp, 10);
        if (exp * 1000 > Date.now()) {
          setAuthState(existingToken);
        } else {
          sessionStorage.removeItem(GOOGLE_TOKEN_KEY);
        }
      } catch {
        sessionStorage.removeItem(GOOGLE_TOKEN_KEY);
      }
    }
    setIsLoading(false);
  }, [parseJwt, setAuthState]);

  useEffect(() => {
    if (!authConfig.google?.clientId) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: authConfig.google!.clientId,
        callback: (response: google.accounts.id.CredentialResponse) => {
          if (response.credential) {
            setAuthState(response.credential);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [setAuthState]);

  const login = useCallback(async () => {
    setIsLoading(true);
    try {
      window.google?.accounts.id.prompt();
    } catch (error) {
      console.error('Google login failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      window.google?.accounts.id.disableAutoSelect();
      sessionStorage.removeItem(GOOGLE_TOKEN_KEY);
      sessionStorage.removeItem(GOOGLE_CREDENTIAL_KEY);
      setIsAuthenticated(false);
      setAccount(null);
      setIdToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    return idToken;
  }, [idToken]);

  const getFoundryToken = useCallback(async (): Promise<string | null> => {
    return null;
  }, []);

  const value: GoogleAuthContextType = {
    isAuthenticated,
    isLoading,
    account,
    login,
    logout,
    getAccessToken,
    getFoundryToken,
  };

  return <GoogleAuthContext.Provider value={value}>{children}</GoogleAuthContext.Provider>;
};
