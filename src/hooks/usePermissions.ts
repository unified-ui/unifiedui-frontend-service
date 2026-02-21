import { useMemo } from 'react';
import { useIdentity } from '../contexts';
import { TenantPermissionEnum, PermissionActionEnum } from '../api/types';

export type ResourceType =
  | 'chat-agents'
  | 'autonomous-agents'
  | 'chat-widgets'
  | 're-act-agents'
  | 'conversations'
  | 'credentials'
  | 'custom-groups'
  | 'tools'
  | 'tenant-ai-models';

const CREATOR_ROLES: Record<ResourceType, TenantPermissionEnum> = {
  'chat-agents': TenantPermissionEnum.CHAT_AGENTS_CREATOR,
  'autonomous-agents': TenantPermissionEnum.AUTONOMOUS_AGENTS_CREATOR,
  'chat-widgets': TenantPermissionEnum.CHAT_WIDGETS_CREATOR,
  're-act-agents': TenantPermissionEnum.REACT_AGENT_CREATOR,
  'conversations': TenantPermissionEnum.CONVERSATIONS_CREATOR,
  'credentials': TenantPermissionEnum.CREDENTIALS_CREATOR,
  'custom-groups': TenantPermissionEnum.CUSTOM_GROUP_CREATOR,
  'tools': TenantPermissionEnum.REACT_AGENT_CREATOR,
  'tenant-ai-models': TenantPermissionEnum.TENANT_AI_MODELS_ADMIN,
};

const ADMIN_ROLES: Record<ResourceType, TenantPermissionEnum> = {
  'chat-agents': TenantPermissionEnum.CHAT_AGENTS_ADMIN,
  'autonomous-agents': TenantPermissionEnum.AUTONOMOUS_AGENTS_ADMIN,
  'chat-widgets': TenantPermissionEnum.CHAT_WIDGETS_ADMIN,
  're-act-agents': TenantPermissionEnum.REACT_AGENT_ADMIN,
  'conversations': TenantPermissionEnum.CONVERSATIONS_ADMIN,
  'credentials': TenantPermissionEnum.CREDENTIALS_ADMIN,
  'custom-groups': TenantPermissionEnum.CUSTOM_GROUPS_ADMIN,
  'tools': TenantPermissionEnum.REACT_AGENT_ADMIN,
  'tenant-ai-models': TenantPermissionEnum.TENANT_AI_MODELS_ADMIN,
};

export interface UsePermissionsReturn {
  hasRole: (role: TenantPermissionEnum) => boolean;
  hasAnyRole: (roles: TenantPermissionEnum[]) => boolean;
  isGlobalAdmin: boolean;
  canCreate: (resourceType: ResourceType) => boolean;
  isResourceAdmin: (resourceType: ResourceType) => boolean;
  canRead: (permission: PermissionActionEnum | null | undefined) => boolean;
  canWrite: (permission: PermissionActionEnum | null | undefined) => boolean;
  canAdmin: (permission: PermissionActionEnum | null | undefined) => boolean;
  canDelete: (permission: PermissionActionEnum | null | undefined) => boolean;
}

export function usePermissions(): UsePermissionsReturn {
  const { selectedTenantRoles } = useIdentity();

  return useMemo(() => {
    const rolesSet = new Set<string>(selectedTenantRoles);

    const hasRole = (role: TenantPermissionEnum): boolean => {
      return rolesSet.has(role);
    };

    const hasAnyRole = (roles: TenantPermissionEnum[]): boolean => {
      return roles.some(role => rolesSet.has(role));
    };

    const isGlobalAdmin = rolesSet.has(TenantPermissionEnum.GLOBAL_ADMIN);

    const canCreate = (resourceType: ResourceType): boolean => {
      if (isGlobalAdmin) return true;
      const creatorRole = CREATOR_ROLES[resourceType];
      const adminRole = ADMIN_ROLES[resourceType];
      return rolesSet.has(creatorRole) || rolesSet.has(adminRole);
    };

    const isResourceAdmin = (resourceType: ResourceType): boolean => {
      if (isGlobalAdmin) return true;
      return rolesSet.has(ADMIN_ROLES[resourceType]);
    };

    const canRead = (permission: PermissionActionEnum | null | undefined): boolean => {
      if (isGlobalAdmin) return true;
      return permission != null;
    };

    const canWrite = (permission: PermissionActionEnum | null | undefined): boolean => {
      if (isGlobalAdmin) return true;
      return permission === PermissionActionEnum.WRITE || permission === PermissionActionEnum.ADMIN;
    };

    const canAdmin = (permission: PermissionActionEnum | null | undefined): boolean => {
      if (isGlobalAdmin) return true;
      return permission === PermissionActionEnum.ADMIN;
    };

    const canDelete = canAdmin;

    return {
      hasRole,
      hasAnyRole,
      isGlobalAdmin,
      canCreate,
      isResourceAdmin,
      canRead,
      canWrite,
      canAdmin,
      canDelete,
    };
  }, [selectedTenantRoles]);
}
