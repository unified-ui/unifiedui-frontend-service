import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import type { AccountInfo } from '@azure/msal-browser';

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
  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const isLoading = inProgress !== 'none';

  const login = async () => {
    try {
      await instance.loginRedirect({
        scopes: ['User.Read', 'User.ReadBasic.All', 'GroupMember.Read.All', 'Group.Read.All'],
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
        scopes: ['User.Read', 'User.ReadBasic.All', 'GroupMember.Read.All', 'Group.Read.All'],
        account: accounts[0],
      });
      return response.accessToken;
    } catch (error) {
      console.error('Token acquisition failed:', error);
      return null;
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
      // Fallback to interactive if silent fails
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
