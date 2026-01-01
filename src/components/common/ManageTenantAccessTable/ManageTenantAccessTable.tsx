import type { FC } from 'react';
import { useState, useMemo, useCallback } from 'react';
import {
  Box,
  TextInput,
  MultiSelect,
  Table,
  Checkbox,
  Text,
  Group,
  Badge,
  Button,
  Loader,
  Stack,
  Center,
  ScrollArea,
  Tooltip,
  ActionIcon,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconSearch, IconPlus, IconUser, IconUsers, IconUsersGroup, IconTrash } from '@tabler/icons-react';
import type { TenantPermissionEnum, PrincipalTypeEnum } from '../../../api/types';
import { useIdentity } from '../../../contexts';
import { ConfirmDeleteDialog } from '../ConfirmDeleteDialog';
import classes from './ManageTenantAccessTable.module.css';

// Tenant roles with labels and descriptions
export const TENANT_ROLE_OPTIONS: { value: TenantPermissionEnum; label: string; description: string; category: string }[] = [
  // Global
  { value: 'READER', label: 'Reader', description: 'Can access the tenant', category: 'General' },
  { value: 'GLOBAL_ADMIN', label: 'Global Admin', description: 'Full access to everything', category: 'General' },
  // Custom Groups
  { value: 'CUSTOM_GROUPS_ADMIN', label: 'Custom Groups Admin', description: 'Manage all custom groups', category: 'Custom Groups' },
  { value: 'CUSTOM_GROUP_CREATOR', label: 'Custom Group Creator', description: 'Create new custom groups', category: 'Custom Groups' },
  // Applications
  { value: 'APPLICATIONS_ADMIN', label: 'Applications Admin', description: 'Manage all applications', category: 'Applications' },
  { value: 'APPLICATIONS_CREATOR', label: 'Applications Creator', description: 'Create new applications', category: 'Applications' },
  // Credentials
  { value: 'CREDENTIALS_ADMIN', label: 'Credentials Admin', description: 'Manage all credentials', category: 'Credentials' },
  { value: 'CREDENTIALS_CREATOR', label: 'Credentials Creator', description: 'Create new credentials', category: 'Credentials' },
  // Conversations
  { value: 'CONVERSATIONS_ADMIN', label: 'Conversations Admin', description: 'Manage all conversations', category: 'Conversations' },
  { value: 'CONVERSATIONS_CREATOR', label: 'Conversations Creator', description: 'Create new conversations', category: 'Conversations' },
  // Autonomous Agents
  { value: 'AUTONOMOUS_AGENTS_ADMIN', label: 'Autonomous Agents Admin', description: 'Manage all autonomous agents', category: 'Autonomous Agents' },
  { value: 'AUTONOMOUS_AGENTS_CREATOR', label: 'Autonomous Agents Creator', description: 'Create new autonomous agents', category: 'Autonomous Agents' },
  // Development Platforms
  { value: 'DEVELOPMENT_PLATFORMS_ADMIN', label: 'Dev Platforms Admin', description: 'Manage all development platforms', category: 'Development Platforms' },
  { value: 'DEVELOPMENT_PLATFORMS_CREATOR', label: 'Dev Platforms Creator', description: 'Create new development platforms', category: 'Development Platforms' },
  // Chat Widgets
  { value: 'CHAT_WIDGETS_ADMIN', label: 'Chat Widgets Admin', description: 'Manage all chat widgets', category: 'Chat Widgets' },
  { value: 'CHAT_WIDGETS_CREATOR', label: 'Chat Widgets Creator', description: 'Create new chat widgets', category: 'Chat Widgets' },
];

// Types
export interface TenantPrincipalPermission {
  id: string;
  principalId: string;
  principalType: PrincipalTypeEnum;
  displayName?: string | null;
  mail?: string | null;
  principalName?: string | null;
  description?: string | null;
  roles: TenantPermissionEnum[];
}

interface ManageTenantAccessTableProps {
  /** List of principals with their tenant roles */
  principals: TenantPrincipalPermission[];
  /** Loading state */
  isLoading?: boolean;
  /** Indicates if initial data fetch is complete */
  hasFetched?: boolean;
  /** Error message */
  error?: string | null;
  /** Handler when a role is toggled */
  onRoleChange: (principalId: string, principalType: PrincipalTypeEnum, role: TenantPermissionEnum, enabled: boolean) => Promise<void>;
  /** Handler to delete a principal's access */
  onDeletePrincipal?: (principalId: string, principalType: PrincipalTypeEnum, displayName?: string | null) => Promise<void>;
  /** Handler to open add principal dialog */
  onAddPrincipal: () => void;
}

const getPrincipalIcon = (type: PrincipalTypeEnum) => {
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

const getPrincipalTypeLabel = (type: PrincipalTypeEnum) => {
  switch (type) {
    case 'IDENTITY_USER':
      return 'User';
    case 'IDENTITY_GROUP':
      return 'Identity Group';
    case 'CUSTOM_GROUP':
      return 'Custom Group';
    default:
      return type;
  }
};

export const ManageTenantAccessTable: FC<ManageTenantAccessTableProps> = ({
  principals,
  isLoading = false,
  hasFetched = true,
  error = null,
  onRoleChange,
  onDeletePrincipal,
  onAddPrincipal,
}) => {
  // Get current user to prevent self-modification
  const { user: currentUser } = useIdentity();

  // Search state
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchValue, 300);
  
  // Role filter state
  const [roleFilter, setRoleFilter] = useState<string[]>([]);
  
  // Loading states for individual role changes
  const [loadingRoles, setLoadingRoles] = useState<Set<string>>(new Set());
  
  // Delete confirmation dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    principalId: string;
    principalType: PrincipalTypeEnum;
    displayName: string | null | undefined;
  }>({ open: false, principalId: '', principalType: 'IDENTITY_USER', displayName: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter principals based on search and role filter
  const filteredPrincipals = useMemo(() => {
    let result = [...principals];

    // Apply search filter
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      result = result.filter(
        (p) =>
          p.displayName?.toLowerCase().includes(query) ||
          p.mail?.toLowerCase().includes(query) ||
          p.principalName?.toLowerCase().includes(query) ||
          p.principalId.toLowerCase().includes(query)
      );
    }

    // Apply role filter
    if (roleFilter.length > 0) {
      result = result.filter((p) =>
        roleFilter.some((role) => p.roles.includes(role as TenantPermissionEnum))
      );
    }

    // Sort by displayName ASC (nulls/empty at the end)
    result.sort((a, b) => {
      const nameA = (a.displayName || a.principalId).toLowerCase();
      const nameB = (b.displayName || b.principalId).toLowerCase();
      return nameA.localeCompare(nameB);
    });

    return result;
  }, [principals, debouncedSearch, roleFilter]);

  // Handle delete click - open confirmation dialog
  const handleDeleteClick = useCallback((principal: TenantPrincipalPermission) => {
    setDeleteDialog({
      open: true,
      principalId: principal.principalId,
      principalType: principal.principalType,
      displayName: principal.displayName,
    });
  }, []);

  // Handle delete confirm
  const handleDeleteConfirm = useCallback(async () => {
    if (!onDeletePrincipal) return;
    setIsDeleting(true);
    try {
      await onDeletePrincipal(deleteDialog.principalId, deleteDialog.principalType, deleteDialog.displayName);
      setDeleteDialog({ open: false, principalId: '', principalType: 'IDENTITY_USER', displayName: '' });
    } finally {
      setIsDeleting(false);
    }
  }, [onDeletePrincipal, deleteDialog]);

  // Handle role checkbox change
  const handleRoleToggle = useCallback(
    async (principal: TenantPrincipalPermission, role: TenantPermissionEnum, enabled: boolean) => {
      // If removing the last remaining role, show delete dialog instead of direct removal
      if (
        !enabled &&
        principal.roles.length === 1 &&
        principal.roles[0] === role &&
        onDeletePrincipal
      ) {
        setDeleteDialog({
          open: true,
          principalId: principal.principalId,
          principalType: principal.principalType,
          displayName: principal.displayName,
        });
        return;
      }
      const key = `${principal.principalId}-${role}`;
      setLoadingRoles((prev) => new Set(prev).add(key));
      try {
        await onRoleChange(principal.principalId, principal.principalType, role, enabled);
      } finally {
        setLoadingRoles((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [onRoleChange, onDeletePrincipal]
  );

  // Check if a specific role checkbox is loading
  const isRoleLoading = (principalId: string, role: string) => {
    return loadingRoles.has(`${principalId}-${role}`);
  };

  if (isLoading) {
    return (
      <Center py="xl">
        <Loader size="lg" />
      </Center>
    );
  }

  if (error) {
    return (
      <Center py="xl">
        <Text c="red">{error}</Text>
      </Center>
    );
  }

  // Group role options for filter dropdown
  const roleFilterOptions = TENANT_ROLE_OPTIONS.map(r => ({ value: r.value, label: r.label }));

  return (
    <Stack gap="md" className={classes.container}>
      {/* Toolbar */}
      <Group justify="space-between" wrap="nowrap">
        <Group gap="sm" wrap="nowrap" style={{ flex: 1 }}>
          <TextInput
            placeholder="Search by name or email..."
            leftSection={<IconSearch size={16} />}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className={classes.searchInput}
          />
          <MultiSelect
            placeholder="Filter by role"
            data={roleFilterOptions}
            value={roleFilter}
            onChange={setRoleFilter}
            clearable
            className={classes.roleFilter}
            searchable
          />
        </Group>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={onAddPrincipal}
        >
          Add Principal
        </Button>
      </Group>

      {/* Table */}
      <ScrollArea>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ width: '300px' }}>Principal</Table.Th>
              <Table.Th>Roles</Table.Th>
              <Table.Th style={{ width: '60px' }}></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredPrincipals.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={3}>
                  <Center py="xl">
                    <Text c="dimmed">
                      {hasFetched 
                        ? (debouncedSearch || roleFilter.length > 0
                          ? 'No principals match your filters'
                          : 'No principals have access yet. Click "Add Principal" to get started.')
                        : ''}
                    </Text>
                  </Center>
                </Table.Td>
              </Table.Tr>
            ) : (
              filteredPrincipals.map((principal) => {
                const isCurrentUser = currentUser?.id === principal.principalId;

                return (
                  <Table.Tr key={principal.id}>
                    {/* Principal Info */}
                    <Table.Td>
                      <Group gap="sm" wrap="nowrap">
                        <Box className={classes.principalIcon}>
                          {getPrincipalIcon(principal.principalType)}
                        </Box>
                        <Stack gap={2}>
                          <Group gap="xs">
                            <Text size="sm" fw={500} lineClamp={1}>
                              {principal.displayName || principal.principalId}
                            </Text>
                            {isCurrentUser && (
                              <Badge size="xs" variant="light" color="blue">
                                You
                              </Badge>
                            )}
                          </Group>
                          {principal.mail && (
                            <Text size="xs" c="dimmed" lineClamp={1}>
                              {principal.mail}
                            </Text>
                          )}
                          <Badge size="xs" variant="outline" color="gray">
                            {getPrincipalTypeLabel(principal.principalType)}
                          </Badge>
                        </Stack>
                      </Group>
                    </Table.Td>

                    {/* Roles - displayed as badges with checkboxes */}
                    <Table.Td>
                      <Group gap="xs" wrap="wrap">
                        {TENANT_ROLE_OPTIONS.map((roleOption) => {
                          const hasRole = principal.roles.includes(roleOption.value);
                          const loading = isRoleLoading(principal.principalId, roleOption.value);

                          return (
                            <Tooltip 
                              key={roleOption.value} 
                              label={roleOption.description}
                              withArrow
                            >
                              <Box
                                className={`${classes.roleChip} ${hasRole ? classes.roleChipActive : ''}`}
                                onClick={() => !loading && handleRoleToggle(principal, roleOption.value, !hasRole)}
                              >
                                {loading ? (
                                  <Loader size={12} />
                                ) : (
                                  <Checkbox
                                    size="xs"
                                    checked={hasRole}
                                    onChange={() => {}}
                                    styles={{ input: { cursor: 'pointer' } }}
                                  />
                                )}
                                <Text size="xs" className={classes.roleChipLabel}>
                                  {roleOption.label}
                                </Text>
                              </Box>
                            </Tooltip>
                          );
                        })}
                      </Group>
                    </Table.Td>

                    {/* Actions */}
                    <Table.Td>
                      {onDeletePrincipal && !isCurrentUser && (
                        <Tooltip label="Remove access">
                          <ActionIcon
                            color="red"
                            variant="subtle"
                            onClick={() => handleDeleteClick(principal)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </Table.Td>
                  </Table.Tr>
                );
              })
            )}
          </Table.Tbody>
        </Table>
      </ScrollArea>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        opened={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, principalId: '', principalType: 'IDENTITY_USER', displayName: '' })}
        onConfirm={handleDeleteConfirm}
        itemName={deleteDialog.displayName || deleteDialog.principalId}
        itemType="Principal"
        isLoading={isDeleting}
      />
    </Stack>
  );
};
