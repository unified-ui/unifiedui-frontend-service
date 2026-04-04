import type { FC } from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Modal,
  TextInput,
  Textarea,
  Button,
  Stack,
  Group,
  LoadingOverlay,
  Alert,
  Box,
  Text,
  Badge,
  SegmentedControl,
  Divider,
  Switch,
  Select,
  ActionIcon,
  Tooltip,
  Loader,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDebouncedValue } from '@mantine/hooks';
import { IconAlertCircle, IconRobot, IconInfoCircle, IconShieldLock, IconPlus } from '@tabler/icons-react';
import { useIdentity } from '../../../contexts';
import { useTranslation } from 'react-i18next';
import { GenerateWithAIButton } from '../../common/GenerateWithAIButton';
import { useEntityPermissions, usePermissions } from '../../../hooks';
import { ManageAccessTable, TagInput, AddPrincipalDialog, KeyValuePairsInput, ConnectionTestButton, FilterableSelect } from '../../common';
import type { KeyValuePair } from '../../common';
import type { WorkflowResponse, PrincipalTypeEnum, CredentialResponse } from '../../../api/types';
import { PermissionActionEnum, WorkflowTypeEnum, CredentialTypeEnum, TestConnectionType } from '../../../api/types';
import type { SelectedPrincipal } from '../../common/AddPrincipalDialog/AddPrincipalDialog';
import { CreateCredentialDialog } from '../CreateCredentialDialog';
import { useFormDirtyGuard } from '../../../hooks';
import classes from './EditWorkflowDialog.module.css';

export type EditDialogTab = 'details' | 'iam';

const API_VERSIONS = [
  { value: 'v1', label: 'v1' },
];

interface FormValues {
  name: string;
  description: string;
  tags: string[];
  is_active: boolean;
  allow_api_keys: boolean;
  // N8N Config
  n8n_api_version: string;
  n8n_workflow_endpoint: string;
  n8n_api_api_key_credential_id: string;
  n8n_enable_start_workflow: boolean;
  n8n_webhook_url: string;
  n8n_default_body: string;
  n8n_default_query_params: KeyValuePair[];
}

export interface EditWorkflowDialogProps {
  opened: boolean;
  workflowId: string | null;
  initialData?: WorkflowResponse | null;
  activeTab?: EditDialogTab;
  onClose: () => void;
  onSuccess?: () => void;
  onTabChange?: (tab: EditDialogTab) => void;
}

export const EditWorkflowDialog: FC<EditWorkflowDialogProps> = ({
  opened,
  workflowId,
  initialData,
  activeTab = 'details',
  onClose,
  onSuccess,
  onTabChange,
}) => {
  const { apiClient, selectedTenant } = useIdentity();
  const { t } = useTranslation('common');
  const { isGlobalAdmin } = usePermissions();
  const showIamTab = isGlobalAdmin || !initialData || initialData.my_permission === 'ADMIN';
  const [workflow, setWorkflow] = useState<WorkflowResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddPrincipalOpen, setIsAddPrincipalOpen] = useState(false);
  const [credentials, setCredentials] = useState<CredentialResponse[]>([]);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);
  const [createCredentialOpen, setCreateCredentialOpen] = useState(false);
  const [credentialSearch, setCredentialSearch] = useState('');
  const [debouncedCredentialSearch] = useDebouncedValue(credentialSearch, 300);

  // Use the generic permissions hook
  const {
    principals,
    isLoading: isPrincipalsLoading,
    hasFetched: hasPrincipalsFetched,
    error: principalsError,
    fetchPrincipals,
    handleRoleChange,
    handleAddPrincipals,
    handleDeletePrincipal,
    resetState: resetPrincipalsState,
  } = useEntityPermissions({
    entityType: 'workflow',
    entityId: workflowId,
  });

  const form = useForm<FormValues>({
    initialValues: {
      name: '',
      description: '',
      tags: [],
      is_active: true,
      allow_api_keys: false,
      n8n_api_version: 'v1',
      n8n_workflow_endpoint: '',
      n8n_api_api_key_credential_id: '',
      n8n_enable_start_workflow: false,
      n8n_webhook_url: '',
      n8n_default_body: '{}',
      n8n_default_query_params: [],
    },
    validate: {
      name: (value) => {
        if (!value.trim()) return 'Name is required';
        if (value.length > 255) return 'Name must be 255 characters or less';
        return null;
      },
      n8n_workflow_endpoint: (value) => {
        if (workflow?.type === WorkflowTypeEnum.N8N) {
          if (!value || value.trim().length === 0) {
            return 'Workflow Endpoint is required';
          }
          try {
            const url = new URL(value);
            if (!url.pathname.includes('/workflow/')) {
              return 'URL must contain /workflow/ in path';
            }
          } catch {
            return 'Invalid URL';
          }
        }
        return null;
      },
      n8n_api_api_key_credential_id: (value) => {
        if (workflow?.type === WorkflowTypeEnum.N8N) {
          if (!value || value.trim().length === 0) {
            return 'API Key Credential is required';
          }
        }
        return null;
      },
      n8n_default_body: (value) => {
        if (workflow?.type === WorkflowTypeEnum.N8N) {
          const trimmed = value.trim();
          if (trimmed && trimmed !== '{}') {
            try {
              JSON.parse(trimmed);
            } catch {
              return 'Invalid JSON';
            }
          }
        }
        return null;
      },
    },
  });

  useFormDirtyGuard(form.isDirty());

  // Load credentials
  const loadCredentials = useCallback(async (searchTerm?: string) => {
    if (!apiClient || !selectedTenant) return;

    setIsLoadingCredentials(true);
    try {
      const response = await apiClient.listCredentials(selectedTenant.id, {
        limit: 100,
        order_by: 'name',
        order_direction: 'asc',
        ...(searchTerm && { name: searchTerm }),
        fields: 'id,name,type',
      });
      setCredentials(Array.isArray(response) ? response as CredentialResponse[] : []);
    } catch (err) {
      console.error('Failed to load credentials:', err);
    } finally {
      setIsLoadingCredentials(false);
    }
  }, [apiClient, selectedTenant]);

  useEffect(() => {
    if (opened && debouncedCredentialSearch !== undefined) {
      loadCredentials(debouncedCredentialSearch || undefined);
    }
    if (!opened) {
      setCredentialSearch('');
    }
  }, [opened, debouncedCredentialSearch, loadCredentials]);

  // Filter credentials by type for API Key dropdown (only API_KEY type)
  const apiKeyCredentials = useMemo(() => {
    return credentials
      .filter((c) => c.type === CredentialTypeEnum.API_KEY)
      .map((c) => ({ value: c.id, label: c.name }));
  }, [credentials]);

  // Initialize form from data
  const initializeFromData = useCallback(
    (data: WorkflowResponse) => {
      setWorkflow(data);

      // Extract N8N config if available
      const config = data.config || {};

      form.setValues({
        name: data.name,
        description: data.description || '',
        tags: data.tags?.map((t) => t.name) || [],
        is_active: data.is_active,
        allow_api_keys: data.allow_api_keys,
        n8n_api_version: (config.api_version as string) || 'v1',
        n8n_workflow_endpoint: (config.workflow_endpoint as string) || '',
        n8n_api_api_key_credential_id: (config.api_api_key_credential_id as string) || '',
        n8n_enable_start_workflow: !!(config.webhook_url as string),
        n8n_webhook_url: (config.webhook_url as string) || '',
        n8n_default_body: config.default_body ? JSON.stringify(config.default_body, null, 2) : '{}',
        n8n_default_query_params: config.default_query_params
          ? Object.entries(config.default_query_params as Record<string, string>).map(([key, value]) => ({ key, value }))
          : [],
      });
      form.resetDirty();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Fetch workflow details
  const fetchWorkflow = useCallback(async () => {
    if (!apiClient || !selectedTenant || !workflowId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.getWorkflow(selectedTenant.id, workflowId);
      initializeFromData(data);
    } catch (err) {
      console.error('Failed to fetch workflow:', err);
      setError('Failed to load workflow details');
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, selectedTenant, workflowId, initializeFromData]);

  // Fetch data when dialog opens
  useEffect(() => {
    if (opened && workflowId) {
      if (initialData) {
        initializeFromData(initialData);
      } else {
        fetchWorkflow();
      }
      // Always fetch principals (they're not in the list data)
      fetchPrincipals();
    } else if (!opened) {
      resetPrincipalsState();
    }
  }, [opened, workflowId, initialData, initializeFromData, fetchWorkflow, fetchPrincipals, resetPrincipalsState]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    const tab = value as EditDialogTab;
    onTabChange?.(tab);
  };

  // Handle form submit
  const handleSubmit = async (values: FormValues) => {
    if (!apiClient || !selectedTenant || !workflowId) return;

    setIsSaving(true);
    setError(null);

    try {
      // Build config if this is an N8N agent
      let config: Record<string, unknown> | undefined;
      if (workflow?.type === WorkflowTypeEnum.N8N) {
        config = {
          api_version: values.n8n_api_version,
          workflow_endpoint: values.n8n_workflow_endpoint.trim(),
          api_api_key_credential_id: values.n8n_api_api_key_credential_id,
        };
        if (values.n8n_enable_start_workflow && values.n8n_webhook_url.trim()) {
          config.webhook_url = values.n8n_webhook_url.trim();
          const bodyTrimmed = values.n8n_default_body.trim();
          if (bodyTrimmed && bodyTrimmed !== '{}') {
            try {
              config.default_body = JSON.parse(bodyTrimmed);
            } catch { /* ignore invalid JSON */ }
          }
          const filledPairs = values.n8n_default_query_params.filter((p) => p.key.trim());
          if (filledPairs.length > 0) {
            config.default_query_params = Object.fromEntries(
              filledPairs.map((p) => [p.key.trim(), p.value])
            );
          }
        }
      }

      // Update workflow
      await apiClient.updateWorkflow(selectedTenant.id, workflowId, {
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        is_active: values.is_active,
        allow_api_keys: values.allow_api_keys,
        config,
      });

      // Update tags if changed
      const currentTags = workflow?.tags?.map((t) => t.name) || [];
      const newTags = values.tags;

      if (JSON.stringify(currentTags.sort()) !== JSON.stringify(newTags.sort())) {
        await apiClient.setWorkflowTags(selectedTenant.id, workflowId, newTags);
      }

      form.resetDirty();
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to update workflow:', err);
      setError('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle open create credential dialog
  const handleOpenCreateCredential = () => {
    setCreateCredentialOpen(true);
  };

  // Handle credential created
  const handleCredentialCreated = async (credential?: { id: string; name: string }) => {
    // Refresh credentials list
    await loadCredentials();

    // Auto-select the newly created credential
    if (credential) {
      form.setFieldValue('n8n_api_api_key_credential_id', credential.id);
    }
  };

  // Check if this is an N8N agent
  const isN8N = workflow?.type === WorkflowTypeEnum.N8N;

  // Handle adding principals with callback
  const handleAddPrincipalsWithRole = useCallback(
    async (selectedPrincipals: SelectedPrincipal[], roles: string[]) => {
      const role = roles[0] as PermissionActionEnum || PermissionActionEnum.READ;
      await handleAddPrincipals(selectedPrincipals, role);
    },
    [handleAddPrincipals]
  );

  // Handle role change with type conversion
  const handleRoleChangeWithTypes = useCallback(
    async (principalId: string, principalType: PrincipalTypeEnum, role: PermissionActionEnum, enabled: boolean) => {
      await handleRoleChange(principalId, principalType, role, enabled);
    },
    [handleRoleChange]
  );

  // Handle delete principal with type conversion
  const handleDeletePrincipalWithTypes = useCallback(
    async (principalId: string, principalType: PrincipalTypeEnum) => {
      await handleDeletePrincipal(principalId, principalType);
    },
    [handleDeletePrincipal]
  );

  // Handle close
  const handleClose = () => {
    form.reset();
    setError(null);
    setWorkflow(null);
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
              <IconRobot size={20} />
            </Box>
            <Stack gap={2}>
              <Text fw={600} size="lg">
                {workflow?.name}
              </Text>
              {workflow && (
                <Group gap="xs">
                  <Badge size="xs" variant="light" color={workflow.is_active ? 'green' : 'gray'}>
                    {workflow.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Text size="xs" c="dimmed">
                    Workflow
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
              <TextInput
                label="Name"
                placeholder="Enter a name"
                required
                withAsterisk
                maxLength={255}
                {...form.getInputProps('name')}
              />

              <Group gap="md">
                <Badge size="lg" variant="light" color="blue">
                  {workflow?.type || 'Unknown'}
                </Badge>
                <Switch
                  label="Active"
                  description="Enable or disable this workflow"
                  checked={form.values.is_active}
                  onChange={(e) => form.setFieldValue('is_active', e.currentTarget.checked)}
                  classNames={{ track: classes.switchTrack }}
                />
                <Switch
                  label="Allow API Keys"
                  description="When enabled, this agent can be accessed using API key authentication"
                  checked={form.values.allow_api_keys}
                  onChange={(e) => form.setFieldValue('allow_api_keys', e.currentTarget.checked)}
                  classNames={{ track: classes.switchTrack }}
                />
              </Group>

              {/* N8N Configuration Section */}
              {isN8N && (
                <>
                  <Divider label="n8n Configuration" labelPosition="center" />

                  <Select
                    label="API Version"
                    placeholder="Select a version"
                    required
                    withAsterisk
                    data={API_VERSIONS}
                    {...form.getInputProps('n8n_api_version')}
                  />

                  <TextInput
                    label="Workflow Endpoint"
                    placeholder="https://your-n8n.com/workflow/{id}"
                    description="URL must contain /workflow/ in path"
                    required
                    withAsterisk
                    {...form.getInputProps('n8n_workflow_endpoint')}
                  />
                  <ConnectionTestButton
                    testType={TestConnectionType.N8N_WORKFLOW}
                    url={form.values.n8n_workflow_endpoint}
                    credentialId={form.values.n8n_api_api_key_credential_id || undefined}
                    disabled={!form.values.n8n_workflow_endpoint || !form.values.n8n_api_api_key_credential_id}
                  />

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
                        onClick={handleOpenCreateCredential}
                      >
                        <IconPlus size={18} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>

                  {apiKeyCredentials.length === 0 && !isLoadingCredentials && (
                    <Alert icon={<IconAlertCircle size={16} />} color="yellow" variant="light">
                      No API Key Credentials available. Create one first.
                    </Alert>
                  )}
                </>
              )}

              {workflow?.type === WorkflowTypeEnum.N8N && (
                <>
                  <Switch
                    label="Enable Start Workflow"
                    description="Allow triggering the workflow via webhook with optional defaults"
                    checked={form.values.n8n_enable_start_workflow}
                    onChange={(e) => form.setFieldValue('n8n_enable_start_workflow', e.currentTarget.checked)}
                  />

                  {form.values.n8n_enable_start_workflow && (
                    <>
                      <TextInput
                        label="Webhook URL"
                        placeholder="https://your-n8n.example.com/webhook/..."
                        description="Webhook URL to trigger the workflow"
                        required
                        withAsterisk
                        {...form.getInputProps('n8n_webhook_url')}
                      />
                      <ConnectionTestButton
                        testType={TestConnectionType.N8N_WEBHOOK}
                        url={form.values.n8n_webhook_url}
                        disabled={!form.values.n8n_webhook_url}
                        hint={t('testConnectionHintWebhook')}
                      />
                      <Textarea
                        label="Default Body (JSON)"
                        placeholder="{}"
                        description="Pre-filled request body when starting the workflow"
                        minRows={3}
                        maxRows={6}
                        autosize
                        styles={{ input: { fontFamily: 'monospace' } }}
                        value={form.values.n8n_default_body}
                        error={form.errors.n8n_default_body}
                        onChange={(e) => form.setFieldValue('n8n_default_body', e.currentTarget.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Tab') {
                            e.preventDefault();
                            const ta = e.currentTarget;
                            const s = ta.selectionStart;
                            const end = ta.selectionEnd;
                            const val = form.values.n8n_default_body;
                            form.setFieldValue('n8n_default_body', val.substring(0, s) + '  ' + val.substring(end));
                            requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = s + 2; });
                          }
                        }}
                      />
                      <KeyValuePairsInput
                        label="Default Query Params"
                        description="Key-value pairs pre-filled when starting the workflow"
                        value={form.values.n8n_default_query_params}
                        onChange={(pairs) => form.setFieldValue('n8n_default_query_params', pairs)}
                      />
                    </>
                  )}
                </>
              )}

              <TagInput
                label="Tags"
                placeholder="Enter a tag and press Space to add..."
                value={form.values.tags}
                onChange={(tags) => form.setFieldValue('tags', tags)}
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
                    entityType="workflow"
                    entityName={form.values.name}
                    existingDescription={form.values.description || undefined}
                    onGenerated={(desc: string) => form.setFieldValue('description', desc)}
                  />
                </Box>
              </Box>

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
              onRoleChange={handleRoleChangeWithTypes}
              onDeletePrincipal={handleDeletePrincipalWithTypes}
              onAddPrincipal={() => setIsAddPrincipalOpen(true)}
              entityName="workflow"
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
        onSubmit={handleAddPrincipalsWithRole}
        entityName="workflow"
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
