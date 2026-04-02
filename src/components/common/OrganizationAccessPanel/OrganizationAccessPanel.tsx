import type { FC } from 'react';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Stack,
  Text,
  Center,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useIdentity } from '../../../contexts';
import { OrganizationRoleEnum } from '../../../api/types';
import type {
  OrganizationPrincipalResponse,
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

const PAGE_SIZE = 50;

/** Map backend OrganizationPrincipalResponse[] to the generic TenantPrincipalPermission[] format */
const mapPrincipalsToTableFormat = (principals: OrganizationPrincipalResponse[]): TenantPrincipalPermission[] =>
  principals.map((p) => ({
    id: p.principal_id,
    principalId: p.principal_id,
    principalType: p.principal_type as PrincipalTypeEnum,
    displayName: p.display_name,
    mail: p.mail,
    principalName: p.principal_name,
    description: null,
    isActive: true,
    roles: p.roles.map((r) => r.role) as unknown as TenantPrincipalPermission['roles'],
  }));

interface OrganizationAccessPanelProps {
  isOrgAdmin: boolean;
}

export const OrganizationAccessPanel: FC<OrganizationAccessPanelProps> = ({ isOrgAdmin }) => {
  const { t } = useTranslation('settings');
  const { apiClient, organization } = useIdentity();

  const [principals, setPrincipals] = useState<OrganizationPrincipalResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editPrincipal, setEditPrincipal] = useState<TenantPrincipalPermission | null>(null);
  const [search, setSearch] = useState('');
  const skipRef = useRef(0);

  const fetchPrincipals = useCallback(async (reset = true) => {
    if (!apiClient || !organization) return;

    if (reset) {
      setIsLoading(true);
      skipRef.current = 0;
    } else {
      setIsLoadingMore(true);
    }

    try {
      const data = await apiClient.listOrganizationPrincipals(organization.id, {
        skip: reset ? 0 : skipRef.current,
        limit: PAGE_SIZE,
        search: search || undefined,
        order_by: 'display_name',
        order_direction: 'asc',
      });

      if (reset) {
        setPrincipals(data.principals);
        skipRef.current = PAGE_SIZE;
      } else {
        setPrincipals((prev) => {
          const existingIds = new Set(prev.map((p) => p.principal_id));
          const uniqueNew = data.principals.filter((p) => !existingIds.has(p.principal_id));
          return [...prev, ...uniqueNew];
        });
        skipRef.current += PAGE_SIZE;
      }

      setHasMore(data.principals.length === PAGE_SIZE);
      setHasFetched(true);
    } catch {
      // handled by API client
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [apiClient, organization, search]);

  // Initial fetch + re-fetch when search changes
  useEffect(() => {
    fetchPrincipals(true);
  }, [fetchPrincipals]);

  // Infinite scroll: load more handler
  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      fetchPrincipals(false);
    }
  }, [fetchPrincipals, isLoadingMore, hasMore]);

  // Search handler (server-side)
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  // Map principals to the format expected by ManageTenantAccessTable
  const tablePrincipals = useMemo(() => mapPrincipalsToTableFormat(principals), [principals]);

  const existingPrincipalIds = useMemo(
    () => principals.map((p) => p.principal_id),
    [principals]
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
            await apiClient.deleteOrganizationPrincipal(organization.id, {
              principal_id: editPrincipal.principalId,
              principal_type: editPrincipal.principalType,
              role: role as OrganizationRoleEnum,
            });
          }
        }

        // Add roles that are newly selected
        for (const role of newRoles) {
          if (!currentRoles.has(role)) {
            await apiClient.setOrganizationPrincipal(organization.id, {
              principal_id: editPrincipal.principalId,
              principal_type: editPrincipal.principalType,
              role: role as OrganizationRoleEnum,
            });
          }
        }

        setEditPrincipal(null);
        await fetchPrincipals(true);
      } catch {
        // handled by API client
      }
    },
    [apiClient, organization, editPrincipal, fetchPrincipals]
  );

  // Add new principals with selected roles
  const handleAddPrincipals = useCallback(
    async (selectedPrincipals: SelectedPrincipal[], roles: string[]) => {
      if (!apiClient || !organization) return;

      try {
        for (const principal of selectedPrincipals) {
          for (const role of roles) {
            await apiClient.setOrganizationPrincipal(organization.id, {
              principal_id: principal.id,
              principal_type: principal.type as PrincipalTypeEnum,
              role: role as OrganizationRoleEnum,
            });
          }
        }
        setAddDialogOpen(false);
        await fetchPrincipals(true);
      } catch {
        // handled by API client
      }
    },
    [apiClient, organization, fetchPrincipals]
  );

  // Delete all roles for a principal (remove access entirely)
  const handleDeletePrincipal = useCallback(
    async (principalId: string, principalType: PrincipalTypeEnum) => {
      if (!apiClient || !organization) return;

      const principal = principals.find((p) => p.principal_id === principalId);
      if (!principal) return;

      try {
        for (const r of principal.roles) {
          await apiClient.deleteOrganizationPrincipal(organization.id, {
            principal_id: principalId,
            principal_type: principalType,
            role: r.role as OrganizationRoleEnum,
          });
        }
        await fetchPrincipals(true);
      } catch {
        // handled by API client
      }
    },
    [apiClient, organization, principals, fetchPrincipals]
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
        principals={tablePrincipals}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        hasFetched={hasFetched}
        hasMore={hasMore}
        onManageAccess={handleManageAccess}
        onDeletePrincipal={isOrgAdmin ? handleDeletePrincipal : undefined}
        onAddPrincipal={() => setAddDialogOpen(true)}
        onSearchChange={handleSearchChange}
        onLoadMore={handleLoadMore}
        roleOptions={ORG_ROLE_OPTIONS}
        showStatusColumn={false}
        onRefreshPrincipal={async (principalId, principalType) => {
          if (!apiClient) return;
          const tenantId = organization?.id;
          if (!tenantId) return;
          await apiClient.refreshPrincipal(principalId, { tenant_id: tenantId, type: principalType as 'IDENTITY_USER' | 'IDENTITY_GROUP' });
          await fetchPrincipals(true);
        }}
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
