import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode, FC } from 'react';
import type { TenantResponse, TenantWithRoles, TenantPermissionEnum } from '../api/types';

const SELECTED_TENANT_KEY = 'unified-ui-selected-tenant-id';

interface TenantContextType {
  tenants: TenantResponse[];
  selectedTenant: TenantResponse | null;
  selectedTenantRoles: TenantPermissionEnum[];
  setTenantsWithRoles: (tenantsWithRoles: TenantWithRoles[]) => void;
  selectTenant: (tenantId: string) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

interface TenantProviderProps {
  children: ReactNode;
}

export const TenantProvider: FC<TenantProviderProps> = ({ children }) => {
  const [tenantsWithRoles, setTenantsWithRolesState] = useState<TenantWithRoles[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  const tenants = useMemo(
    () => tenantsWithRoles.map(t => t.tenant),
    [tenantsWithRoles]
  );

  const selectedTenant = useMemo(
    () => tenants.find(t => t.id === selectedTenantId) || null,
    [tenants, selectedTenantId]
  );

  const selectedTenantRoles = useMemo(
    () => {
      const entry = tenantsWithRoles.find(t => t.tenant.id === selectedTenantId);
      return (entry?.roles || []) as TenantPermissionEnum[];
    },
    [tenantsWithRoles, selectedTenantId]
  );

  const setTenantsWithRoles = useCallback((newTenantsWithRoles: TenantWithRoles[]) => {
    setTenantsWithRolesState(newTenantsWithRoles);
    if (newTenantsWithRoles.length > 0) {
      const savedTenantId = localStorage.getItem(SELECTED_TENANT_KEY);
      if (savedTenantId) {
        const found = newTenantsWithRoles.find(t => t.tenant.id === savedTenantId);
        if (found) {
          setSelectedTenantId(savedTenantId);
          return;
        }
      }
      setSelectedTenantId(newTenantsWithRoles[0].tenant.id);
    }
  }, []);

  const selectTenant = useCallback((tenantId: string) => {
    const found = tenantsWithRoles.find(t => t.tenant.id === tenantId);
    if (found && tenantId !== selectedTenantId) {
      localStorage.setItem(SELECTED_TENANT_KEY, tenantId);
      setSelectedTenantId(tenantId);
    }
  }, [tenantsWithRoles, selectedTenantId]);

  const value: TenantContextType = {
    tenants,
    selectedTenant,
    selectedTenantRoles,
    setTenantsWithRoles,
    selectTenant,
  };

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
