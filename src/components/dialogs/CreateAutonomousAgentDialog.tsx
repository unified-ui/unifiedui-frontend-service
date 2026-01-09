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
  Divider,
  ActionIcon,
  Tooltip,
  Alert,
  Loader,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconRobot, IconPlus, IconAlertCircle } from '@tabler/icons-react';
import { useIdentity } from '../../contexts';
import {
  AutonomousAgentTypeEnum,
  CredentialTypeEnum,
  type CredentialResponse,
  type N8NAutonomousAgentConfig,
} from '../../api/types';
import { TagInput } from '../common';
import { CreateCredentialDialog } from './CreateCredentialDialog';

const AUTONOMOUS_AGENT_TYPES = [
  { value: AutonomousAgentTypeEnum.N8N, label: 'n8n' },
];

const API_VERSIONS = [
  { value: 'v1', label: 'v1' },
];

interface CreateAutonomousAgentDialogProps {
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
  n8n_workflow_endpoint: string;
  n8n_api_api_key_credential_id: string;
}

export const CreateAutonomousAgentDialog: FC<CreateAutonomousAgentDialogProps> = ({
  opened,
  onClose,
  onSuccess,
}) => {
  const { apiClient, selectedTenant } = useIdentity();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [credentials, setCredentials] = useState<CredentialResponse[]>([]);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);
  const [createCredentialOpen, setCreateCredentialOpen] = useState(false);

  const form = useForm<FormValues>({
    initialValues: {
      name: '',
      type: '',
      description: '',
      tags: [],
      // N8N Config defaults
      n8n_api_version: 'v1',
      n8n_workflow_endpoint: '',
      n8n_api_api_key_credential_id: '',
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
      n8n_workflow_endpoint: (value, values) => {
        if (values.type === AutonomousAgentTypeEnum.N8N) {
          if (!value || value.trim().length === 0) {
            return 'Workflow Endpoint ist erforderlich';
          }
          try {
            const url = new URL(value);
            if (!url.pathname.includes('/workflow/')) {
              return 'URL muss /workflow/ im Pfad enthalten';
            }
          } catch {
            return 'Ungültige URL';
          }
        }
        return null;
      },
      n8n_api_api_key_credential_id: (value, values) => {
        if (values.type === AutonomousAgentTypeEnum.N8N) {
          if (!value || value.trim().length === 0) {
            return 'API Key Credential ist erforderlich';
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

  const handleSubmit = async (values: FormValues) => {
    if (!apiClient || !selectedTenant) return;

    setIsSubmitting(true);
    try {
      // Build config based on agent type
      let config: N8NAutonomousAgentConfig | undefined;

      if (values.type === AutonomousAgentTypeEnum.N8N) {
        config = {
          api_version: values.n8n_api_version,
          workflow_endpoint: values.n8n_workflow_endpoint.trim(),
          api_api_key_credential_id: values.n8n_api_api_key_credential_id,
        };
      }

      // Create the autonomous agent
      const agent = await apiClient.createAutonomousAgent(selectedTenant.id, {
        name: values.name.trim(),
        type: values.type as AutonomousAgentTypeEnum,
        description: values.description?.trim() || undefined,
        config: config as Record<string, unknown> | undefined,
      });

      // If tags were added, save them to the agent
      if (values.tags.length > 0) {
        try {
          await apiClient.setAutonomousAgentTags(
            selectedTenant.id,
            agent.id,
            values.tags
          );
        } catch (tagError) {
          console.error('Failed to save tags:', tagError);
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

  const handleOpenCreateCredential = () => {
    setCreateCredentialOpen(true);
  };

  const handleCredentialCreated = async (credential?: { id: string; name: string }) => {
    // Refresh credentials list
    if (apiClient && selectedTenant) {
      try {
        const response = await apiClient.listCredentials(selectedTenant.id, { limit: 999 });
        setCredentials(Array.isArray(response) ? response as CredentialResponse[] : []);

        // Auto-select the newly created credential
        if (credential) {
          form.setFieldValue('n8n_api_api_key_credential_id', credential.id);
        }
      } catch (error) {
        console.error('Failed to refresh credentials:', error);
      }
    }
  };

  const isN8N = form.values.type === AutonomousAgentTypeEnum.N8N;

  return (
    <>
      <Modal
        opened={opened}
        onClose={handleClose}
        title={
          <Group gap="sm">
            <IconRobot size={24} />
            <Text fw={600} size="lg">Autonomous Agent erstellen</Text>
          </Group>
        }
        size="md"
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
              data={AUTONOMOUS_AGENT_TYPES}
              {...form.getInputProps('type')}
            />

            {/* N8N Configuration Section */}
            {isN8N && (
              <>
                <Divider label="n8n Konfiguration" labelPosition="center" />

                <Select
                  label="API Version"
                  placeholder="Wählen Sie eine Version"
                  required
                  withAsterisk
                  data={API_VERSIONS}
                  {...form.getInputProps('n8n_api_version')}
                />

                <TextInput
                  label="Workflow Endpoint"
                  placeholder="https://your-n8n.com/webhook/.../workflow/..."
                  description="URL muss /workflow/ im Pfad enthalten"
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
                      onClick={handleOpenCreateCredential}
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
