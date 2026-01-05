import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode, FC } from 'react';
import { useAuth } from '../auth';
import { UnifiedUIAPIClient } from '../api/client';
import type { TenantResponse, IdentityUser } from '../api/types';
import { notifications } from '@mantine/notifications';

interface IdentityContextType {
  user: IdentityUser | null;
  tenants: TenantResponse[];
  selectedTenant: TenantResponse | null;
  isLoading: boolean;
  apiClient: UnifiedUIAPIClient | null;
  refreshIdentity: () => Promise<void>;
  selectTenant: (tenantId: string) => void;
  getFoundryToken: () => Promise<string | null>;
}

const IdentityContext = createContext<IdentityContextType | undefined>(undefined);

const SELECTED_TENANT_KEY = 'unified-ui-selected-tenant-id';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const AGENT_SERVICE_URL = import.meta.env.VITE_AGENT_SERVICE_URL || 'http://localhost:8085';

interface IdentityProviderProps {
  children: ReactNode;
}

export const IdentityProvider: FC<IdentityProviderProps> = ({ children }) => {
  const { isAuthenticated, getAccessToken, getFoundryToken } = useAuth();
  const [user, setUser] = useState<IdentityUser | null>(null);
  const [tenants, setTenants] = useState<TenantResponse[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<TenantResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiClient, setApiClient] = useState<UnifiedUIAPIClient | null>(null);

  // Initialize API Client
  useEffect(() => {
    if (isAuthenticated) {
      const client = new UnifiedUIAPIClient({
        baseURL: API_BASE_URL,
        getAccessToken: async () => {
          const token = await getAccessToken();
          return token || '';
        },
        onError: (error) => {
          console.error('API Error:', error);
          notifications.show({
            title: 'Fehler',
            message: error.message || 'Ein unerwarteter Fehler ist aufgetreten',
            color: 'red',
            position: 'top-right',
          });
        },
        onSuccess: (message) => {
          notifications.show({
            title: 'Erfolg',
            message,
            color: 'green',
            position: 'top-right',
          });
        },
      });
      // Configure agent service URL
      client.setAgentServiceURL(AGENT_SERVICE_URL);
      setApiClient(client);
    } else {
      setApiClient(null);
      setUser(null);
      setTenants([]);
      setSelectedTenant(null);
    }
  }, [isAuthenticated, getAccessToken]);

  // Load identity when authenticated
  useEffect(() => {
    if (isAuthenticated && apiClient) {
      refreshIdentity();
    }
  }, [isAuthenticated, apiClient]);

  // Restore selected tenant from localStorage
  useEffect(() => {
    if (tenants.length > 0) {
      const savedTenantId = localStorage.getItem(SELECTED_TENANT_KEY);
      
      if (savedTenantId) {
        const tenant = tenants.find(t => t.id === savedTenantId);
        if (tenant) {
          setSelectedTenant(tenant);
          return;
        }
      }
      
      // If no saved tenant or tenant not found, select first one
      setSelectedTenant(tenants[0]);
    }
  }, [tenants]);

  const refreshIdentity = async (): Promise<void> => {
    if (!apiClient) return;

    setIsLoading(true);
    try {
      let meResponse = await apiClient.getMe();

      // Extract user info from response
      const user: IdentityUser = {
        id: meResponse.id,
        identity_provider: meResponse.identity_provider,
        identity_tenant_id: meResponse.identity_tenant_id,
        display_name: meResponse.display_name,
        firstname: meResponse.firstname,
        lastname: meResponse.lastname,
        mail: meResponse.mail,
      };

      // Extract tenants from nested structure
      const tenants = meResponse.tenants?.map(t => t.tenant) || [];

      // If no tenants exist, create default tenant
      if (tenants.length === 0) {
        console.log('No tenants found, creating default tenant...');
        
        await apiClient.createTenant({
          name: 'default',
          description: 'Default tenant created automatically',
        });

        // Fetch /me again to get the newly created tenant
        meResponse = await apiClient.getMe();
        const updatedTenants = meResponse.tenants?.map(t => t.tenant) || [];
        setTenants(updatedTenants);
      } else {
        setTenants(tenants);
      }

      setUser(user);
    } catch (error) {
      console.error('Failed to load identity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectTenant = (tenantId: string): void => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (tenant) {
      setSelectedTenant(tenant);
      localStorage.setItem(SELECTED_TENANT_KEY, tenantId);
      
      notifications.show({
        title: 'Tenant gewechselt',
        message: `Sie haben zu "${tenant.name}" gewechselt`,
        color: 'blue',
        position: 'top-right',
      });
    }
  };

  const value: IdentityContextType = {
    user,
    tenants,
    selectedTenant,
    isLoading,
    apiClient,
    refreshIdentity,
    selectTenant,
    getFoundryToken,
  };

  return (
    <IdentityContext.Provider value={value}>
      {children}
    </IdentityContext.Provider>
  );
};

export const useIdentity = (): IdentityContextType => {
  const context = useContext(IdentityContext);
  if (context === undefined) {
    throw new Error('useIdentity must be used within an IdentityProvider');
  }
  return context;
};
