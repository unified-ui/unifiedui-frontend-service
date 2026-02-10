import { useState, useEffect, useCallback } from 'react';
import type { FC } from 'react';
import {
  Modal, TextInput, Textarea, Select, Button, Group, Stack,
  Text, NumberInput, Switch, MultiSelect, Alert, LoadingOverlay, Divider, Box,
  ActionIcon, Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconBrain, IconCheck, IconX, IconAlertCircle, IconPlus } from '@tabler/icons-react';
import { useIdentity } from '../../../contexts';
import { GenerateWithAIButton } from '../../common/GenerateWithAIButton';
import {
  AIModelTypeEnum,
  AIModelProviderEnum,
  AIModelPurposeGroupEnum,
} from '../../../api/types';
import type { QuickListItemResponse } from '../../../api/types';
import { CreateCredentialDialog } from '../CreateCredentialDialog';
import { useFormDirtyGuard } from '../../../hooks';
import classes from './AIModelDialog.module.css';

interface AIModelDialogProps {
  opened: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  modelId?: string | null;
}

interface FormValues {
  name: string;
  description: string;
  type: string;
  provider: string;
  purpose_groups: string[];
  config: Record<string, string>;
  credential_id: string;
  priority: number;
  is_active: boolean;
}

const MODEL_TYPES = [
  { value: AIModelTypeEnum.LLM_MODEL, label: 'LLM Model' },
  { value: AIModelTypeEnum.EMBEDDING_MODEL, label: 'Embedding Model' },
];

const PROVIDERS = [
  { value: AIModelProviderEnum.AZURE_OPENAI, label: 'Azure OpenAI' },
  { value: AIModelProviderEnum.OPENAI, label: 'OpenAI' },
  { value: AIModelProviderEnum.ANTHROPIC, label: 'Anthropic' },
  { value: AIModelProviderEnum.GOOGLE_GENAI, label: 'Google GenAI' },
  { value: AIModelProviderEnum.OLLAMA, label: 'Ollama' },
  { value: AIModelProviderEnum.MISTRAL, label: 'Mistral' },
  { value: AIModelProviderEnum.GROQ, label: 'Groq' },
];

const PURPOSE_GROUPS = [
  { value: AIModelPurposeGroupEnum.REACT_AGENT, label: 'ReAct Agent' },
  { value: AIModelPurposeGroupEnum.CONVERSATION_TITLE_GENERATION, label: 'Title Generation' },
  { value: AIModelPurposeGroupEnum.CONVERSATION_SUMMARIZATION, label: 'Conversation Summarization' },
  { value: AIModelPurposeGroupEnum.DESCRIPTION_GENERATION, label: 'Description Generation' },
  { value: AIModelPurposeGroupEnum.TRACE_ANALYSIS, label: 'Trace Analysis' },
  { value: AIModelPurposeGroupEnum.GENERAL, label: 'General' },
];

const PROVIDER_REQUIRES_CREDENTIAL: Record<string, boolean> = {
  [AIModelProviderEnum.AZURE_OPENAI]: true,
  [AIModelProviderEnum.OPENAI]: true,
  [AIModelProviderEnum.ANTHROPIC]: true,
  [AIModelProviderEnum.GOOGLE_GENAI]: true,
  [AIModelProviderEnum.OLLAMA]: false,
  [AIModelProviderEnum.MISTRAL]: true,
  [AIModelProviderEnum.GROQ]: true,
};

export const AIModelDialog: FC<AIModelDialogProps> = ({
  opened,
  onClose,
  onSuccess,
  modelId,
}) => {
  const { apiClient, selectedTenant } = useIdentity();
  const isEdit = !!modelId;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<QuickListItemResponse[]>([]);
  const [createCredentialOpen, setCreateCredentialOpen] = useState(false);

  const form = useForm<FormValues>({
    initialValues: {
      name: '',
      description: '',
      type: AIModelTypeEnum.LLM_MODEL,
      provider: '',
      purpose_groups: [],
      config: {},
      credential_id: '',
      priority: 0,
      is_active: false,
    },
    validate: {
      name: (value) => {
        if (!value.trim()) return 'Name is required';
        if (value.length > 255) return 'Name must be 255 characters or less';
        return null;
      },
      provider: (value) => (!value ? 'Provider is required' : null),
      type: (value) => (!value ? 'Type is required' : null),
    },
  });

  useFormDirtyGuard(form.isDirty());

  const fetchCredentials = useCallback(async () => {
    if (!apiClient || !selectedTenant) return;
    try {
      const result = await apiClient.listCredentials(selectedTenant.id, {
        view: 'quick-list',
        limit: 200,
      }) as QuickListItemResponse[];
      setCredentials(result);
    } catch {
      setCredentials([]);
    }
  }, [apiClient, selectedTenant]);

  const fetchModel = useCallback(async () => {
    if (!apiClient || !selectedTenant || !modelId) return;
    setIsLoading(true);
    try {
      const model = await apiClient.getAIModel(selectedTenant.id, modelId);
      form.setValues({
        name: model.name,
        description: model.description || '',
        type: model.type,
        provider: model.provider,
        purpose_groups: model.purpose_groups,
        config: model.config as Record<string, string>,
        credential_id: model.credential_id || '',
        priority: model.priority,
        is_active: model.is_active,
      });
      form.resetDirty();
    } catch {
      setError('Failed to load AI model');
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, selectedTenant, modelId]);

  useEffect(() => {
    if (opened) {
      setError(null);
      setTestResult(null);
      fetchCredentials();
      if (isEdit) {
        fetchModel();
      } else {
        form.reset();
      }
    }
  }, [opened, isEdit]);

  const handleSubmit = async (values: FormValues) => {
    if (!apiClient || !selectedTenant) return;
    setIsSubmitting(true);
    setError(null);
    try {
      if (isEdit && modelId) {
        await apiClient.updateAIModel(selectedTenant.id, modelId, {
          name: values.name.trim(),
          description: values.description?.trim() || undefined,
          purpose_groups: values.purpose_groups as AIModelPurposeGroupEnum[],
          config: values.config,
          credential_id: values.credential_id || undefined,
          priority: values.priority,
          is_active: values.is_active,
        });
      } else {
        await apiClient.createAIModel(selectedTenant.id, {
          name: values.name.trim(),
          description: values.description?.trim() || undefined,
          type: values.type as AIModelTypeEnum,
          provider: values.provider as AIModelProviderEnum,
          purpose_groups: values.purpose_groups as AIModelPurposeGroupEnum[],
          config: values.config,
          credential_id: values.credential_id || undefined,
          priority: values.priority,
          is_active: values.is_active,
        });
      }
      form.reset();
      onSuccess?.();
      onClose();
    } catch {
      setError('Failed to save AI model');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestModel = async () => {
    if (!apiClient || !selectedTenant) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await apiClient.testAIModel(selectedTenant.id, {
        provider: form.values.provider,
        config: form.values.config,
        credential_id: form.values.credential_id || undefined,
      });
      setTestResult({ success: result.success, message: result.message });
    } catch {
      setTestResult({ success: false, message: 'Failed to test model connection' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setError(null);
    setTestResult(null);
    onClose();
  };

  const handleOpenCreateCredential = () => {
    setCreateCredentialOpen(true);
  };

  const handleCredentialCreated = async (credential?: { id: string; name: string }) => {
    await fetchCredentials();
    if (credential) {
      form.setFieldValue('credential_id', credential.id);
    }
  };

  const provider = form.values.provider;
  const requiresCredential = provider ? PROVIDER_REQUIRES_CREDENTIAL[provider] ?? true : false;
  const credentialOptions = credentials.map((c) => ({ value: c.id, label: c.name }));

  const renderProviderConfigFields = () => {
    switch (provider) {
      case AIModelProviderEnum.AZURE_OPENAI:
        return (
          <>
            <TextInput
              label="Endpoint"
              placeholder="https://your-resource.openai.azure.com/"
              required
              value={(form.values.config.endpoint as string) || ''}
              onChange={(e) => form.setFieldValue('config', { ...form.values.config, endpoint: e.currentTarget.value })}
            />
            <TextInput
              label="API Version"
              placeholder="2024-12-01-preview"
              required
              value={(form.values.config.api_version as string) || ''}
              onChange={(e) => form.setFieldValue('config', { ...form.values.config, api_version: e.currentTarget.value })}
            />
            <TextInput
              label="Deployment Name"
              placeholder="gpt-4o"
              required
              value={(form.values.config.deployment_name as string) || ''}
              onChange={(e) => form.setFieldValue('config', { ...form.values.config, deployment_name: e.currentTarget.value })}
            />
          </>
        );
      case AIModelProviderEnum.OPENAI:
        return (
          <>
            <TextInput
              label="Model Name"
              placeholder="gpt-4o"
              required
              value={(form.values.config.model_name as string) || ''}
              onChange={(e) => form.setFieldValue('config', { ...form.values.config, model_name: e.currentTarget.value })}
            />
            <TextInput
              label="Base URL"
              placeholder="https://api.openai.com/v1 (optional)"
              value={(form.values.config.base_url as string) || ''}
              onChange={(e) => form.setFieldValue('config', { ...form.values.config, base_url: e.currentTarget.value })}
            />
            <TextInput
              label="Organization"
              placeholder="Optional"
              value={(form.values.config.organization as string) || ''}
              onChange={(e) => form.setFieldValue('config', { ...form.values.config, organization: e.currentTarget.value })}
            />
          </>
        );
      case AIModelProviderEnum.OLLAMA:
        return (
          <>
            <TextInput
              label="Model Name"
              placeholder="llama3"
              required
              value={(form.values.config.model_name as string) || ''}
              onChange={(e) => form.setFieldValue('config', { ...form.values.config, model_name: e.currentTarget.value })}
            />
            <TextInput
              label="Base URL"
              placeholder="http://localhost:11434 (default)"
              value={(form.values.config.base_url as string) || ''}
              onChange={(e) => form.setFieldValue('config', { ...form.values.config, base_url: e.currentTarget.value })}
            />
          </>
        );
      default:
        return (
          <TextInput
            label="Model Name"
            placeholder="Enter model name"
            required
            value={(form.values.config.model_name as string) || ''}
            onChange={(e) => form.setFieldValue('config', { ...form.values.config, model_name: e.currentTarget.value })}
          />
        );
    }
  };

  return (
    <>
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="sm">
          <IconBrain size={24} />
          <Text fw={600} size="lg">{isEdit ? 'Edit AI Model' : 'Create AI Model'}</Text>
        </Group>
      }
      size="lg"
      centered
    >
      <LoadingOverlay visible={isLoading} zIndex={1000} overlayProps={{ blur: 2 }} />

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md" withCloseButton onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Name"
            placeholder="Enter model name"
            required
            withAsterisk
            maxLength={255}
            data-autofocus
            {...form.getInputProps('name')}
          />

          <Group grow>
            <Select
              label="Type"
              placeholder="Select type"
              required
              withAsterisk
              data={MODEL_TYPES}
              disabled={isEdit}
              {...form.getInputProps('type')}
            />
            <Select
              label="Provider"
              placeholder="Select provider"
              required
              withAsterisk
              data={PROVIDERS}
              disabled={isEdit}
              {...form.getInputProps('provider')}
            />
          </Group>

          {provider && (
            <>
              <Divider label="Provider Configuration" labelPosition="center" />
              {renderProviderConfigFields()}

              {requiresCredential && (
                <Group gap="xs" align="flex-end">
                  <Select
                    label="Credential"
                    placeholder="Select a credential"
                    data={credentialOptions}
                    clearable
                    searchable
                    style={{ flex: 1 }}
                    {...form.getInputProps('credential_id')}
                  />
                  <Tooltip label="Create new Credential">
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
              )}

              <Group justify="flex-start">
                <Button
                  variant="light"
                  size="xs"
                  onClick={handleTestModel}
                  loading={isTesting}
                  disabled={!provider}
                >
                  Test Model
                </Button>
                {testResult && (
                  <Group gap="xs">
                    {testResult.success ? (
                      <IconCheck size={16} className={classes.testSuccess} />
                    ) : (
                      <IconX size={16} className={classes.testError} />
                    )}
                    <Text size="xs" c={testResult.success ? 'green' : 'red'}>
                      {testResult.message}
                    </Text>
                  </Group>
                )}
              </Group>
            </>
          )}

          <Divider label="Settings" labelPosition="center" />

          <MultiSelect
            label="Purpose Groups"
            placeholder="Select purpose groups"
            data={PURPOSE_GROUPS}
            {...form.getInputProps('purpose_groups')}
          />

          <Group grow>
            <NumberInput
              label="Priority"
              min={0}
              max={100}
              {...form.getInputProps('priority')}
            />
            <div>
              <Text size="sm" fw={500} mb={4}>Active</Text>
              <Switch
                checked={form.values.is_active}
                onChange={(e) => form.setFieldValue('is_active', e.currentTarget.checked)}
                label={form.values.is_active ? 'Enabled' : 'Disabled'}
              />
            </div>
          </Group>

          <Box pos="relative">
            <Textarea
              label="Description"
              placeholder="Optional description"
              maxLength={2000}
              minRows={2}
              maxRows={4}
              autosize
              {...form.getInputProps('description')}
            />
            <Box pos="absolute" top={0} right={0}>
              <GenerateWithAIButton
                entityType="ai_model"
                entityName={form.values.name}
                existingDescription={form.values.description || undefined}
                onGenerated={(desc: string) => form.setFieldValue('description', desc)}
              />
            </Box>
          </Box>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={isEdit && !form.isDirty()}>
              {isEdit ? 'Save Changes' : 'Create'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>

      <CreateCredentialDialog
        opened={createCredentialOpen}
        onClose={() => setCreateCredentialOpen(false)}
        onSuccess={handleCredentialCreated}
      />
    </>
  );
};
