import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';
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
} from '@mantine/core';
import { useForm } from '@mantine/form';
import {
  IconSparkles,
  IconInfoCircle,
  IconShieldLock,
  IconAlertCircle,
} from '@tabler/icons-react';
import { useIdentity } from '../../../contexts';
import {
  ApplicationTypeEnum,
  type ApplicationResponse,
  type PrincipalTypeEnum,
  type PermissionActionEnum,
  type PrincipalWithRolesResponse,
} from '../../../api/types';
import { TagInput, ManageAccessTable, AddPrincipalDialog } from '../../common';
import type { PrincipalPermission } from '../../common/ManageAccessTable/ManageAccessTable';
import type { SelectedPrincipal } from '../../common/AddPrincipalDialog/AddPrincipalDialog';
import classes from './EditApplicationDialog.module.css';

const APPLICATION_TYPES = [
  { value: ApplicationTypeEnum.N8N, label: 'n8n' },
  { value: ApplicationTypeEnum.MICROSOFT_FOUNDRY, label: 'Microsoft Foundry' },
  { value: ApplicationTypeEnum.REST_API, label: 'REST API' },
];

export type EditDialogTab = 'details' | 'iam';

interface EditApplicationDialogProps {
  opened: boolean;
  onClose: () => void;
  applicationId: string | null;
  /** Pre-loaded application data from context (avoids re-fetch if provided) */
  initialData?: ApplicationResponse | null;
  initialTab?: EditDialogTab;
  onTabChange?: (tab: EditDialogTab) => void;
  onSuccess?: () => void;
}

interface FormValues {
  name: string;
  type: string;
  description: string;
  tags: string[];
  is_active: boolean;
}

export const EditApplicationDialog: FC<EditApplicationDialogProps> = ({
  opened,
  onClose,
  applicationId,
  initialData = null,
  initialTab = 'details',
  onTabChange,
  onSuccess,
}) => {
  const { apiClient, selectedTenant } = useIdentity();
  const [activeTab, setActiveTab] = useState<EditDialogTab>(initialTab);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [application, setApplication] = useState<ApplicationResponse | null>(null);
  
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
      is_active: true,
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
    },
  });

  // Update activeTab when initialTab changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Initialize from initialData when provided
  const initializeFromData = useCallback((data: ApplicationResponse) => {
    setApplication(data);
    form.setValues({
      name: data.name,
      type: data.type,
      description: data.description || '',
      tags: data.tags?.map((t) => t.name) || [],
      is_active: data.is_active,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch application data (only if no initialData provided)
  const fetchApplication = useCallback(async () => {
    if (!apiClient || !selectedTenant || !applicationId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.getApplication(selectedTenant.id, applicationId);
      initializeFromData(data);
    } catch (err) {
      console.error('Failed to fetch application:', err);
      setError('Failed to load application data');
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, selectedTenant, applicationId, initializeFromData]);

  // Fetch principals (showLoading=false for background refresh to prevent flash)
  const fetchPrincipals = useCallback(async (showLoading = true) => {
    if (!apiClient || !selectedTenant || !applicationId) return;

    if (showLoading) {
      setIsPrincipalsLoading(true);
    }
    setPrincipalsError(null);

    try {
      const response = await apiClient.getApplicationPrincipals(selectedTenant.id, applicationId);

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
  }, [apiClient, selectedTenant, applicationId]);

  // Load data when dialog opens or applicationId changes
  useEffect(() => {
    if (opened && applicationId) {
      // If initialData is provided, use it; otherwise fetch
      if (initialData) {
        initializeFromData(initialData);
      } else {
        fetchApplication();
      }
      // Always fetch principals (they're not in the list data)
      fetchPrincipals();
    } else if (!opened) {
      // Reset hasPrincipalsFetched when dialog closes
      setHasPrincipalsFetched(false);
    }
  }, [opened, applicationId, initialData, initializeFromData, fetchApplication, fetchPrincipals]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    const tab = value as EditDialogTab;
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  // Handle form submit
  const handleSubmit = async (values: FormValues) => {
    if (!apiClient || !selectedTenant || !applicationId) return;

    setIsSaving(true);
    setError(null);

    try {
      // Update application
      await apiClient.updateApplication(selectedTenant.id, applicationId, {
        name: values.name.trim(),
        type: values.type as ApplicationTypeEnum,
        description: values.description?.trim() || undefined,
        is_active: values.is_active,
      });

      // Update tags if changed
      const currentTags = application?.tags?.map((t) => t.name) || [];
      const newTags = values.tags;
      
      if (JSON.stringify(currentTags.sort()) !== JSON.stringify(newTags.sort())) {
        await apiClient.setApplicationTags(selectedTenant.id, applicationId, newTags);
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to update application:', err);
      setError('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle role change for a principal
  const handleRoleChange = useCallback(
    async (principalId: string, principalType: PrincipalTypeEnum, role: PermissionActionEnum, enabled: boolean) => {
      if (!apiClient || !selectedTenant || !applicationId) return;

      try {
        if (enabled) {
          // Add permission
          await apiClient.setApplicationPermission(selectedTenant.id, applicationId, {
            principal_id: principalId,
            principal_type: principalType,
            role,
          });
        } else {
          // Remove permission
          await apiClient.deleteApplicationPermission(
            selectedTenant.id,
            applicationId,
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
    [apiClient, selectedTenant, applicationId, fetchPrincipals]
  );

  // Handle adding a new principal
  const handleAddPrincipals = useCallback(
    async (selectedPrincipals: SelectedPrincipal[], role: PermissionActionEnum) => {
      if (!apiClient || !selectedTenant || !applicationId) return;

      // Add permission for each selected principal
      for (const principal of selectedPrincipals) {
        await apiClient.setApplicationPermission(selectedTenant.id, applicationId, {
          principal_id: principal.id,
          principal_type: principal.type,
          role,
        });
      }

      // Refresh principals list without showing loading state
      await fetchPrincipals(false);
    },
    [apiClient, selectedTenant, applicationId, fetchPrincipals]
  );

  // Handle deleting a principal's access
  const handleDeletePrincipal = useCallback(
    async (principalId: string, principalType: PrincipalTypeEnum) => {
      if (!apiClient || !selectedTenant || !applicationId) return;

      // Delete all permissions for this principal
      const principal = principals.find(p => p.principalId === principalId && p.principalType === principalType);
      if (principal) {
        for (const role of principal.roles) {
          await apiClient.deleteApplicationPermission(
            selectedTenant.id,
            applicationId,
            principalId,
            principalType,
            role
          );
        }
      }

      // Refresh principals list without showing loading state
      await fetchPrincipals(false);
    },
    [apiClient, selectedTenant, applicationId, principals, fetchPrincipals]
  );

  // Handle close
  const handleClose = () => {
    form.reset();
    setError(null);
    setApplication(null);
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
                {application?.name || 'Edit Chat Agent'}
              </Text>
              {application && (
                <Group gap="xs">
                  <Badge size="xs" variant="light" color={application.is_active ? 'green' : 'gray'}>
                    {application.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Text size="xs" c="dimmed">
                    {APPLICATION_TYPES.find((t) => t.value === application.type)?.label || application.type}
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
                  data={APPLICATION_TYPES}
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
              onRoleChange={handleRoleChange}
              onDeletePrincipal={handleDeletePrincipal}
              onAddPrincipal={() => setIsAddPrincipalOpen(true)}
              entityName="chat agent"
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
    </>
  );
};
