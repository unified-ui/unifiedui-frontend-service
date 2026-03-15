import type { FC } from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Modal,
  TextInput,
  Textarea,
  Button,
  Group,
  Stack,
  Text,
  Select,
  SegmentedControl,
  Box,
  LoadingOverlay,
  Alert,
  Switch,
  Divider,
  Badge,
  NumberInput,
  ActionIcon,
  Tooltip,
  Loader,
  TagsInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import {
  IconSparkles,
  IconInfoCircle,
  IconShieldLock,
  IconAlertCircle,
  IconPlus,
} from '@tabler/icons-react';
import { useIdentity } from '../../../contexts';
import { useTranslation } from 'react-i18next';
import { GenerateWithAIButton } from '../../common/GenerateWithAIButton';
import {
  ChatAgentTypeEnum,
  PermissionActionEnum,
  N8NApiVersionEnum,
  N8NWorkflowTypeEnum,
  FoundryAgentTypeEnum,
  FoundryApiVersionEnum,
  RestApiAuthTypeEnum,
  CredentialTypeEnum,
  type ChatAgentResponse,
  type PrincipalTypeEnum,
  type PrincipalWithRolesResponse,
  type CredentialResponse,
  type N8NChatAgentConfig,
  type FoundryChatAgentConfig,
  type RestApiChatAgentConfig,
} from '../../../api/types';
import { TagInput, ManageAccessTable, AddPrincipalDialog, GreetingMessagesInput } from '../../common';
import { CreateCredentialDialog } from '../CreateCredentialDialog';
import type { PrincipalPermission } from '../../common/ManageAccessTable/ManageAccessTable';
import type { SelectedPrincipal } from '../../common/AddPrincipalDialog/AddPrincipalDialog';
import { useFormDirtyGuard, usePermissions } from '../../../hooks';
import classes from './EditChatAgentDialog.module.css';

const CHAT_AGENT_TYPES = [
  { value: ChatAgentTypeEnum.N8N, label: 'n8n' },
  { value: ChatAgentTypeEnum.MICROSOFT_FOUNDRY, label: 'Microsoft Foundry' },
  { value: ChatAgentTypeEnum.REST_API, label: 'REST API' },
];

const N8N_API_VERSIONS = [
  { value: N8NApiVersionEnum.V1, label: 'v1' },
];

const N8N_WORKFLOW_TYPES = [
  { value: N8NWorkflowTypeEnum.N8N_CHAT_AGENT_WORKFLOW, label: 'Chat Agent Workflow' },
];

const FOUNDRY_AGENT_TYPES = [
  { value: FoundryAgentTypeEnum.AGENT, label: 'Agent' },
  { value: FoundryAgentTypeEnum.MULTI_AGENT, label: 'Multi-Agent' },
];

const FOUNDRY_API_VERSIONS = [
  { value: FoundryApiVersionEnum.V2025_11_15_PREVIEW, label: '2025-11-15-preview' },
];

const REST_API_AUTH_TYPES = [
  { value: RestApiAuthTypeEnum.ANONYMOUS, label: 'Anonymous (No Auth)' },
  { value: RestApiAuthTypeEnum.BASIC_AUTH, label: 'Basic Auth' },
  { value: RestApiAuthTypeEnum.API_KEY, label: 'API Key' },
  { value: RestApiAuthTypeEnum.ENTRA_ID_USER_TOKEN, label: 'Entra ID User Token (Forward)' },
  { value: RestApiAuthTypeEnum.ENTRA_ID_APP_REGISTRATION, label: 'Entra ID App Registration' },
];

const AUTH_TYPES_REQUIRING_CREDENTIAL = new Set([
  RestApiAuthTypeEnum.BASIC_AUTH,
  RestApiAuthTypeEnum.API_KEY,
  RestApiAuthTypeEnum.ENTRA_ID_APP_REGISTRATION,
]);

export type EditDialogTab = 'details' | 'iam';

interface EditChatAgentDialogProps {
  opened: boolean;
  onClose: () => void;
  chatAgentId: string | null;
  /** Pre-loaded chat agent data from context (avoids re-fetch if provided) */
  initialData?: ChatAgentResponse | null;
  initialTab?: EditDialogTab;
  onTabChange?: (tab: EditDialogTab) => void;
  onSuccess?: () => void;
}

interface FormValues {
  name: string;
  type: string;
  description: string;
  tags: string[];
  embed_allowed_origins: string[];
  is_active: boolean;
  greeting_messages: string[];
  // N8N Config
  n8n_api_version: string;
  n8n_workflow_type: string;
  n8n_use_unified_chat_history: boolean;
  n8n_chat_history_count: number;
  n8n_chat_url: string;
  n8n_workflow_endpoint: string;
  n8n_api_api_key_credential_id: string;
  n8n_chat_auth_credential_id: string;
  // Foundry Config
  foundry_agent_type: string;
  foundry_api_version: string;
  foundry_project_endpoint: string;
  foundry_agent_name: string;
  // REST API Config
  rest_api_auth_type: string;
  rest_api_invoke_endpoint: string;
  rest_api_credential_id: string;
  rest_api_api_key_header_name: string;
  rest_api_use_unified_chat_history: boolean;
  rest_api_chat_history_count: number;
  rest_api_enable_conversation_endpoint: boolean;
  rest_api_create_conversation_endpoint: string;
}

export const EditChatAgentDialog: FC<EditChatAgentDialogProps> = ({
  opened,
  onClose,
  chatAgentId,
  initialData = null,
  initialTab = 'details',
  onTabChange,
  onSuccess,
}) => {
  const { apiClient, selectedTenant } = useIdentity();
  const { t } = useTranslation('common');
  const { isGlobalAdmin } = usePermissions();
  const showIamTab = isGlobalAdmin || !initialData || initialData.my_permission === 'ADMIN';
  const [activeTab, setActiveTab] = useState<EditDialogTab>(initialTab);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatAgent, setChatAgent] = useState<ChatAgentResponse | null>(null);
  // Credentials state
  const [credentials, setCredentials] = useState<CredentialResponse[]>([]);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);
  const [createCredentialOpen, setCreateCredentialOpen] = useState(false);
  const [credentialFieldTarget, setCredentialFieldTarget] = useState<'api_key' | 'chat_auth' | 'rest_api' | null>(null);

  // Principals state
  const [principals, setPrincipals] = useState<PrincipalPermission[]>([]);
  const [isPrincipalsLoading, setIsPrincipalsLoading] = useState(false);
  const [hasPrincipalsFetched, setHasPrincipalsFetched] = useState(false);
  const [principalsError, setPrincipalsError] = useState<string | null>(null);
  const [isAddPrincipalOpen, setIsAddPrincipalOpen] = useState(false);

  const form = useForm<FormValues>({
    initialValues: {
      name: '',
      type: '',
      description: '',
      tags: [],
      embed_allowed_origins: [],
      is_active: true,
      greeting_messages: [],
      // N8N Config defaults
      n8n_api_version: N8NApiVersionEnum.V1,
      n8n_workflow_type: N8NWorkflowTypeEnum.N8N_CHAT_AGENT_WORKFLOW,
      n8n_use_unified_chat_history: true,
      n8n_chat_history_count: 30,
      n8n_chat_url: '',
      n8n_workflow_endpoint: '',
      n8n_api_api_key_credential_id: '',
      n8n_chat_auth_credential_id: '',
      // Foundry Config defaults
      foundry_agent_type: FoundryAgentTypeEnum.AGENT,
      foundry_api_version: FoundryApiVersionEnum.V2025_11_15_PREVIEW,
      foundry_project_endpoint: '',
      foundry_agent_name: '',
      // REST API Config defaults
      rest_api_auth_type: RestApiAuthTypeEnum.ANONYMOUS,
      rest_api_invoke_endpoint: '',
      rest_api_credential_id: '',
      rest_api_api_key_header_name: 'X-API-Key',
      rest_api_use_unified_chat_history: true,
      rest_api_chat_history_count: 30,
      rest_api_enable_conversation_endpoint: false,
      rest_api_create_conversation_endpoint: '',
    },
    validate: {
      name: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Name is required';
        }
        if (value.length > 255) {
          return 'Name cannot exceed 255 characters';
        }
        return null;
      },
      type: (value) => {
        if (!value) {
          return 'Type is required';
        }
        return null;
      },
      description: (value) => {
        if (value && value.length > 2000) {
          return 'Description cannot exceed 2000 characters';
        }
        return null;
      },
      n8n_chat_url: (value, values) => {
        if (values.type === ChatAgentTypeEnum.N8N) {
          if (!value || value.trim().length === 0) {
            return 'Chat URL is required';
          }
          try {
            new URL(value);
          } catch {
            return 'Invalid URL';
          }
        }
        return null;
      },
      n8n_workflow_endpoint: (value, values) => {
        if (values.type === ChatAgentTypeEnum.N8N) {
          if (!value || value.trim().length === 0) {
            return 'Workflow Endpoint is required';
          }
          try {
            const url = new URL(value);
            if (!url.pathname.includes('/workflow/')) {
              return 'URL must contain "/workflow/"';
            }
          } catch {
            return 'Invalid URL';
          }
        }
        return null;
      },
      n8n_api_api_key_credential_id: (value, values) => {
        if (values.type === ChatAgentTypeEnum.N8N) {
          if (!value || value.trim().length === 0) {
            return 'API Key Credential is required';
          }
        }
        return null;
      },
      n8n_chat_history_count: (value, values) => {
        if (values.type === ChatAgentTypeEnum.N8N && values.n8n_use_unified_chat_history) {
          if (value < 1 || value > 100) {
            return 'Chat History Count must be between 1 and 100';
          }
        }
        return null;
      },
      foundry_project_endpoint: (value, values) => {
        if (values.type === ChatAgentTypeEnum.MICROSOFT_FOUNDRY) {
          if (!value || value.trim().length === 0) {
            return 'Project Endpoint is required';
          }
          try {
            new URL(value);
          } catch {
            return 'Invalid URL';
          }
        }
        return null;
      },
      foundry_agent_name: (value, values) => {
        if (values.type === ChatAgentTypeEnum.MICROSOFT_FOUNDRY) {
          if (!value || value.trim().length === 0) {
            return 'Agent Name is required';
          }
        }
        return null;
      },
      rest_api_invoke_endpoint: (value, values) => {
        if (values.type === ChatAgentTypeEnum.REST_API) {
          if (!value || value.trim().length === 0) {
            return 'Invoke Endpoint is required';
          }
          try {
            new URL(value);
          } catch {
            return 'Invalid URL';
          }
        }
        return null;
      },
      rest_api_credential_id: (value, values) => {
        if (values.type === ChatAgentTypeEnum.REST_API &&
            AUTH_TYPES_REQUIRING_CREDENTIAL.has(values.rest_api_auth_type as RestApiAuthTypeEnum)) {
          if (!value || value.trim().length === 0) {
            return 'Credential is required for this auth type';
          }
        }
        return null;
      },
      rest_api_chat_history_count: (value, values) => {
        if (values.type === ChatAgentTypeEnum.REST_API && values.rest_api_use_unified_chat_history) {
          if (value < 1 || value > 100) {
            return 'Chat History Count must be between 1 and 100';
          }
        }
        return null;
      },
      rest_api_create_conversation_endpoint: (value, values) => {
        if (values.type === ChatAgentTypeEnum.REST_API && values.rest_api_enable_conversation_endpoint) {
          if (!value || value.trim().length === 0) {
            return 'Conversation Endpoint is required when enabled';
          }
          try {
            new URL(value);
          } catch {
            return 'Invalid URL';
          }
        }
        return null;
      },
    },
  });

  useFormDirtyGuard(form.isDirty());

  // Update activeTab when initialTab changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Load credentials when dialog opens
  const loadCredentials = useCallback(async () => {
    if (!apiClient || !selectedTenant) return;

    setIsLoadingCredentials(true);
    try {
      const response = await apiClient.listCredentials(selectedTenant.id, {
        limit: 100,
        order_by: 'name',
        order_direction: 'asc',
      });
      setCredentials(Array.isArray(response) ? response as CredentialResponse[] : []);
    } catch (error) {
      console.error('Failed to load credentials:', error);
    } finally {
      setIsLoadingCredentials(false);
    }
  }, [apiClient, selectedTenant]);

  // Filter credentials by type for API Key dropdown (only API_KEY type)
  const apiKeyCredentials = useMemo(() => {
    return credentials
      .filter((c) => c.type === CredentialTypeEnum.API_KEY)
      .map((c) => ({ value: c.id, label: c.name }));
  }, [credentials]);

  // Filter credentials by type for Chat Auth dropdown (BASIC_AUTH type)
  const chatAuthCredentials = useMemo(() => {
    return credentials
      .filter((c) => c.type === CredentialTypeEnum.BASIC_AUTH)
      .map((c) => ({ value: c.id, label: c.name }));
  }, [credentials]);

  // Filter credentials for REST API based on selected auth type
  const restApiCredentials = useMemo(() => {
    const authType = form.values.rest_api_auth_type as RestApiAuthTypeEnum;
    const typeMap: Record<string, string> = {
      [RestApiAuthTypeEnum.BASIC_AUTH]: CredentialTypeEnum.BASIC_AUTH,
      [RestApiAuthTypeEnum.API_KEY]: CredentialTypeEnum.API_KEY,
      [RestApiAuthTypeEnum.ENTRA_ID_APP_REGISTRATION]: CredentialTypeEnum.ENTRA_ID_APP_REGISTRATION,
    };
    const credType = typeMap[authType];
    if (!credType) return [];
    return credentials
      .filter((c) => c.type === credType)
      .map((c) => ({ value: c.id, label: c.name }));
  }, [credentials, form.values.rest_api_auth_type]);

  // Initialize from initialData when provided
  const initializeFromData = useCallback((data: ChatAgentResponse) => {
    setChatAgent(data);

    // Parse config from chat agent based on type
    const n8nConfig = data.type === ChatAgentTypeEnum.N8N
      ? (data.config as unknown as N8NChatAgentConfig | undefined)
      : undefined;
    const foundryConfig = data.type === ChatAgentTypeEnum.MICROSOFT_FOUNDRY
      ? (data.config as unknown as FoundryChatAgentConfig | undefined)
      : undefined;
    const restApiConfig = data.type === ChatAgentTypeEnum.REST_API
      ? (data.config as unknown as RestApiChatAgentConfig | undefined)
      : undefined;

    form.setValues({
      name: data.name,
      type: data.type,
      description: data.description || '',
      tags: data.tags?.map((t) => t.name) || [],
      embed_allowed_origins: data.embed_allowed_origins
        ? data.embed_allowed_origins.split(';').filter(Boolean)
        : [],
      is_active: data.is_active,
      greeting_messages: data.greeting_messages || [],
      // N8N Config from data
      n8n_api_version: n8nConfig?.api_version || N8NApiVersionEnum.V1,
      n8n_workflow_type: n8nConfig?.workflow_type || N8NWorkflowTypeEnum.N8N_CHAT_AGENT_WORKFLOW,
      n8n_use_unified_chat_history: n8nConfig?.use_unified_chat_history ?? true,
      n8n_chat_history_count: n8nConfig?.chat_history_count ?? 30,
      n8n_chat_url: n8nConfig?.chat_url || '',
      n8n_workflow_endpoint: n8nConfig?.workflow_endpoint || '',
      n8n_api_api_key_credential_id: n8nConfig?.api_api_key_credential_id || '',
      n8n_chat_auth_credential_id: n8nConfig?.chat_auth_credential_id || '',
      // Foundry Config from data
      foundry_agent_type: foundryConfig?.agent_type || FoundryAgentTypeEnum.AGENT,
      foundry_api_version: foundryConfig?.api_version || FoundryApiVersionEnum.V2025_11_15_PREVIEW,
      foundry_project_endpoint: foundryConfig?.project_endpoint || '',
      foundry_agent_name: foundryConfig?.agent_name || '',
      // REST API Config from data
      rest_api_auth_type: restApiConfig?.auth_type || RestApiAuthTypeEnum.ANONYMOUS,
      rest_api_invoke_endpoint: restApiConfig?.invoke_endpoint || '',
      rest_api_credential_id: restApiConfig?.credential_id || '',
      rest_api_api_key_header_name: restApiConfig?.api_key_header_name || 'X-API-Key',
      rest_api_use_unified_chat_history: restApiConfig?.use_unified_chat_history ?? true,
      rest_api_chat_history_count: restApiConfig?.chat_history_count ?? 30,
      rest_api_enable_conversation_endpoint: !!restApiConfig?.create_conversation_endpoint,
      rest_api_create_conversation_endpoint: restApiConfig?.create_conversation_endpoint || '',
    });
    form.resetDirty();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch chat agent data (only if no initialData provided)
  const fetchChatAgent = useCallback(async () => {
    if (!apiClient || !selectedTenant || !chatAgentId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.getChatAgent(selectedTenant.id, chatAgentId);
      initializeFromData(data);
    } catch (err) {
      console.error('Failed to fetch chat agent:', err);
      setError('Failed to load chat agent data');
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, selectedTenant, chatAgentId, initializeFromData]);

  // Fetch principals (showLoading=false for background refresh to prevent flash)
  const fetchPrincipals = useCallback(async (showLoading = true) => {
    if (!apiClient || !selectedTenant || !chatAgentId) return;

    if (showLoading) {
      setIsPrincipalsLoading(true);
    }
    setPrincipalsError(null);

    try {
      const response = await apiClient.getChatAgentPrincipals(selectedTenant.id, chatAgentId);

      // Transform response to PrincipalPermission format
      // Response structure: { resource_id, resource_type, tenant_id, principals: [{ principal_id, principal_type, roles, mail, display_name, principal_name, description }] }
      const transformedPrincipals: PrincipalPermission[] = (response.principals || []).map(
        (p: PrincipalWithRolesResponse) => ({
          id: p.principal_id,
          principalId: p.principal_id,
          principalType: p.principal_type,
          displayName: p.display_name,
          mail: p.mail,
          principalName: p.principal_name,
          description: p.description,
          roles: p.roles || [],
        })
      );

      setPrincipals(transformedPrincipals);
    } catch (err) {
      console.error('Failed to fetch principals:', err);
      setPrincipalsError('Failed to load access permissions');
    } finally {
      setIsPrincipalsLoading(false);
      setHasPrincipalsFetched(true);
    }
  }, [apiClient, selectedTenant, chatAgentId]);

  // Load data when dialog opens or chatAgentId changes
  useEffect(() => {
    if (opened && chatAgentId) {
      // If initialData is provided, use it; otherwise fetch
      if (initialData) {
        initializeFromData(initialData);
      } else {
        fetchChatAgent();
      }
      // Always fetch principals (they're not in the list data)
      fetchPrincipals();
      // Load credentials for dropdowns
      loadCredentials();
    } else if (!opened) {
      // Reset hasPrincipalsFetched when dialog closes
      setHasPrincipalsFetched(false);
    }
  }, [opened, chatAgentId, initialData, initializeFromData, fetchChatAgent, fetchPrincipals, loadCredentials]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    const tab = value as EditDialogTab;
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  // Handle form submit
  const handleSubmit = async (values: FormValues) => {
    if (!apiClient || !selectedTenant || !chatAgentId) return;

    setIsSaving(true);
    setError(null);

    try {
      // Build config based on chat agent type
      let config: N8NChatAgentConfig | FoundryChatAgentConfig | RestApiChatAgentConfig | undefined;

      if (values.type === ChatAgentTypeEnum.N8N) {
        config = {
          api_version: values.n8n_api_version as N8NApiVersionEnum,
          workflow_type: values.n8n_workflow_type as N8NWorkflowTypeEnum,
          use_unified_chat_history: values.n8n_use_unified_chat_history,
          chat_history_count: values.n8n_use_unified_chat_history ? values.n8n_chat_history_count : undefined,
          chat_url: values.n8n_chat_url.trim(),
          workflow_endpoint: values.n8n_workflow_endpoint.trim(),
          api_api_key_credential_id: values.n8n_api_api_key_credential_id,
          chat_auth_credential_id: values.n8n_chat_auth_credential_id || undefined,
        };
      } else if (values.type === ChatAgentTypeEnum.MICROSOFT_FOUNDRY) {
        config = {
          agent_type: values.foundry_agent_type as FoundryAgentTypeEnum,
          api_version: values.foundry_api_version as FoundryApiVersionEnum,
          project_endpoint: values.foundry_project_endpoint.trim(),
          agent_name: values.foundry_agent_name.trim(),
        };
      } else if (values.type === ChatAgentTypeEnum.REST_API) {
        const authType = values.rest_api_auth_type as RestApiAuthTypeEnum;
        config = {
          auth_type: authType,
          invoke_endpoint: values.rest_api_invoke_endpoint.trim(),
          credential_id: AUTH_TYPES_REQUIRING_CREDENTIAL.has(authType)
            ? values.rest_api_credential_id
            : undefined,
          api_key_header_name: authType === RestApiAuthTypeEnum.API_KEY
            ? values.rest_api_api_key_header_name.trim() || 'X-API-Key'
            : undefined,
          use_unified_chat_history: values.rest_api_use_unified_chat_history,
          chat_history_count: values.rest_api_use_unified_chat_history
            ? values.rest_api_chat_history_count
            : undefined,
          create_conversation_endpoint: values.rest_api_enable_conversation_endpoint
            ? values.rest_api_create_conversation_endpoint.trim()
            : undefined,
        };
      }

      // Update chat agent
      await apiClient.updateChatAgent(selectedTenant.id, chatAgentId, {
        name: values.name.trim(),
        type: values.type as ChatAgentTypeEnum,
        description: values.description?.trim() || undefined,
        is_active: values.is_active,
        config: config as Record<string, unknown> | undefined,
        embed_allowed_origins: values.embed_allowed_origins.length > 0
          ? values.embed_allowed_origins.join(';')
          : undefined,
        greeting_messages: values.greeting_messages.filter(Boolean),
      });

      // Update tags if changed
      const currentTags = chatAgent?.tags?.map((t) => t.name) || [];
      const newTags = values.tags;

      if (JSON.stringify(currentTags.sort()) !== JSON.stringify(newTags.sort())) {
        await apiClient.setChatAgentTags(selectedTenant.id, chatAgentId, newTags);
      }

      form.resetDirty();
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to update chat agent:', err);
      setError('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle opening create credential dialog
  const handleOpenCreateCredential = (target: 'api_key' | 'chat_auth' | 'rest_api') => {
    setCredentialFieldTarget(target);
    setCreateCredentialOpen(true);
  };

  // Handle credential created callback
  const handleCredentialCreated = async (credential?: { id: string; name: string }) => {
    // Refresh credentials list
    await loadCredentials();

    // Auto-select the newly created credential
    if (credential && credentialFieldTarget) {
      if (credentialFieldTarget === 'api_key') {
        form.setFieldValue('n8n_api_api_key_credential_id', credential.id);
      } else if (credentialFieldTarget === 'chat_auth') {
        form.setFieldValue('n8n_chat_auth_credential_id', credential.id);
      } else if (credentialFieldTarget === 'rest_api') {
        form.setFieldValue('rest_api_credential_id', credential.id);
      }
    }
    setCredentialFieldTarget(null);
  };

  // Handle role change for a principal
  const handleRoleChange = useCallback(
    async (principalId: string, principalType: PrincipalTypeEnum, role: PermissionActionEnum, enabled: boolean) => {
      if (!apiClient || !selectedTenant || !chatAgentId) return;

      try {
        if (enabled) {
          // Add permission
          await apiClient.setChatAgentPermission(selectedTenant.id, chatAgentId, {
            principal_id: principalId,
            principal_type: principalType,
            role,
          });
        } else {
          // Remove permission
          await apiClient.deleteChatAgentPermission(
            selectedTenant.id,
            chatAgentId,
            principalId,
            principalType,
            role
          );
        }

        // Refresh principals list without showing loading state (prevents flash)
        await fetchPrincipals(false);
      } catch (error) {
        console.error('Failed to update permission:', error);
        // Refresh to get correct state from server
        await fetchPrincipals(false);
      }
    },
    [apiClient, selectedTenant, chatAgentId, fetchPrincipals]
  );

  // Handle adding a new principal
  const handleAddPrincipals = useCallback(
    async (selectedPrincipals: SelectedPrincipal[], roles: string[]) => {
      if (!apiClient || !selectedTenant || !chatAgentId) return;

      // Add permission for each selected principal with the first selected role
      const role = roles[0] as PermissionActionEnum || PermissionActionEnum.READ;
      for (const principal of selectedPrincipals) {
        await apiClient.setChatAgentPermission(selectedTenant.id, chatAgentId, {
          principal_id: principal.id,
          principal_type: principal.type,
          role,
        });
      }

      // Refresh principals list without showing loading state
      await fetchPrincipals(false);
    },
    [apiClient, selectedTenant, chatAgentId, fetchPrincipals]
  );

  // Handle deleting a principal's access
  const handleDeletePrincipal = useCallback(
    async (principalId: string, principalType: PrincipalTypeEnum) => {
      if (!apiClient || !selectedTenant || !chatAgentId) return;

      // Delete all permissions for this principal
      const principal = principals.find(p => p.principalId === principalId && p.principalType === principalType);
      if (principal) {
        for (const role of principal.roles) {
          await apiClient.deleteChatAgentPermission(
            selectedTenant.id,
            chatAgentId,
            principalId,
            principalType,
            role
          );
        }
      }

      // Refresh principals list without showing loading state
      await fetchPrincipals(false);
    },
    [apiClient, selectedTenant, chatAgentId, principals, fetchPrincipals]
  );

  // Handle close
  const handleClose = () => {
    form.reset();
    setError(null);
    setChatAgent(null);
    setPrincipals([]);
    onClose();
  };

  return (
    <>
      <Modal
        opened={opened}
        onClose={handleClose}
        title={
          <Group gap="sm">
            <Box className={classes.titleIcon}>
              <IconSparkles size={20} />
            </Box>
            <Stack gap={2}>
              <Text fw={600} size="lg">
                {chatAgent?.name}
              </Text>
              {chatAgent && (
                <Group gap="xs">
                  <Badge size="xs" variant="light" color={chatAgent.is_active ? 'green' : 'gray'}>
                    {chatAgent.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Text size="xs" c="dimmed">
                    {CHAT_AGENT_TYPES.find((t) => t.value === chatAgent.type)?.label || chatAgent.type}
                  </Text>
                </Group>
              )}
            </Stack>
          </Group>
        }
        size={1100}
        centered
        classNames={{
          content: classes.modalContent,
          header: classes.modalHeader,
          body: classes.modalBody,
        }}
      >
        <LoadingOverlay visible={isLoading} zIndex={1000} overlayProps={{ blur: 2 }} />

        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="red"
            mb="md"
            onClose={() => setError(null)}
            withCloseButton
          >
            {error}
          </Alert>
        )}

        {/* Tab Navigation */}
        {showIamTab && (
        <Box className={classes.tabContainer}>
          <SegmentedControl
            value={activeTab}
            onChange={handleTabChange}
            data={[
              {
                value: 'details',
                label: (
                  <Group gap="xs" wrap="nowrap">
                    <IconInfoCircle size={16} />
                    <span>Details</span>
                  </Group>
                ),
              },
              {
                value: 'iam',
                label: (
                  <Group gap="xs" wrap="nowrap">
                    <IconShieldLock size={16} />
                    <span>Manage Access</span>
                  </Group>
                ),
              },
            ]}
            fullWidth
            className={classes.segmentedControl}
          />
        </Box>
        )}

        {/* Tab Content */}
        {activeTab === 'details' ? (
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <Group grow align="flex-start">
                <TextInput
                  label="Name"
                  placeholder="Enter a name"
                  required
                  withAsterisk
                  maxLength={255}
                  {...form.getInputProps('name')}
                />

                <Select
                  label="Type"
                  placeholder="Select a type"
                  required
                  withAsterisk
                  data={CHAT_AGENT_TYPES}
                  {...form.getInputProps('type')}
                />
              </Group>

              <Switch
                label="Active"
                description="Enable or disable this chat agent"
                checked={form.values.is_active}
                onChange={(e) => form.setFieldValue('is_active', e.currentTarget.checked)}
                classNames={{ track: classes.switchTrack }}
              />

              {/* N8N Configuration Section */}
              {form.values.type === ChatAgentTypeEnum.N8N && (
                <>
                  <Divider label="N8N Configuration" labelPosition="center" />

                  <Group grow>
                    <Select
                      label="API Version"
                      required
                      withAsterisk
                      data={N8N_API_VERSIONS}
                      {...form.getInputProps('n8n_api_version')}
                    />
                    <Select
                      label="Workflow Type"
                      required
                      withAsterisk
                      data={N8N_WORKFLOW_TYPES}
                      {...form.getInputProps('n8n_workflow_type')}
                    />
                  </Group>

                  <TextInput
                    label="Chat URL"
                    placeholder="https://your-n8n-instance.com/webhook/..."
                    required
                    withAsterisk
                    {...form.getInputProps('n8n_chat_url')}
                  />

                  <TextInput
                    label="Workflow Endpoint"
                    placeholder="https://your-n8n-instance.com/workflow/abc123"
                    description="The URL to the N8N workflow (e.g. https://n8n.example.com/workflow/abc123)"
                    required
                    withAsterisk
                    {...form.getInputProps('n8n_workflow_endpoint')}
                  />

                  {/* API Key Credential with Add Button */}
                  <Group gap="xs" align="flex-end">
                    <Select
                      label="API Key Credential"
                      placeholder={isLoadingCredentials ? 'Loading...' : 'Select a credential'}
                      required
                      withAsterisk
                      data={apiKeyCredentials}
                      rightSection={isLoadingCredentials ? <Loader size="xs" /> : undefined}
                      disabled={isLoadingCredentials}
                      searchable
                      nothingFoundMessage="No credentials found"
                      style={{ flex: 1 }}
                      {...form.getInputProps('n8n_api_api_key_credential_id')}
                    />
                    <Tooltip label="Create new API Key Credential">
                      <ActionIcon
                        variant="light"
                        color="blue"
                        size="lg"
                        onClick={() => handleOpenCreateCredential('api_key')}
                      >
                        <IconPlus size={18} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>

                  {apiKeyCredentials.length === 0 && !isLoadingCredentials && (
                    <Alert icon={<IconAlertCircle size={16} />} color="yellow" variant="light">
                      No API Key Credentials available. Please create a credential first.
                    </Alert>
                  )}

                  {/* Chat Auth Credential (Optional) with Add Button */}
                  <Group gap="xs" align="flex-end">
                    <Select
                      label="Chat Auth Credential (Optional)"
                      placeholder={isLoadingCredentials ? 'Loading...' : 'Select a credential (optional)'}
                      data={chatAuthCredentials}
                      rightSection={isLoadingCredentials ? <Loader size="xs" /> : undefined}
                      disabled={isLoadingCredentials}
                      clearable
                      searchable
                      nothingFoundMessage="No credentials found"
                      style={{ flex: 1 }}
                      {...form.getInputProps('n8n_chat_auth_credential_id')}
                    />
                    <Tooltip label="Create new Basic Auth Credential">
                      <ActionIcon
                        variant="light"
                        color="blue"
                        size="lg"
                        onClick={() => handleOpenCreateCredential('chat_auth')}
                      >
                        <IconPlus size={18} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>

                  <Divider label="Chat History" labelPosition="center" />

                  <Switch
                    label="Use Unified Chat History"
                    description="When enabled, chat history is managed in the Agent Service"
                    {...form.getInputProps('n8n_use_unified_chat_history', { type: 'checkbox' })}
                  />

                  {form.values.n8n_use_unified_chat_history && (
                    <NumberInput
                      label="Chat History Count"
                      description="Number of messages in chat history (1-100)"
                      min={1}
                      max={100}
                      {...form.getInputProps('n8n_chat_history_count')}
                    />
                  )}
                </>
              )}

              {/* Microsoft Foundry Configuration Section */}
              {form.values.type === ChatAgentTypeEnum.MICROSOFT_FOUNDRY && (
                <>
                  <Divider label="Microsoft Foundry Configuration" labelPosition="center" />

                  <Group grow>
                    <Select
                      label="Agent Type"
                      required
                      withAsterisk
                      data={FOUNDRY_AGENT_TYPES}
                      {...form.getInputProps('foundry_agent_type')}
                    />
                    <Select
                      label="API Version"
                      required
                      withAsterisk
                      data={FOUNDRY_API_VERSIONS}
                      {...form.getInputProps('foundry_api_version')}
                    />
                  </Group>

                  <TextInput
                    label="Project Endpoint"
                    placeholder="https://your-project.services.ai.azure.com/api/..."
                    required
                    withAsterisk
                    {...form.getInputProps('foundry_project_endpoint')}
                  />

                  <TextInput
                    label="Agent Name"
                    placeholder="Name of the Foundry agent"
                    required
                    withAsterisk
                    {...form.getInputProps('foundry_agent_name')}
                  />
                </>
              )}

              {/* REST API Configuration Section */}
              {form.values.type === ChatAgentTypeEnum.REST_API && (
                <>
                  <Divider label="REST API Configuration" labelPosition="center" />

                  <Select
                    label="Authentication Type"
                    required
                    withAsterisk
                    data={REST_API_AUTH_TYPES}
                    {...form.getInputProps('rest_api_auth_type')}
                  />

                  <TextInput
                    label="Invoke Endpoint"
                    placeholder="https://your-agent-api.com/invoke"
                    description="The URL to send chat messages to"
                    required
                    withAsterisk
                    {...form.getInputProps('rest_api_invoke_endpoint')}
                  />

                  {AUTH_TYPES_REQUIRING_CREDENTIAL.has(form.values.rest_api_auth_type as RestApiAuthTypeEnum) && (
                    <>
                      <Group gap="xs" align="flex-end">
                        <Select
                          label="Credential"
                          placeholder={isLoadingCredentials ? 'Loading...' : 'Select a credential'}
                          required
                          withAsterisk
                          data={restApiCredentials}
                          rightSection={isLoadingCredentials ? <Loader size="xs" /> : undefined}
                          disabled={isLoadingCredentials}
                          searchable
                          nothingFoundMessage="No credentials found"
                          style={{ flex: 1 }}
                          {...form.getInputProps('rest_api_credential_id')}
                        />
                        <Tooltip label="Create new Credential">
                          <ActionIcon
                            variant="light"
                            color="blue"
                            size="lg"
                            onClick={() => handleOpenCreateCredential('rest_api')}
                          >
                            <IconPlus size={18} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>

                      {restApiCredentials.length === 0 && !isLoadingCredentials && (
                        <Alert icon={<IconAlertCircle size={16} />} color="yellow" variant="light">
                          No matching credentials available. Please create a credential first.
                        </Alert>
                      )}
                    </>
                  )}

                  {form.values.rest_api_auth_type === RestApiAuthTypeEnum.API_KEY && (
                    <TextInput
                      label="API Key Header Name"
                      placeholder="X-API-Key"
                      description="HTTP header name used to send the API key (default: X-API-Key)"
                      {...form.getInputProps('rest_api_api_key_header_name')}
                    />
                  )}

                  <Divider label="Chat History" labelPosition="center" />

                  <Switch
                    label="Use Unified Chat History"
                    description="When enabled, chat history is managed in the Agent Service"
                    {...form.getInputProps('rest_api_use_unified_chat_history', { type: 'checkbox' })}
                  />

                  {form.values.rest_api_use_unified_chat_history && (
                    <NumberInput
                      label="Chat History Count"
                      description="Number of messages in chat history (1-100)"
                      min={1}
                      max={100}
                      {...form.getInputProps('rest_api_chat_history_count')}
                    />
                  )}

                  <Divider label="Conversation Management" labelPosition="center" />

                  <Switch
                    label="Enable Conversation Endpoint"
                    description="When enabled, the agent service will create conversations via a dedicated endpoint"
                    {...form.getInputProps('rest_api_enable_conversation_endpoint', { type: 'checkbox' })}
                  />

                  {form.values.rest_api_enable_conversation_endpoint && (
                    <TextInput
                      label="Create Conversation Endpoint"
                      placeholder="https://your-agent-api.com/conversations"
                      description="POST endpoint to create a new conversation/session"
                      required
                      withAsterisk
                      {...form.getInputProps('rest_api_create_conversation_endpoint')}
                    />
                  )}
                </>
              )}

              <TagInput
                label="Tags"
                placeholder="Enter a tag and press Space to add..."
                value={form.values.tags}
                onChange={(tags) => form.setFieldValue('tags', tags)}
              />

              <TagsInput
                label={t('embedAllowedOrigins')}
                placeholder={t('embedAllowedOriginsPlaceholder')}
                description={t('embedAllowedOriginsDescription')}
                splitChars={[',', ' ']}
                value={form.values.embed_allowed_origins}
                onChange={(origins) => form.setFieldValue('embed_allowed_origins', origins)}
              />

              <Box pos="relative">
                <Textarea
                  label="Description"
                  placeholder="Optional description"
                  maxLength={2000}
                  minRows={3}
                  maxRows={6}
                  autosize
                  {...form.getInputProps('description')}
                />
                <Box pos="absolute" top={0} right={0}>
                  <GenerateWithAIButton
                    entityType="chat-agent"
                    entityName={form.values.name}
                    existingDescription={form.values.description || undefined}
                    onGenerated={(desc: string) => form.setFieldValue('description', desc)}
                  />
                </Box>
              </Box>

              <Divider />
              <GreetingMessagesInput
                value={form.values.greeting_messages}
                onChange={(msgs) => form.setFieldValue('greeting_messages', msgs)}
              />

              <Divider />

              <Group justify="flex-end">
                <Button variant="default" onClick={handleClose} disabled={isSaving}>
                  Cancel
                </Button>
                <Button type="submit" loading={isSaving} disabled={!form.isDirty()}>
                  Save Changes
                </Button>
              </Group>
            </Stack>
          </form>
        ) : (
          <Box className={classes.iamContainer}>
            <ManageAccessTable
              principals={principals}
              isLoading={isPrincipalsLoading}
              hasFetched={hasPrincipalsFetched}
              error={principalsError}
              onRoleChange={handleRoleChange}
              onDeletePrincipal={handleDeletePrincipal}
              onAddPrincipal={() => setIsAddPrincipalOpen(true)}
              entityName="chat agent"
              onRefreshPrincipal={async (principalId, principalType) => {
                if (!apiClient || !selectedTenant) return;
                await apiClient.refreshPrincipal(principalId, { tenant_id: selectedTenant.id, type: principalType as 'IDENTITY_USER' | 'IDENTITY_GROUP' });
                await fetchPrincipals(false);
              }}
            />
          </Box>
        )}
      </Modal>

      <AddPrincipalDialog
        opened={isAddPrincipalOpen}
        onClose={() => setIsAddPrincipalOpen(false)}
        onSubmit={handleAddPrincipals}
        entityName="chat agent"
        existingPrincipalIds={principals.map((p) => p.principalId)}
      />

      {/* Create Credential Dialog */}
      <CreateCredentialDialog
        opened={createCredentialOpen}
        onClose={() => setCreateCredentialOpen(false)}
        onSuccess={handleCredentialCreated}
      />

    </>
  );
};
