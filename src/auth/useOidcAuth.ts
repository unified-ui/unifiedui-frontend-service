import { createContext, useContext } from 'react';
import type { AccountInfo } from '@azure/msal-browser';

export interface OidcAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  account: AccountInfo | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  getFoundryToken: () => Promise<string | null>;
}

export const OidcAuthContext = createContext<OidcAuthContextType | undefined>(undefined);

export const useOidcAuth = (): OidcAuthContextType => {
  const context = useContext(OidcAuthContext);
  if (!context) {
    throw new Error('useOidcAuth must be used within OidcAuthProvider');
  }
  return context;
};
