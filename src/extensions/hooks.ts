import { useAuth } from '../auth';
import { useIdentity } from '../contexts';
import type { IdentityUser, TenantPermissionEnum, TenantResponse } from '../api/types';
import {
  createCustomServiceClient,
  type CustomServiceClient,
  type CustomServiceClientConfig,
} from './client';

export interface CustomExtensionContextValue {
  user: IdentityUser | null;
  selectedTenant: TenantResponse | null;
  selectedTenantRoles: TenantPermissionEnum[];
  getAccessToken: () => Promise<string | null>;
}

export type CustomServiceHookConfig = Omit<
  CustomServiceClientConfig,
  'getAccessToken' | 'getTenantId'
>;

export const useCustomExtensionContext = (): CustomExtensionContextValue => {
  const { getAccessToken } = useAuth();
  const { user, selectedTenant, selectedTenantRoles } = useIdentity();
  return { user, selectedTenant, selectedTenantRoles, getAccessToken };
};

export const useCustomServiceClient = (
  config: CustomServiceHookConfig,
): CustomServiceClient => {
  const { getAccessToken } = useAuth();
  const { selectedTenant } = useIdentity();

  return createCustomServiceClient({
    ...config,
    getAccessToken,
    getTenantId: () => selectedTenant?.id ?? null,
  });
};
