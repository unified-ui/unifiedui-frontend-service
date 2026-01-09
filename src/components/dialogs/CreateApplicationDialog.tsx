import { type FC, useState, useEffect, useMemo } from 'react';
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
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconSparkles, IconPlus, IconAlertCircle } from '@tabler/icons-react';
import { useIdentity } from '../../contexts';
import {
  ApplicationTypeEnum,
  N8NApiVersionEnum,
  N8NWorkflowTypeEnum,
  FoundryAgentTypeEnum,
  FoundryApiVersionEnum,
  CredentialTypeEnum,
  type CredentialResponse,
  type N8NApplicationConfig,
  type FoundryApplicationConfig,
} from '../../api/types';
import { TagInput } from '../common';
import { CreateCredentialDialog } from './CreateCredentialDialog';

const APPLICATION_TYPES = [
  { value: ApplicationTypeEnum.N8N, label: 'n8n' },
  { value: ApplicationTypeEnum.MICROSOFT_FOUNDRY, label: 'Microsoft Foundry' },
  { value: ApplicationTypeEnum.REST_API, label: 'REST API' },
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

interface CreateApplicationDialogProps {
  opened: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormValues {
  name: string;
  type: string;
  description: string;
  tags: string[];
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
}

export const CreateApplicationDialog: FC<CreateApplicationDialogProps> = ({
  opened,
  onClose,
  onSuccess,
}) => {
  const { apiClient, selectedTenant } = useIdentity();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [credentials, setCredentials] = useState<CredentialResponse[]>([]);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);
  const [createCredentialOpen, setCreateCredentialOpen] = useState(false);
  const [credentialFieldTarget, setCredentialFieldTarget] = useState<'api_key' | 'chat_auth' | null>(null);

  const form = useForm<FormValues>({
    initialValues: {
      name: '',
      type: '',
      description: '',
      tags: [],
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
    },
    validate: {
      name: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Name ist erforderlich';
        }
        if (value.length > 255) {
          return 'Name darf maximal 255 Zeichen lang sein';
        }
        return null;
      },
      type: (value) => {
        if (!value) {
          return 'Typ ist erforderlich';
        }
        return null;
      },
      description: (value) => {
        if (value && value.length > 2000) {
          return 'Beschreibung darf maximal 2000 Zeichen lang sein';
        }
        return null;
      },
      n8n_chat_url: (value, values) => {
        if (values.type === ApplicationTypeEnum.N8N) {
          if (!value || value.trim().length === 0) {
            return 'Chat URL ist erforderlich';
          }
          try {
            new URL(value);
          } catch {
            return 'Ungültige URL';
          }
        }
        return null;
      },
      n8n_workflow_endpoint: (value, values) => {
        if (values.type === ApplicationTypeEnum.N8N) {
          if (!value || value.trim().length === 0) {
            return 'Workflow Endpoint ist erforderlich';
          }
          try {
            const url = new URL(value);
            if (!url.pathname.includes('/workflow/')) {
              return 'URL muss "/workflow/" enthalten';
            }
          } catch {
            return 'Ungültige URL';
          }
        }
        return null;
      },
      n8n_api_api_key_credential_id: (value, values) => {
        if (values.type === ApplicationTypeEnum.N8N) {
          if (!value || value.trim().length === 0) {
            return 'API Key Credential ist erforderlich';
          }
        }
        return null;
      },
      n8n_chat_history_count: (value, values) => {
        if (values.type === ApplicationTypeEnum.N8N && values.n8n_use_unified_chat_history) {
          if (value < 1 || value > 100) {
            return 'Chat History Count muss zwischen 1 und 100 liegen';
          }
        }
        return null;
      },
      foundry_project_endpoint: (value, values) => {
        if (values.type === ApplicationTypeEnum.MICROSOFT_FOUNDRY) {
          if (!value || value.trim().length === 0) {
            return 'Project Endpoint ist erforderlich';
          }
          try {
            new URL(value);
          } catch {
            return 'Ungültige URL';
          }
        }
        return null;
      },
      foundry_agent_name: (value, values) => {
        if (values.type === ApplicationTypeEnum.MICROSOFT_FOUNDRY) {
          if (!value || value.trim().length === 0) {
            return 'Agent Name ist erforderlich';
          }
        }
        return null;
      },
    },
  });

  // Load credentials when dialog opens
  useEffect(() => {
    const loadCredentials = async () => {
      if (!opened || !apiClient || !selectedTenant) return;
      
      setIsLoadingCredentials(true);
      try {
        const response = await apiClient.listCredentials(selectedTenant.id, { limit: 999 });
        // listCredentials returns an array directly, not an object with items property
        setCredentials(Array.isArray(response) ? response as CredentialResponse[] : []);
      } catch (error) {
        console.error('Failed to load credentials:', error);
      } finally {
        setIsLoadingCredentials(false);
      }
    };

    loadCredentials();
  }, [opened, apiClient, selectedTenant]);

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

  const handleSubmit = async (values: FormValues) => {
    if (!apiClient || !selectedTenant) return;

    setIsSubmitting(true);
    try {
      // Build config based on application type
      let config: N8NApplicationConfig | FoundryApplicationConfig | undefined;
      
      if (values.type === ApplicationTypeEnum.N8N) {
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
      } else if (values.type === ApplicationTypeEnum.MICROSOFT_FOUNDRY) {
        config = {
          agent_type: values.foundry_agent_type as FoundryAgentTypeEnum,
          api_version: values.foundry_api_version as FoundryApiVersionEnum,
          project_endpoint: values.foundry_project_endpoint.trim(),
          agent_name: values.foundry_agent_name.trim(),
        };
      }

      // Create the application
      const application = await apiClient.createApplication(selectedTenant.id, {
        name: values.name.trim(),
        type: values.type as ApplicationTypeEnum,
        description: values.description?.trim() || undefined,
        config: config as Record<string, unknown> | undefined,
      });

      // If tags were added, save them to the application
      if (values.tags.length > 0) {
        try {
          await apiClient.setApplicationTags(
            selectedTenant.id,
            application.id,
            values.tags
          );
        } catch (tagError) {
          console.error('Failed to save tags:', tagError);
          // Application was created successfully, just tags failed
        }
      }

      form.reset();
      onSuccess?.();
      onClose();
    } catch (error) {
      // Error handling is done by the API client
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const handleOpenCreateCredential = (target: 'api_key' | 'chat_auth') => {
    setCredentialFieldTarget(target);
    setCreateCredentialOpen(true);
  };

  const handleCredentialCreated = async (credential?: { id: string; name: string }) => {
    // Refresh credentials list
    if (apiClient && selectedTenant) {
      try {
        const response = await apiClient.listCredentials(selectedTenant.id, { limit: 999 });
        setCredentials(Array.isArray(response) ? response as CredentialResponse[] : []);
        
        // Auto-select the newly created credential
        if (credential && credentialFieldTarget) {
          if (credentialFieldTarget === 'api_key') {
            form.setFieldValue('n8n_api_api_key_credential_id', credential.id);
          } else if (credentialFieldTarget === 'chat_auth') {
            form.setFieldValue('n8n_chat_auth_credential_id', credential.id);
          }
        }
      } catch (error) {
        console.error('Failed to refresh credentials:', error);
      }
    }
    setCredentialFieldTarget(null);
  };

  const isN8N = form.values.type === ApplicationTypeEnum.N8N;

  return (
    <>
      <Modal
        opened={opened}
        onClose={handleClose}
        title={
          <Group gap="sm">
            <IconSparkles size={24} />
            <Text fw={600} size="lg">Chat Agent erstellen</Text>
          </Group>
        }
        size="lg"
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Name"
              placeholder="Geben Sie einen Namen ein"
              required
              withAsterisk
              maxLength={255}
              data-autofocus
              {...form.getInputProps('name')}
            />

            <Select
              label="Typ"
              placeholder="Wählen Sie einen Typ"
              required
              withAsterisk
              data={APPLICATION_TYPES}
              {...form.getInputProps('type')}
            />

            {/* N8N Configuration Section */}
            {isN8N && (
              <>
                <Divider label="N8N Konfiguration" labelPosition="center" />

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
                  description="Die URL zum N8N Workflow (z.B. https://n8n.example.com/workflow/abc123)"
                  required
                  withAsterisk
                  {...form.getInputProps('n8n_workflow_endpoint')}
                />

                {/* API Key Credential with Add Button */}
                <Group gap="xs" align="flex-end">
                  <Select
                    label="API Key Credential"
                    placeholder={isLoadingCredentials ? 'Laden...' : 'Wählen Sie ein Credential'}
                    required
                    withAsterisk
                    data={apiKeyCredentials}
                    rightSection={isLoadingCredentials ? <Loader size="xs" /> : undefined}
                    disabled={isLoadingCredentials}
                    style={{ flex: 1 }}
                    {...form.getInputProps('n8n_api_api_key_credential_id')}
                  />
                  <Tooltip label="Neues API Key Credential erstellen">
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
                    Keine API Key Credentials vorhanden. Erstellen Sie zuerst ein Credential.
                  </Alert>
                )}

                {/* Chat Auth Credential (Optional) with Add Button */}
                <Group gap="xs" align="flex-end">
                  <Select
                    label="Chat Auth Credential (Optional)"
                    placeholder={isLoadingCredentials ? 'Laden...' : 'Wählen Sie ein Credential (optional)'}
                    data={chatAuthCredentials}
                    rightSection={isLoadingCredentials ? <Loader size="xs" /> : undefined}
                    disabled={isLoadingCredentials}
                    clearable
                    style={{ flex: 1 }}
                    {...form.getInputProps('n8n_chat_auth_credential_id')}
                  />
                  <Tooltip label="Neues Basic Auth Credential erstellen">
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
                  label="Unified Chat History verwenden"
                  description="Wenn aktiviert, wird der Chat-Verlauf im Agent Service verwaltet"
                  {...form.getInputProps('n8n_use_unified_chat_history', { type: 'checkbox' })}
                />

                {form.values.n8n_use_unified_chat_history && (
                  <NumberInput
                    label="Chat History Count"
                    description="Anzahl der Nachrichten im Chat-Verlauf (1-100)"
                    min={1}
                    max={100}
                    {...form.getInputProps('n8n_chat_history_count')}
                  />
                )}
              </>
            )}

            {/* Microsoft Foundry Configuration Section */}
            {form.values.type === ApplicationTypeEnum.MICROSOFT_FOUNDRY && (
              <>
                <Divider label="Microsoft Foundry Konfiguration" labelPosition="center" />

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
                  placeholder="https://your-project.services.ai.azure.com"
                  required
                  withAsterisk
                  {...form.getInputProps('foundry_project_endpoint')}
                />

                <TextInput
                  label="Agent Name"
                  placeholder="z.B. MyAssistantAgent"
                  required
                  withAsterisk
                  {...form.getInputProps('foundry_agent_name')}
                />
              </>
            )}

            <TagInput
              label="Tags"
              placeholder="Tag eingeben und mit Space bestätigen..."
              value={form.values.tags}
              onChange={(tags) => form.setFieldValue('tags', tags)}
            />

            <Textarea
              label="Beschreibung"
              placeholder="Optionale Beschreibung"
              maxLength={2000}
              minRows={3}
              maxRows={6}
              autosize
              {...form.getInputProps('description')}
            />

            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={handleClose} disabled={isSubmitting}>
                Abbrechen
              </Button>
              <Button type="submit" loading={isSubmitting}>
                Erstellen
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
    </>
  );
};
