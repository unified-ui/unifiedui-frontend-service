import type { FC } from 'react';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  TextInput,
  MultiSelect,
  Table,
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
  Popover,
  Switch,
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

// Role priority for sorting (higher = more privileged)
const ROLE_PRIORITY: Record<string, number> = {
  GLOBAL_ADMIN: 100,
  // Admins
  APPLICATIONS_ADMIN: 50,
  AUTONOMOUS_AGENTS_ADMIN: 50,
  CONVERSATIONS_ADMIN: 50,
  CREDENTIALS_ADMIN: 50,
  CUSTOM_GROUPS_ADMIN: 50,
  DEVELOPMENT_PLATFORMS_ADMIN: 50,
  CHAT_WIDGETS_ADMIN: 50,
  // Creators
  APPLICATIONS_CREATOR: 25,
  AUTONOMOUS_AGENTS_CREATOR: 25,
  CONVERSATIONS_CREATOR: 25,
  CREDENTIALS_CREATOR: 25,
  CUSTOM_GROUP_CREATOR: 25,
  DEVELOPMENT_PLATFORMS_CREATOR: 25,
  CHAT_WIDGETS_CREATOR: 25,
  // Reader
  READER: 10,
};

// How many roles to show before collapsing into popover
const MAX_VISIBLE_ROLES = 3;

// Types
export interface TenantPrincipalPermission {
  id: string;
  principalId: string;
  principalType: PrincipalTypeEnum;
  displayName?: string | null;
  mail?: string | null;
  principalName?: string | null;
  description?: string | null;
  isActive: boolean;
  roles: TenantPermissionEnum[];
}

interface ManageTenantAccessTableProps {
  /** List of principals with their tenant roles */
  principals: TenantPrincipalPermission[];
  /** Loading state */
  isLoading?: boolean;
  /** Loading more state (for infinite scroll) */
  isLoadingMore?: boolean;
  /** Indicates if initial data fetch is complete */
  hasFetched?: boolean;
  /** Whether there are more items to load */
  hasMore?: boolean;
  /** Error message */
  error?: string | null;
  /** Handler when clicking on a principal row to manage access */
  onManageAccess: (principal: TenantPrincipalPermission) => void;
  /** Handler to delete a principal's access */
  onDeletePrincipal?: (principalId: string, principalType: PrincipalTypeEnum, displayName?: string | null) => Promise<void>;
  /** Handler to open add principal dialog */
  onAddPrincipal: () => void;
  /** Handler to update principal's active status */
  onStatusChange?: (principalId: string, principalType: PrincipalTypeEnum, isActive: boolean) => Promise<void>;
  /** Handler for search changes (server-side) */
  onSearchChange?: (search: string) => void;
  /** Handler for role filter changes (server-side) */
  onRoleFilterChange?: (roles: string[]) => void;
  /** Handler to load more items (infinite scroll) */
  onLoadMore?: () => void;
  /** Current search value (controlled) */
  searchValue?: string;
  /** Current role filter values (controlled) */
  roleFilterValue?: string[];
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
      return 'Identity User';
    case 'IDENTITY_GROUP':
      return 'Identity Group';
    case 'CUSTOM_GROUP':
      return 'Custom Group';
    default:
      return type;
  }
};

// Get badge color for principal type
const getPrincipalTypeBadgeColor = (type: PrincipalTypeEnum): string => {
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

// Get role label from role value
const getRoleLabel = (role: TenantPermissionEnum): string => {
  const option = TENANT_ROLE_OPTIONS.find((o) => o.value === role);
  return option?.label || role;
};

// Get badge color based on role type
const getRoleBadgeColor = (role: TenantPermissionEnum): string => {
  if (role === 'GLOBAL_ADMIN') return 'red';
  if (role.endsWith('_ADMIN')) return 'orange';
  if (role.endsWith('_CREATOR')) return 'blue';
  return 'gray';
};

// Sort roles by priority (most privileged first)
const sortRolesByPriority = (roles: TenantPermissionEnum[]): TenantPermissionEnum[] => {
  return [...roles].sort((a, b) => {
    const priorityA = ROLE_PRIORITY[a] || 0;
    const priorityB = ROLE_PRIORITY[b] || 0;
    return priorityB - priorityA;
  });
};

// Role Badge Component with popover for hidden roles
const RoleBadges: FC<{ roles: TenantPermissionEnum[] }> = ({ roles }) => {
  const [popoverOpened, setPopoverOpened] = useState(false);
  
  const sortedRoles = sortRolesByPriority(roles);
  const visibleRoles = sortedRoles.slice(0, MAX_VISIBLE_ROLES);
  const hiddenRoles = sortedRoles.slice(MAX_VISIBLE_ROLES);
  const hasHiddenRoles = hiddenRoles.length > 0;

  return (
    <Group gap={4} wrap="wrap">
      {visibleRoles.map((role) => (
        <Badge 
          key={role} 
          size="sm" 
          variant="light" 
          color={getRoleBadgeColor(role)}
          radius="sm"
        >
          {getRoleLabel(role)}
        </Badge>
      ))}
      {hasHiddenRoles && (
        <Popover
          position="top"
          withArrow
          shadow="md"
          withinPortal
          opened={popoverOpened}
          onChange={setPopoverOpened}
        >
          <Popover.Target>
            <div
              onMouseEnter={() => setPopoverOpened(true)}
              onMouseLeave={() => setPopoverOpened(false)}
              onClick={(e) => e.stopPropagation()}
              style={{ display: 'inline-block', lineHeight: 1 }}
            >
              <Badge 
                size="sm" 
                variant="outline" 
                radius="sm" 
                style={{ cursor: 'pointer', display: 'inline-flex' }}
              >
                +{hiddenRoles.length}
              </Badge>
            </div>
          </Popover.Target>
          <Popover.Dropdown
            onMouseEnter={() => setPopoverOpened(true)}
            onMouseLeave={() => setPopoverOpened(false)}
          >
            <Group gap={4} wrap="wrap" maw={300}>
              {hiddenRoles.map((role) => (
                <Badge 
                  key={role} 
                  size="sm" 
                  variant="light" 
                  color={getRoleBadgeColor(role)}
                  radius="sm"
                >
                  {getRoleLabel(role)}
                </Badge>
              ))}
            </Group>
          </Popover.Dropdown>
        </Popover>
      )}
    </Group>
  );
};

export const ManageTenantAccessTable: FC<ManageTenantAccessTableProps> = ({
  principals,
  isLoading = false,
  isLoadingMore = false,
  hasFetched = true,
  hasMore = false,
  error = null,
  onManageAccess,
  onDeletePrincipal,
  onAddPrincipal,
  onStatusChange,
  onSearchChange,
  onRoleFilterChange,
  onLoadMore,
  searchValue: controlledSearchValue,
  roleFilterValue: controlledRoleFilterValue,
}) => {
  // Get current user to prevent self-modification
  const { user: currentUser } = useIdentity();

  // Search state (for internal debouncing)
  const [internalSearchValue, setInternalSearchValue] = useState(controlledSearchValue || '');
  const [debouncedSearch] = useDebouncedValue(internalSearchValue, 400);
  
  // Role filter state
  const [internalRoleFilter, setInternalRoleFilter] = useState<string[]>(controlledRoleFilterValue || []);
  
  // Infinite scroll observer ref
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  // Delete confirmation dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    principalId: string;
    principalType: PrincipalTypeEnum;
    displayName: string | null | undefined;
  }>({ open: false, principalId: '', principalType: 'IDENTITY_USER', displayName: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync internal search with controlled value
  useEffect(() => {
    if (controlledSearchValue !== undefined && controlledSearchValue !== internalSearchValue) {
      setInternalSearchValue(controlledSearchValue);
    }
  }, [controlledSearchValue]); // eslint-disable-line react-hooks/exhaustive-deps

  // Trigger server-side search when debounced value changes
  useEffect(() => {
    if (onSearchChange) {
      onSearchChange(debouncedSearch);
    }
  }, [debouncedSearch, onSearchChange]);

  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalSearchValue(e.target.value);
  }, []);

  // Handle role filter change
  const handleRoleFilterChange = useCallback((roles: string[]) => {
    setInternalRoleFilter(roles);
    if (onRoleFilterChange) {
      onRoleFilterChange(roles);
    }
  }, [onRoleFilterChange]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !onLoadMore || !hasMore || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, onLoadMore]);

  // Handle delete click - open confirmation dialog
  const handleDeleteClick = useCallback((e: React.MouseEvent, principal: TenantPrincipalPermission) => {
    e.stopPropagation();
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

  // Handle row click
  const handleRowClick = useCallback((principal: TenantPrincipalPermission) => {
    onManageAccess(principal);
  }, [onManageAccess]);

  // Group role options for filter dropdown
  const roleFilterOptions = useMemo(() => 
    TENANT_ROLE_OPTIONS.map(r => ({ value: r.value, label: r.label })), 
    []
  );

  // Determine what to show in table body
  const showInitialLoading = isLoading && !hasFetched;
  const showFilterLoading = isLoading && hasFetched;
  const showError = !!error;
  const showEmpty = !isLoading && principals.length === 0;
  const showData = !isLoading && principals.length > 0;

  return (
    <Stack gap="md" className={classes.container}>
      {/* Toolbar - always visible */}
      <Group justify="space-between" wrap="nowrap">
        <Group gap="sm" wrap="nowrap" style={{ flex: 1 }}>
          <TextInput
            placeholder="Search by name or email..."
            leftSection={<IconSearch size={16} />}
            value={internalSearchValue}
            onChange={handleSearchChange}
            className={classes.searchInput}
          />
          <MultiSelect
            placeholder="Filter by role"
            data={roleFilterOptions}
            value={internalRoleFilter}
            onChange={handleRoleFilterChange}
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

      {/* Scrollable Table Container */}
      <ScrollArea.Autosize className={classes.tableScrollArea}>
        <Table striped highlightOnHover>
          <Table.Thead className={classes.tableHeader}>
            <Table.Tr>
              <Table.Th style={{ width: '280px' }}>Principal</Table.Th>
              <Table.Th style={{ width: '120px' }}>Type</Table.Th>
              <Table.Th style={{ width: '100px' }}>Status</Table.Th>
              <Table.Th>Roles</Table.Th>
              <Table.Th style={{ width: '60px' }}></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {/* Show loading spinner (initial or filter loading) */}
            {(showInitialLoading || showFilterLoading) && (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Center py="xl">
                    <Loader size="md" />
                  </Center>
                </Table.Td>
              </Table.Tr>
            )}
            {/* Show error */}
            {showError && (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Center py="xl">
                    <Text c="red">{error}</Text>
                  </Center>
                </Table.Td>
              </Table.Tr>
            )}
            {/* Show empty state */}
            {showEmpty && (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Center py="xl">
                    <Text c="dimmed">
                      {hasFetched 
                        ? (internalSearchValue || internalRoleFilter.length > 0
                          ? 'No principals match your filters'
                          : 'No principals have access yet. Click "Add Principal" to get started.')
                        : ''}
                    </Text>
                  </Center>
                </Table.Td>
              </Table.Tr>
            )}
            {/* Show data */}
            {showData && principals.map((principal) => {
                const isCurrentUser = currentUser?.id === principal.principalId;

                return (
                  <Table.Tr 
                    key={`${principal.principalId}-${principal.principalType}`}
                    onClick={() => !isCurrentUser && handleRowClick(principal)}
                    style={{ cursor: isCurrentUser ? 'default' : 'pointer' }}
                  >
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
                          {(principal.mail || principal.principalName) && (
                            <Text size="xs" c="dimmed" lineClamp={1}>
                              {principal.mail || principal.principalName}
                            </Text>
                          )}
                        </Stack>
                      </Group>
                    </Table.Td>

                    {/* Type Column */}
                    <Table.Td>
                      <Badge size="sm" variant="light" color={getPrincipalTypeBadgeColor(principal.principalType)}>
                        {getPrincipalTypeLabel(principal.principalType)}
                      </Badge>
                    </Table.Td>

                    {/* Status Column with Switch */}
                    <Table.Td onClick={(e) => e.stopPropagation()}>
                      <Group gap="xs" wrap="nowrap">
                        <Switch
                          checked={principal.isActive}
                          disabled={isCurrentUser || !onStatusChange}
                          onChange={(e) => {
                            if (onStatusChange && !isCurrentUser) {
                              onStatusChange(principal.principalId, principal.principalType, e.currentTarget.checked);
                            }
                          }}
                          size="sm"
                        />
                        <Text size="xs" c={principal.isActive ? 'green' : 'dimmed'}>
                          {principal.isActive ? 'Active' : 'Inactive'}
                        </Text>
                      </Group>
                    </Table.Td>

                    {/* Roles - displayed as badges like tags */}
                    <Table.Td>
                      <RoleBadges roles={principal.roles} />
                    </Table.Td>

                    {/* Actions */}
                    <Table.Td>
                      {onDeletePrincipal && !isCurrentUser && (
                        <Tooltip label="Remove access">
                          <ActionIcon
                            color="red"
                            variant="subtle"
                            onClick={(e) => handleDeleteClick(e, principal)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </Table.Td>
                  </Table.Tr>
                );
              })}
          </Table.Tbody>
        </Table>
        
        {/* Infinite scroll trigger element */}
        {hasMore && (
          <div ref={loadMoreRef} className={classes.loadMoreTrigger}>
            {isLoadingMore && (
              <Center py="sm">
                <Loader size="sm" />
              </Center>
            )}
          </div>
        )}
      </ScrollArea.Autosize>

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
