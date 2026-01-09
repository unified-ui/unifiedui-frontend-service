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
import { IconAlertCircle, IconRobot, IconInfoCircle, IconShieldLock, IconPlus } from '@tabler/icons-react';
import { useIdentity } from '../../../contexts';
import { useEntityPermissions } from '../../../hooks';
import { ManageAccessTable, TagInput, AddPrincipalDialog } from '../../common';
import type { AutonomousAgentResponse, PrincipalTypeEnum, CredentialResponse } from '../../../api/types';
import { PermissionActionEnum, AutonomousAgentTypeEnum, CredentialTypeEnum } from '../../../api/types';
import type { SelectedPrincipal } from '../../common/AddPrincipalDialog/AddPrincipalDialog';
import { CreateCredentialDialog } from '../CreateCredentialDialog';
import classes from './EditAutonomousAgentDialog.module.css';

export type EditDialogTab = 'details' | 'iam';

interface FormValues {
  name: string;
  description: string;
  tags: string[];
  is_active: boolean;
  // N8N Config
  n8n_workflow_endpoint: string;
  n8n_api_api_key_credential_id: string;
}

export interface EditAutonomousAgentDialogProps {
  opened: boolean;
  autonomousAgentId: string | null;
  initialData?: AutonomousAgentResponse | null;
  activeTab?: EditDialogTab;
  onClose: () => void;
  onSuccess?: () => void;
  onTabChange?: (tab: EditDialogTab) => void;
}

export const EditAutonomousAgentDialog: FC<EditAutonomousAgentDialogProps> = ({
  opened,
  autonomousAgentId,
  initialData,
  activeTab = 'details',
  onClose,
  onSuccess,
  onTabChange,
}) => {
  const { apiClient, selectedTenant } = useIdentity();
  const [autonomousAgent, setAutonomousAgent] = useState<AutonomousAgentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddPrincipalOpen, setIsAddPrincipalOpen] = useState(false);
  const [credentials, setCredentials] = useState<CredentialResponse[]>([]);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);
  const [createCredentialOpen, setCreateCredentialOpen] = useState(false);

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
    entityType: 'autonomous-agent',
    entityId: autonomousAgentId,
  });

  const form = useForm<FormValues>({
    initialValues: {
      name: '',
      description: '',
      tags: [],
      is_active: true,
      n8n_workflow_endpoint: '',
      n8n_api_api_key_credential_id: '',
    },
    validate: {
      name: (value) => {
        if (!value.trim()) return 'Name is required';
        if (value.length > 255) return 'Name must be 255 characters or less';
        return null;
      },
      n8n_workflow_endpoint: (value) => {
        if (autonomousAgent?.type === AutonomousAgentTypeEnum.N8N) {
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
        if (autonomousAgent?.type === AutonomousAgentTypeEnum.N8N) {
          if (!value || value.trim().length === 0) {
            return 'API Key Credential is required';
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
      } catch (err) {
        console.error('Failed to load credentials:', err);
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

  // Initialize form from data
  const initializeFromData = useCallback(
    (data: AutonomousAgentResponse) => {
      setAutonomousAgent(data);
      
      // Extract N8N config if available
      const config = data.config || {};
      
      form.setValues({
        name: data.name,
        description: data.description || '',
        tags: data.tags?.map((t) => t.name) || [],
        is_active: data.is_active,
        n8n_workflow_endpoint: (config.workflow_endpoint as string) || '',
        n8n_api_api_key_credential_id: (config.api_api_key_credential_id as string) || '',
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Fetch autonomous agent details
  const fetchAutonomousAgent = useCallback(async () => {
    if (!apiClient || !selectedTenant || !autonomousAgentId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.getAutonomousAgent(selectedTenant.id, autonomousAgentId);
      initializeFromData(data);
    } catch (err) {
      console.error('Failed to fetch autonomous agent:', err);
      setError('Failed to load autonomous agent details');
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, selectedTenant, autonomousAgentId, initializeFromData]);

  // Fetch data when dialog opens
  useEffect(() => {
    if (opened && autonomousAgentId) {
      if (initialData) {
        initializeFromData(initialData);
      } else {
        fetchAutonomousAgent();
      }
      // Always fetch principals (they're not in the list data)
      fetchPrincipals();
    } else if (!opened) {
      resetPrincipalsState();
    }
  }, [opened, autonomousAgentId, initialData, initializeFromData, fetchAutonomousAgent, fetchPrincipals, resetPrincipalsState]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    const tab = value as EditDialogTab;
    onTabChange?.(tab);
  };

  // Handle form submit
  const handleSubmit = async (values: FormValues) => {
    if (!apiClient || !selectedTenant || !autonomousAgentId) return;

    setIsSaving(true);
    setError(null);

    try {
      // Build config if this is an N8N agent
      let config: Record<string, unknown> | undefined;
      if (autonomousAgent?.type === AutonomousAgentTypeEnum.N8N) {
        config = {
          workflow_endpoint: values.n8n_workflow_endpoint.trim(),
          api_api_key_credential_id: values.n8n_api_api_key_credential_id,
        };
      }

      // Update autonomous agent
      await apiClient.updateAutonomousAgent(selectedTenant.id, autonomousAgentId, {
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        is_active: values.is_active,
        config,
      });

      // Update tags if changed
      const currentTags = autonomousAgent?.tags?.map((t) => t.name) || [];
      const newTags = values.tags;

      if (JSON.stringify(currentTags.sort()) !== JSON.stringify(newTags.sort())) {
        await apiClient.setAutonomousAgentTags(selectedTenant.id, autonomousAgentId, newTags);
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to update autonomous agent:', err);
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
    if (apiClient && selectedTenant) {
      try {
        const response = await apiClient.listCredentials(selectedTenant.id, { limit: 999 });
        setCredentials(Array.isArray(response) ? response as CredentialResponse[] : []);

        // Auto-select the newly created credential
        if (credential) {
          form.setFieldValue('n8n_api_api_key_credential_id', credential.id);
        }
      } catch (err) {
        console.error('Failed to refresh credentials:', err);
      }
    }
  };

  // Check if this is an N8N agent
  const isN8N = autonomousAgent?.type === AutonomousAgentTypeEnum.N8N;

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
    setAutonomousAgent(null);
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
                {autonomousAgent?.name}
              </Text>
              {autonomousAgent && (
                <Group gap="xs">
                  <Badge size="xs" variant="light" color={autonomousAgent.is_active ? 'green' : 'gray'}>
                    {autonomousAgent.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Text size="xs" c="dimmed">
                    Autonomous Agent
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
                  {autonomousAgent?.type || 'Unknown'}
                </Badge>
                <Switch
                  label="Active"
                  description="Enable or disable this autonomous agent"
                  checked={form.values.is_active}
                  onChange={(e) => form.setFieldValue('is_active', e.currentTarget.checked)}
                  classNames={{ track: classes.switchTrack }}
                />
              </Group>

              {/* N8N Configuration Section */}
              {isN8N && (
                <>
                  <Divider label="n8n Configuration" labelPosition="center" />

                  <TextInput
                    label="Workflow Endpoint"
                    placeholder="https://your-n8n.com/webhook/.../workflow/..."
                    description="URL must contain /workflow/ in path"
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

              <TagInput
                label="Tags"
                placeholder="Enter a tag and press Space to add..."
                value={form.values.tags}
                onChange={(tags) => form.setFieldValue('tags', tags)}
              />

              <Textarea
                label="Description"
                placeholder="Optional description"
                maxLength={2000}
                minRows={3}
                maxRows={6}
                autosize
                {...form.getInputProps('description')}
              />

              <Divider />

              <Group justify="flex-end">
                <Button variant="default" onClick={handleClose} disabled={isSaving}>
                  Cancel
                </Button>
                <Button type="submit" loading={isSaving}>
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
              entityName="autonomous agent"
            />
          </Box>
        )}
      </Modal>

      <AddPrincipalDialog
        opened={isAddPrincipalOpen}
        onClose={() => setIsAddPrincipalOpen(false)}
        onSubmit={handleAddPrincipalsWithRole}
        entityName="autonomous agent"
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
