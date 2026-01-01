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
import type { PermissionActionEnum, PrincipalTypeEnum } from '../../../api/types';
import { ConfirmDeleteDialog } from '../ConfirmDeleteDialog';
import classes from './ManageAccessTable.module.css';

// Types
export interface PrincipalPermission {
  id: string;
  principalId: string;
  principalType: PrincipalTypeEnum;
  displayName?: string | null;
  mail?: string | null;
  principalName?: string | null;
  description?: string | null;
  roles: PermissionActionEnum[];
}

interface ManageAccessTableProps {
  /** List of principals with their permissions */
  principals: PrincipalPermission[];
  /** Loading state */
  isLoading?: boolean;
  /** Error message */
  error?: string | null;
  /** Handler when a role is toggled */
  onRoleChange: (principalId: string, principalType: PrincipalTypeEnum, role: PermissionActionEnum, enabled: boolean) => Promise<void>;
  /** Handler to delete a principal's access */
  onDeletePrincipal?: (principalId: string, principalType: PrincipalTypeEnum, displayName?: string | null) => Promise<void>;
  /** Handler to open add principal dialog */
  onAddPrincipal: () => void;
  /** Entity name for labels (e.g., "application", "credential") */
  entityName?: string;
}

const ROLE_OPTIONS = [
  { value: 'READ', label: 'Read' },
  { value: 'WRITE', label: 'Write' },
  { value: 'ADMIN', label: 'Admin' },
];

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

export const ManageAccessTable: FC<ManageAccessTableProps> = ({
  principals,
  isLoading = false,
  error = null,
  onRoleChange,
  onDeletePrincipal,
  onAddPrincipal,
  entityName = 'resource',
}) => {
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
        roleFilter.some((role) => p.roles.includes(role as PermissionActionEnum))
      );
    }

    return result;
  }, [principals, debouncedSearch, roleFilter]);

  // Handle delete click - open confirmation dialog
  const handleDeleteClick = useCallback((principal: PrincipalPermission) => {
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
    async (principal: PrincipalPermission, role: PermissionActionEnum, enabled: boolean) => {
      // If removing READ and it's the only role, show delete dialog instead of direct removal
      if (
        !enabled &&
        role === 'READ' &&
        principal.roles.length === 1 &&
        principal.roles[0] === 'READ' &&
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
            data={ROLE_OPTIONS}
            value={roleFilter}
            onChange={setRoleFilter}
            clearable
            className={classes.roleFilter}
          />
        </Group>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={onAddPrincipal}
        >
          Add Access
        </Button>
      </Group>

      {/* Table */}
      <ScrollArea className={classes.tableContainer}>
        <Table highlightOnHover className={classes.table}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th className={classes.roleHeader}>
                <Tooltip label={`Can view this ${entityName} and its data`} withArrow>
                  <Text size="sm" style={{ cursor: 'help' }}>Read</Text>
                </Tooltip>
              </Table.Th>
              <Table.Th className={classes.roleHeader}>
                <Tooltip label={`Can edit this ${entityName}`} withArrow>
                  <Text size="sm" style={{ cursor: 'help' }}>Write</Text>
                </Tooltip>
              </Table.Th>
              <Table.Th className={classes.roleHeader}>
                <Tooltip label="Full control including manage access" withArrow>
                  <Text size="sm" style={{ cursor: 'help' }}>Admin</Text>
                </Tooltip>
              </Table.Th>
              {onDeletePrincipal && (
                <Table.Th className={classes.actionHeader}></Table.Th>
              )}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredPrincipals.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={onDeletePrincipal ? 6 : 5}>
                  <Center py="lg">
                    <Text c="dimmed">
                      {principals.length === 0
                        ? 'No principals have access to this resource.'
                        : 'No principals match your search criteria.'}
                    </Text>
                  </Center>
                </Table.Td>
              </Table.Tr>
            ) : (
              filteredPrincipals.map((principal) => {
                // Determine what to show: display_name on top, mail or principalName below
                const hasDisplayName = !!principal.displayName;
                const secondaryText = principal.mail || principal.principalName || null;
                const hasSecondary = !!secondaryText;
                
                // Fallback: if no display name, show principalId
                const primaryText = principal.displayName || principal.principalId;
                
                return (
                <Table.Tr key={principal.id}>
                  <Table.Td>
                    <Group gap="sm" wrap="nowrap">
                      <Box className={classes.principalIcon}>
                        {getPrincipalIcon(principal.principalType)}
                      </Box>
                      <Box className={hasDisplayName && hasSecondary ? classes.principalNameContainer : classes.principalNameContainerCentered}>
                        <Text size="sm" fw={500}>
                          {primaryText}
                        </Text>
                        {hasDisplayName && hasSecondary && (
                          <Text size="xs" c="dimmed">
                            {secondaryText}
                          </Text>
                        )}
                      </Box>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" size="sm">
                      {getPrincipalTypeLabel(principal.principalType)}
                    </Badge>
                  </Table.Td>
                  {(['READ', 'WRITE', 'ADMIN'] as PermissionActionEnum[]).map((role) => (
                    <Table.Td key={role} className={classes.roleCell}>
                      {isRoleLoading(principal.principalId, role) ? (
                        <Loader size="xs" />
                      ) : (
                        <Checkbox
                          checked={principal.roles.includes(role)}
                          onChange={(e) =>
                            handleRoleToggle(principal, role, e.target.checked)
                          }
                          aria-label={`${role} permission for ${primaryText}`}
                        />
                      )}
                    </Table.Td>
                  ))}
                  {onDeletePrincipal && (
                    <Table.Td className={classes.actionCell}>
                      <Tooltip label="Remove access" withArrow>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => handleDeleteClick(principal)}
                          aria-label={`Remove access for ${primaryText}`}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Table.Td>
                  )}
                </Table.Tr>
              )})
            )}
          </Table.Tbody>
        </Table>
      </ScrollArea>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        opened={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, principalId: '', principalType: 'IDENTITY_USER', displayName: '' })}
        onConfirm={handleDeleteConfirm}
        title="Remove Access"
        itemName={deleteDialog.displayName ?? undefined}
        itemType="access"
        isLoading={isDeleting}
      />
    </Stack>
  );
};
