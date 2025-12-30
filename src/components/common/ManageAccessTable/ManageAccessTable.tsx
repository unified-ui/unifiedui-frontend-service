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
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconSearch, IconPlus, IconUser, IconUsers, IconUsersGroup } from '@tabler/icons-react';
import type { PermissionActionEnum, PrincipalTypeEnum } from '../../../api/types';
import classes from './ManageAccessTable.module.css';

// Types
export interface PrincipalPermission {
  id: string;
  principalId: string;
  principalType: PrincipalTypeEnum;
  displayName: string;
  email?: string;
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
    case 'USER':
      return <IconUser size={16} />;
    case 'GROUP':
      return <IconUsers size={16} />;
    case 'CUSTOM_GROUP':
      return <IconUsersGroup size={16} />;
    default:
      return <IconUser size={16} />;
  }
};

const getPrincipalTypeLabel = (type: PrincipalTypeEnum) => {
  switch (type) {
    case 'USER':
      return 'User';
    case 'GROUP':
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

  // Filter principals based on search and role filter
  const filteredPrincipals = useMemo(() => {
    let result = [...principals];

    // Apply search filter
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      result = result.filter(
        (p) =>
          p.displayName.toLowerCase().includes(query) ||
          p.email?.toLowerCase().includes(query)
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

  // Handle role checkbox change
  const handleRoleToggle = useCallback(
    async (principal: PrincipalPermission, role: PermissionActionEnum, enabled: boolean) => {
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
    [onRoleChange]
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
                <Group gap="xs">
                  <Text size="sm">Read</Text>
                  <Text size="xs" c="dimmed">(View {entityName})</Text>
                </Group>
              </Table.Th>
              <Table.Th className={classes.roleHeader}>
                <Group gap="xs">
                  <Text size="sm">Write</Text>
                  <Text size="xs" c="dimmed">(Edit {entityName})</Text>
                </Group>
              </Table.Th>
              <Table.Th className={classes.roleHeader}>
                <Group gap="xs">
                  <Text size="sm">Admin</Text>
                  <Text size="xs" c="dimmed">(Manage access)</Text>
                </Group>
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredPrincipals.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={5}>
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
              filteredPrincipals.map((principal) => (
                <Table.Tr key={principal.id}>
                  <Table.Td>
                    <Group gap="sm" wrap="nowrap">
                      <Box className={classes.principalIcon}>
                        {getPrincipalIcon(principal.principalType)}
                      </Box>
                      <Box>
                        <Text size="sm" fw={500}>
                          {principal.displayName}
                        </Text>
                        {principal.email && (
                          <Text size="xs" c="dimmed">
                            {principal.email}
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
                          aria-label={`${role} permission for ${principal.displayName}`}
                        />
                      )}
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Stack>
  );
};
