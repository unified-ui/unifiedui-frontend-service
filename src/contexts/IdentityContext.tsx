import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode, FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth';
import { UnifiedUIAPIClient } from '../api/client';
import type { TenantResponse, IdentityUser, TenantPermissionEnum, OrganizationContextResponse } from '../api/types';
import { notifications } from '@mantine/notifications';
import { AuthProviderInternal, useAuthContext } from './AuthContext';
import { TenantProvider, useTenantContext } from './TenantContext';
import { ApiClientProvider, useApiClient } from './ApiClientContext';

interface IdentityContextType {
  user: IdentityUser | null;
  organization: OrganizationContextResponse | null;
  tenants: TenantResponse[];
  selectedTenant: TenantResponse | null;
  selectedTenantRoles: TenantPermissionEnum[];
  isLoading: boolean;
  apiClient: UnifiedUIAPIClient | null;
  refreshIdentity: (noCache?: boolean) => Promise<void>;
  selectTenant: (tenantId: string) => void;
  getFoundryToken: () => Promise<string | null>;
}

const IdentityContext = createContext<IdentityContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const AGENT_SERVICE_URL = import.meta.env.VITE_AGENT_SERVICE_URL || 'http://localhost:8085';

interface IdentityProviderProps {
  children: ReactNode;
}

const IdentityProviderInner: FC<IdentityProviderProps> = ({ children }) => {
  const { t } = useTranslation('common');
  const { isAuthenticated, getAccessToken, getFoundryToken } = useAuth();
  const { user, isLoading, setUser, setIsLoading } = useAuthContext();
  const { tenants, selectedTenant, selectedTenantRoles, setTenantsWithRoles, selectTenant } = useTenantContext();
  const { apiClient, setApiClient } = useApiClient();
  const [organization, setOrganization] = useState<OrganizationContextResponse | null>(null);

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
            title: t('error'),
            message: error.message || t('unexpectedError'),
            color: 'red',
            position: 'top-right',
          });
        },
        onSuccess: (message) => {
          notifications.show({
            title: t('success'),
            message,
            color: 'green',
            position: 'top-right',
          });
        },
      });
      client.setAgentServiceURL(AGENT_SERVICE_URL);
      setApiClient(client);
    } else {
      setApiClient(null);
      setUser(null);
      setOrganization(null);
      setTenantsWithRoles([]);
    }
  }, [isAuthenticated, getAccessToken]);

  useEffect(() => {
    if (isAuthenticated && apiClient) {
      refreshIdentity();
    }
  }, [isAuthenticated, apiClient]);

  const refreshIdentity = async (noCache?: boolean): Promise<void> => {
    if (!apiClient) return;

    setIsLoading(true);
    try {
      const meResponse = await apiClient.getMe({ noCache });

      const identityUser: IdentityUser = {
        id: meResponse.id,
        identity_provider: meResponse.identity_provider,
        identity_tenant_id: meResponse.identity_tenant_id,
        display_name: meResponse.display_name,
        firstname: meResponse.firstname,
        lastname: meResponse.lastname,
        mail: meResponse.mail,
      };

      setOrganization(meResponse.organization || null);
      setTenantsWithRoles(meResponse.tenants || []);
      setUser(identityUser);
    } catch (error) {
      console.error('Failed to load identity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value: IdentityContextType = {
    user,
    organization,
    tenants,
    selectedTenant,
    selectedTenantRoles,
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

export const IdentityProvider: FC<IdentityProviderProps> = ({ children }) => {
  return (
    <AuthProviderInternal>
      <TenantProvider>
        <ApiClientProvider>
          <IdentityProviderInner>
            {children}
          </IdentityProviderInner>
        </ApiClientProvider>
      </TenantProvider>
    </AuthProviderInternal>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useIdentity = (): IdentityContextType => {
  const context = useContext(IdentityContext);
  if (context === undefined) {
    throw new Error('useIdentity must be used within an IdentityProvider');
  }
  return context;
};
