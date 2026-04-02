import { useState, useCallback, useEffect, useRef } from 'react';
import type { ReactNode, FC } from 'react';
import type { AccountInfo } from '@azure/msal-browser';
import { UserManager, WebStorageStateStore } from 'oidc-client-ts';
import type { User } from 'oidc-client-ts';
import { authConfig } from './authConfig';
import { OidcAuthContext } from './useOidcAuth';
import type { OidcAuthContextType } from './useOidcAuth';

interface OidcAuthProviderProps {
  children: ReactNode;
}

const NOOP_ASYNC = async () => {};
const NOOP_TOKEN = async (): Promise<string | null> => null;

const UNCONFIGURED_VALUE: OidcAuthContextType = {
  isAuthenticated: false,
  isLoading: false,
  account: null,
  login: NOOP_ASYNC,
  logout: NOOP_ASYNC,
  getAccessToken: NOOP_TOKEN,
  getFoundryToken: NOOP_TOKEN,
};

export const OidcAuthProviderUnconfigured: FC<OidcAuthProviderProps> = ({ children }) => {
  return <OidcAuthContext.Provider value={UNCONFIGURED_VALUE}>{children}</OidcAuthContext.Provider>;
};

const createUserManager = (): UserManager => {
  const config = authConfig.oidc;
  if (!config) throw new Error('OIDC configuration is missing');

  return new UserManager({
    authority: config.authority,
    client_id: config.clientId,
    redirect_uri: config.redirectUri || window.location.origin + '/auth/callback/oidc',
    post_logout_redirect_uri: window.location.origin,
    response_type: 'code',
    scope: config.scope || 'openid profile email',
    userStore: new WebStorageStateStore({ store: sessionStorage }),
    automaticSilentRenew: true,
  });
};

const mapUserToAccount = (user: User): AccountInfo => {
  const profile = user.profile;
  return {
    homeAccountId: profile.sub || '',
    localAccountId: profile.sub || '',
    environment: 'oidc',
    tenantId: profile.iss || '',
    username: (profile.email as string) || (profile.preferred_username as string) || '',
    name: (profile.name as string) || '',
  } as AccountInfo;
};

export const OidcAuthProvider: FC<OidcAuthProviderProps> = ({ children }) => {
  const userManagerRef = useRef<UserManager | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const getUserManager = useCallback((): UserManager => {
    if (!userManagerRef.current) {
      userManagerRef.current = createUserManager();
    }
    return userManagerRef.current;
  }, []);

  useEffect(() => {
    const mgr = getUserManager();

    const handleCallback = async () => {
      const url = new URL(window.location.href);
      if (url.pathname === '/auth/callback/oidc' && url.searchParams.has('code')) {
        try {
          const callbackUser = await mgr.signinRedirectCallback();
          setUser(callbackUser);
          setAccount(mapUserToAccount(callbackUser));
          setIsAuthenticated(true);
          window.history.replaceState({}, '', '/login');
        } catch (error) {
          console.error('OIDC callback failed:', error);
        } finally {
          setIsLoading(false);
        }
        return;
      }

      try {
        const existingUser = await mgr.getUser();
        if (existingUser && !existingUser.expired) {
          setUser(existingUser);
          setAccount(mapUserToAccount(existingUser));
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('OIDC user check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    handleCallback();

    mgr.events.addUserLoaded((loadedUser: User) => {
      setUser(loadedUser);
      setAccount(mapUserToAccount(loadedUser));
      setIsAuthenticated(true);
    });

    mgr.events.addUserUnloaded(() => {
      setUser(null);
      setAccount(null);
      setIsAuthenticated(false);
    });

    mgr.events.addAccessTokenExpired(() => {
      setUser(null);
      setAccount(null);
      setIsAuthenticated(false);
    });
  }, [getUserManager]);

  const login = useCallback(async () => {
    setIsLoading(true);
    try {
      await getUserManager().signinRedirect();
    } catch (error) {
      console.error('OIDC login failed:', error);
      setIsLoading(false);
    }
  }, [getUserManager]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await getUserManager().signoutRedirect();
    } catch (error) {
      console.error('OIDC logout failed:', error);
      setIsLoading(false);
    }
  }, [getUserManager]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    return user?.access_token || null;
  }, [user]);

  const getFoundryToken = useCallback(async (): Promise<string | null> => {
    return null;
  }, []);

  const value: OidcAuthContextType = {
    isAuthenticated,
    isLoading,
    account,
    login,
    logout,
    getAccessToken,
    getFoundryToken,
  };

  return <OidcAuthContext.Provider value={value}>{children}</OidcAuthContext.Provider>;
};
