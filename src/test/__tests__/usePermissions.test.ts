import { renderHook } from '@testing-library/react';
import { usePermissions } from '../../hooks/usePermissions';
import type { ResourceType } from '../../hooks/usePermissions';
import { TenantPermissionEnum, PermissionActionEnum, OrganizationRoleEnum } from '../../api/types';

vi.mock('../../contexts', () => ({
  useIdentity: vi.fn(),
}));

import { useIdentity } from '../../contexts';

const mockUseIdentity = vi.mocked(useIdentity);

function setupRoles(roles: string[], orgRoles: string[] = []) {
  mockUseIdentity.mockReturnValue({
    user: null,
    organization: orgRoles.length > 0 ? { id: 'org-1', name: 'Test Org', slug: 'test-org', roles: orgRoles } : null,
    isSystemAdmin: false,
    tenants: [],
    selectedTenant: null,
    selectedTenantRoles: roles as TenantPermissionEnum[],
    isLoading: false,
    apiClient: null,
    refreshIdentity: vi.fn(),
    selectTenant: vi.fn(),
    getFoundryToken: vi.fn(),
  });
}

describe('usePermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('hasRole', () => {
    it('returns true when user has the role', () => {
      setupRoles([TenantPermissionEnum.CHAT_AGENTS_CREATOR]);
      const { result } = renderHook(() => usePermissions());
      expect(result.current.hasRole(TenantPermissionEnum.CHAT_AGENTS_CREATOR)).toBe(true);
    });

    it('returns false when user lacks the role', () => {
      setupRoles([TenantPermissionEnum.READER]);
      const { result } = renderHook(() => usePermissions());
      expect(result.current.hasRole(TenantPermissionEnum.CHAT_AGENTS_CREATOR)).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    it('returns true when user has at least one of the roles', () => {
      setupRoles([TenantPermissionEnum.CREDENTIALS_CREATOR]);
      const { result } = renderHook(() => usePermissions());
      expect(result.current.hasAnyRole([
        TenantPermissionEnum.CHAT_AGENTS_CREATOR,
        TenantPermissionEnum.CREDENTIALS_CREATOR,
      ])).toBe(true);
    });

    it('returns false when user has none of the roles', () => {
      setupRoles([TenantPermissionEnum.READER]);
      const { result } = renderHook(() => usePermissions());
      expect(result.current.hasAnyRole([
        TenantPermissionEnum.CHAT_AGENTS_CREATOR,
        TenantPermissionEnum.CREDENTIALS_CREATOR,
      ])).toBe(false);
    });
  });

  describe('isGlobalAdmin', () => {
    it('returns true for TENANT_GLOBAL_ADMIN', () => {
      setupRoles([TenantPermissionEnum.TENANT_GLOBAL_ADMIN]);
      const { result } = renderHook(() => usePermissions());
      expect(result.current.isGlobalAdmin).toBe(true);
    });

    it('returns false for non-admin', () => {
      setupRoles([TenantPermissionEnum.READER]);
      const { result } = renderHook(() => usePermissions());
      expect(result.current.isGlobalAdmin).toBe(false);
    });
  });

  describe('canCreate', () => {
    const resourceTypes: Array<{ type: ResourceType; creatorRole: TenantPermissionEnum; adminRole: TenantPermissionEnum }> = [
      { type: 'chat-agents', creatorRole: TenantPermissionEnum.CHAT_AGENTS_CREATOR, adminRole: TenantPermissionEnum.CHAT_AGENTS_ADMIN },
      { type: 'workflows', creatorRole: TenantPermissionEnum.WORKFLOWS_CREATOR, adminRole: TenantPermissionEnum.WORKFLOWS_ADMIN },
      { type: 'chat-widgets', creatorRole: TenantPermissionEnum.CHAT_WIDGETS_CREATOR, adminRole: TenantPermissionEnum.CHAT_WIDGETS_ADMIN },
      { type: 'conversations', creatorRole: TenantPermissionEnum.CONVERSATIONS_CREATOR, adminRole: TenantPermissionEnum.CONVERSATIONS_ADMIN },
      { type: 'credentials', creatorRole: TenantPermissionEnum.CREDENTIALS_CREATOR, adminRole: TenantPermissionEnum.CREDENTIALS_ADMIN },
      { type: 'custom-groups', creatorRole: TenantPermissionEnum.CUSTOM_GROUP_CREATOR, adminRole: TenantPermissionEnum.CUSTOM_GROUPS_ADMIN },
    ];

    it('returns true for TENANT_GLOBAL_ADMIN on any resource type', () => {
      setupRoles([TenantPermissionEnum.TENANT_GLOBAL_ADMIN]);
      const { result } = renderHook(() => usePermissions());
      resourceTypes.forEach(({ type }) => {
        expect(result.current.canCreate(type)).toBe(true);
      });
    });

    it.each(resourceTypes)('returns true for $type with creator role', ({ type, creatorRole }) => {
      setupRoles([creatorRole]);
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canCreate(type)).toBe(true);
    });

    it.each(resourceTypes)('returns true for $type with admin role', ({ type, adminRole }) => {
      setupRoles([adminRole]);
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canCreate(type)).toBe(true);
    });

    it('returns false for READER on chat agents', () => {
      setupRoles([TenantPermissionEnum.READER]);
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canCreate('chat-agents')).toBe(false);
    });
  });

  describe('isResourceAdmin', () => {
    it('returns true for TENANT_GLOBAL_ADMIN', () => {
      setupRoles([TenantPermissionEnum.TENANT_GLOBAL_ADMIN]);
      const { result } = renderHook(() => usePermissions());
      expect(result.current.isResourceAdmin('chat-agents')).toBe(true);
    });

    it('returns true with matching admin role', () => {
      setupRoles([TenantPermissionEnum.CHAT_AGENTS_ADMIN]);
      const { result } = renderHook(() => usePermissions());
      expect(result.current.isResourceAdmin('chat-agents')).toBe(true);
    });

    it('returns false with only creator role', () => {
      setupRoles([TenantPermissionEnum.CHAT_AGENTS_CREATOR]);
      const { result } = renderHook(() => usePermissions());
      expect(result.current.isResourceAdmin('chat-agents')).toBe(false);
    });
  });

  describe('canRead', () => {
    it('returns true for TENANT_GLOBAL_ADMIN even with null permission', () => {
      setupRoles([TenantPermissionEnum.TENANT_GLOBAL_ADMIN]);
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canRead(null)).toBe(true);
    });

    it('returns true for READ permission', () => {
      setupRoles([TenantPermissionEnum.READER]);
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canRead(PermissionActionEnum.READ)).toBe(true);
    });

    it('returns true for WRITE permission', () => {
      setupRoles([TenantPermissionEnum.READER]);
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canRead(PermissionActionEnum.WRITE)).toBe(true);
    });

    it('returns true for ADMIN permission', () => {
      setupRoles([TenantPermissionEnum.READER]);
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canRead(PermissionActionEnum.ADMIN)).toBe(true);
    });

    it('returns false for null permission', () => {
      setupRoles([TenantPermissionEnum.READER]);
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canRead(null)).toBe(false);
    });

    it('returns false for undefined permission', () => {
      setupRoles([TenantPermissionEnum.READER]);
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canRead(undefined)).toBe(false);
    });
  });

  describe('canWrite', () => {
    it('returns true for TENANT_GLOBAL_ADMIN even with null permission', () => {
      setupRoles([TenantPermissionEnum.TENANT_GLOBAL_ADMIN]);
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canWrite(null)).toBe(true);
    });

    it('returns true for WRITE permission', () => {
      setupRoles([TenantPermissionEnum.READER]);
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canWrite(PermissionActionEnum.WRITE)).toBe(true);
    });

    it('returns true for ADMIN permission', () => {
      setupRoles([TenantPermissionEnum.READER]);
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canWrite(PermissionActionEnum.ADMIN)).toBe(true);
    });

    it('returns false for READ permission', () => {
      setupRoles([TenantPermissionEnum.READER]);
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canWrite(PermissionActionEnum.READ)).toBe(false);
    });

    it('returns false for null permission', () => {
      setupRoles([TenantPermissionEnum.READER]);
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canWrite(null)).toBe(false);
    });
  });

  describe('canAdmin', () => {
    it('returns true for TENANT_GLOBAL_ADMIN even with null permission', () => {
      setupRoles([TenantPermissionEnum.TENANT_GLOBAL_ADMIN]);
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canAdmin(null)).toBe(true);
    });

    it('returns true for ADMIN permission', () => {
      setupRoles([TenantPermissionEnum.READER]);
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canAdmin(PermissionActionEnum.ADMIN)).toBe(true);
    });

    it('returns false for WRITE permission', () => {
      setupRoles([TenantPermissionEnum.READER]);
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canAdmin(PermissionActionEnum.WRITE)).toBe(false);
    });

    it('returns false for READ permission', () => {
      setupRoles([TenantPermissionEnum.READER]);
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canAdmin(PermissionActionEnum.READ)).toBe(false);
    });
  });

  describe('canDelete', () => {
    it('behaves same as canAdmin', () => {
      setupRoles([TenantPermissionEnum.READER]);
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canDelete(PermissionActionEnum.ADMIN)).toBe(true);
      expect(result.current.canDelete(PermissionActionEnum.WRITE)).toBe(false);
      expect(result.current.canDelete(PermissionActionEnum.READ)).toBe(false);
      expect(result.current.canDelete(null)).toBe(false);
    });
  });

  describe('organization role bypass', () => {
    it('ORGANISATION_GLOBAL_ADMIN bypasses all tenant permissions (isGlobalAdmin=true)', () => {
      setupRoles([TenantPermissionEnum.READER], [OrganizationRoleEnum.ORGANISATION_GLOBAL_ADMIN]);
      const { result } = renderHook(() => usePermissions());
      expect(result.current.isGlobalAdmin).toBe(true);
      expect(result.current.hasOrgBypass).toBe(true);
      expect(result.current.isOrgGlobalAdmin).toBe(true);
      expect(result.current.isOrgTenantAdmin).toBe(false);
      expect(result.current.canCreate('chat-agents')).toBe(true);
      expect(result.current.canCreate('credentials')).toBe(true);
      expect(result.current.isResourceAdmin('chat-agents')).toBe(true);
      expect(result.current.canRead(null)).toBe(true);
      expect(result.current.canWrite(null)).toBe(true);
      expect(result.current.canAdmin(null)).toBe(true);
      expect(result.current.canDelete(null)).toBe(true);
    });

    it('ORGANISATION_TENANT_ADMIN bypasses all tenant permissions (isGlobalAdmin=true)', () => {
      setupRoles([TenantPermissionEnum.READER], [OrganizationRoleEnum.ORGANISATION_TENANT_ADMIN]);
      const { result } = renderHook(() => usePermissions());
      expect(result.current.isGlobalAdmin).toBe(true);
      expect(result.current.hasOrgBypass).toBe(true);
      expect(result.current.isOrgGlobalAdmin).toBe(false);
      expect(result.current.isOrgTenantAdmin).toBe(true);
      expect(result.current.canCreate('chat-agents')).toBe(true);
      expect(result.current.isResourceAdmin('workflows')).toBe(true);
      expect(result.current.canWrite(PermissionActionEnum.READ)).toBe(true);
      expect(result.current.canAdmin(null)).toBe(true);
    });

    it('ORGANISATION_TENANT_CREATOR does NOT bypass tenant permissions', () => {
      setupRoles([TenantPermissionEnum.READER], [OrganizationRoleEnum.ORGANISATION_TENANT_CREATOR]);
      const { result } = renderHook(() => usePermissions());
      expect(result.current.isGlobalAdmin).toBe(false);
      expect(result.current.hasOrgBypass).toBe(false);
      expect(result.current.isOrgGlobalAdmin).toBe(false);
      expect(result.current.isOrgTenantAdmin).toBe(false);
      expect(result.current.canCreate('chat-agents')).toBe(false);
      expect(result.current.canAdmin(null)).toBe(false);
    });

    it('org bypass works even without any tenant roles', () => {
      setupRoles([], [OrganizationRoleEnum.ORGANISATION_GLOBAL_ADMIN]);
      const { result } = renderHook(() => usePermissions());
      expect(result.current.isGlobalAdmin).toBe(true);
      expect(result.current.canCreate('chat-agents')).toBe(true);
      expect(result.current.canWrite(null)).toBe(true);
    });

    it('org bypass combined with TENANT_GLOBAL_ADMIN is still global admin', () => {
      setupRoles([TenantPermissionEnum.TENANT_GLOBAL_ADMIN], [OrganizationRoleEnum.ORGANISATION_TENANT_ADMIN]);
      const { result } = renderHook(() => usePermissions());
      expect(result.current.isGlobalAdmin).toBe(true);
      expect(result.current.hasOrgBypass).toBe(true);
    });
  });

  describe('hasOrgRole', () => {
    it('returns true when user has the org role', () => {
      setupRoles([], [OrganizationRoleEnum.ORGANISATION_GLOBAL_ADMIN]);
      const { result } = renderHook(() => usePermissions());
      expect(result.current.hasOrgRole(OrganizationRoleEnum.ORGANISATION_GLOBAL_ADMIN)).toBe(true);
    });

    it('returns false when user lacks the org role', () => {
      setupRoles([], [OrganizationRoleEnum.ORGANISATION_TENANT_CREATOR]);
      const { result } = renderHook(() => usePermissions());
      expect(result.current.hasOrgRole(OrganizationRoleEnum.ORGANISATION_GLOBAL_ADMIN)).toBe(false);
    });

    it('returns false when organization is null', () => {
      setupRoles([]);
      const { result } = renderHook(() => usePermissions());
      expect(result.current.hasOrgRole(OrganizationRoleEnum.ORGANISATION_GLOBAL_ADMIN)).toBe(false);
    });
  });

  describe('isOrgGlobalAdmin', () => {
    it('returns true only for ORGANISATION_GLOBAL_ADMIN', () => {
      setupRoles([], [OrganizationRoleEnum.ORGANISATION_GLOBAL_ADMIN]);
      const { result } = renderHook(() => usePermissions());
      expect(result.current.isOrgGlobalAdmin).toBe(true);
    });

    it('returns false for ORGANISATION_TENANT_ADMIN', () => {
      setupRoles([], [OrganizationRoleEnum.ORGANISATION_TENANT_ADMIN]);
      const { result } = renderHook(() => usePermissions());
      expect(result.current.isOrgGlobalAdmin).toBe(false);
    });

    it('returns false when organization is null', () => {
      setupRoles([]);
      const { result } = renderHook(() => usePermissions());
      expect(result.current.isOrgGlobalAdmin).toBe(false);
    });
  });
});
