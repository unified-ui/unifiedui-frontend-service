import { type FC, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Modal,
  TextInput,
  Textarea,
  Button,
  Group,
  Stack,
  Text,
  Select,
  NumberInput,
  Switch,
  Divider,
  ActionIcon,
  Tooltip,
  Alert,
  Loader,
  Box,
  TagsInput,
  Autocomplete,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDebouncedValue } from '@mantine/hooks';
import { IconSparkles, IconPlus, IconAlertCircle, IconSearch } from '@tabler/icons-react';
import { useIdentity } from '../../../contexts';
import { useTranslation } from 'react-i18next';
import { useConfigSuggestions, useFoundryAgents } from '../../../hooks';
import { GenerateWithAIButton } from '../../common/GenerateWithAIButton';
import {
  ChatAgentTypeEnum,
  N8NApiVersionEnum,
  N8NWorkflowTypeEnum,
  FoundryAgentTypeEnum,
  FoundryApiVersionEnum,
  FoundryAuthTypeEnum,
  FoundryCustomRestApiAuthTypeEnum,
  RestApiAuthTypeEnum,
  CredentialTypeEnum,
  type CredentialResponse,
  type AIModelResponse,
  type N8NChatAgentConfig,
  type FoundryChatAgentConfig,
  type RestApiChatAgentConfig,
  type LlmChatAgentConfig,
} from '../../../api/types';
import { TagInput, ConnectionTestButton, FilterableSelect, EndpointSuggestInput, ModelTestButton } from '../../common';
import { GreetingMessagesInput } from '../../common';
import { TestConnectionType } from '../../../api/types';
import { CreateCredentialDialog } from '../CreateCredentialDialog';
import { N8NWorkflowBrowserDialog } from '../N8NWorkflowBrowserDialog';

const MICROSOFT_FOUNDRY_PROXY = 'MICROSOFT_FOUNDRY_PROXY';

const CHAT_AGENT_TYPES = [
  { value: ChatAgentTypeEnum.MICROSOFT_FOUNDRY, label: 'Microsoft Foundry' },
  { value: MICROSOFT_FOUNDRY_PROXY, label: 'Microsoft Foundry API Proxy' },
  { value: ChatAgentTypeEnum.N8N, label: 'n8n' },
  { value: ChatAgentTypeEnum.REST_API, label: 'REST API' },
  { value: ChatAgentTypeEnum.LLM, label: 'LLM' },
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

const FOUNDRY_AUTH_TYPES = [
  { value: FoundryAuthTypeEnum.ENTRA_ID_USER_TOKEN, label: 'User Token (Forward)' },
  { value: FoundryAuthTypeEnum.ENTRA_ID_APP_REGISTRATION, label: 'Entra ID App Registration' },
  { value: FoundryAuthTypeEnum.API_KEY, label: 'API Key' },
];

const FOUNDRY_AUTH_TYPES_REQUIRING_CREDENTIAL = new Set<FoundryAuthTypeEnum>([
  FoundryAuthTypeEnum.ENTRA_ID_APP_REGISTRATION,
  FoundryAuthTypeEnum.API_KEY,
]);

const FOUNDRY_CUSTOM_REST_API_AUTH_TYPES = [
  { value: FoundryCustomRestApiAuthTypeEnum.USER_TOKEN, label: 'User Token (Forward)' },
  { value: FoundryCustomRestApiAuthTypeEnum.API_KEY, label: 'API Key' },
  { value: FoundryCustomRestApiAuthTypeEnum.ENTRA_ID_APP_REGISTRATION, label: 'Entra ID App Registration' },
];

const REST_API_AUTH_TYPES = [
  { value: RestApiAuthTypeEnum.ANONYMOUS, label: 'Anonymous (No Auth)' },
  { value: RestApiAuthTypeEnum.BASIC_AUTH, label: 'Basic Auth' },
  { value: RestApiAuthTypeEnum.API_KEY, label: 'API Key' },
  { value: RestApiAuthTypeEnum.ENTRA_ID_USER_TOKEN, label: 'Entra ID User Token (Forward)' },
  { value: RestApiAuthTypeEnum.ENTRA_ID_APP_REGISTRATION, label: 'Entra ID App Registration' },
];

const AUTH_TYPES_REQUIRING_CREDENTIAL = new Set<RestApiAuthTypeEnum>([
  RestApiAuthTypeEnum.BASIC_AUTH,
  RestApiAuthTypeEnum.API_KEY,
  RestApiAuthTypeEnum.ENTRA_ID_APP_REGISTRATION,
]);

interface CreateChatAgentDialogProps {
  opened: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultType?: string;
}

interface FormValues {
  name: string;
  type: string;
  description: string;
  tags: string[];
  embed_allowed_origins: string[];
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
  foundry_auth_type: string;
  foundry_credential_id: string;
  foundry_custom_rest_api_endpoint: string;
  foundry_custom_rest_api_auth_type: string;
  foundry_custom_rest_api_api_key_header: string;
  // REST API Config
  rest_api_auth_type: string;
  rest_api_invoke_endpoint: string;
  rest_api_credential_id: string;
  rest_api_api_key_header_name: string;
  rest_api_use_unified_chat_history: boolean;
  rest_api_chat_history_count: number;
  rest_api_enable_conversation_endpoint: boolean;
  rest_api_create_conversation_endpoint: string;
  // LLM Config
  llm_ai_model_id: string;
  llm_system_prompt: string;
  greeting_messages: string[];
}

export const CreateChatAgentDialog: FC<CreateChatAgentDialogProps> = ({
  opened,
  onClose,
  onSuccess,
  defaultType,
}) => {
  const { apiClient, selectedTenant } = useIdentity();
  const { t } = useTranslation('common');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [credentials, setCredentials] = useState<CredentialResponse[]>([]);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);
  const [createCredentialOpen, setCreateCredentialOpen] = useState(false);
  const [credentialFieldTarget, setCredentialFieldTarget] = useState<'api_key' | 'chat_auth' | 'rest_api' | 'foundry' | null>(null);
  const [workflowBrowserOpen, setWorkflowBrowserOpen] = useState(false);
  const [aiModels, setAiModels] = useState<AIModelResponse[]>([]);
  const [isLoadingAiModels, setIsLoadingAiModels] = useState(false);

  // Server-side filtering for credentials
  const [credentialSearch, setCredentialSearch] = useState('');
  const [debouncedCredentialSearch] = useDebouncedValue(credentialSearch, 300);

  const form = useForm<FormValues>({
    initialValues: {
      name: '',
      type: defaultType || '',
      description: '',
      tags: [],
      embed_allowed_origins: [],
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
      foundry_auth_type: FoundryAuthTypeEnum.ENTRA_ID_USER_TOKEN,
      foundry_credential_id: '',
      foundry_custom_rest_api_endpoint: '',
      foundry_custom_rest_api_auth_type: FoundryCustomRestApiAuthTypeEnum.USER_TOKEN,
      foundry_custom_rest_api_api_key_header: 'X-API-Key',
      // REST API Config defaults
      rest_api_auth_type: RestApiAuthTypeEnum.ANONYMOUS,
      rest_api_invoke_endpoint: '',
      rest_api_credential_id: '',
      rest_api_api_key_header_name: 'X-API-Key',
      rest_api_use_unified_chat_history: true,
      rest_api_chat_history_count: 30,
      rest_api_enable_conversation_endpoint: false,
      rest_api_create_conversation_endpoint: '',
      // LLM Config defaults
      llm_ai_model_id: '',
      llm_system_prompt: '',
      greeting_messages: [],
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
      foundry_custom_rest_api_endpoint: (value, values) => {
        if (values.type === MICROSOFT_FOUNDRY_PROXY) {
          if (!value || value.trim().length === 0) {
            return 'Proxy Endpoint URL is required';
          }
          try {
            new URL(value);
          } catch {
            return 'Invalid URL';
          }
        }
        return null;
      },
      foundry_credential_id: (value, values) => {
        if (values.type === MICROSOFT_FOUNDRY_PROXY) {
          const proxyRequiresCredential = values.foundry_custom_rest_api_auth_type === FoundryCustomRestApiAuthTypeEnum.API_KEY
            || values.foundry_custom_rest_api_auth_type === FoundryCustomRestApiAuthTypeEnum.ENTRA_ID_APP_REGISTRATION;
          if (proxyRequiresCredential && !value) {
            return 'Credential is required for this auth type';
          }
        }
        if (values.type === ChatAgentTypeEnum.MICROSOFT_FOUNDRY) {
          if (FOUNDRY_AUTH_TYPES_REQUIRING_CREDENTIAL.has(values.foundry_auth_type as FoundryAuthTypeEnum) && !value) {
            return 'Credential is required for this auth type';
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
        if (values.type === ChatAgentTypeEnum.REST_API) {
          if (AUTH_TYPES_REQUIRING_CREDENTIAL.has(values.rest_api_auth_type as RestApiAuthTypeEnum) && !value) {
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
      llm_ai_model_id: (value, values) => {
        if (values.type === ChatAgentTypeEnum.LLM) {
          if (!value || value.trim().length === 0) {
            return 'AI Model is required';
          }
        }
        return null;
      },
    },
  });

  const { suggestions: configSuggestions } = useConfigSuggestions(
    form.values.type === MICROSOFT_FOUNDRY_PROXY ? ChatAgentTypeEnum.MICROSOFT_FOUNDRY : form.values.type,
  );

  const [debouncedProjectEndpoint] = useDebouncedValue(form.values.foundry_project_endpoint, 500);
  const { agents: foundryAgents, isLoading: isLoadingAgents, refresh: refreshFoundryAgents } = useFoundryAgents(
    form.values.type === ChatAgentTypeEnum.MICROSOFT_FOUNDRY ? debouncedProjectEndpoint : '',
  );
  const foundryAgentNames = useMemo(() => foundryAgents.map((a) => a.name), [foundryAgents]);

  const n8nHostUrl = useMemo(() => {
    const endpoint = form.values.n8n_workflow_endpoint || form.values.n8n_chat_url || '';
    try {
      const url = new URL(endpoint);
      return `${url.protocol}//${url.host}`;
    } catch {
      return '';
    }
  }, [form.values.n8n_workflow_endpoint, form.values.n8n_chat_url]);

  // Load credentials when dialog opens or search changes
  const loadCredentials = useCallback(async (searchTerm?: string) => {
    if (!apiClient || !selectedTenant) return;

    setIsLoadingCredentials(true);
    try {
      const response = await apiClient.listCredentials(selectedTenant.id, {
        limit: 100,
        order_by: 'name',
        order_direction: 'asc',
        name: searchTerm || undefined,
        fields: 'id,name,type',
      });
      // listCredentials returns an array directly, not an object with items property
      setCredentials(Array.isArray(response) ? response as CredentialResponse[] : []);
    } catch (error) {
      console.error('Failed to load credentials:', error);
    } finally {
      setIsLoadingCredentials(false);
    }
  }, [apiClient, selectedTenant]);

  useEffect(() => {
    if (opened && debouncedCredentialSearch !== undefined) {
      loadCredentials(debouncedCredentialSearch);
    }
  }, [opened, debouncedCredentialSearch, loadCredentials]);

  const loadAiModels = useCallback(async () => {
    if (!apiClient || !selectedTenant) return;
    setIsLoadingAiModels(true);
    try {
      const models = await apiClient.listAIModels(selectedTenant.id, {
        limit: 200,
        order_by: 'name',
        order_direction: 'asc',
      });
      setAiModels(
        (Array.isArray(models) ? models : []).filter(
          (m) => m.type === 'LLM_MODEL' && m.is_active,
        ),
      );
    } catch {
      setAiModels([]);
    } finally {
      setIsLoadingAiModels(false);
    }
  }, [apiClient, selectedTenant]);

  useEffect(() => {
    if (opened && form.values.type === ChatAgentTypeEnum.LLM) {
      loadAiModels();
    }
  }, [opened, form.values.type, loadAiModels]);

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
    const authType = form.values.rest_api_auth_type;
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

  // Filter credentials for Foundry based on selected auth type
  const foundryCredentials = useMemo(() => {
    const authType = form.values.foundry_auth_type as FoundryAuthTypeEnum;
    let credType: string | undefined;
    if (form.values.type === MICROSOFT_FOUNDRY_PROXY) {
      const proxyTypeMap: Record<string, string> = {
        [FoundryCustomRestApiAuthTypeEnum.API_KEY]: CredentialTypeEnum.API_KEY,
        [FoundryCustomRestApiAuthTypeEnum.ENTRA_ID_APP_REGISTRATION]: CredentialTypeEnum.ENTRA_ID_APP_REGISTRATION,
      };
      credType = proxyTypeMap[form.values.foundry_custom_rest_api_auth_type];
    } else {
      const typeMap: Record<string, string> = {
        [FoundryAuthTypeEnum.ENTRA_ID_APP_REGISTRATION]: CredentialTypeEnum.ENTRA_ID_APP_REGISTRATION,
        [FoundryAuthTypeEnum.API_KEY]: CredentialTypeEnum.API_KEY,
      };
      credType = typeMap[authType];
    }
    if (!credType) return [];
    return credentials
      .filter((c) => c.type === credType)
      .map((c) => ({ value: c.id, label: c.name }));
  }, [credentials, form.values.type, form.values.foundry_auth_type, form.values.foundry_custom_rest_api_auth_type]);

  const aiModelOptions = useMemo(() => {
    return aiModels.map((m) => ({ value: m.id, label: `${m.name} (${m.provider})` }));
  }, [aiModels]);

  const handleSubmit = async (values: FormValues) => {
    if (!apiClient || !selectedTenant) return;

    setIsSubmitting(true);
    try {
      // Build config based on chat agent type
      let config: N8NChatAgentConfig | FoundryChatAgentConfig | RestApiChatAgentConfig | LlmChatAgentConfig | undefined;

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
        const foundryAuthType = (values.foundry_auth_type || FoundryAuthTypeEnum.ENTRA_ID_USER_TOKEN) as FoundryAuthTypeEnum;
        const needsCredential = FOUNDRY_AUTH_TYPES_REQUIRING_CREDENTIAL.has(foundryAuthType);
        config = {
          agent_type: values.foundry_agent_type as FoundryAgentTypeEnum,
          api_version: values.foundry_api_version as FoundryApiVersionEnum,
          project_endpoint: values.foundry_project_endpoint.trim(),
          agent_name: values.foundry_agent_name.trim(),
          auth_type: foundryAuthType,
          credential_id: needsCredential
            ? values.foundry_credential_id || undefined
            : undefined,
        };
      } else if (values.type === MICROSOFT_FOUNDRY_PROXY) {
        const customRestApiAuthType = values.foundry_custom_rest_api_auth_type as FoundryCustomRestApiAuthTypeEnum;
        const needsCredential = customRestApiAuthType === FoundryCustomRestApiAuthTypeEnum.API_KEY
          || customRestApiAuthType === FoundryCustomRestApiAuthTypeEnum.ENTRA_ID_APP_REGISTRATION;
        config = {
          agent_type: FoundryAgentTypeEnum.AGENT,
          api_version: FoundryApiVersionEnum.V2025_11_15_PREVIEW,
          project_endpoint: '',
          agent_name: '',
          auth_type: FoundryAuthTypeEnum.CUSTOM_REST_API,
          credential_id: needsCredential
            ? values.foundry_credential_id || undefined
            : undefined,
          custom_rest_api_endpoint: values.foundry_custom_rest_api_endpoint.trim(),
          custom_rest_api_auth_type: customRestApiAuthType,
          custom_rest_api_api_key_header: customRestApiAuthType === FoundryCustomRestApiAuthTypeEnum.API_KEY
            ? values.foundry_custom_rest_api_api_key_header.trim() || 'X-API-Key'
            : undefined,
        };
      } else if (values.type === ChatAgentTypeEnum.REST_API) {
        const authType = values.rest_api_auth_type as RestApiAuthTypeEnum;
        config = {
          auth_type: authType,
          invoke_endpoint: values.rest_api_invoke_endpoint.trim(),
          credential_id: AUTH_TYPES_REQUIRING_CREDENTIAL.has(authType)
            ? values.rest_api_credential_id || undefined
            : undefined,
          api_key_header_name: authType === RestApiAuthTypeEnum.API_KEY
            ? values.rest_api_api_key_header_name.trim() || 'X-API-Key'
            : undefined,
          use_unified_chat_history: values.rest_api_use_unified_chat_history,
          chat_history_count: values.rest_api_use_unified_chat_history
            ? values.rest_api_chat_history_count
            : undefined,
          create_conversation_endpoint: values.rest_api_enable_conversation_endpoint
            ? values.rest_api_create_conversation_endpoint.trim() || undefined
            : undefined,
        };
      }

      if (values.type === ChatAgentTypeEnum.LLM) {
        config = {
          ai_model_id: values.llm_ai_model_id,
          system_prompt: values.llm_system_prompt.trim() || undefined,
        };
      }

      // Create the chat agent
      const chatAgent = await apiClient.createChatAgent(selectedTenant.id, {
        name: values.name.trim(),
        type: (values.type === MICROSOFT_FOUNDRY_PROXY
          ? ChatAgentTypeEnum.MICROSOFT_FOUNDRY
          : values.type) as ChatAgentTypeEnum,
        description: values.description?.trim() || undefined,
        is_active: true,
        config: config as Record<string, unknown> | undefined,
        embed_allowed_origins: values.embed_allowed_origins.length > 0
          ? values.embed_allowed_origins.join(';')
          : undefined,
        greeting_messages: values.greeting_messages.filter(Boolean).length > 0
          ? values.greeting_messages.filter(Boolean)
          : undefined,
      });

      // If tags were added, save them to the chat agent
      if (values.tags.length > 0) {
        try {
          await apiClient.setChatAgentTags(
            selectedTenant.id,
            chatAgent.id,
            values.tags
          );
        } catch (tagError) {
          console.error('Failed to save tags:', tagError);
          // Chat agent was created successfully, just tags failed
        }
      }

      form.reset();
      onSuccess?.();
      onClose();
    } catch {
      // Error handling is done by the API client
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const handleOpenCreateCredential = (target: 'api_key' | 'chat_auth' | 'rest_api' | 'foundry') => {
    setCredentialFieldTarget(target);
    setCreateCredentialOpen(true);
  };

  const handleCredentialCreated = async (credential?: { id: string; name: string }) => {
    // Refresh credentials list
    if (apiClient && selectedTenant) {
      try {
        await loadCredentials();

        // Auto-select the newly created credential
        if (credential && credentialFieldTarget) {
          if (credentialFieldTarget === 'api_key') {
            form.setFieldValue('n8n_api_api_key_credential_id', credential.id);
          } else if (credentialFieldTarget === 'chat_auth') {
            form.setFieldValue('n8n_chat_auth_credential_id', credential.id);
          } else if (credentialFieldTarget === 'rest_api') {
            form.setFieldValue('rest_api_credential_id', credential.id);
          } else if (credentialFieldTarget === 'foundry') {
            form.setFieldValue('foundry_credential_id', credential.id);
          }
        }
      } catch (error) {
        console.error('Failed to refresh credentials:', error);
      }
    }
    setCredentialFieldTarget(null);
  };

  const isN8N = form.values.type === ChatAgentTypeEnum.N8N;

  return (
    <>
      <Modal
        opened={opened}
        onClose={handleClose}
        title={
          <Group gap="sm">
            <IconSparkles size={24} />
            <Text fw={600} size="lg">Create Chat Agent</Text>
          </Group>
        }
        size="lg"
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Name"
              placeholder="Enter a name"
              required
              withAsterisk
              maxLength={255}
              data-autofocus
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

            {/* N8N Configuration Section */}
            {isN8N && (
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

                {/* API Key Credential with Add Button */}
                <Group gap="xs" align="flex-end">
                  <FilterableSelect
                    label="API Key Credential"
                    placeholder={isLoadingCredentials ? 'Loading...' : 'Select a credential'}
                    required
                    withAsterisk
                    data={apiKeyCredentials}
                    rightSection={isLoadingCredentials ? <Loader size="xs" /> : undefined}
                    disabled={isLoadingCredentials}
                    nothingFoundMessage="No credentials found"
                    onFilterChange={setCredentialSearch}
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
                  <FilterableSelect
                    label="Chat Auth Credential (Optional)"
                    placeholder={isLoadingCredentials ? 'Loading...' : 'Select a credential (optional)'}
                    data={chatAuthCredentials}
                    rightSection={isLoadingCredentials ? <Loader size="xs" /> : undefined}
                    disabled={isLoadingCredentials}
                    clearable
                    nothingFoundMessage="No credentials found"
                    onFilterChange={setCredentialSearch}
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

                <EndpointSuggestInput
                  label="Chat URL"
                  placeholder="https://your-n8n-instance.com/webhook/..."
                  required
                  withAsterisk
                  suggestions={configSuggestions['chat_url'] || []}
                  {...form.getInputProps('n8n_chat_url')}
                />
                <ConnectionTestButton
                  testType={TestConnectionType.N8N_CHAT_URL}
                  url={form.values.n8n_chat_url}
                  credentialId={form.values.n8n_chat_auth_credential_id || undefined}
                  disabled={!form.values.n8n_chat_url}
                  hint={t('testConnectionHintN8nChat')}
                />

                <Group align="flex-end" gap="xs" wrap="nowrap">
                  <Box style={{ flex: 1 }}>
                    <EndpointSuggestInput
                      label="Workflow Endpoint"
                      placeholder="https://your-n8n-instance.com/workflow/abc123"
                      description="The URL to the N8N workflow (e.g. https://n8n.example.com/workflow/abc123)"
                      required
                      withAsterisk
                      suggestions={configSuggestions['workflow_endpoint'] || []}
                      {...form.getInputProps('n8n_workflow_endpoint')}
                    />
                  </Box>
                  <Tooltip label={!form.values.n8n_api_api_key_credential_id ? 'Select an API Key credential first' : 'Browse workflows'}>
                    <ActionIcon
                      variant="default"
                      size="lg"
                      onClick={() => setWorkflowBrowserOpen(true)}
                      disabled={!form.values.n8n_api_api_key_credential_id}
                      mb={form.getInputProps('n8n_workflow_endpoint').error ? 22 : 0}
                    >
                      <IconSearch size={18} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
                <ConnectionTestButton
                  testType={TestConnectionType.N8N_WORKFLOW}
                  url={form.values.n8n_workflow_endpoint}
                  credentialId={form.values.n8n_api_api_key_credential_id || undefined}
                  disabled={!form.values.n8n_workflow_endpoint || !form.values.n8n_api_api_key_credential_id}
                />

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

                <Select
                  label="Authentication"
                  description="How to authenticate against the Foundry endpoint"
                  required
                  withAsterisk
                  data={FOUNDRY_AUTH_TYPES}
                  {...form.getInputProps('foundry_auth_type')}
                />

                {form.values.foundry_auth_type === FoundryAuthTypeEnum.ENTRA_ID_USER_TOKEN && (
                  <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light">
                    The signed-in user's Entra ID token is forwarded to Foundry. No credential needed.
                  </Alert>
                )}

                {FOUNDRY_AUTH_TYPES_REQUIRING_CREDENTIAL.has(form.values.foundry_auth_type as FoundryAuthTypeEnum) && (
                  <>
                    <Group gap="xs" align="flex-end">
                      <FilterableSelect
                        label="Credential"
                        placeholder={isLoadingCredentials ? 'Loading...' : 'Select a credential'}
                        required
                        withAsterisk
                        data={foundryCredentials}
                        rightSection={isLoadingCredentials ? <Loader size="xs" /> : undefined}
                        disabled={isLoadingCredentials}
                        nothingFoundMessage="No matching credentials found"
                        onFilterChange={setCredentialSearch}
                        style={{ flex: 1 }}
                        {...form.getInputProps('foundry_credential_id')}
                      />
                      <Tooltip label="Create new Credential">
                        <ActionIcon
                          variant="light"
                          color="blue"
                          size="lg"
                          onClick={() => handleOpenCreateCredential('foundry')}
                        >
                          <IconPlus size={18} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>

                    {foundryCredentials.length === 0 && !isLoadingCredentials && (
                      <Alert icon={<IconAlertCircle size={16} />} color="yellow" variant="light">
                        No matching credentials available. Please create a credential first.
                      </Alert>
                    )}
                  </>
                )}

                <Group grow>
                  <Select
                    label="Agent Type"
                    required
                    withAsterisk
                    data={FOUNDRY_AGENT_TYPES}
                    {...form.getInputProps('foundry_agent_type')}
                  />
                  <Autocomplete
                    label="API Version"
                    placeholder="e.g. 2025-11-15-preview"
                    required
                    data={FOUNDRY_API_VERSIONS.map((v) => v.value)}
                    {...form.getInputProps('foundry_api_version')}
                  />
                </Group>

                <EndpointSuggestInput
                  label="Project Endpoint"
                  placeholder="https://your-project.services.ai.azure.com"
                  required
                  withAsterisk
                  suggestions={configSuggestions['project_endpoint'] || []}
                  {...form.getInputProps('foundry_project_endpoint')}
                />

                <EndpointSuggestInput
                  label="Agent Name"
                  placeholder={isLoadingAgents ? 'Loading agents...' : 'e.g. MyAssistantAgent'}
                  required
                  withAsterisk
                  suggestions={foundryAgentNames}
                  onRefresh={refreshFoundryAgents}
                  isRefreshing={isLoadingAgents}
                  {...form.getInputProps('foundry_agent_name')}
                />

                <ConnectionTestButton
                  testType={TestConnectionType.FOUNDRY_AGENT}
                  url={form.values.foundry_project_endpoint}
                  credentialId={
                    FOUNDRY_AUTH_TYPES_REQUIRING_CREDENTIAL.has(form.values.foundry_auth_type as FoundryAuthTypeEnum)
                      ? form.values.foundry_credential_id || undefined
                      : undefined
                  }
                  config={{
                    agent_name: form.values.foundry_agent_name,
                    api_version: form.values.foundry_api_version,
                    auth_type: form.values.foundry_auth_type,
                  }}
                  disabled={
                    !form.values.foundry_project_endpoint ||
                    !form.values.foundry_agent_name ||
                    (FOUNDRY_AUTH_TYPES_REQUIRING_CREDENTIAL.has(form.values.foundry_auth_type as FoundryAuthTypeEnum) &&
                      !form.values.foundry_credential_id)
                  }
                />
              </>
            )}

            {/* Microsoft Foundry API Proxy Configuration Section */}
            {form.values.type === MICROSOFT_FOUNDRY_PROXY && (
              <>
                <Divider label="Foundry API Proxy Configuration" labelPosition="center" />

                <TextInput
                  label="Proxy Endpoint URL"
                  description="The REST API proxy endpoint that speaks the unified-ui SSE protocol"
                  placeholder="http://host.docker.internal:8099/api/v1/agent/invoke"
                  required
                  withAsterisk
                  {...form.getInputProps('foundry_custom_rest_api_endpoint')}
                />

                <Select
                  label="Proxy Authentication"
                  description="How to authenticate against the proxy endpoint"
                  required
                  withAsterisk
                  data={FOUNDRY_CUSTOM_REST_API_AUTH_TYPES}
                  {...form.getInputProps('foundry_custom_rest_api_auth_type')}
                />

                {form.values.foundry_custom_rest_api_auth_type === FoundryCustomRestApiAuthTypeEnum.USER_TOKEN && (
                  <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light">
                    The signed-in user's token is forwarded to the proxy. No credential needed.
                  </Alert>
                )}

                {(form.values.foundry_custom_rest_api_auth_type === FoundryCustomRestApiAuthTypeEnum.API_KEY
                  || form.values.foundry_custom_rest_api_auth_type === FoundryCustomRestApiAuthTypeEnum.ENTRA_ID_APP_REGISTRATION) && (
                  <>
                    {form.values.foundry_custom_rest_api_auth_type === FoundryCustomRestApiAuthTypeEnum.API_KEY && (
                      <TextInput
                        label="API Key Header Name"
                        description="Custom header name for the API key (default: X-API-Key)"
                        placeholder="X-API-Key"
                        {...form.getInputProps('foundry_custom_rest_api_api_key_header')}
                      />
                    )}
                    <Group gap="xs" align="flex-end">
                      <FilterableSelect
                        label="Credential"
                        placeholder={isLoadingCredentials ? 'Loading...' : 'Select a credential'}
                        required
                        withAsterisk
                        data={foundryCredentials}
                        rightSection={isLoadingCredentials ? <Loader size="xs" /> : undefined}
                        disabled={isLoadingCredentials}
                        nothingFoundMessage="No matching credentials found"
                        onFilterChange={setCredentialSearch}
                        style={{ flex: 1 }}
                        {...form.getInputProps('foundry_credential_id')}
                      />
                      <Tooltip label="Create new Credential">
                        <ActionIcon
                          variant="light"
                          color="blue"
                          size="lg"
                          onClick={() => handleOpenCreateCredential('foundry')}
                        >
                          <IconPlus size={18} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>

                    {foundryCredentials.length === 0 && !isLoadingCredentials && (
                      <Alert icon={<IconAlertCircle size={16} />} color="yellow" variant="light">
                        No matching credentials available. Please create a credential first.
                      </Alert>
                    )}
                  </>
                )}

                <ConnectionTestButton
                  testType={TestConnectionType.REST_API_INVOKE}
                  url={form.values.foundry_custom_rest_api_endpoint}
                  credentialId={
                    (form.values.foundry_custom_rest_api_auth_type === FoundryCustomRestApiAuthTypeEnum.API_KEY
                      || form.values.foundry_custom_rest_api_auth_type === FoundryCustomRestApiAuthTypeEnum.ENTRA_ID_APP_REGISTRATION)
                      ? form.values.foundry_credential_id || undefined
                      : undefined
                  }
                  config={{
                    auth_type: form.values.foundry_custom_rest_api_auth_type === FoundryCustomRestApiAuthTypeEnum.USER_TOKEN
                      ? 'ENTRA_ID_USER_TOKEN'
                      : form.values.foundry_custom_rest_api_auth_type,
                    api_key_header_name: form.values.foundry_custom_rest_api_api_key_header || 'X-API-Key',
                  }}
                  disabled={!form.values.foundry_custom_rest_api_endpoint}
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

                {AUTH_TYPES_REQUIRING_CREDENTIAL.has(form.values.rest_api_auth_type as RestApiAuthTypeEnum) && (
                  <>
                    <Group gap="xs" align="flex-end">
                      <FilterableSelect
                        label="Credential"
                        placeholder={isLoadingCredentials ? 'Loading...' : 'Select a credential'}
                        required
                        withAsterisk
                        data={restApiCredentials}
                        rightSection={isLoadingCredentials ? <Loader size="xs" /> : undefined}
                        disabled={isLoadingCredentials}
                        nothingFoundMessage="No matching credentials found"
                        onFilterChange={setCredentialSearch}
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

                <EndpointSuggestInput
                  label="Invoke Endpoint"
                  placeholder="https://api.example.com/agent/invoke"
                  description="The POST endpoint URL for sending messages to the agent"
                  required
                  withAsterisk
                  suggestions={configSuggestions['invoke_endpoint'] || []}
                  {...form.getInputProps('rest_api_invoke_endpoint')}
                />
                <ConnectionTestButton
                  testType={TestConnectionType.REST_API_INVOKE}
                  url={form.values.rest_api_invoke_endpoint}
                  credentialId={form.values.rest_api_credential_id || undefined}
                  config={{
                    auth_type: form.values.rest_api_auth_type,
                    api_key_header_name: form.values.rest_api_api_key_header_name,
                  }}
                  disabled={!form.values.rest_api_invoke_endpoint}
                />

                <Divider label="Chat History" labelPosition="center" />

                <Switch
                  label="Use Unified Chat History"
                  description="When enabled, chat history from unified-ui is sent with each request"
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
                  description="Call an external endpoint to create a conversation before sending the first message"
                  {...form.getInputProps('rest_api_enable_conversation_endpoint', { type: 'checkbox' })}
                />

                {form.values.rest_api_enable_conversation_endpoint && (
                  <>
                    <EndpointSuggestInput
                      label="Create Conversation Endpoint"
                      placeholder="https://api.example.com/conversations"
                      description="POST endpoint that returns a conversation_id"
                      required
                      withAsterisk
                      suggestions={configSuggestions['create_conversation_endpoint'] || []}
                      {...form.getInputProps('rest_api_create_conversation_endpoint')}
                    />
                    <ConnectionTestButton
                      testType={TestConnectionType.REST_API_CONVERSATION}
                      url={form.values.rest_api_create_conversation_endpoint}
                      credentialId={form.values.rest_api_credential_id || undefined}
                      config={{
                        auth_type: form.values.rest_api_auth_type,
                        api_key_header_name: form.values.rest_api_api_key_header_name,
                    }}
                      disabled={!form.values.rest_api_create_conversation_endpoint}
                    />
                  </>
                )}
              </>
            )}

            {form.values.type === ChatAgentTypeEnum.LLM && (
              <>
                <Divider label="LLM Configuration" labelPosition="center" />

                <Select
                  label="AI Model"
                  placeholder={isLoadingAiModels ? 'Loading models...' : 'Select an AI model'}
                  required
                  withAsterisk
                  data={aiModelOptions}
                  disabled={isLoadingAiModels}
                  searchable
                  {...form.getInputProps('llm_ai_model_id')}
                />

                <Textarea
                  label="System Prompt"
                  placeholder="Optional system prompt for the LLM"
                  minRows={3}
                  maxRows={8}
                  autosize
                  {...form.getInputProps('llm_system_prompt')}
                />

                {form.values.llm_ai_model_id && (
                  <ModelTestButton
                    aiModels={aiModels}
                    selectedModelId={form.values.llm_ai_model_id}
                  />
                )}
              </>
            )}

            <TagInput
              label="Tags"
              placeholder="Enter tag and press Space to confirm..."
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

            {form.values.type && form.values.type !== ChatAgentTypeEnum.REACT_AGENT && (
              <>
                <Divider />
                <GreetingMessagesInput
                  value={form.values.greeting_messages}
                  onChange={(msgs) => form.setFieldValue('greeting_messages', msgs)}
                />
              </>
            )}

            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting}>
                Create
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Create Credential Dialog */}
      <CreateCredentialDialog
        opened={createCredentialOpen}
        onClose={() => setCreateCredentialOpen(false)}
        onSuccess={handleCredentialCreated}
      />

      {/* N8N Workflow Browser Dialog */}
      <N8NWorkflowBrowserDialog
        opened={workflowBrowserOpen}
        onClose={() => setWorkflowBrowserOpen(false)}
        host={n8nHostUrl}
        credentialId={form.values.n8n_api_api_key_credential_id}
        onSelect={(wf) => form.setFieldValue('n8n_workflow_endpoint', wf.url)}
      />
    </>
  );
};
