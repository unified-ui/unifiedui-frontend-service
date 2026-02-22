import type { FC } from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Stack,
  Text,
  Center,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useIdentity } from '../../../contexts';
import { OrganizationRoleEnum } from '../../../api/types';
import type {
  OrganizationMemberResponse,
  PrincipalTypeEnum,
} from '../../../api/types';
import { AddPrincipalDialog } from '../AddPrincipalDialog';
import type { SelectedPrincipal, RoleOption } from '../AddPrincipalDialog';
import { ManageTenantAccessTable } from '../ManageTenantAccessTable';
import type { TenantPrincipalPermission } from '../ManageTenantAccessTable';
import { EditRolesDialog } from '../EditRolesDialog';

const ORG_ROLE_OPTIONS: RoleOption[] = [
  { value: OrganizationRoleEnum.ORGANISATION_GLOBAL_ADMIN, label: 'Global Admin', description: 'Full organization access including billing and member management' },
  { value: OrganizationRoleEnum.ORGANISATION_TENANT_ADMIN, label: 'Tenant Admin', description: 'Manage all tenants in this organization' },
  { value: OrganizationRoleEnum.ORGANISATION_TENANT_CREATOR, label: 'Tenant Creator', description: 'Create new tenants in this organization' },
];

/** Map backend OrganizationMemberResponse[] to the generic TenantPrincipalPermission[] format */
const mapMembersToPrincipals = (members: OrganizationMemberResponse[]): TenantPrincipalPermission[] =>
  members.map((m) => ({
    id: m.principal_id,
    principalId: m.principal_id,
    principalType: m.principal_type as PrincipalTypeEnum,
    displayName: m.display_name,
    mail: m.mail,
    principalName: m.principal_name,
    description: null,
    isActive: true,
    roles: m.roles.map((r) => r.role) as unknown as TenantPrincipalPermission['roles'],
  }));

interface OrganizationAccessPanelProps {
  isOrgAdmin: boolean;
}

export const OrganizationAccessPanel: FC<OrganizationAccessPanelProps> = ({ isOrgAdmin }) => {
  const { t } = useTranslation('settings');
  const { apiClient, organization } = useIdentity();

  const [members, setMembers] = useState<OrganizationMemberResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editPrincipal, setEditPrincipal] = useState<TenantPrincipalPermission | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!apiClient || !organization) return;
    setIsLoading(true);
    try {
      const data = await apiClient.listOrganizationMembers(organization.id);
      setMembers(data.members);
    } catch {
      // handled by API client
    } finally {
      setIsLoading(false);
      setHasFetched(true);
    }
  }, [apiClient, organization]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Map members to the format expected by ManageTenantAccessTable
  const principals = useMemo(() => mapMembersToPrincipals(members), [members]);

  const existingPrincipalIds = useMemo(
    () => members.map((m) => m.principal_id),
    [members]
  );

  // Row click → open EditRolesDialog
  const handleManageAccess = useCallback((principal: TenantPrincipalPermission) => {
    setEditPrincipal(principal);
  }, []);

  // Save edited roles: diff current vs new, add/remove as needed
  const handleEditPrincipalRoles = useCallback(
    async (roles: string[]) => {
      if (!apiClient || !organization || !editPrincipal) return;

      try {
        const currentRoles = new Set(editPrincipal.roles as unknown as string[]);
        const newRoles = new Set(roles);

        // Remove roles that are no longer selected
        for (const role of currentRoles) {
          if (!newRoles.has(role)) {
            await apiClient.deleteOrganizationMember(organization.id, {
              principal_id: editPrincipal.principalId,
              principal_type: editPrincipal.principalType,
              role: role as OrganizationRoleEnum,
            });
          }
        }

        // Add roles that are newly selected
        for (const role of newRoles) {
          if (!currentRoles.has(role)) {
            await apiClient.setOrganizationMember(organization.id, {
              principal_id: editPrincipal.principalId,
              principal_type: editPrincipal.principalType,
              role: role as OrganizationRoleEnum,
            });
          }
        }

        setEditPrincipal(null);
        await fetchMembers();
      } catch {
        // handled by API client
      }
    },
    [apiClient, organization, editPrincipal, fetchMembers]
  );

  // Add new principals with selected roles
  const handleAddPrincipals = useCallback(
    async (selectedPrincipals: SelectedPrincipal[], roles: string[]) => {
      if (!apiClient || !organization) return;

      try {
        for (const principal of selectedPrincipals) {
          for (const role of roles) {
            await apiClient.setOrganizationMember(organization.id, {
              principal_id: principal.id,
              principal_type: principal.type as PrincipalTypeEnum,
              role: role as OrganizationRoleEnum,
            });
          }
        }
        setAddDialogOpen(false);
        await fetchMembers();
      } catch {
        // handled by API client
      }
    },
    [apiClient, organization, fetchMembers]
  );

  // Delete all roles for a principal (remove access entirely)
  const handleDeletePrincipal = useCallback(
    async (principalId: string, principalType: PrincipalTypeEnum) => {
      if (!apiClient || !organization) return;

      const member = members.find((m) => m.principal_id === principalId);
      if (!member) return;

      try {
        for (const r of member.roles) {
          await apiClient.deleteOrganizationMember(organization.id, {
            principal_id: principalId,
            principal_type: principalType,
            role: r.role as OrganizationRoleEnum,
          });
        }
        await fetchMembers();
      } catch {
        // handled by API client
      }
    },
    [apiClient, organization, members, fetchMembers]
  );

  if (!organization) {
    return (
      <Center py="xl">
        <Text c="dimmed">{t('noOrganization')}</Text>
      </Center>
    );
  }

  return (
    <Stack gap="md">
      <ManageTenantAccessTable
        principals={principals}
        isLoading={isLoading}
        hasFetched={hasFetched}
        onManageAccess={handleManageAccess}
        onDeletePrincipal={isOrgAdmin ? handleDeletePrincipal : undefined}
        onAddPrincipal={() => setAddDialogOpen(true)}
        roleOptions={ORG_ROLE_OPTIONS}
        showStatusColumn={false}
      />

      <AddPrincipalDialog
        opened={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSubmit={handleAddPrincipals}
        existingPrincipalIds={existingPrincipalIds}
        entityName="organization"
        roleOptions={ORG_ROLE_OPTIONS}
        multiSelect={true}
      />

      <EditRolesDialog
        opened={!!editPrincipal}
        onClose={() => setEditPrincipal(null)}
        onSubmit={handleEditPrincipalRoles}
        principalName={editPrincipal?.displayName || editPrincipal?.principalId || ''}
        principalType={editPrincipal?.principalType || 'IDENTITY_USER'}
        principalEmail={editPrincipal?.mail || editPrincipal?.principalName}
        roleOptions={ORG_ROLE_OPTIONS}
        currentRoles={(editPrincipal?.roles as unknown as string[]) || []}
      />
    </Stack>
  );
};
