import { createContext, useContext } from 'react';
import type { AccountInfo } from '@azure/msal-browser';

export interface CognitoAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  account: AccountInfo | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  getFoundryToken: () => Promise<string | null>;
}

export const CognitoAuthContext = createContext<CognitoAuthContextType | undefined>(undefined);

export const useCognitoAuth = (): CognitoAuthContextType => {
  const context = useContext(CognitoAuthContext);
  if (!context) {
    throw new Error('useCognitoAuth must be used within CognitoAuthProvider');
  }
  return context;
};
