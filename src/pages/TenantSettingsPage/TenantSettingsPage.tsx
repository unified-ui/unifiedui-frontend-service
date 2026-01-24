import type { FC } from 'react';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Stack,
  Tabs,
  TextInput,
  Textarea,
  Button,
  Group,
  Paper,
  Text,
  Title,
  Badge,
  Alert,
  Loader,
  Center,
  Table,
  ActionIcon,
  Menu,
  ScrollArea,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDebouncedValue } from '@mantine/hooks';
import {
  IconSettings,
  IconUsers,
  IconUsersGroup,
  IconCreditCard,
  IconTrash,
  IconInfoCircle,
  IconEdit,
  IconSearch,
  IconDots,
  IconUserPlus,
  IconKey,
  IconShieldLock,
  IconTool,
} from '@tabler/icons-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { PageContainer, ConfirmDeleteDialog, EditRolesDialog } from '../../components/common';
import { ManageTenantAccessTable, TENANT_ROLE_OPTIONS } from '../../components/common/ManageTenantAccessTable';
import type { TenantPrincipalPermission } from '../../components/common/ManageTenantAccessTable';
import { AddPrincipalDialog } from '../../components/common/AddPrincipalDialog';
import type { SelectedPrincipal, RoleOption } from '../../components/common/AddPrincipalDialog';
import {
  CreateCustomGroupDialog,
  EditCustomGroupDialog,
  CreateCredentialDialog,
  EditCredentialDialog,
  CreateToolDialog,
  EditToolDialog,
} from '../../components/dialogs';
import type { EditDialogTab } from '../../components/dialogs';
import { useIdentity } from '../../contexts';
import type {
  TenantPermissionEnum,
  PrincipalTypeEnum,
  CustomGroupResponse,
  CredentialResponse,
  ToolResponse,
} from '../../api/types';
import classes from './TenantSettingsPage.module.css';

type TabValue = 'settings' | 'iam' | 'custom-groups' | 'tools' | 'credentials' | 'billing-and-licence';

const TAB_VALUES: TabValue[] = ['settings', 'iam', 'custom-groups', 'tools', 'credentials', 'billing-and-licence'];
const DEFAULT_TAB: TabValue = 'settings';

const isValidTab = (value: string | null): value is TabValue => {
  return value !== null && TAB_VALUES.includes(value as TabValue);
};

interface TenantSettingsFormValues {
  name: string;
  description: string;
}

export const TenantSettingsPage: FC = () => {
  const { apiClient, selectedTenant, refreshIdentity } = useIdentity();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Read initial tab from URL, default to 'settings'
  const tabFromUrl = searchParams.get('tab');
  const initialTab = isValidTab(tabFromUrl) ? tabFromUrl : DEFAULT_TAB;
  const [activeTab, setActiveTab] = useState<TabValue>(initialTab);

  // Update URL when tab changes
  const handleTabChange = useCallback((value: string | null) => {
    if (value && isValidTab(value)) {
      setActiveTab(value);
      setSearchParams({ tab: value }, { replace: true });
    }
  }, [setSearchParams]);

  // ===== Tenant Settings State =====
  const [isSavingTenant, setIsSavingTenant] = useState(false);
  const [deleteDialogStep, setDeleteDialogStep] = useState<0 | 1 | 2>(0); // 0=closed, 1=first confirm, 2=second confirm
  const [isDeletingTenant, setIsDeletingTenant] = useState(false);

  const tenantForm = useForm<TenantSettingsFormValues>({
    initialValues: {
      name: '',
      description: '',
    },
    validate: {
      name: (value) => {
        if (!value.trim()) return 'Name is required';
        if (value.length > 255) return 'Name must be less than 255 characters';
        return null;
      },
      description: (value) => {
        if (value && value.length > 2000) return 'Description must be less than 2000 characters';
        return null;
      },
    },
  });

  // ===== Access Management State =====
  const [principals, setPrincipals] = useState<TenantPrincipalPermission[]>([]);
  const [principalsLoading, setPrincipalsLoading] = useState(false);
  const [principalsLoadingMore, setPrincipalsLoadingMore] = useState(false);
  const [principalsError, setPrincipalsError] = useState<string | null>(null);
  const [principalsFetched, setPrincipalsFetched] = useState(false);
  const [principalsHasMore, setPrincipalsHasMore] = useState(true);
  const [principalsSkip, setPrincipalsSkip] = useState(0);
  const [principalsSearch, setPrincipalsSearch] = useState('');
  const [principalsRoleFilter, setPrincipalsRoleFilter] = useState<string[]>([]);
  const [addPrincipalDialogOpen, setAddPrincipalDialogOpen] = useState(false);
  const [editPrincipal, setEditPrincipal] = useState<TenantPrincipalPermission | null>(null);
  
  const PRINCIPALS_PAGE_SIZE = 50;

  // ===== Custom Groups State =====
  const [customGroups, setCustomGroups] = useState<CustomGroupResponse[]>([]);
  const [customGroupsLoading, setCustomGroupsLoading] = useState(false);
  const [customGroupsLoadingMore, setCustomGroupsLoadingMore] = useState(false);
  const [customGroupsError, setCustomGroupsError] = useState<string | null>(null);
  const [customGroupsFetched, setCustomGroupsFetched] = useState(false);
  const [customGroupsHasMore, setCustomGroupsHasMore] = useState(true);
  const [customGroupsSkip, setCustomGroupsSkip] = useState(0);
  const [createGroupDialogOpen, setCreateGroupDialogOpen] = useState(false);
  const [editGroupId, setEditGroupId] = useState<string | null>(null);
  const [editGroupInitialTab, setEditGroupInitialTab] = useState<'members' | 'details'>('details');
  const [customGroupsSearch, setCustomGroupsSearch] = useState('');
  const [debouncedCustomGroupsSearch] = useDebouncedValue(customGroupsSearch, 400);
  const [deleteGroupDialog, setDeleteGroupDialog] = useState<{
    open: boolean;
    id: string;
    name: string;
  }>({ open: false, id: '', name: '' });
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);
  
  const CUSTOM_GROUPS_PAGE_SIZE = 50;
  const customGroupsLoadMoreRef = useRef<HTMLDivElement>(null);

  // ===== Credentials State =====
  const [credentials, setCredentials] = useState<CredentialResponse[]>([]);
  const [credentialsLoading, setCredentialsLoading] = useState(false);
  const [credentialsLoadingMore, setCredentialsLoadingMore] = useState(false);
  const [credentialsError, setCredentialsError] = useState<string | null>(null);
  const [credentialsFetched, setCredentialsFetched] = useState(false);
  const [credentialsHasMore, setCredentialsHasMore] = useState(true);
  const [credentialsSkip, setCredentialsSkip] = useState(0);
  const [createCredentialDialogOpen, setCreateCredentialDialogOpen] = useState(false);
  const [editCredentialId, setEditCredentialId] = useState<string | null>(null);
  const [editCredentialTab, setEditCredentialTab] = useState<EditDialogTab>('details');
  const [credentialsSearch, setCredentialsSearch] = useState('');
  const [debouncedCredentialsSearch] = useDebouncedValue(credentialsSearch, 400);
  const [deleteCredentialDialog, setDeleteCredentialDialog] = useState<{
    open: boolean;
    id: string;
    name: string;
  }>({ open: false, id: '', name: '' });
  const [isDeletingCredential, setIsDeletingCredential] = useState(false);
  
  const CREDENTIALS_PAGE_SIZE = 50;
  const credentialsLoadMoreRef = useRef<HTMLDivElement>(null);

  // ===== Tools State =====
  const [tools, setTools] = useState<ToolResponse[]>([]);
  const [toolsLoading, setToolsLoading] = useState(false);
  const [toolsLoadingMore, setToolsLoadingMore] = useState(false);
  const [toolsError, setToolsError] = useState<string | null>(null);
  const [toolsFetched, setToolsFetched] = useState(false);
  const [toolsHasMore, setToolsHasMore] = useState(true);
  const [toolsSkip, setToolsSkip] = useState(0);
  const [createToolDialogOpen, setCreateToolDialogOpen] = useState(false);
  const [editToolId, setEditToolId] = useState<string | null>(null);
  const [editToolTab, setEditToolTab] = useState<EditDialogTab>('details');
  const [toolsSearch, setToolsSearch] = useState('');
  const [debouncedToolsSearch] = useDebouncedValue(toolsSearch, 400);
  const [deleteToolDialog, setDeleteToolDialog] = useState<{
    open: boolean;
    id: string;
    name: string;
  }>({ open: false, id: '', name: '' });
  const [isDeletingTool, setIsDeletingTool] = useState(false);
  
  const TOOLS_PAGE_SIZE = 50;
  const toolsLoadMoreRef = useRef<HTMLDivElement>(null);

  // ===== Load Tenant Details =====
  useEffect(() => {
    if (selectedTenant) {
      tenantForm.setValues({
        name: selectedTenant.name,
        description: selectedTenant.description || '',
      });
      tenantForm.resetDirty();
    }
  }, [selectedTenant]); // eslint-disable-line react-hooks/exhaustive-deps

  // ===== Fetch Principals =====
  const fetchPrincipals = useCallback(async (reset = false) => {
    if (!apiClient || !selectedTenant) return;

    const isInitialFetch = reset || !principalsFetched;
    if (isInitialFetch) {
      setPrincipalsLoading(true);
    } else {
      setPrincipalsLoadingMore(true);
    }
    setPrincipalsError(null);

    const skip = reset ? 0 : principalsSkip;
    
    try {
      const response = await apiClient.getTenantPrincipals(selectedTenant.id, {
        skip,
        limit: PRINCIPALS_PAGE_SIZE,
        search: principalsSearch || undefined,
        roles: principalsRoleFilter.length > 0 ? principalsRoleFilter.join(',') : undefined,
        order_by: 'display_name',
        order_direction: 'asc',
      });
      
      // Transform response: use display_name, mail, principal_name from principal level
      const newPrincipals: TenantPrincipalPermission[] = response.principals.map(principal => ({
        id: `${principal.principal_id}-${principal.principal_type}`,
        principalId: principal.principal_id,
        principalType: principal.principal_type,
        displayName: principal.display_name || null,
        mail: principal.mail || null,
        principalName: principal.principal_name || null,
        description: principal.description || null,
        isActive: principal.is_active,
        roles: principal.roles.map(r => r.role),
      }));
      
      if (reset) {
        setPrincipals(newPrincipals);
        setPrincipalsSkip(PRINCIPALS_PAGE_SIZE);
      } else {
        // Append new principals, avoiding duplicates
        setPrincipals(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNewPrincipals = newPrincipals.filter(p => !existingIds.has(p.id));
          return [...prev, ...uniqueNewPrincipals];
        });
        setPrincipalsSkip(prev => prev + PRINCIPALS_PAGE_SIZE);
      }
      
      // Determine if there are more items to load
      setPrincipalsHasMore(newPrincipals.length === PRINCIPALS_PAGE_SIZE);
      setPrincipalsFetched(true);
    } catch {
      setPrincipalsError('Failed to load principals');
    } finally {
      setPrincipalsLoading(false);
      setPrincipalsLoadingMore(false);
    }
  }, [apiClient, selectedTenant, principalsFetched, principalsSkip, principalsSearch, principalsRoleFilter]);

  // Handler for search changes (server-side)
  const handlePrincipalsSearchChange = useCallback((search: string) => {
    setPrincipalsSearch(search);
    setPrincipalsSkip(0);
    setPrincipalsFetched(false); // Trigger re-fetch
  }, []);

  // Handler for role filter changes (server-side)
  const handlePrincipalsRoleFilterChange = useCallback((roles: string[]) => {
    setPrincipalsRoleFilter(roles);
    setPrincipalsSkip(0);
    setPrincipalsFetched(false); // Trigger re-fetch
  }, []);

  // Handler for loading more principals (infinite scroll)
  const handleLoadMorePrincipals = useCallback(() => {
    if (!principalsLoadingMore && principalsHasMore) {
      fetchPrincipals(false);
    }
  }, [fetchPrincipals, principalsLoadingMore, principalsHasMore]);

  // ===== Fetch Custom Groups =====
  const fetchCustomGroups = useCallback(async (reset = false) => {
    if (!apiClient || !selectedTenant) return;

    const isInitialFetch = reset || !customGroupsFetched;
    if (isInitialFetch) {
      setCustomGroupsLoading(true);
    } else {
      setCustomGroupsLoadingMore(true);
    }
    setCustomGroupsError(null);

    const skip = reset ? 0 : customGroupsSkip;

    try {
      const groups = await apiClient.listCustomGroups(selectedTenant.id, {
        skip,
        limit: CUSTOM_GROUPS_PAGE_SIZE,
        name: debouncedCustomGroupsSearch || undefined,
      });

      if (reset) {
        setCustomGroups(groups);
        setCustomGroupsSkip(CUSTOM_GROUPS_PAGE_SIZE);
      } else {
        // Append new groups, avoiding duplicates
        setCustomGroups((prev) => {
          const existingIds = new Set(prev.map(g => g.id));
          const uniqueNewGroups = groups.filter(g => !existingIds.has(g.id));
          return [...prev, ...uniqueNewGroups];
        });
        setCustomGroupsSkip((prev) => prev + CUSTOM_GROUPS_PAGE_SIZE);
      }

      setCustomGroupsHasMore(groups.length === CUSTOM_GROUPS_PAGE_SIZE);
      setCustomGroupsFetched(true);
    } catch {
      setCustomGroupsError('Failed to load custom groups');
    } finally {
      setCustomGroupsLoading(false);
      setCustomGroupsLoadingMore(false);
    }
  }, [apiClient, selectedTenant, customGroupsFetched, customGroupsSkip, debouncedCustomGroupsSearch]);

  // Handler for loading more custom groups (infinite scroll)
  const handleLoadMoreCustomGroups = useCallback(() => {
    if (!customGroupsLoadingMore && customGroupsHasMore) {
      fetchCustomGroups(false);
    }
  }, [fetchCustomGroups, customGroupsLoadingMore, customGroupsHasMore]);

  // Intersection observer for infinite scroll (custom groups)
  useEffect(() => {
    if (!customGroupsLoadMoreRef.current || !handleLoadMoreCustomGroups || !customGroupsHasMore || customGroupsLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && customGroupsHasMore && !customGroupsLoadingMore) {
          handleLoadMoreCustomGroups();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(customGroupsLoadMoreRef.current);

    return () => observer.disconnect();
  }, [customGroupsHasMore, customGroupsLoadingMore, handleLoadMoreCustomGroups]);

  // ===== Fetch Credentials =====
  const fetchCredentials = useCallback(async (reset = false) => {
    if (!apiClient || !selectedTenant) return;

    const isInitialFetch = reset || !credentialsFetched;
    if (isInitialFetch) {
      setCredentialsLoading(true);
    } else {
      setCredentialsLoadingMore(true);
    }
    setCredentialsError(null);

    const skip = reset ? 0 : credentialsSkip;

    try {
      const result = await apiClient.listCredentials(selectedTenant.id, {
        skip,
        limit: CREDENTIALS_PAGE_SIZE,
        name_filter: debouncedCredentialsSearch || undefined,
        order_by: 'name',
        order_direction: 'asc',
      }) as CredentialResponse[];

      if (reset) {
        setCredentials(result);
        setCredentialsSkip(CREDENTIALS_PAGE_SIZE);
      } else {
        // Append new credentials, avoiding duplicates
        setCredentials((prev) => {
          const existingIds = new Set(prev.map(c => c.id));
          const uniqueNewCredentials = result.filter(c => !existingIds.has(c.id));
          return [...prev, ...uniqueNewCredentials];
        });
        setCredentialsSkip((prev) => prev + CREDENTIALS_PAGE_SIZE);
      }

      setCredentialsHasMore(result.length === CREDENTIALS_PAGE_SIZE);
      setCredentialsFetched(true);
    } catch {
      setCredentialsError('Failed to load credentials');
    } finally {
      setCredentialsLoading(false);
      setCredentialsLoadingMore(false);
    }
  }, [apiClient, selectedTenant, credentialsFetched, credentialsSkip, debouncedCredentialsSearch]);

  // Handler for loading more credentials (infinite scroll)
  const handleLoadMoreCredentials = useCallback(() => {
    if (!credentialsLoadingMore && credentialsHasMore) {
      fetchCredentials(false);
    }
  }, [fetchCredentials, credentialsLoadingMore, credentialsHasMore]);

  // Intersection observer for infinite scroll (credentials)
  useEffect(() => {
    if (!credentialsLoadMoreRef.current || !handleLoadMoreCredentials || !credentialsHasMore || credentialsLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && credentialsHasMore && !credentialsLoadingMore) {
          handleLoadMoreCredentials();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(credentialsLoadMoreRef.current);

    return () => observer.disconnect();
  }, [credentialsHasMore, credentialsLoadingMore, handleLoadMoreCredentials]);

  // ===== Fetch Tools =====
  const fetchTools = useCallback(async (reset = false) => {
    if (!apiClient || !selectedTenant) return;

    const isInitialFetch = reset || !toolsFetched;
    if (isInitialFetch) {
      setToolsLoading(true);
    } else {
      setToolsLoadingMore(true);
    }
    setToolsError(null);

    const skip = reset ? 0 : toolsSkip;

    try {
      const result = await apiClient.listTools(selectedTenant.id, {
        skip,
        limit: TOOLS_PAGE_SIZE,
        name_filter: debouncedToolsSearch || undefined,
        order_by: 'name',
        order_direction: 'asc',
      }) as ToolResponse[];

      if (reset) {
        setTools(result);
        setToolsSkip(TOOLS_PAGE_SIZE);
      } else {
        // Append new tools, avoiding duplicates
        setTools((prev) => {
          const existingIds = new Set(prev.map(t => t.id));
          const uniqueNewTools = result.filter(t => !existingIds.has(t.id));
          return [...prev, ...uniqueNewTools];
        });
        setToolsSkip((prev) => prev + TOOLS_PAGE_SIZE);
      }

      setToolsHasMore(result.length === TOOLS_PAGE_SIZE);
      setToolsFetched(true);
    } catch {
      setToolsError('Failed to load tools');
    } finally {
      setToolsLoading(false);
      setToolsLoadingMore(false);
    }
  }, [apiClient, selectedTenant, toolsFetched, toolsSkip, debouncedToolsSearch]);

  // Handler for loading more tools (infinite scroll)
  const handleLoadMoreTools = useCallback(() => {
    if (!toolsLoadingMore && toolsHasMore) {
      fetchTools(false);
    }
  }, [fetchTools, toolsLoadingMore, toolsHasMore]);

  // Intersection observer for infinite scroll (tools)
  useEffect(() => {
    if (!toolsLoadMoreRef.current || !handleLoadMoreTools || !toolsHasMore || toolsLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && toolsHasMore && !toolsLoadingMore) {
          handleLoadMoreTools();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(toolsLoadMoreRef.current);

    return () => observer.disconnect();
  }, [toolsHasMore, toolsLoadingMore, handleLoadMoreTools]);

  // ===== Load data based on active tab =====
  useEffect(() => {
    if (activeTab === 'iam' && !principalsFetched) {
      fetchPrincipals(true);
    }
    if (activeTab === 'custom-groups' && !customGroupsFetched) {
      fetchCustomGroups();
    }
    if (activeTab === 'tools' && !toolsFetched) {
      fetchTools(true);
    }
    if (activeTab === 'credentials' && !credentialsFetched) {
      fetchCredentials(true);
    }
  }, [activeTab, principalsFetched, customGroupsFetched, toolsFetched, credentialsFetched, fetchPrincipals, fetchCustomGroups, fetchTools, fetchCredentials]);

  // Re-fetch principals when search or filters change
  useEffect(() => {
    if (activeTab === 'iam' && principalsFetched) {
      fetchPrincipals(true);
    }
  }, [principalsSearch, principalsRoleFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch custom groups when search changes
  useEffect(() => {
    if (activeTab === 'custom-groups' && customGroupsFetched) {
      fetchCustomGroups(true);
    }
  }, [debouncedCustomGroupsSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch credentials when search changes
  useEffect(() => {
    if (activeTab === 'credentials' && credentialsFetched) {
      fetchCredentials(true);
    }
  }, [debouncedCredentialsSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch tools when search changes
  useEffect(() => {
    if (activeTab === 'tools' && toolsFetched) {
      fetchTools(true);
    }
  }, [debouncedToolsSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  // ===== Tenant Settings Handlers =====
  const handleSaveTenant = tenantForm.onSubmit(async (values) => {
    if (!apiClient || !selectedTenant) return;

    setIsSavingTenant(true);
    try {
      await apiClient.updateTenant(selectedTenant.id, {
        name: values.name.trim(),
        description: values.description.trim() || undefined,
      });
      await refreshIdentity();
      tenantForm.resetDirty();
    } catch {
      // Error handled by API client
    } finally {
      setIsSavingTenant(false);
    }
  });

  const handleDeleteTenant = async () => {
    if (!apiClient || !selectedTenant) return;

    setIsDeletingTenant(true);
    try {
      await apiClient.deleteTenant(selectedTenant.id);
      await refreshIdentity();
      setDeleteDialogStep(0);
      // Navigation will happen automatically when tenant is gone
    } catch {
      // Error handled by API client
    } finally {
      setIsDeletingTenant(false);
    }
  };

  const handleFirstDeleteConfirm = () => {
    setDeleteDialogStep(2); // Move to second confirmation
  };

  // ===== Principal Handlers =====
  const handleManageAccess = useCallback((principal: TenantPrincipalPermission) => {
    setEditPrincipal(principal);
  }, []);

  const handleEditPrincipalRoles = useCallback(
    async (roles: string[]) => {
      if (!apiClient || !selectedTenant || !editPrincipal) return;

      try {
        // Get current roles and new roles
        const currentRoles = new Set(editPrincipal.roles);
        const newRoles = new Set(roles as TenantPermissionEnum[]);

        // Remove roles that are no longer selected
        for (const role of currentRoles) {
          if (!newRoles.has(role)) {
            await apiClient.deleteTenantPrincipal(selectedTenant.id, {
              principal_id: editPrincipal.principalId,
              principal_type: editPrincipal.principalType,
              role: role,
            });
          }
        }

        // Add roles that are newly selected
        for (const role of newRoles) {
          if (!currentRoles.has(role)) {
            await apiClient.setTenantPrincipal(selectedTenant.id, {
              principal_id: editPrincipal.principalId,
              principal_type: editPrincipal.principalType,
              role: role,
            });
          }
        }

        setEditPrincipal(null);
        // Reset and refetch from the beginning
        await fetchPrincipals(true);
      } catch {
        // Error handled by API client
      }
    },
    [apiClient, selectedTenant, editPrincipal, fetchPrincipals]
  );

  const handleDeletePrincipal = useCallback(
    async (principalId: string, principalType: PrincipalTypeEnum) => {
      if (!apiClient || !selectedTenant) return;

      // Delete all roles for this principal
      const principal = principals.find(p => p.principalId === principalId);
      if (!principal) return;

      try {
        for (const role of principal.roles) {
          await apiClient.deleteTenantPrincipal(selectedTenant.id, {
            principal_id: principalId,
            principal_type: principalType,
            role: role,
          });
        }
        // Reset and refetch from the beginning
        await fetchPrincipals(true);
      } catch {
        // Error handled by API client
      }
    },
    [apiClient, selectedTenant, principals, fetchPrincipals]
  );

  const handleAddPrincipals = useCallback(
    async (selectedPrincipals: SelectedPrincipal[], roles: string[]) => {
      if (!apiClient || !selectedTenant) return;

      try {
        for (const principal of selectedPrincipals) {
          // Add each selected role for each principal
          for (const role of roles) {
            await apiClient.setTenantPrincipal(selectedTenant.id, {
              principal_id: principal.id,
              principal_type: principal.type,
              role: role as TenantPermissionEnum,
            });
          }
        }
        setAddPrincipalDialogOpen(false);
        // Reset and refetch from the beginning
        await fetchPrincipals(true);
      } catch {
        // Error handled by API client
      }
    },
    [apiClient, selectedTenant, fetchPrincipals]
  );

  const handleStatusChange = useCallback(
    async (principalId: string, principalType: PrincipalTypeEnum, isActive: boolean) => {
      if (!apiClient || !selectedTenant) return;

      try {
        await apiClient.updatePrincipalStatus(selectedTenant.id, principalId, principalType, isActive);
        // Update local state optimistically
        setPrincipals((prev) =>
          prev.map((p) =>
            p.principalId === principalId && p.principalType === principalType
              ? { ...p, isActive }
              : p
          )
        );
      } catch {
        // Error handled by API client - revert optimistic update by refetching
        await fetchPrincipals(true);
      }
    },
    [apiClient, selectedTenant, fetchPrincipals]
  );

  // ===== Custom Group Handlers =====
  const handleDeleteGroup = async () => {
    if (!apiClient || !selectedTenant || !deleteGroupDialog.id) return;

    setIsDeletingGroup(true);
    try {
      await apiClient.deleteCustomGroup(selectedTenant.id, deleteGroupDialog.id);
      setDeleteGroupDialog({ open: false, id: '', name: '' });
      await fetchCustomGroups();
    } catch {
      // Error handled by API client
    } finally {
      setIsDeletingGroup(false);
    }
  };

  const handleOpenEditGroup = (groupId: string, tab: 'members' | 'details' = 'members') => {
    setEditGroupInitialTab(tab);
    setEditGroupId(groupId);
  };

  const handleCloseEditGroup = () => {
    setEditGroupId(null);
    setEditGroupInitialTab('details');
  };

  // ===== Credential Handlers =====
  const handleDeleteCredential = async () => {
    if (!apiClient || !selectedTenant || !deleteCredentialDialog.id) return;

    setIsDeletingCredential(true);
    try {
      await apiClient.deleteCredential(selectedTenant.id, deleteCredentialDialog.id);
      setDeleteCredentialDialog({ open: false, id: '', name: '' });
      await fetchCredentials(true);
    } catch {
      // Error handled by API client
    } finally {
      setIsDeletingCredential(false);
    }
  };

  const handleOpenEditCredential = (credentialId: string, tab: EditDialogTab = 'details') => {
    setEditCredentialTab(tab);
    setEditCredentialId(credentialId);
  };

  const handleCloseEditCredential = () => {
    setEditCredentialId(null);
    setEditCredentialTab('details');
  };

  const handleCredentialEditSuccess = () => {
    fetchCredentials(true);
  };

  // ===== Tool Handlers =====
  const handleDeleteTool = async () => {
    if (!apiClient || !selectedTenant || !deleteToolDialog.id) return;

    setIsDeletingTool(true);
    try {
      await apiClient.deleteTool(selectedTenant.id, deleteToolDialog.id);
      setDeleteToolDialog({ open: false, id: '', name: '' });
      await fetchTools(true);
    } catch {
      // Error handled by API client
    } finally {
      setIsDeletingTool(false);
    }
  };

  const handleOpenEditTool = (toolId: string, tab: EditDialogTab = 'details') => {
    setEditToolTab(tab);
    setEditToolId(toolId);
  };

  const handleCloseEditTool = () => {
    setEditToolId(null);
    setEditToolTab('details');
  };

  const handleToolEditSuccess = () => {
    fetchTools(true);
  };

  // Get existing principal IDs for AddPrincipalDialog
  const existingPrincipalIds = useMemo(
    () => principals.map((p) => p.principalId),
    [principals]
  );

  // Convert TENANT_ROLE_OPTIONS to RoleOption format for AddPrincipalDialog
  const tenantRoleOptions: RoleOption[] = useMemo(
    () => TENANT_ROLE_OPTIONS.map((r) => ({
      value: r.value,
      label: r.label,
      description: r.description,
    })),
    []
  );

  if (!selectedTenant) {
    return (
      <MainLayout>
        <Center py="xl">
          <Text>No tenant selected</Text>
        </Center>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageContainer>
        <Stack gap="lg">
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            classNames={{
              root: classes.tabs,
              list: classes.tabsList,
              tab: classes.tab,
              panel: classes.tabPanel,
            }}
          >
            <Tabs.List>
              <Tabs.Tab value="settings" leftSection={<IconSettings size={20} />}>
                Tenant Settings
              </Tabs.Tab>
              <Tabs.Tab value="iam" leftSection={<IconUsers size={20} />}>
                Manage Access
              </Tabs.Tab>
              <Tabs.Tab value="custom-groups" leftSection={<IconUsersGroup size={20} />}>
                Custom Groups
              </Tabs.Tab>
              <Tabs.Tab value="tools" leftSection={<IconTool size={20} />}>
                ReACT Agent Tools
              </Tabs.Tab>
              <Tabs.Tab value="credentials" leftSection={<IconKey size={20} />}>
                Credentials
              </Tabs.Tab>
              <Tabs.Tab value="billing-and-licence" leftSection={<IconCreditCard size={20} />}>
                Billing & Licence
              </Tabs.Tab>
            </Tabs.List>

            {/* Tenant Settings Tab */}
            <Tabs.Panel value="settings">
              <Stack gap="lg">
                <Paper p="lg" withBorder>
                  <form onSubmit={handleSaveTenant}>
                    <Stack gap="md">
                      <Title order={4}>Tenant Information</Title>
                      <TextInput
                        label="Name"
                        placeholder="Enter tenant name"
                        required
                        {...tenantForm.getInputProps('name')}
                      />
                      <Textarea
                        label="Description"
                        placeholder="Enter tenant description (optional)"
                        minRows={3}
                        {...tenantForm.getInputProps('description')}
                      />
                      <Group justify="flex-end">
                        <Button
                          type="submit"
                          loading={isSavingTenant}
                          disabled={!tenantForm.isDirty()}
                        >
                          Save Changes
                        </Button>
                      </Group>
                    </Stack>
                  </form>
                </Paper>

                <Paper p="lg" withBorder className={classes.dangerZone}>
                  <Stack gap="md">
                    <Title order={4} c="red">
                      Danger Zone
                    </Title>
                    <Text size="sm" c="dimmed">
                      Deleting a tenant will permanently remove all data including applications,
                      credentials, conversations, and custom groups. This action cannot be undone.
                    </Text>
                    <Button
                      color="red"
                      variant="outline"
                      leftSection={<IconTrash size={16} />}
                      onClick={() => setDeleteDialogStep(1)}
                    >
                      Delete Tenant
                    </Button>
                  </Stack>
                </Paper>
              </Stack>
            </Tabs.Panel>

            {/* Access Management Tab */}
            <Tabs.Panel value="iam">
              <Stack gap="md">
                <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                  <Text size="sm">
                    Manage who can access this tenant and what they can do. Each principal can have
                    multiple roles that define their permissions across different resources.
                  </Text>
                </Alert>

                <ManageTenantAccessTable
                  principals={principals}
                  isLoading={principalsLoading}
                  isLoadingMore={principalsLoadingMore}
                  hasFetched={principalsFetched}
                  hasMore={principalsHasMore}
                  error={principalsError}
                  onManageAccess={handleManageAccess}
                  onDeletePrincipal={handleDeletePrincipal}
                  onAddPrincipal={() => setAddPrincipalDialogOpen(true)}
                  onStatusChange={handleStatusChange}
                  onSearchChange={handlePrincipalsSearchChange}
                  onRoleFilterChange={handlePrincipalsRoleFilterChange}
                  onLoadMore={handleLoadMorePrincipals}
                  searchValue={principalsSearch}
                  roleFilterValue={principalsRoleFilter}
                />
              </Stack>
            </Tabs.Panel>

            {/* Custom Groups Tab */}
            <Tabs.Panel value="custom-groups">
              <Stack gap="md">
                <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                  <Text size="sm">
                    Custom groups allow you to organize users and identity groups for easier
                    permission management across your tenant resources. Click on a group to manage its members.
                  </Text>
                </Alert>

                {/* Toolbar */}
                <Group justify="space-between">
                  <TextInput
                    placeholder="Search groups..."
                    leftSection={<IconSearch size={16} />}
                    value={customGroupsSearch}
                    onChange={(e) => setCustomGroupsSearch(e.currentTarget.value)}
                    style={{ flex: 1, maxWidth: 350 }}
                  />
                  <Button
                    leftSection={<IconUsersGroup size={16} />}
                    onClick={() => setCreateGroupDialogOpen(true)}
                  >
                    Create Group
                  </Button>
                </Group>

                {/* Table */}
                <ScrollArea.Autosize className={classes.customGroupsTableScrollArea}>
                    <Table striped highlightOnHover>
                      <Table.Thead className={classes.customGroupsTableHeader}>
                        <Table.Tr>
                          <Table.Th>Name</Table.Th>
                          <Table.Th>Description</Table.Th>
                          <Table.Th style={{ width: 60 }}></Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {customGroupsLoading && !customGroupsFetched ? (
                          <Table.Tr>
                            <Table.Td colSpan={3}>
                              <Center py="xl">
                                <Loader size="lg" />
                              </Center>
                            </Table.Td>
                          </Table.Tr>
                        ) : customGroupsError ? (
                          <Table.Tr>
                            <Table.Td colSpan={3}>
                              <Alert color="red">{customGroupsError}</Alert>
                            </Table.Td>
                          </Table.Tr>
                        ) : customGroups.length === 0 ? (
                          <Table.Tr>
                            <Table.Td colSpan={3}>
                              <Center py="xl">
                                <Text c="dimmed">
                                  {customGroupsSearch
                                    ? 'No custom groups match your search.'
                                    : 'No custom groups yet. Create one to get started.'}
                                </Text>
                              </Center>
                            </Table.Td>
                          </Table.Tr>
                        ) : (
                          customGroups.map((group) => (
                            <Table.Tr
                              key={group.id}
                              className={classes.customGroupRow}
                              onClick={() => handleOpenEditGroup(group.id, 'members')}
                            >
                              <Table.Td>
                                <Group gap="sm">
                                  <div className={classes.groupIcon}>
                                    <IconUsersGroup size={16} />
                                  </div>
                                  <Text fw={500}>{group.name}</Text>
                                </Group>
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm" c="dimmed" lineClamp={1}>
                                  {group.description || '-'}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <Group gap={0} justify="flex-end">
                                  <Menu position="bottom-end" withinPortal shadow="md">
                                    <Menu.Target>
                                      <ActionIcon
                                        variant="subtle"
                                        color="gray"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <IconDots size={16} />
                                      </ActionIcon>
                                    </Menu.Target>
                                    <Menu.Dropdown>
                                      <Menu.Item
                                        leftSection={<IconUserPlus size={14} />}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenEditGroup(group.id, 'members');
                                        }}
                                      >
                                        Manage Members
                                      </Menu.Item>
                                      <Menu.Item
                                        leftSection={<IconEdit size={14} />}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenEditGroup(group.id, 'details');
                                        }}
                                      >
                                        Edit Details
                                      </Menu.Item>
                                      <Menu.Divider />
                                      <Menu.Item
                                        color="red"
                                        leftSection={<IconTrash size={14} />}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDeleteGroupDialog({
                                            open: true,
                                            id: group.id,
                                            name: group.name,
                                          });
                                        }}
                                      >
                                        Delete
                                      </Menu.Item>
                                    </Menu.Dropdown>
                                  </Menu>
                                </Group>
                              </Table.Td>
                            </Table.Tr>
                          ))
                        )}
                      </Table.Tbody>
                    </Table>
                    
                    {/* Infinite scroll trigger element */}
                    {customGroupsHasMore && (
                      <div ref={customGroupsLoadMoreRef} className={classes.loadMoreTrigger}>
                        {customGroupsLoadingMore && (
                          <Center py="sm">
                            <Loader size="sm" />
                          </Center>
                        )}
                      </div>
                    )}
                </ScrollArea.Autosize>
              </Stack>
            </Tabs.Panel>

            {/* Tools Tab */}
            <Tabs.Panel value="tools">
              <Stack gap="md">
                <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                  <Text size="sm">
                    Manage tools for ReACT agents. Tools can be MCP servers or OpenAPI definitions 
                    that agents use to interact with external services.
                  </Text>
                </Alert>

                {/* Toolbar */}
                <Group justify="space-between">
                  <TextInput
                    placeholder="Search tools..."
                    leftSection={<IconSearch size={16} />}
                    value={toolsSearch}
                    onChange={(e) => setToolsSearch(e.currentTarget.value)}
                    style={{ flex: 1, maxWidth: 350 }}
                  />
                  <Button
                    leftSection={<IconTool size={16} />}
                    onClick={() => setCreateToolDialogOpen(true)}
                  >
                    Create Tool
                  </Button>
                </Group>

                {/* Table */}
                <ScrollArea.Autosize className={classes.customGroupsTableScrollArea}>
                    <Table striped highlightOnHover>
                      <Table.Thead className={classes.customGroupsTableHeader}>
                        <Table.Tr>
                          <Table.Th>Name</Table.Th>
                          <Table.Th>Type</Table.Th>
                          <Table.Th>Description</Table.Th>
                          <Table.Th style={{ width: 60 }}></Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {toolsLoading && !toolsFetched ? (
                          <Table.Tr>
                            <Table.Td colSpan={4}>
                              <Center py="xl">
                                <Loader size="lg" />
                              </Center>
                            </Table.Td>
                          </Table.Tr>
                        ) : toolsError ? (
                          <Table.Tr>
                            <Table.Td colSpan={4}>
                              <Alert color="red">{toolsError}</Alert>
                            </Table.Td>
                          </Table.Tr>
                        ) : tools.length === 0 ? (
                          <Table.Tr>
                            <Table.Td colSpan={4}>
                              <Center py="xl">
                                <Text c="dimmed">
                                  {toolsSearch
                                    ? 'No tools match your search.'
                                    : 'No tools yet. Create one to get started.'}
                                </Text>
                              </Center>
                            </Table.Td>
                          </Table.Tr>
                        ) : (
                          tools.map((tool) => (
                            <Table.Tr
                              key={tool.id}
                              className={classes.customGroupRow}
                              onClick={() => handleOpenEditTool(tool.id, 'details')}
                            >
                              <Table.Td>
                                <Group gap="sm">
                                  <div className={classes.groupIcon}>
                                    <IconTool size={16} />
                                  </div>
                                  <Text fw={500}>{tool.name}</Text>
                                </Group>
                              </Table.Td>
                              <Table.Td>
                                <Badge size="sm" variant="light" color="grape">
                                  {tool.type === 'MCP_SERVER' ? 'MCP Server' : 'OpenAPI Definition'}
                                </Badge>
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm" c="dimmed" lineClamp={1}>
                                  {tool.description || '-'}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <Group gap={0} justify="flex-end">
                                  <Menu position="bottom-end" withinPortal shadow="md">
                                    <Menu.Target>
                                      <ActionIcon
                                        variant="subtle"
                                        color="gray"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <IconDots size={16} />
                                      </ActionIcon>
                                    </Menu.Target>
                                    <Menu.Dropdown>
                                      <Menu.Item
                                        leftSection={<IconShieldLock size={14} />}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenEditTool(tool.id, 'iam');
                                        }}
                                      >
                                        Manage Access
                                      </Menu.Item>
                                      <Menu.Item
                                        leftSection={<IconEdit size={14} />}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenEditTool(tool.id, 'details');
                                        }}
                                      >
                                        Edit Details
                                      </Menu.Item>
                                      <Menu.Divider />
                                      <Menu.Item
                                        color="red"
                                        leftSection={<IconTrash size={14} />}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDeleteToolDialog({
                                            open: true,
                                            id: tool.id,
                                            name: tool.name,
                                          });
                                        }}
                                      >
                                        Delete
                                      </Menu.Item>
                                    </Menu.Dropdown>
                                  </Menu>
                                </Group>
                              </Table.Td>
                            </Table.Tr>
                          ))
                        )}
                      </Table.Tbody>
                    </Table>
                    
                    {/* Infinite scroll trigger element */}
                    {toolsHasMore && (
                      <div ref={toolsLoadMoreRef} className={classes.loadMoreTrigger}>
                        {toolsLoadingMore && (
                          <Center py="sm">
                            <Loader size="sm" />
                          </Center>
                        )}
                      </div>
                    )}
                </ScrollArea.Autosize>
              </Stack>
            </Tabs.Panel>

            {/* Credentials Tab */}
            <Tabs.Panel value="credentials">
              <Stack gap="md">
                <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                  <Text size="sm">
                    Manage credentials for connecting to external services and APIs. 
                    Click on a credential to view details or manage access permissions.
                  </Text>
                </Alert>

                {/* Toolbar */}
                <Group justify="space-between">
                  <TextInput
                    placeholder="Search credentials..."
                    leftSection={<IconSearch size={16} />}
                    value={credentialsSearch}
                    onChange={(e) => setCredentialsSearch(e.currentTarget.value)}
                    style={{ flex: 1, maxWidth: 350 }}
                  />
                  <Button
                    leftSection={<IconKey size={16} />}
                    onClick={() => setCreateCredentialDialogOpen(true)}
                  >
                    Create Credential
                  </Button>
                </Group>

                {/* Table */}
                <ScrollArea.Autosize className={classes.customGroupsTableScrollArea}>
                    <Table striped highlightOnHover>
                      <Table.Thead className={classes.customGroupsTableHeader}>
                        <Table.Tr>
                          <Table.Th>Name</Table.Th>
                          <Table.Th>Type</Table.Th>
                          <Table.Th>Description</Table.Th>
                          <Table.Th style={{ width: 60 }}></Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {credentialsLoading && !credentialsFetched ? (
                          <Table.Tr>
                            <Table.Td colSpan={4}>
                              <Center py="xl">
                                <Loader size="lg" />
                              </Center>
                            </Table.Td>
                          </Table.Tr>
                        ) : credentialsError ? (
                          <Table.Tr>
                            <Table.Td colSpan={4}>
                              <Alert color="red">{credentialsError}</Alert>
                            </Table.Td>
                          </Table.Tr>
                        ) : credentials.length === 0 ? (
                          <Table.Tr>
                            <Table.Td colSpan={4}>
                              <Center py="xl">
                                <Text c="dimmed">
                                  {credentialsSearch
                                    ? 'No credentials match your search.'
                                    : 'No credentials yet. Create one to get started.'}
                                </Text>
                              </Center>
                            </Table.Td>
                          </Table.Tr>
                        ) : (
                          credentials.map((credential) => (
                            <Table.Tr
                              key={credential.id}
                              className={classes.customGroupRow}
                              onClick={() => handleOpenEditCredential(credential.id, 'details')}
                            >
                              <Table.Td>
                                <Group gap="sm">
                                  <div className={classes.groupIcon}>
                                    <IconKey size={16} />
                                  </div>
                                  <Text fw={500}>{credential.name}</Text>
                                </Group>
                              </Table.Td>
                              <Table.Td>
                                <Badge size="sm" variant="light" color="gray">
                                  {credential.type}
                                </Badge>
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm" c="dimmed" lineClamp={1}>
                                  {credential.description || '-'}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <Group gap={0} justify="flex-end">
                                  <Menu position="bottom-end" withinPortal shadow="md">
                                    <Menu.Target>
                                      <ActionIcon
                                        variant="subtle"
                                        color="gray"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <IconDots size={16} />
                                      </ActionIcon>
                                    </Menu.Target>
                                    <Menu.Dropdown>
                                      <Menu.Item
                                        leftSection={<IconShieldLock size={14} />}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenEditCredential(credential.id, 'iam');
                                        }}
                                      >
                                        Manage Access
                                      </Menu.Item>
                                      <Menu.Item
                                        leftSection={<IconEdit size={14} />}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenEditCredential(credential.id, 'details');
                                        }}
                                      >
                                        Edit Details
                                      </Menu.Item>
                                      <Menu.Divider />
                                      <Menu.Item
                                        color="red"
                                        leftSection={<IconTrash size={14} />}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDeleteCredentialDialog({
                                            open: true,
                                            id: credential.id,
                                            name: credential.name,
                                          });
                                        }}
                                      >
                                        Delete
                                      </Menu.Item>
                                    </Menu.Dropdown>
                                  </Menu>
                                </Group>
                              </Table.Td>
                            </Table.Tr>
                          ))
                        )}
                      </Table.Tbody>
                    </Table>
                    
                    {/* Infinite scroll trigger element */}
                    {credentialsHasMore && (
                      <div ref={credentialsLoadMoreRef} className={classes.loadMoreTrigger}>
                        {credentialsLoadingMore && (
                          <Center py="sm">
                            <Loader size="sm" />
                          </Center>
                        )}
                      </div>
                    )}
                </ScrollArea.Autosize>
              </Stack>
            </Tabs.Panel>

            {/* Billing Tab */}
            <Tabs.Panel value="billing-and-licence">
              <Stack gap="lg">
                <Paper p="lg" withBorder>
                  <Stack gap="md">
                    <Group>
                      <Text fw={500}>Current Licence:</Text>
                      <Badge size="lg" color="blue" variant="light">
                        Standard
                      </Badge>
                    </Group>
                    <Text size="sm" c="dimmed">
                      Your current plan includes all standard features with unlimited users.
                    </Text>
                  </Stack>
                </Paper>

                <Paper p="lg" withBorder>
                  <Center py="xl">
                    <Stack align="center" gap="sm">
                      <IconCreditCard size={48} color="var(--mantine-color-gray-5)" />
                      <Title order={4} c="dimmed">
                        Billing & Upgrades
                      </Title>
                      <Text c="dimmed">Coming soon</Text>
                    </Stack>
                  </Center>
                </Paper>
              </Stack>
            </Tabs.Panel>
          </Tabs>
        </Stack>
      </PageContainer>

      {/* Delete Tenant - First Confirmation */}
      <ConfirmDeleteDialog
        opened={deleteDialogStep === 1}
        onClose={() => setDeleteDialogStep(0)}
        onConfirm={handleFirstDeleteConfirm}
        itemName={selectedTenant.name}
        itemType="Tenant"
        title="Delete Tenant (Step 1 of 2)"
        message="Are you sure you want to delete this tenant? This will permanently remove all data including applications, credentials, conversations, and custom groups."
      />

      {/* Delete Tenant - Second Confirmation */}
      <ConfirmDeleteDialog
        opened={deleteDialogStep === 2}
        onClose={() => setDeleteDialogStep(0)}
        onConfirm={handleDeleteTenant}
        itemName={selectedTenant.name}
        itemType="Tenant"
        title="Final Confirmation (Step 2 of 2)"
        message="This action is IRREVERSIBLE. All tenant data will be permanently deleted. Are you absolutely sure?"
        isLoading={isDeletingTenant}
        confirmButtonText="WIRKLICH LÖSCHEN"
        reverseButtons
      />

      {/* Add Principal Dialog */}
      <AddPrincipalDialog
        opened={addPrincipalDialogOpen}
        onClose={() => setAddPrincipalDialogOpen(false)}
        onSubmit={handleAddPrincipals}
        existingPrincipalIds={existingPrincipalIds}
        entityName="tenant"
        roleOptions={tenantRoleOptions}
        multiSelect={true}
        defaultRoles={['READER']}
      />

      {/* Edit Principal Roles Dialog */}
      <EditRolesDialog
        opened={!!editPrincipal}
        onClose={() => setEditPrincipal(null)}
        onSubmit={handleEditPrincipalRoles}
        principalName={editPrincipal?.displayName || editPrincipal?.principalId || ''}
        principalType={editPrincipal?.principalType || 'IDENTITY_USER'}
        principalEmail={editPrincipal?.mail || editPrincipal?.principalName}
        roleOptions={tenantRoleOptions}
        currentRoles={editPrincipal?.roles || []}
      />

      {/* Create Custom Group Dialog */}
      <CreateCustomGroupDialog
        opened={createGroupDialogOpen}
        onClose={() => setCreateGroupDialogOpen(false)}
        onSuccess={() => fetchCustomGroups(true)}
      />

      {/* Edit Custom Group Dialog */}
      <EditCustomGroupDialog
        opened={!!editGroupId}
        onClose={handleCloseEditGroup}
        customGroupId={editGroupId}
        initialTab={editGroupInitialTab}
        onTabChange={setEditGroupInitialTab}
        onSuccess={() => fetchCustomGroups()}
      />

      {/* Delete Custom Group Confirmation */}
      <ConfirmDeleteDialog
        opened={deleteGroupDialog.open}
        onClose={() => setDeleteGroupDialog({ open: false, id: '', name: '' })}
        onConfirm={handleDeleteGroup}
        itemName={deleteGroupDialog.name}
        itemType="Custom Group"
        isLoading={isDeletingGroup}
      />

      {/* Create Credential Dialog */}
      <CreateCredentialDialog
        opened={createCredentialDialogOpen}
        onClose={() => setCreateCredentialDialogOpen(false)}
        onSuccess={() => fetchCredentials(true)}
      />

      {/* Edit Credential Dialog */}
      <EditCredentialDialog
        opened={!!editCredentialId}
        onClose={handleCloseEditCredential}
        credentialId={editCredentialId}
        activeTab={editCredentialTab}
        onTabChange={setEditCredentialTab}
        onSuccess={handleCredentialEditSuccess}
      />

      {/* Delete Credential Confirmation */}
      <ConfirmDeleteDialog
        opened={deleteCredentialDialog.open}
        onClose={() => setDeleteCredentialDialog({ open: false, id: '', name: '' })}
        onConfirm={handleDeleteCredential}
        itemName={deleteCredentialDialog.name}
        itemType="Credential"
        isLoading={isDeletingCredential}
      />

      {/* Create Tool Dialog */}
      <CreateToolDialog
        opened={createToolDialogOpen}
        onClose={() => setCreateToolDialogOpen(false)}
        onSuccess={() => fetchTools(true)}
      />

      {/* Edit Tool Dialog */}
      <EditToolDialog
        opened={!!editToolId}
        onClose={handleCloseEditTool}
        toolId={editToolId}
        activeTab={editToolTab}
        onTabChange={setEditToolTab}
        onSuccess={handleToolEditSuccess}
      />

      {/* Delete Tool Confirmation */}
      <ConfirmDeleteDialog
        opened={deleteToolDialog.open}
        onClose={() => setDeleteToolDialog({ open: false, id: '', name: '' })}
        onConfirm={handleDeleteTool}
        itemName={deleteToolDialog.name}
        itemType="Tool"
        isLoading={isDeletingTool}
      />
    </MainLayout>
  );
};
