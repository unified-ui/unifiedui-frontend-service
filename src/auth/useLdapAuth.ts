import { createContext, useContext } from 'react';
import type { AccountInfo } from '@azure/msal-browser';

export interface LdapAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  account: AccountInfo | null;
  login: () => Promise<void>;
  loginWithCredentials: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  getFoundryToken: () => Promise<string | null>;
}

export const LdapAuthContext = createContext<LdapAuthContextType | undefined>(undefined);

export const useLdapAuth = (): LdapAuthContextType => {
  const context = useContext(LdapAuthContext);
  if (!context) {
    throw new Error('useLdapAuth must be used within LdapAuthProvider');
  }
  return context;
};
