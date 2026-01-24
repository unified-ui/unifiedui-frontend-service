import { useState, useCallback } from 'react';
import { useIdentity } from '../contexts';
import type {
  PrincipalTypeEnum,
  PermissionActionEnum,
  PrincipalWithRolesResponse,
  ResourcePrincipalsResponse,
} from '../api/types';
import type { PrincipalPermission } from '../components/common/ManageAccessTable/ManageAccessTable';
import type { SelectedPrincipal } from '../components/common/AddPrincipalDialog/AddPrincipalDialog';

export type EntityType = 
  | 'application' 
  | 'autonomous-agent' 
  | 'credential' 
  | 'chat-widget' 
  | 'conversation'
  | 'tool';

interface UseEntityPermissionsOptions {
  entityType: EntityType;
  entityId: string | null;
}

interface UseEntityPermissionsReturn {
  principals: PrincipalPermission[];
  isLoading: boolean;
  hasFetched: boolean;
  error: string | null;
  fetchPrincipals: (showLoading?: boolean) => Promise<void>;
  handleRoleChange: (
    principalId: string,
    principalType: PrincipalTypeEnum,
    role: PermissionActionEnum,
    enabled: boolean
  ) => Promise<void>;
  handleAddPrincipals: (
    selectedPrincipals: SelectedPrincipal[],
    role: PermissionActionEnum
  ) => Promise<void>;
  handleDeletePrincipal: (
    principalId: string,
    principalType: PrincipalTypeEnum
  ) => Promise<void>;
  resetState: () => void;
}

const transformPrincipals = (response: ResourcePrincipalsResponse): PrincipalPermission[] => {
  return (response.principals || []).map((p: PrincipalWithRolesResponse) => ({
    id: p.principal_id,
    principalId: p.principal_id,
    principalType: p.principal_type,
    displayName: p.display_name,
    mail: p.mail,
    principalName: p.principal_name,
    description: p.description,
    roles: p.roles || [],
  }));
};

export const useEntityPermissions = ({
  entityType,
  entityId,
}: UseEntityPermissionsOptions): UseEntityPermissionsReturn => {
  const { apiClient, selectedTenant } = useIdentity();

  const [principals, setPrincipals] = useState<PrincipalPermission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setPrincipals([]);
    setIsLoading(false);
    setHasFetched(false);
    setError(null);
  }, []);

  const getPermissionMethods = useCallback(() => {
    if (!apiClient || !selectedTenant || !entityId) return null;
    const tenantId = selectedTenant.id;

    switch (entityType) {
      case 'application':
        return {
          getPrincipals: () => apiClient.getApplicationPrincipals(tenantId, entityId),
          setPermission: (data: { principal_id: string; principal_type: PrincipalTypeEnum; role: PermissionActionEnum }) =>
            apiClient.setApplicationPermission(tenantId, entityId, data),
          deletePermission: (principalId: string, principalType: PrincipalTypeEnum, role: PermissionActionEnum) =>
            apiClient.deleteApplicationPermission(tenantId, entityId, principalId, principalType, role),
        };
      case 'autonomous-agent':
        return {
          getPrincipals: () => apiClient.getAutonomousAgentPrincipals(tenantId, entityId),
          setPermission: (data: { principal_id: string; principal_type: PrincipalTypeEnum; role: PermissionActionEnum }) =>
            apiClient.setAutonomousAgentPermission(tenantId, entityId, data),
          deletePermission: (principalId: string, principalType: PrincipalTypeEnum, role: PermissionActionEnum) =>
            apiClient.deleteAutonomousAgentPermission(tenantId, entityId, principalId, principalType, role),
        };
      case 'credential':
        return {
          getPrincipals: () => apiClient.getCredentialPrincipals(tenantId, entityId),
          setPermission: (data: { principal_id: string; principal_type: PrincipalTypeEnum; role: PermissionActionEnum }) =>
            apiClient.setCredentialPermission(tenantId, entityId, data),
          deletePermission: (principalId: string, principalType: PrincipalTypeEnum, role: PermissionActionEnum) =>
            apiClient.deleteCredentialPermission(tenantId, entityId, principalId, principalType, role),
        };
      case 'chat-widget':
        return {
          getPrincipals: () => apiClient.getChatWidgetPrincipals(tenantId, entityId),
          setPermission: (data: { principal_id: string; principal_type: PrincipalTypeEnum; role: PermissionActionEnum }) =>
            apiClient.setChatWidgetPermission(tenantId, entityId, data),
          deletePermission: (principalId: string, principalType: PrincipalTypeEnum, role: PermissionActionEnum) =>
            apiClient.deleteChatWidgetPermission(tenantId, entityId, principalId, principalType, role),
        };
      case 'conversation':
        return {
          getPrincipals: () => apiClient.getConversationPrincipals(tenantId, entityId),
          setPermission: (data: { principal_id: string; principal_type: PrincipalTypeEnum; role: PermissionActionEnum }) =>
            apiClient.setConversationPermission(tenantId, entityId, data),
          deletePermission: (principalId: string, principalType: PrincipalTypeEnum, role: PermissionActionEnum) =>
            apiClient.deleteConversationPermission(tenantId, entityId, principalId, principalType, role),
        };
      case 'tool':
        return {
          getPrincipals: () => apiClient.getToolPrincipals(tenantId, entityId),
          setPermission: (data: { principal_id: string; principal_type: PrincipalTypeEnum; role: PermissionActionEnum }) =>
            apiClient.setToolPermission(tenantId, entityId, data),
          deletePermission: (principalId: string, principalType: PrincipalTypeEnum, role: PermissionActionEnum) =>
            apiClient.deleteToolPermission(tenantId, entityId, principalId, principalType, role),
        };
      default:
        return null;
    }
  }, [apiClient, selectedTenant, entityId, entityType]);

  const fetchPrincipals = useCallback(async (showLoading = true) => {
    const methods = getPermissionMethods();
    if (!methods) return;

    if (showLoading) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await methods.getPrincipals();
      setPrincipals(transformPrincipals(response));
    } catch (err) {
      console.error('Failed to fetch principals:', err);
      setError('Failed to load access permissions');
    } finally {
      setIsLoading(false);
      setHasFetched(true);
    }
  }, [getPermissionMethods]);

  const handleRoleChange = useCallback(
    async (
      principalId: string,
      principalType: PrincipalTypeEnum,
      role: PermissionActionEnum,
      enabled: boolean
    ) => {
      const methods = getPermissionMethods();
      if (!methods) return;

      try {
        if (enabled) {
          await methods.setPermission({
            principal_id: principalId,
            principal_type: principalType,
            role,
          });
        } else {
          await methods.deletePermission(principalId, principalType, role);
        }
        await fetchPrincipals(false);
      } catch (err) {
        console.error('Failed to update permission:', err);
        await fetchPrincipals(false);
      }
    },
    [getPermissionMethods, fetchPrincipals]
  );

  const handleAddPrincipals = useCallback(
    async (selectedPrincipals: SelectedPrincipal[], role: PermissionActionEnum) => {
      const methods = getPermissionMethods();
      if (!methods) return;

      for (const principal of selectedPrincipals) {
        await methods.setPermission({
          principal_id: principal.id,
          principal_type: principal.type,
          role,
        });
      }
      await fetchPrincipals(false);
    },
    [getPermissionMethods, fetchPrincipals]
  );

  const handleDeletePrincipal = useCallback(
    async (principalId: string, principalType: PrincipalTypeEnum) => {
      const methods = getPermissionMethods();
      if (!methods) return;

      const principal = principals.find(
        (p) => p.principalId === principalId && p.principalType === principalType
      );
      if (principal) {
        for (const role of principal.roles) {
          await methods.deletePermission(principalId, principalType, role);
        }
      }
      await fetchPrincipals(false);
    },
    [getPermissionMethods, principals, fetchPrincipals]
  );

  return {
    principals,
    isLoading,
    hasFetched,
    error,
    fetchPrincipals,
    handleRoleChange,
    handleAddPrincipals,
    handleDeletePrincipal,
    resetState,
  };
};
