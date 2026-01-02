import type { FC } from 'react';
import { useState, useEffect, useCallback, useRef, type KeyboardEvent } from 'react';
import {
  Modal,
  Button,
  Group,
  Stack,
  Text,
  Box,
  CloseButton,
  Loader,
  Paper,
  Divider,
  Radio,
  Checkbox,
  ScrollArea,
  Center,
  TextInput,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import {
  IconSearch,
  IconUser,
  IconUsers,
  IconUsersGroup,
  IconShieldLock,
} from '@tabler/icons-react';
import { useIdentity } from '../../../contexts';
import type {
  IdentityUser,
  IdentityGroup,
  CustomGroupResponse,
  PrincipalTypeEnum,
} from '../../../api/types';
import classes from './AddPrincipalDialog.module.css';

// Types
export interface SelectedPrincipal {
  id: string;
  displayName: string;
  email?: string;
  type: PrincipalTypeEnum;
}

// Role option that can be passed to the dialog
export interface RoleOption {
  value: string;
  label: string;
  description?: string;
}

interface AddPrincipalDialogProps {
  /** Whether the dialog is open */
  opened: boolean;
  /** Close handler */
  onClose: () => void;
  /** Submit handler with selected principals and selected roles */
  onSubmit: (principals: SelectedPrincipal[], roles: string[]) => Promise<void>;
  /** Entity name for labels (e.g., "application", "credential") */
  entityName?: string;
  /** IDs of principals that already have access (to filter them out) */
  existingPrincipalIds?: string[];
  /** Custom role options - if not provided, uses default READ/WRITE/ADMIN */
  roleOptions?: RoleOption[];
  /** Whether to allow multiple role selection (default: false = single select) */
  multiSelect?: boolean;
  /** Default selected role(s) */
  defaultRoles?: string[];
}

const SEARCH_DEBOUNCE_MS = 300;
const INITIAL_FETCH_LIMIT = 10;

// Default resource permissions
const DEFAULT_ROLE_OPTIONS: RoleOption[] = [
  { value: 'READ', label: 'Read', description: 'Can view this resource and its data' },
  { value: 'WRITE', label: 'Write', description: 'Can view and edit this resource' },
  { value: 'ADMIN', label: 'Admin', description: 'Full access including managing permissions' },
];

export const AddPrincipalDialog: FC<AddPrincipalDialogProps> = ({
  opened,
  onClose,
  onSubmit,
  entityName = 'resource',
  existingPrincipalIds = [],
  roleOptions = DEFAULT_ROLE_OPTIONS,
  multiSelect = false,
  defaultRoles,
}) => {
  const { apiClient, selectedTenant } = useIdentity();

  // Search state
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchValue, SEARCH_DEBOUNCE_MS);
  const [showDropdown, setShowDropdown] = useState(false);

  // Permission search state
  const [permissionSearch, setPermissionSearch] = useState('');

  // Loading states
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isLoadingCustomGroups, setIsLoadingCustomGroups] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data states
  const [users, setUsers] = useState<IdentityUser[]>([]);
  const [groups, setGroups] = useState<IdentityGroup[]>([]);
  const [customGroups, setCustomGroups] = useState<CustomGroupResponse[]>([]);

  // Selection state
  const [selectedPrincipals, setSelectedPrincipals] = useState<SelectedPrincipal[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(defaultRoles || [roleOptions[0]?.value || 'READ']);

  // Highlight state for keyboard navigation
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter role options by search
  const filteredRoleOptions = roleOptions.filter(
    (role) =>
      !permissionSearch ||
      role.label.toLowerCase().includes(permissionSearch.toLowerCase()) ||
      role.description?.toLowerCase().includes(permissionSearch.toLowerCase())
  );

  // Build flat list of all suggestions for keyboard navigation
  const allSuggestions = [
    ...users.map((u) => ({
      id: u.id,
      displayName: u.display_name,
      email: u.mail,
      type: 'IDENTITY_USER' as PrincipalTypeEnum,
      section: 'users',
    })),
    ...groups.map((g) => ({
      id: g.id,
      displayName: g.display_name,
      email: undefined,
      type: 'IDENTITY_GROUP' as PrincipalTypeEnum,
      section: 'groups',
    })),
    ...customGroups.map((cg) => ({
      id: cg.id,
      displayName: cg.name,
      email: undefined,
      type: 'CUSTOM_GROUP' as PrincipalTypeEnum,
      section: 'customGroups',
    })),
  ].filter(
    (p) =>
      !selectedPrincipals.some((sp) => sp.id === p.id) &&
      !existingPrincipalIds.includes(p.id)
  );

  // Fetch data when search changes
  useEffect(() => {
    if (!opened || !apiClient || !selectedTenant) return;

    const fetchData = async () => {
      setIsLoadingUsers(true);
      setIsLoadingGroups(true);
      setIsLoadingCustomGroups(true);

      try {
        const [usersResult, groupsResult, customGroupsResult] = await Promise.all([
          apiClient.getUsers({ search: debouncedSearch, top: INITIAL_FETCH_LIMIT }),
          apiClient.getGroups({ search: debouncedSearch, top: INITIAL_FETCH_LIMIT }),
          apiClient.listCustomGroups(selectedTenant.id, {
            skip: 0,
            limit: INITIAL_FETCH_LIMIT,
            name: debouncedSearch || undefined,
          }),
        ]);

        setUsers(usersResult.value || []);
        setGroups(groupsResult.value || []);
        setCustomGroups(customGroupsResult || []);
      } catch (error) {
        console.error('Failed to fetch principals:', error);
      } finally {
        setIsLoadingUsers(false);
        setIsLoadingGroups(false);
        setIsLoadingCustomGroups(false);
      }
    };

    fetchData();
  }, [opened, debouncedSearch, apiClient, selectedTenant]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (opened) {
      setSearchValue('');
      setSelectedPrincipals([]);
      setSelectedRoles(defaultRoles || [roleOptions[0]?.value || 'READ']);
      setShowDropdown(false);
      setHighlightedIndex(-1);
      setPermissionSearch('');
    }
  }, [opened, defaultRoles, roleOptions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Add principal to selection
  const addPrincipal = useCallback((principal: SelectedPrincipal) => {
    if (selectedPrincipals.some((p) => p.id === principal.id)) return;
    setSelectedPrincipals((prev) => [...prev, principal]);
    setSearchValue('');
    setShowDropdown(false);
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  }, [selectedPrincipals]);

  // Remove principal from selection
  const removePrincipal = useCallback((principalId: string) => {
    setSelectedPrincipals((prev) => prev.filter((p) => p.id !== principalId));
  }, []);

  // Handle role selection
  const handleRoleSelect = useCallback((roleValue: string) => {
    if (multiSelect) {
      setSelectedRoles((prev) => {
        if (prev.includes(roleValue)) {
          if (prev.length === 1) return prev;
          return prev.filter((r) => r !== roleValue);
        }
        return [...prev, roleValue];
      });
    } else {
      setSelectedRoles([roleValue]);
    }
  }, [multiSelect]);

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < allSuggestions.length - 1 ? prev + 1 : prev
      );
      setTimeout(() => {
        const highlighted = dropdownRef.current?.querySelector(`[data-index="${highlightedIndex + 1}"]`);
        highlighted?.scrollIntoView({ block: 'nearest' });
      }, 0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      setTimeout(() => {
        const highlighted = dropdownRef.current?.querySelector(`[data-index="${highlightedIndex - 1}"]`);
        highlighted?.scrollIntoView({ block: 'nearest' });
      }, 0);
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      const suggestion = allSuggestions[highlightedIndex];
      if (suggestion) {
        addPrincipal({
          id: suggestion.id,
          displayName: suggestion.displayName,
          email: suggestion.email,
          type: suggestion.type,
        });
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setHighlightedIndex(-1);
    } else if (e.key === 'Backspace' && !searchValue && selectedPrincipals.length > 0) {
      removePrincipal(selectedPrincipals[selectedPrincipals.length - 1].id);
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    if (selectedPrincipals.length === 0 || selectedRoles.length === 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit(selectedPrincipals, selectedRoles);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get icon for principal type
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

  const isLoading = isLoadingUsers || isLoadingGroups || isLoadingCustomGroups;
  const hasResults = users.length > 0 || groups.length > 0 || customGroups.length > 0;

  // Track current highlight index across sections
  let currentIndex = -1;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <IconShieldLock size={20} />
          <span>Add access to {entityName}</span>
        </Group>
      }
      size="lg"
      centered
    >
      <Stack gap="lg">
        {/* Principal Search */}
        <Box ref={containerRef} className={classes.searchContainer}>
          <Text size="sm" fw={500} mb="xs">
            Select users or groups
          </Text>

          <Box
            className={classes.inputContainer}
            onClick={() => inputRef.current?.focus()}
          >
            <IconSearch size={16} className={classes.searchIconFixed} />
            <Box className={classes.selectedWrapper}>
              {selectedPrincipals.map((principal) => (
                <Box key={principal.id} className={classes.selectedTag}>
                  {getPrincipalIcon(principal.type)}
                  <Text size="sm" className={classes.selectedTagText}>
                    {principal.displayName}
                  </Text>
                  <CloseButton
                    size="xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePrincipal(principal.id);
                    }}
                    aria-label={`Remove ${principal.displayName}`}
                  />
                </Box>
              ))}

              <Box className={classes.inputWrapper}>
                <input
                  ref={inputRef}
                  type="text"
                  value={searchValue}
                  onChange={(e) => {
                    setSearchValue(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    selectedPrincipals.length === 0
                      ? 'Search for users or groups...'
                      : ''
                  }
                  className={classes.input}
                />
                {isLoading && <Loader size="xs" className={classes.loader} />}
              </Box>
            </Box>
          </Box>

          {/* Dropdown */}
          {showDropdown && (
            <Paper ref={dropdownRef} className={classes.dropdown} shadow="md" withBorder>
              {isLoading && !hasResults ? (
                <Center py="md">
                  <Loader size="sm" />
                </Center>
              ) : !hasResults ? (
                <Center py="md">
                  <Text size="sm" c="dimmed">
                    No results found
                  </Text>
                </Center>
              ) : (
                <>
                  {/* Identity Users Section */}
                  {users.length > 0 && (
                    <>
                      <Text px="sm" py="xs" className={classes.sectionHeader}>
                        Identity Users
                      </Text>
                      {users
                        .filter(
                          (u) =>
                            !selectedPrincipals.some((p) => p.id === u.id) &&
                            !existingPrincipalIds.includes(u.id)
                        )
                        .map((user) => {
                          currentIndex++;
                          const idx = currentIndex;
                          return (
                            <Box
                              key={user.id}
                              data-index={idx}
                              className={`${classes.suggestion} ${
                                highlightedIndex === idx ? classes.suggestionHighlighted : ''
                              }`}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                addPrincipal({
                                  id: user.id,
                                  displayName: user.display_name,
                                  email: user.mail,
                                  type: 'IDENTITY_USER',
                                });
                              }}
                              onMouseEnter={() => setHighlightedIndex(idx)}
                            >
                              <Group gap="sm" wrap="nowrap">
                                <Box className={classes.suggestionIcon}>
                                  <IconUser size={16} />
                                </Box>
                                <Box>
                                  <Text size="sm">{user.display_name}</Text>
                                  {user.mail && (
                                    <Text size="xs" c="dimmed">
                                      {user.mail}
                                    </Text>
                                  )}
                                </Box>
                              </Group>
                            </Box>
                          );
                        })}
                    </>
                  )}

                  {/* Identity Groups Section */}
                  {groups.length > 0 && (
                    <>
                      {users.length > 0 && <Divider my="xs" />}
                      <Text px="sm" py="xs" className={classes.sectionHeader}>
                        Identity Groups
                      </Text>
                      {groups
                        .filter(
                          (g) =>
                            !selectedPrincipals.some((p) => p.id === g.id) &&
                            !existingPrincipalIds.includes(g.id)
                        )
                        .map((group) => {
                          currentIndex++;
                          const idx = currentIndex;
                          return (
                            <Box
                              key={group.id}
                              data-index={idx}
                              className={`${classes.suggestion} ${
                                highlightedIndex === idx ? classes.suggestionHighlighted : ''
                              }`}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                addPrincipal({
                                  id: group.id,
                                  displayName: group.display_name,
                                  type: 'IDENTITY_GROUP',
                                });
                              }}
                              onMouseEnter={() => setHighlightedIndex(idx)}
                            >
                              <Group gap="sm" wrap="nowrap">
                                <Box className={classes.suggestionIcon}>
                                  <IconUsers size={16} />
                                </Box>
                                <Text size="sm">{group.display_name}</Text>
                              </Group>
                            </Box>
                          );
                        })}
                    </>
                  )}

                  {/* Custom Groups Section */}
                  {customGroups.length > 0 && (
                    <>
                      {(users.length > 0 || groups.length > 0) && <Divider my="xs" />}
                      <Text px="sm" py="xs" className={classes.sectionHeader}>
                        Custom Groups
                      </Text>
                      {customGroups
                        .filter(
                          (cg) =>
                            !selectedPrincipals.some((p) => p.id === cg.id) &&
                            !existingPrincipalIds.includes(cg.id)
                        )
                        .map((customGroup) => {
                          currentIndex++;
                          const idx = currentIndex;
                          return (
                            <Box
                              key={customGroup.id}
                              data-index={idx}
                              className={`${classes.suggestion} ${
                                highlightedIndex === idx ? classes.suggestionHighlighted : ''
                              }`}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                addPrincipal({
                                  id: customGroup.id,
                                  displayName: customGroup.name,
                                  type: 'CUSTOM_GROUP',
                                });
                              }}
                              onMouseEnter={() => setHighlightedIndex(idx)}
                            >
                              <Group gap="sm" wrap="nowrap">
                                <Box className={classes.suggestionIcon}>
                                  <IconUsersGroup size={16} />
                                </Box>
                                <Box>
                                  <Text size="sm">{customGroup.name}</Text>
                                  {customGroup.description && (
                                    <Text size="xs" c="dimmed" lineClamp={1}>
                                      {customGroup.description}
                                    </Text>
                                  )}
                                </Box>
                              </Group>
                            </Box>
                          );
                        })}
                    </>
                  )}
                </>
              )}
            </Paper>
          )}
        </Box>

        {/* Role Selection */}
        <Box>
          <Text size="sm" fw={500} mb="xs">
            Select {multiSelect ? 'permissions' : 'permission level'}
          </Text>
          
          {/* Search for permissions if there are many */}
          {roleOptions.length > 5 && (
            <TextInput
              placeholder="Search permissions..."
              leftSection={<IconSearch size={14} />}
              value={permissionSearch}
              onChange={(e) => setPermissionSearch(e.target.value)}
              mb="sm"
              size="sm"
            />
          )}
          
          <ScrollArea.Autosize mah={200} scrollbarSize={8}>
            {multiSelect ? (
              <Stack gap="sm">
                {filteredRoleOptions.map((role) => (
                  <Box
                    key={role.value}
                    className={`${classes.roleOption} ${selectedRoles.includes(role.value) ? classes.roleOptionSelected : ''}`}
                    onClick={() => handleRoleSelect(role.value)}
                  >
                    <Checkbox
                      checked={selectedRoles.includes(role.value)}
                      onChange={() => handleRoleSelect(role.value)}
                      label={
                        <Box>
                          <Text size="sm" fw={500}>
                            {role.label}
                          </Text>
                          {role.description && (
                            <Text size="xs" c="dimmed">
                              {role.description}
                            </Text>
                          )}
                        </Box>
                      }
                      styles={{ input: { cursor: 'pointer' }, label: { cursor: 'pointer' } }}
                    />
                  </Box>
                ))}
              </Stack>
            ) : (
              <Radio.Group
                value={selectedRoles[0] || ''}
                onChange={(value) => setSelectedRoles([value])}
              >
                <Stack gap="sm">
                  {filteredRoleOptions.map((role) => (
                    <Box
                      key={role.value}
                      className={`${classes.roleOption} ${selectedRoles.includes(role.value) ? classes.roleOptionSelected : ''}`}
                      onClick={() => handleRoleSelect(role.value)}
                    >
                      <Radio
                        value={role.value}
                        label={
                          <Box>
                            <Text size="sm" fw={500}>
                              {role.label}
                            </Text>
                            {role.description && (
                              <Text size="xs" c="dimmed">
                                {role.description}
                              </Text>
                            )}
                          </Box>
                        }
                        styles={{ radio: { cursor: 'pointer' }, label: { cursor: 'pointer' } }}
                      />
                    </Box>
                  ))}
                </Stack>
              </Radio.Group>
            )}
          </ScrollArea.Autosize>
        </Box>

        {/* Actions */}
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={selectedPrincipals.length === 0 || selectedRoles.length === 0}
          >
            Add Access
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
