import type { FC } from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Stack,
  Table,
  Text,
  Group,
  Badge,
  Button,
  Loader,
  Center,
  Alert,
  ActionIcon,
  Menu,
} from '@mantine/core';
import {
  IconInfoCircle,
  IconUserPlus,
  IconUser,
  IconUsers,
  IconUsersGroup,
  IconDots,
  IconTrash,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useIdentity } from '../../../contexts';
import { OrganizationRoleEnum } from '../../../api/types';
import type {
  OrganizationMemberResponse,
  PrincipalTypeEnum,
} from '../../../api/types';
import { AddPrincipalDialog } from '../AddPrincipalDialog';
import type { SelectedPrincipal, RoleOption } from '../AddPrincipalDialog';
import { ConfirmDeleteDialog } from '../ConfirmDeleteDialog';

const ORG_ROLE_COLORS: Record<string, string> = {
  ORGANISATION_GLOBAL_ADMIN: 'red',
  ORGANISATION_TENANT_ADMIN: 'teal',
  ORGANISATION_TENANT_CREATOR: 'blue',
};

const ORG_ROLE_LABELS: Record<string, string> = {
  ORGANISATION_GLOBAL_ADMIN: 'Global Admin',
  ORGANISATION_TENANT_ADMIN: 'Tenant Admin',
  ORGANISATION_TENANT_CREATOR: 'Tenant Creator',
};

const orgRoleLabel = (role: string): string =>
  ORG_ROLE_LABELS[role] || role;

const ORG_ROLE_OPTIONS: RoleOption[] = [
  { value: OrganizationRoleEnum.ORGANISATION_GLOBAL_ADMIN, label: 'Global Admin', description: 'Full organization access including billing and member management' },
  { value: OrganizationRoleEnum.ORGANISATION_TENANT_ADMIN, label: 'Tenant Admin', description: 'Manage all tenants in this organization' },
  { value: OrganizationRoleEnum.ORGANISATION_TENANT_CREATOR, label: 'Tenant Creator', description: 'Create new tenants in this organization' },
];

const getPrincipalTypeIcon = (type: string) => {
  switch (type) {
    case 'IDENTITY_USER':
      return <IconUser size={16} />;
    case 'IDENTITY_GROUP':
      return <IconUsers size={16} />;
    case 'CUSTOM_GROUP':
      return <IconUsersGroup size={16} />;
    default:
      return <IconUser size={16} />;
  }
};

const getPrincipalTypeBadgeColor = (type: string): string => {
  switch (type) {
    case 'IDENTITY_USER':
      return 'blue';
    case 'IDENTITY_GROUP':
      return 'violet';
    case 'CUSTOM_GROUP':
      return 'teal';
    default:
      return 'gray';
  }
};

const getPrincipalTypeLabel = (type: string): string => {
  switch (type) {
    case 'IDENTITY_USER':
      return 'User';
    case 'IDENTITY_GROUP':
      return 'Group';
    case 'CUSTOM_GROUP':
      return 'Custom Group';
    default:
      return type;
  }
};

interface OrganizationAccessPanelProps {
  isOrgAdmin: boolean;
}

export const OrganizationAccessPanel: FC<OrganizationAccessPanelProps> = ({ isOrgAdmin }) => {
  const { t } = useTranslation('settings');
  const { apiClient, organization, user: currentUser } = useIdentity();

  const [members, setMembers] = useState<OrganizationMemberResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    principalId: string;
    principalType: string;
    role: string;
    displayName: string;
  }>({ open: false, principalId: '', principalType: '', role: '', displayName: '' });
  const [isDeleting, setIsDeleting] = useState(false);

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
    }
  }, [apiClient, organization]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

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

  const handleRemoveRole = useCallback(async () => {
    if (!apiClient || !organization || !deleteDialog.principalId) return;

    setIsDeleting(true);
    try {
      await apiClient.deleteOrganizationMember(organization.id, {
        principal_id: deleteDialog.principalId,
        principal_type: deleteDialog.principalType as PrincipalTypeEnum,
        role: deleteDialog.role as OrganizationRoleEnum,
      });
      setDeleteDialog({ open: false, principalId: '', principalType: '', role: '', displayName: '' });
      await fetchMembers();
    } catch {
      // handled by API client
    } finally {
      setIsDeleting(false);
    }
  }, [apiClient, organization, deleteDialog, fetchMembers]);

  const existingPrincipalIds = useMemo(
    () => members.map((m) => m.principal_id),
    [members]
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
      <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
        <Text size="sm">{t('orgAccessHint')}</Text>
      </Alert>

      {isOrgAdmin && (
        <Group justify="flex-end">
          <Button
            leftSection={<IconUserPlus size={16} />}
            onClick={() => setAddDialogOpen(true)}
          >
            {t('addOrgMember')}
          </Button>
        </Group>
      )}

      {isLoading ? (
        <Center py="xl">
          <Loader size="md" />
        </Center>
      ) : members.length === 0 ? (
        <Center py="xl">
          <Text c="dimmed">{t('noOrgMembers')}</Text>
        </Center>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('principal')}</Table.Th>
              <Table.Th>{t('principalType')}</Table.Th>
              <Table.Th>{t('roles')}</Table.Th>
              {isOrgAdmin && <Table.Th w={60} />}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {members.map((member) => {
              const isCurrentUser = currentUser?.id === member.principal_id;

              return (
                <Table.Tr key={member.principal_id}>
                  <Table.Td>
                    <Group gap="sm" wrap="nowrap">
                      {getPrincipalTypeIcon(member.principal_type)}
                      <Stack gap={2}>
                        <Group gap="xs">
                          <Text size="sm" fw={500}>
                            {member.display_name || member.principal_name || member.principal_id}
                          </Text>
                          {isCurrentUser && (
                            <Badge size="xs" variant="light" color="blue">
                              You
                            </Badge>
                          )}
                        </Group>
                        {member.mail && (
                          <Text size="xs" c="dimmed">{member.mail}</Text>
                        )}
                      </Stack>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge size="sm" variant="light" color={getPrincipalTypeBadgeColor(member.principal_type)}>
                      {getPrincipalTypeLabel(member.principal_type)}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      {member.roles.map((r) => (
                        <Badge
                          key={r.id}
                          size="sm"
                          color={ORG_ROLE_COLORS[r.role] || 'gray'}
                          variant="light"
                        >
                          {orgRoleLabel(r.role)}
                        </Badge>
                      ))}
                    </Group>
                  </Table.Td>
                  {isOrgAdmin && (
                    <Table.Td>
                      {!isCurrentUser && (
                        <Menu position="bottom-end" withinPortal>
                          <Menu.Target>
                            <ActionIcon variant="subtle" size="sm">
                              <IconDots size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            {member.roles.map((r) => (
                              <Menu.Item
                                key={r.id}
                                color="red"
                                leftSection={<IconTrash size={14} />}
                                onClick={() =>
                                  setDeleteDialog({
                                    open: true,
                                    principalId: member.principal_id,
                                    principalType: member.principal_type,
                                    role: r.role,
                                    displayName: member.display_name || member.principal_name || member.principal_id,
                                  })
                                }
                              >
                                {orgRoleLabel(r.role)}
                              </Menu.Item>
                            ))}
                          </Menu.Dropdown>
                        </Menu>
                      )}
                    </Table.Td>
                  )}
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      )}

      <AddPrincipalDialog
        opened={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSubmit={handleAddPrincipals}
        existingPrincipalIds={existingPrincipalIds}
        entityName="organization"
        roleOptions={ORG_ROLE_OPTIONS}
        multiSelect={true}
      />

      <ConfirmDeleteDialog
        opened={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, principalId: '', principalType: '', role: '', displayName: '' })}
        onConfirm={handleRemoveRole}
        itemName={`${orgRoleLabel(deleteDialog.role)} role from ${deleteDialog.displayName}`}
        itemType="Role"
        isLoading={isDeleting}
      />
    </Stack>
  );
};
