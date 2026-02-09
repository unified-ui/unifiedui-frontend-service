import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode, FC } from 'react';
import type { IdentityUser } from '../api/types';

interface AuthContextType {
  user: IdentityUser | null;
  isLoading: boolean;
  setUser: (user: IdentityUser | null) => void;
  setIsLoading: (loading: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderInternalProps {
  children: ReactNode;
}

export const AuthProviderInternal: FC<AuthProviderInternalProps> = ({ children }) => {
  const [user, setUserState] = useState<IdentityUser | null>(null);
  const [isLoading, setIsLoadingState] = useState(false);

  const setUser = useCallback((user: IdentityUser | null) => {
    setUserState(user);
  }, []);

  const setIsLoading = useCallback((loading: boolean) => {
    setIsLoadingState(loading);
  }, []);

  const value: AuthContextType = { user, isLoading, setUser, setIsLoading };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProviderInternal');
  }
  return context;
};
