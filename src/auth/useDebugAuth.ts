import { createContext, useContext } from 'react';
import type { AccountInfo } from '@azure/msal-browser';

export interface DebugLoginParams {
  userId: string;
  upn: string;
  name?: string;
  groups?: string[];
}

export interface DebugAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  account: AccountInfo | null;
  login: (params: DebugLoginParams) => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  getFoundryToken: () => Promise<string | null>;
}

export const DebugAuthContext = createContext<DebugAuthContextType | undefined>(undefined);

export const useDebugAuth = (): DebugAuthContextType => {
  const context = useContext(DebugAuthContext);
  if (!context) {
    throw new Error('useDebugAuth must be used within DebugAuthProvider');
  }
  return context;
};
