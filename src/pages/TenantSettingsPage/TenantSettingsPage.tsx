import type { FC } from 'react';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  Skeleton,
  ActionIcon,
  Menu,
  MultiSelect,
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
  IconBuilding,
  IconBrain,
} from '@tabler/icons-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { ConfirmDeleteDialog, EditRolesDialog, OrganizationSettingsPanel, OrganizationAccessPanel, AccessDeniedBanner } from '../../components/common';
import { ManageTenantAccessTable, TENANT_ROLE_OPTIONS } from '../../components/common/ManageTenantAccessTable';
import type { TenantPrincipalPermission } from '../../components/common/ManageTenantAccessTable';
import { AddPrincipalDialog } from '../../components/common/AddPrincipalDialog';
import type { SelectedPrincipal, RoleOption } from '../../components/common/AddPrincipalDialog';
import {
  CreateCustomGroupDialog,
  EditCustomGroupDialog,
  CreateCredentialDialog,
  EditCredentialDialog,
} from '../../components/dialogs';
import { AIModelDialog } from '../../components/dialogs/AIModelDialog';
import type { EditDialogTab } from '../../components/dialogs';
import { useIdentity } from '../../contexts';
import type {
  PrincipalTypeEnum,
  CustomGroupResponse,
  CredentialResponse,
  AIModelResponse,
} from '../../api/types';
import { TenantPermissionEnum, AIModelProviderEnum, AIModelTypeEnum } from '../../api/types';
import { useDelayedLoading, usePermissions, useDialogParams } from '../../hooks';
import classes from './TenantSettingsPage.module.css';

type TabValue = 'organization' | 'org-iam' | 'settings' | 'iam' | 'custom-groups' | 'credentials' | 'ai-models' | 'billing-and-licence';

const TAB_VALUES: TabValue[] = ['organization', 'org-iam', 'settings', 'iam', 'custom-groups', 'credentials', 'ai-models', 'billing-and-licence'];
const DEFAULT_TAB: TabValue = 'settings';

const PURPOSE_GROUP_COLORS: Record<string, string> = {
  DIRECT_CHAT: 'cyan',
  CONVERSATION_TITLE_GENERATION: 'blue',
  CONVERSATION_SUMMARIZATION: 'teal',
  DESCRIPTION_GENERATION: 'orange',
  GENERAL: 'gray',
};

const purposeGroupColor = (group: string): string =>
  PURPOSE_GROUP_COLORS[group] || 'gray';

const isValidTab = (value: string | null): value is TabValue => {
  return value !== null && TAB_VALUES.includes(value as TabValue);
};

interface TenantSettingsFormValues {
  name: string;
  description: string;
}

interface TenantSettingsPageProps {
  layout?: 'main' | 'admin';
}

export const TenantSettingsPage: FC<TenantSettingsPageProps> = ({ layout = 'main' }) => {
  const Shell = layout === 'admin' ? AdminLayout : MainLayout;
  const { t } = useTranslation('common');
  const { apiClient, selectedTenant, refreshIdentity } = useIdentity();
  const { isGlobalAdmin, canCreate, hasOrgBypass } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial tab from URL, default to 'settings'
  const tabFromUrl = searchParams.get('tab');
  const initialTab = isValidTab(tabFromUrl) ? tabFromUrl : DEFAULT_TAB;
  const [activeTab, setActiveTab] = useState<TabValue>(initialTab);

  useEffect(() => {
    if (isValidTab(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl, activeTab]);

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

  const { dialog, selectedId, dialogTab, openDialog, closeDialog, setDialogTab } = useDialogParams();

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

  const editPrincipal = dialog === 'edit-member' && selectedId
    ? principals.find(p => p.principalId === selectedId) || null
    : null;

  const PRINCIPALS_PAGE_SIZE = 50;

  // ===== Custom Groups State =====
  const [customGroups, setCustomGroups] = useState<CustomGroupResponse[]>([]);
  const [customGroupsLoading, setCustomGroupsLoading] = useState(false);
  const [customGroupsLoadingMore, setCustomGroupsLoadingMore] = useState(false);
  const [customGroupsError, setCustomGroupsError] = useState<string | null>(null);
  const [customGroupsFetched, setCustomGroupsFetched] = useState(false);
  const [customGroupsHasMore, setCustomGroupsHasMore] = useState(true);
  const [customGroupsSkip, setCustomGroupsSkip] = useState(0);
  const [customGroupsSearch, setCustomGroupsSearch] = useState('');
  const [debouncedCustomGroupsSearch] = useDebouncedValue(customGroupsSearch, 400);
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
  const [credentialsSearch, setCredentialsSearch] = useState('');
  const [debouncedCredentialsSearch] = useDebouncedValue(credentialsSearch, 400);
  const [isDeletingCredential, setIsDeletingCredential] = useState(false);

  const CREDENTIALS_PAGE_SIZE = 50;
  const credentialsLoadMoreRef = useRef<HTMLDivElement>(null);

  // ===== AI Models State =====
  const [aiModels, setAiModels] = useState<AIModelResponse[]>([]);
  const [aiModelsLoading, setAiModelsLoading] = useState(false);
  const [aiModelsLoadingMore, setAiModelsLoadingMore] = useState(false);
  const [aiModelsError, setAiModelsError] = useState<string | null>(null);
  const [aiModelsFetched, setAiModelsFetched] = useState(false);
  const [aiModelsHasMore, setAiModelsHasMore] = useState(true);
  const [aiModelsSkip, setAiModelsSkip] = useState(0);
  const [aiModelsSearch, setAiModelsSearch] = useState('');
  const [debouncedAiModelsSearch] = useDebouncedValue(aiModelsSearch, 400);
  const [aiModelsTypeFilter, setAiModelsTypeFilter] = useState<string[]>([]);
  const [aiModelsProviderFilter, setAiModelsProviderFilter] = useState<string[]>([]);
  const [isDeletingAiModel, setIsDeletingAiModel] = useState(false);

  const AI_MODELS_PAGE_SIZE = 50;
  const aiModelsLoadMoreRef = useRef<HTMLDivElement>(null);

  const showCustomGroupsSkeleton = useDelayedLoading(customGroupsLoading && !customGroupsFetched);
  const showCredentialsSkeleton = useDelayedLoading(credentialsLoading && !credentialsFetched);
  const showAiModelsSkeleton = useDelayedLoading(aiModelsLoading && !aiModelsFetched);

  const AI_MODEL_TYPE_OPTIONS = [
    { value: AIModelTypeEnum.LLM_MODEL, label: 'LLM Model' },
    { value: AIModelTypeEnum.EMBEDDING_MODEL, label: 'Embedding Model' },
  ];

  const AI_MODEL_PROVIDER_OPTIONS = [
    { value: AIModelProviderEnum.AZURE_OPENAI, label: 'Azure OpenAI' },
    { value: AIModelProviderEnum.OPENAI, label: 'OpenAI' },
    { value: AIModelProviderEnum.ANTHROPIC, label: 'Anthropic' },
    { value: AIModelProviderEnum.GOOGLE_GENAI, label: 'Google GenAI' },
    { value: AIModelProviderEnum.OLLAMA, label: 'Ollama' },
    { value: AIModelProviderEnum.MISTRAL, label: 'Mistral' },
    { value: AIModelProviderEnum.GROQ, label: 'Groq' },
  ];

  const getAiModelProviderBadgeColor = (provider: string): string => {
    switch (provider) {
      case AIModelProviderEnum.AZURE_OPENAI:
        return 'blue';
      case AIModelProviderEnum.OPENAI:
        return 'green';
      case AIModelProviderEnum.ANTHROPIC:
        return 'orange';
      case AIModelProviderEnum.GOOGLE_GENAI:
        return 'yellow';
      case AIModelProviderEnum.OLLAMA:
        return 'gray';
      case AIModelProviderEnum.MISTRAL:
        return 'violet';
      case AIModelProviderEnum.GROQ:
        return 'teal';
      default:
        return 'gray';
    }
  };

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
        fields: 'id,name,description',
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
        name: debouncedCredentialsSearch || undefined,
        order_by: 'name',
        order_direction: 'asc',
        fields: 'id,name,type,description',
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

  // ===== Fetch AI Models =====
  const fetchAIModels = useCallback(async (reset = false) => {
    if (!apiClient || !selectedTenant) return;

    const isInitialFetch = reset || !aiModelsFetched;
    if (isInitialFetch) {
      setAiModelsLoading(true);
    } else {
      setAiModelsLoadingMore(true);
    }
    setAiModelsError(null);

    const skip = reset ? 0 : aiModelsSkip;

    try {
      const result = await apiClient.listAIModels(selectedTenant.id, {
        skip,
        limit: AI_MODELS_PAGE_SIZE,
        name: debouncedAiModelsSearch || undefined,
        type: aiModelsTypeFilter.length > 0 ? aiModelsTypeFilter.join(',') : undefined,
        provider: aiModelsProviderFilter.length > 0 ? aiModelsProviderFilter.join(',') : undefined,
        order_by: 'name',
        order_direction: 'asc',
        fields: 'id,name,type,provider,is_active,purpose_groups,description',
      });

      if (reset) {
        setAiModels(result);
        setAiModelsSkip(AI_MODELS_PAGE_SIZE);
      } else {
        setAiModels((prev) => {
          const existingIds = new Set(prev.map(m => m.id));
          const uniqueNew = result.filter(m => !existingIds.has(m.id));
          return [...prev, ...uniqueNew];
        });
        setAiModelsSkip((prev) => prev + AI_MODELS_PAGE_SIZE);
      }

      setAiModelsHasMore(result.length === AI_MODELS_PAGE_SIZE);
      setAiModelsFetched(true);
    } catch {
      setAiModelsError('Failed to load AI models');
    } finally {
      setAiModelsLoading(false);
      setAiModelsLoadingMore(false);
    }
  }, [apiClient, selectedTenant, aiModelsFetched, aiModelsSkip, debouncedAiModelsSearch, aiModelsTypeFilter, aiModelsProviderFilter]);

  const handleLoadMoreAIModels = useCallback(() => {
    if (!aiModelsLoadingMore && aiModelsHasMore) {
      fetchAIModels(false);
    }
  }, [fetchAIModels, aiModelsLoadingMore, aiModelsHasMore]);

  useEffect(() => {
    if (!aiModelsLoadMoreRef.current || !handleLoadMoreAIModels || !aiModelsHasMore || aiModelsLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && aiModelsHasMore && !aiModelsLoadingMore) {
          handleLoadMoreAIModels();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(aiModelsLoadMoreRef.current);

    return () => observer.disconnect();
  }, [aiModelsHasMore, aiModelsLoadingMore, handleLoadMoreAIModels]);

  // ===== Load data based on active tab =====
  useEffect(() => {
    if (activeTab === 'iam' && !principalsFetched) {
      fetchPrincipals(true);
    }
    if (activeTab === 'custom-groups' && !customGroupsFetched) {
      fetchCustomGroups();
    }
    if (activeTab === 'credentials' && !credentialsFetched) {
      fetchCredentials(true);
    }
    if (activeTab === 'ai-models' && !aiModelsFetched) {
      fetchAIModels(true);
    }
  }, [activeTab, principalsFetched, customGroupsFetched, credentialsFetched, aiModelsFetched, fetchPrincipals, fetchCustomGroups, fetchCredentials, fetchAIModels]);

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

  // Re-fetch AI models when search or filters change
  useEffect(() => {
    if (activeTab === 'ai-models' && aiModelsFetched) {
      fetchAIModels(true);
    }
  }, [debouncedAiModelsSearch, aiModelsTypeFilter, aiModelsProviderFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // ===== Tenant Settings Handlers =====
  const handleSaveTenant = tenantForm.onSubmit(async (values) => {
    if (!apiClient || !selectedTenant) return;

    setIsSavingTenant(true);
    try {
      await apiClient.updateTenant(selectedTenant.id, {
        name: values.name.trim(),
        description: values.description.trim() || undefined,
      });
      await refreshIdentity(true);
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
      await refreshIdentity(true);
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
    openDialog('edit-member', { selectedId: principal.principalId });
  }, [openDialog]);

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

        closeDialog();
        // Reset and refetch from the beginning
        await fetchPrincipals(true);
      } catch {
        // Error handled by API client
      }
    },
    [apiClient, selectedTenant, editPrincipal, fetchPrincipals, closeDialog]
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
        closeDialog();
        // Reset and refetch from the beginning
        await fetchPrincipals(true);
      } catch {
        // Error handled by API client
      }
    },
    [apiClient, selectedTenant, fetchPrincipals, closeDialog]
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
    if (!apiClient || !selectedTenant || !selectedId) return;

    setIsDeletingGroup(true);
    try {
      await apiClient.deleteCustomGroup(selectedTenant.id, selectedId);
      closeDialog();
      await fetchCustomGroups();
    } catch {
      // Error handled by API client
    } finally {
      setIsDeletingGroup(false);
    }
  };

  const handleOpenEditGroup = (groupId: string, tab: 'members' | 'details' = 'members') => {
    openDialog('edit-custom-group', { selectedId: groupId, dialogTab: tab });
  };

  const handleCloseEditGroup = () => {
    closeDialog();
  };

  // ===== Credential Handlers =====
  const handleDeleteCredential = async () => {
    if (!apiClient || !selectedTenant || !selectedId) return;

    setIsDeletingCredential(true);
    try {
      await apiClient.deleteCredential(selectedTenant.id, selectedId);
      closeDialog();
      await fetchCredentials(true);
    } catch {
      // Error handled by API client
    } finally {
      setIsDeletingCredential(false);
    }
  };

  const handleOpenEditCredential = (credentialId: string, tab: EditDialogTab = 'details') => {
    openDialog('edit-credential', { selectedId: credentialId, dialogTab: tab });
  };

  const handleCloseEditCredential = () => {
    closeDialog();
  };

  const handleCredentialEditSuccess = () => {
    fetchCredentials(true);
  };

  // ===== AI Model Handlers =====
  const handleDeleteAiModel = async () => {
    if (!apiClient || !selectedTenant || !selectedId) return;

    setIsDeletingAiModel(true);
    try {
      await apiClient.deleteAIModel(selectedTenant.id, selectedId);
      closeDialog();
      await fetchAIModels(true);
    } catch {
      // Error handled by API client
    } finally {
      setIsDeletingAiModel(false);
    }
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
      <Shell>
        <Center py="xl">
          <Text>No tenant selected</Text>
        </Center>
      </Shell>
    );
  }

  return (
    <Shell>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          classNames={{
            root: classes.settingsLayout,
            list: classes.settingsTabList,
            tab: classes.settingsTab,
            panel: classes.settingsContent,
          }}
        >
          {layout !== 'admin' && (
          <Tabs.List>
            <Tabs.Tab value="organization" leftSection={<IconBuilding size={18} />}>
              Organization
            </Tabs.Tab>
            {hasOrgBypass && (
            <Tabs.Tab value="org-iam" leftSection={<IconShieldLock size={18} />}>
              Organisation Access (IAM)
            </Tabs.Tab>
            )}
            <Tabs.Tab value="settings" leftSection={<IconSettings size={18} />}>
              Tenant
            </Tabs.Tab>
            {isGlobalAdmin && (
            <Tabs.Tab value="iam" leftSection={<IconUsers size={18} />}>
              Tenant Access (IAM)
            </Tabs.Tab>
            )}
            <Tabs.Tab value="custom-groups" leftSection={<IconUsersGroup size={18} />}>
              Groups
            </Tabs.Tab>
            <Tabs.Tab value="ai-models" leftSection={<IconBrain size={18} />}>
              AI Models
            </Tabs.Tab>
            <Tabs.Tab value="credentials" leftSection={<IconKey size={18} />}>
              Credentials
            </Tabs.Tab>
            <Tabs.Tab value="billing-and-licence" leftSection={<IconCreditCard size={18} />}>
              Billing
            </Tabs.Tab>
          </Tabs.List>
          )}

            {/* Organization Settings Tab */}
            <Tabs.Panel value="organization">
              <OrganizationSettingsPanel isOrgAdmin={hasOrgBypass} />
            </Tabs.Panel>

            {/* Organisation Access (IAM) Tab */}
            <Tabs.Panel value="org-iam">
              {hasOrgBypass ? (
                <OrganizationAccessPanel isOrgAdmin={hasOrgBypass} />
              ) : (
                <AccessDeniedBanner requiredRoles={['ORGANISATION_GLOBAL_ADMIN', 'ORGANISATION_TENANT_ADMIN']} />
              )}
            </Tabs.Panel>

            {/* Tenant Settings Tab */}
            <Tabs.Panel value="settings">
              <Stack gap="lg">
                {!isGlobalAdmin && (
                  <AccessDeniedBanner message={t('accessDenied.readOnly')} requiredRoles={[TenantPermissionEnum.TENANT_GLOBAL_ADMIN]} compact />
                )}
                <Paper p="lg" withBorder>
                  <form onSubmit={handleSaveTenant}>
                    <Stack gap="md">
                      <Title order={4}>Tenant Information</Title>
                      <TextInput
                        label="Name"
                        placeholder="Enter tenant name"
                        required
                        disabled={!isGlobalAdmin}
                        {...tenantForm.getInputProps('name')}
                      />
                      <Textarea
                        label="Description"
                        placeholder="Enter tenant description (optional)"
                        minRows={3}
                        disabled={!isGlobalAdmin}
                        {...tenantForm.getInputProps('description')}
                      />
                      {isGlobalAdmin && (
                      <Group justify="flex-end">
                        <Button
                          type="submit"
                          loading={isSavingTenant}
                          disabled={!tenantForm.isDirty()}
                        >
                          Save Changes
                        </Button>
                      </Group>
                      )}
                    </Stack>
                  </form>
                </Paper>

                {isGlobalAdmin && (
                <Paper p="lg" withBorder className={classes.dangerZone}>
                  <Stack gap="md">
                    <Title order={4} c="red">
                      Danger Zone
                    </Title>
                    <Text size="sm" c="dimmed">
                      Deleting a tenant will permanently remove all data including chat agents,
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
                )}
              </Stack>
            </Tabs.Panel>

            {/* Access Management Tab */}
            <Tabs.Panel value="iam">
              {isGlobalAdmin ? (
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
                  onAddPrincipal={() => openDialog('add-member')}
                  onStatusChange={handleStatusChange}
                  onSearchChange={handlePrincipalsSearchChange}
                  onRoleFilterChange={handlePrincipalsRoleFilterChange}
                  onLoadMore={handleLoadMorePrincipals}
                  searchValue={principalsSearch}
                  roleFilterValue={principalsRoleFilter}
                  onRefreshPrincipal={async (principalId, principalType) => {
                    if (!apiClient || !selectedTenant) return;
                    await apiClient.refreshPrincipal(principalId, { tenant_id: selectedTenant.id, type: principalType as 'IDENTITY_USER' | 'IDENTITY_GROUP' });
                    await fetchPrincipals(true);
                  }}
                />
              </Stack>
              ) : (
                <AccessDeniedBanner requiredRoles={[TenantPermissionEnum.TENANT_GLOBAL_ADMIN]} />
              )}
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
                  {canCreate('custom-groups') && (
                  <Button
                    leftSection={<IconUsersGroup size={16} />}
                    onClick={() => openDialog('new-custom-group')}
                  >
                    Create Group
                  </Button>
                  )}
                </Group>

                {/* Table */}
                <div className={classes.tableScrollWrapper}>
                  <div className={classes.tableScrollArea}>
                  <div className={classes.tableWrapper}>
                    <Table striped highlightOnHover>
                      <Table.Thead className={classes.tableHeader}>
                        <Table.Tr>
                          <Table.Th className={classes.colName}>Name</Table.Th>
                          <Table.Th className={classes.colDescription}>Description</Table.Th>
                          <Table.Th className={classes.colActions}></Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {customGroupsLoading && !customGroupsFetched ? (
                          showCustomGroupsSkeleton ? (
                            <>
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Table.Tr key={i}>
                                  <Table.Td><Skeleton height={16} radius="sm" /></Table.Td>
                                  <Table.Td><Skeleton height={16} radius="sm" /></Table.Td>
                                  <Table.Td><Skeleton height={16} width={60} radius="sm" /></Table.Td>
                                </Table.Tr>
                              ))}
                            </>
                          ) : null
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
                                {!customGroupsSearch && !canCreate('custom-groups') ? (
                                  <AccessDeniedBanner
                                    message={t('accessDenied.noCreatePermission', { resource: 'Custom Groups' })}
                                    requiredRoles={[TenantPermissionEnum.CUSTOM_GROUP_CREATOR, TenantPermissionEnum.CUSTOM_GROUPS_ADMIN]}
                                    compact
                                  />
                                ) : (
                                  <Text c="dimmed">
                                    {customGroupsSearch
                                      ? 'No custom groups match your search.'
                                      : 'No custom groups yet. Create one to get started.'}
                                  </Text>
                                )}
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
                                          openDialog('delete-custom-group', { selectedId: group.id });
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
                  </div>

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
                  </div>
                </div>
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
                  {canCreate('credentials') && (
                  <Button
                    leftSection={<IconKey size={16} />}
                    onClick={() => openDialog('new-credential')}
                  >
                    Create Credential
                  </Button>
                  )}
                </Group>

                {/* Table */}
                <div className={classes.tableScrollWrapper}>
                  <div className={classes.tableScrollArea}>
                  <div className={classes.tableWrapper}>
                    <Table striped highlightOnHover>
                      <Table.Thead className={classes.tableHeader}>
                        <Table.Tr>
                          <Table.Th className={classes.colName}>Name</Table.Th>
                          <Table.Th className={classes.colType}>Type</Table.Th>
                          <Table.Th className={classes.colDescription}>Description</Table.Th>
                          <Table.Th className={classes.colActions}></Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {credentialsLoading && !credentialsFetched ? (
                          showCredentialsSkeleton ? (
                            <>
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Table.Tr key={i}>
                                  <Table.Td><Skeleton height={16} radius="sm" /></Table.Td>
                                  <Table.Td><Skeleton height={16} radius="sm" /></Table.Td>
                                  <Table.Td><Skeleton height={16} radius="sm" /></Table.Td>
                                  <Table.Td><Skeleton height={16} width={60} radius="sm" /></Table.Td>
                                </Table.Tr>
                              ))}
                            </>
                          ) : null
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
                                {!credentialsSearch && !canCreate('credentials') ? (
                                  <AccessDeniedBanner
                                    message={t('accessDenied.noCreatePermission', { resource: 'Credentials' })}
                                    requiredRoles={[TenantPermissionEnum.CREDENTIALS_CREATOR, TenantPermissionEnum.CREDENTIALS_ADMIN]}
                                    compact
                                  />
                                ) : (
                                  <Text c="dimmed">
                                    {credentialsSearch
                                      ? 'No credentials match your search.'
                                      : 'No credentials yet. Create one to get started.'}
                                  </Text>
                                )}
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
                                      {(!credential.my_permission || credential.my_permission === 'ADMIN') && (
                                      <Menu.Item
                                        leftSection={<IconShieldLock size={14} />}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenEditCredential(credential.id, 'iam');
                                        }}
                                      >
                                        Manage Access
                                      </Menu.Item>
                                      )}
                                      {(!credential.my_permission || credential.my_permission === 'ADMIN' || credential.my_permission === 'WRITE') && (
                                      <Menu.Item
                                        leftSection={<IconEdit size={14} />}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenEditCredential(credential.id, 'details');
                                        }}
                                      >
                                        Edit Details
                                      </Menu.Item>
                                      )}
                                      {(!credential.my_permission || credential.my_permission === 'ADMIN') && (
                                      <>
                                      <Menu.Divider />
                                      <Menu.Item
                                        color="red"
                                        leftSection={<IconTrash size={14} />}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openDialog('delete-credential', { selectedId: credential.id });
                                        }}
                                      >
                                        Delete
                                      </Menu.Item>
                                      </>
                                      )}
                                    </Menu.Dropdown>
                                  </Menu>
                                </Group>
                              </Table.Td>
                            </Table.Tr>
                          ))
                        )}
                      </Table.Tbody>
                    </Table>
                  </div>

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
                  </div>
                </div>
              </Stack>
            </Tabs.Panel>

            {/* AI Models Tab */}
            <Tabs.Panel value="ai-models">
              <Stack gap="md">
                <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                  <Text size="sm">
                    Configure AI models for agent features like description generation, trace analysis, and conversation summarization.
                  </Text>
                </Alert>

                <Group justify="space-between">
                  <Group gap="sm" style={{ flex: 1 }}>
                    <TextInput
                      placeholder="Search AI models..."
                      leftSection={<IconSearch size={16} />}
                      value={aiModelsSearch}
                      onChange={(e) => setAiModelsSearch(e.currentTarget.value)}
                      style={{ flex: 1, maxWidth: 250 }}
                    />
                    <MultiSelect
                      placeholder="Type"
                      data={AI_MODEL_TYPE_OPTIONS}
                      value={aiModelsTypeFilter}
                      onChange={setAiModelsTypeFilter}
                      clearable
                      style={{ maxWidth: 200 }}
                    />
                    <MultiSelect
                      placeholder="Provider"
                      data={AI_MODEL_PROVIDER_OPTIONS}
                      value={aiModelsProviderFilter}
                      onChange={setAiModelsProviderFilter}
                      clearable
                      style={{ maxWidth: 200 }}
                    />
                  </Group>
                  {canCreate('tenant-ai-models') && (
                  <Button
                    leftSection={<IconBrain size={16} />}
                    onClick={() => openDialog('new-ai-model')}
                  >
                    Create AI Model
                  </Button>
                  )}
                </Group>

                <div className={classes.tableScrollWrapper}>
                  <div className={classes.tableScrollArea}>
                  <div className={classes.tableWrapper}>
                    <Table striped highlightOnHover>
                      <Table.Thead className={classes.tableHeader}>
                        <Table.Tr>
                          <Table.Th className={classes.colName}>Name</Table.Th>
                          <Table.Th className={classes.colTypeSmall}>Type</Table.Th>
                          <Table.Th className={classes.colType}>Provider</Table.Th>
                          <Table.Th className={classes.colTypeSmall}>Status</Table.Th>
                          <Table.Th className={classes.colPurposeGroups}>Purpose Groups</Table.Th>
                          <Table.Th className={classes.colDescription}>Description</Table.Th>
                          <Table.Th className={classes.colActions}></Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {aiModelsLoading && !aiModelsFetched ? (
                          showAiModelsSkeleton ? (
                            <>
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Table.Tr key={i}>
                                  <Table.Td><Skeleton height={16} radius="sm" /></Table.Td>
                                  <Table.Td><Skeleton height={16} radius="sm" /></Table.Td>
                                  <Table.Td><Skeleton height={16} radius="sm" /></Table.Td>
                                  <Table.Td><Skeleton height={16} radius="sm" /></Table.Td>
                                  <Table.Td><Skeleton height={16} radius="sm" /></Table.Td>
                                  <Table.Td><Skeleton height={16} radius="sm" /></Table.Td>
                                  <Table.Td><Skeleton height={16} width={60} radius="sm" /></Table.Td>
                                </Table.Tr>
                              ))}
                            </>
                          ) : null
                        ) : aiModelsError ? (
                          <Table.Tr>
                            <Table.Td colSpan={7}>
                              <Alert color="red">{aiModelsError}</Alert>
                            </Table.Td>
                          </Table.Tr>
                        ) : aiModels.length === 0 ? (
                          <Table.Tr>
                            <Table.Td colSpan={7}>
                              <Center py="xl">
                                {!(aiModelsSearch || aiModelsTypeFilter.length > 0 || aiModelsProviderFilter.length > 0) && !canCreate('tenant-ai-models') ? (
                                  <AccessDeniedBanner
                                    message={t('accessDenied.noCreatePermission', { resource: 'AI Models' })}
                                    requiredRoles={[TenantPermissionEnum.TENANT_AI_MODELS_ADMIN]}
                                    compact
                                  />
                                ) : (
                                  <Text c="dimmed">
                                    {aiModelsSearch || aiModelsTypeFilter.length > 0 || aiModelsProviderFilter.length > 0
                                      ? 'No AI models match your filters.'
                                      : 'No AI models yet. Create one to get started.'}
                                  </Text>
                                )}
                              </Center>
                            </Table.Td>
                          </Table.Tr>
                        ) : (
                          aiModels.map((model) => (
                            <Table.Tr
                              key={model.id}
                              className={classes.customGroupRow}
                              onClick={() => openDialog('edit-ai-model', { selectedId: model.id })}
                            >
                              <Table.Td>
                                <Group gap="sm">
                                  <div className={classes.groupIcon}>
                                    <IconBrain size={16} />
                                  </div>
                                  <Text fw={500}>{model.name}</Text>
                                </Group>
                              </Table.Td>
                              <Table.Td>
                                <Badge size="sm" variant="light" color="gray">
                                  {model.type === AIModelTypeEnum.LLM_MODEL ? 'LLM' : 'Embedding'}
                                </Badge>
                              </Table.Td>
                              <Table.Td>
                                <Badge size="sm" variant="light" color={getAiModelProviderBadgeColor(model.provider)}>
                                  {model.provider.replace(/_/g, ' ')}
                                </Badge>
                              </Table.Td>
                              <Table.Td>
                                <Badge size="sm" variant="light" color={model.is_active ? 'green' : 'gray'}>
                                  {model.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </Table.Td>
                              <Table.Td>
                                <Group gap={4} wrap="wrap">
                                  {model.purpose_groups.length > 0 ? model.purpose_groups.map((pg) => (
                                    <Badge key={pg} size="xs" variant="light" color={purposeGroupColor(pg)}>
                                      {pg.replace(/_/g, ' ')}
                                    </Badge>
                                  )) : (
                                    <Text size="sm" c="dimmed">-</Text>
                                  )}
                                </Group>
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm" c="dimmed" className={classes.descriptionText}>
                                  {model.description || '-'}
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
                                        leftSection={<IconEdit size={14} />}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openDialog('edit-ai-model', { selectedId: model.id });
                                        }}
                                      >
                                        Edit
                                      </Menu.Item>
                                      <Menu.Divider />
                                      <Menu.Item
                                        color="red"
                                        leftSection={<IconTrash size={14} />}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openDialog('delete-ai-model', { selectedId: model.id });
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
                  </div>

                    {aiModelsHasMore && (
                      <div ref={aiModelsLoadMoreRef} className={classes.loadMoreTrigger}>
                        {aiModelsLoadingMore && (
                          <Center py="sm">
                            <Loader size="sm" />
                          </Center>
                        )}
                      </div>
                    )}
                  </div>
                </div>
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

      {/* Delete Tenant - First Confirmation */}
      <ConfirmDeleteDialog
        opened={deleteDialogStep === 1}
        onClose={() => setDeleteDialogStep(0)}
        onConfirm={handleFirstDeleteConfirm}
        itemName={selectedTenant.name}
        itemType="Tenant"
        title="Delete Tenant (Step 1 of 2)"
        message="Are you sure you want to delete this tenant? This will permanently remove all data including chat agents, credentials, conversations, and custom groups."
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
        confirmButtonText="REALLY DELETE"
        reverseButtons
      />

      {/* Add Principal Dialog */}
      <AddPrincipalDialog
        opened={dialog === 'add-member'}
        onClose={closeDialog}
        onSubmit={handleAddPrincipals}
        existingPrincipalIds={existingPrincipalIds}
        entityName="tenant"
        roleOptions={tenantRoleOptions}
        multiSelect={true}
        defaultRoles={['READER']}
      />

      <EditRolesDialog
        opened={!!editPrincipal}
        onClose={closeDialog}
        onSubmit={handleEditPrincipalRoles}
        principalName={editPrincipal?.displayName || editPrincipal?.principalId || ''}
        principalType={editPrincipal?.principalType || 'IDENTITY_USER'}
        principalEmail={editPrincipal?.mail || editPrincipal?.principalName}
        roleOptions={tenantRoleOptions}
        currentRoles={editPrincipal?.roles || []}
      />

      <CreateCustomGroupDialog
        opened={dialog === 'new-custom-group'}
        onClose={closeDialog}
        onSuccess={() => fetchCustomGroups(true)}
      />

      <EditCustomGroupDialog
        opened={dialog === 'edit-custom-group' && !!selectedId}
        onClose={handleCloseEditGroup}
        customGroupId={selectedId}
        initialTab={(dialogTab as 'members' | 'details') || 'details'}
        onTabChange={(tab) => setDialogTab(tab)}
        onSuccess={() => fetchCustomGroups()}
      />

      <ConfirmDeleteDialog
        opened={dialog === 'delete-custom-group' && !!selectedId}
        onClose={closeDialog}
        onConfirm={handleDeleteGroup}
        itemName={customGroups.find(g => g.id === selectedId)?.name}
        itemType="Custom Group"
        isLoading={isDeletingGroup}
      />

      <CreateCredentialDialog
        opened={dialog === 'new-credential'}
        onClose={closeDialog}
        onSuccess={() => fetchCredentials(true)}
      />

      <EditCredentialDialog
        opened={dialog === 'edit-credential' && !!selectedId}
        onClose={handleCloseEditCredential}
        credentialId={selectedId}
        activeTab={(dialogTab as EditDialogTab) || 'details'}
        onTabChange={(tab) => setDialogTab(tab)}
        onSuccess={handleCredentialEditSuccess}
      />

      <ConfirmDeleteDialog
        opened={dialog === 'delete-credential' && !!selectedId}
        onClose={closeDialog}
        onConfirm={handleDeleteCredential}
        itemName={credentials.find(c => c.id === selectedId)?.name}
        itemType="Credential"
        isLoading={isDeletingCredential}
      />

      <AIModelDialog
        opened={dialog === 'new-ai-model'}
        onClose={closeDialog}
        onSuccess={() => fetchAIModels(true)}
      />

      <AIModelDialog
        opened={dialog === 'edit-ai-model' && !!selectedId}
        onClose={closeDialog}
        onSuccess={() => fetchAIModels(true)}
        modelId={selectedId}
      />

      <ConfirmDeleteDialog
        opened={dialog === 'delete-ai-model' && !!selectedId}
        onClose={closeDialog}
        onConfirm={handleDeleteAiModel}
        itemName={aiModels.find(m => m.id === selectedId)?.name}
        itemType="AI Model"
        isLoading={isDeletingAiModel}
      />
    </Shell>
  );
};
