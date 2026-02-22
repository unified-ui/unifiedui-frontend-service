import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import type { AccountInfo } from '@azure/msal-browser';
import { authConfig, loginRequest } from './authConfig';
import { useGoogleAuth } from './useGoogleAuth';
import { useCognitoAuth } from './useCognitoAuth';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  account: AccountInfo | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
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

const MsalAuthProviderInner = ({ children }: AuthProviderProps) => {
  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const isLoading = inProgress !== 'none';

  const login = async () => {
    try {
      await instance.loginRedirect({
        scopes: loginRequest.scopes,
      });
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const logout = async () => {
    try {
      await instance.logoutRedirect();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getAccessToken = async (): Promise<string | null> => {
    if (!isAuthenticated || accounts.length === 0) {
      return null;
    }

    try {
      const response = await instance.acquireTokenSilent({
        scopes: loginRequest.scopes,
        account: accounts[0],
      });
      return response.accessToken;
    } catch (error) {
      console.error('Token acquisition failed, trying popup:', error);
      try {
        const response = await instance.acquireTokenPopup({
          scopes: loginRequest.scopes,
          account: accounts[0],
        });
        return response.accessToken;
      } catch (popupError) {
        console.error('Token popup failed:', popupError);
        return null;
      }
    }
  };

  const getFoundryToken = async (): Promise<string | null> => {
    if (!isAuthenticated || accounts.length === 0) {
      return null;
    }

    try {
      const response = await instance.acquireTokenSilent({
        scopes: ['https://ai.azure.com/.default'],
        account: accounts[0],
      });
      return response.accessToken;
    } catch (error) {
      console.error('Foundry token acquisition failed:', error);
      try {
        const response = await instance.acquireTokenPopup({
          scopes: ['https://ai.azure.com/.default'],
          account: accounts[0],
        });
        return response.accessToken;
      } catch (popupError) {
        console.error('Foundry token popup failed:', popupError);
        return null;
      }
    }
  };

  const value: AuthContextType = {
    isLoading,
    isAuthenticated,
    account: accounts[0] || null,
    login,
    logout,
    getAccessToken,
    getFoundryToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const GoogleAuthProviderInner = ({ children }: AuthProviderProps) => {
  const googleAuth = useGoogleAuth();

  const value: AuthContextType = {
    isAuthenticated: googleAuth.isAuthenticated,
    isLoading: googleAuth.isLoading,
    account: googleAuth.account,
    login: googleAuth.login,
    logout: googleAuth.logout,
    getAccessToken: googleAuth.getAccessToken,
    getFoundryToken: googleAuth.getFoundryToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const CognitoAuthProviderInner = ({ children }: AuthProviderProps) => {
  const cognitoAuth = useCognitoAuth();

  const value: AuthContextType = {
    isAuthenticated: cognitoAuth.isAuthenticated,
    isLoading: cognitoAuth.isLoading,
    account: cognitoAuth.account,
    login: cognitoAuth.login,
    logout: cognitoAuth.logout,
    getAccessToken: cognitoAuth.getAccessToken,
    getFoundryToken: cognitoAuth.getFoundryToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  switch (authConfig.provider) {
    case 'google':
      return <GoogleAuthProviderInner>{children}</GoogleAuthProviderInner>;
    case 'aws_cognito':
      return <CognitoAuthProviderInner>{children}</CognitoAuthProviderInner>;
    case 'microsoft':
    default:
      return <MsalAuthProviderInner>{children}</MsalAuthProviderInner>;
  }
};
