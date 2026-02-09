import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode, FC } from 'react';
import type { TenantResponse } from '../api/types';

const SELECTED_TENANT_KEY = 'unified-ui-selected-tenant-id';

interface TenantContextType {
  tenants: TenantResponse[];
  selectedTenant: TenantResponse | null;
  setTenants: (tenants: TenantResponse[]) => void;
  selectTenant: (tenantId: string) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

interface TenantProviderProps {
  children: ReactNode;
}

export const TenantProvider: FC<TenantProviderProps> = ({ children }) => {
  const [tenants, setTenantsState] = useState<TenantResponse[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<TenantResponse | null>(null);

  const setTenants = useCallback((newTenants: TenantResponse[]) => {
    setTenantsState(newTenants);
    if (newTenants.length > 0) {
      const savedTenantId = localStorage.getItem(SELECTED_TENANT_KEY);
      if (savedTenantId) {
        const tenant = newTenants.find(t => t.id === savedTenantId);
        if (tenant) {
          setSelectedTenant(tenant);
          return;
        }
      }
      setSelectedTenant(newTenants[0]);
    }
  }, []);

  const selectTenant = useCallback((tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (tenant && tenant.id !== selectedTenant?.id) {
      localStorage.setItem(SELECTED_TENANT_KEY, tenantId);
      setSelectedTenant(tenant);
    }
  }, [tenants, selectedTenant?.id]);

  const value: TenantContextType = { tenants, selectedTenant, setTenants, selectTenant };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenantContext = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenantContext must be used within a TenantProvider');
  }
  return context;
};
