import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';
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
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconCode, IconInfoCircle, IconShieldLock } from '@tabler/icons-react';
import { useIdentity } from '../../../contexts';
import { useEntityPermissions } from '../../../hooks';
import { ManageAccessTable, TagInput, AddPrincipalDialog } from '../../common';
import type { DevelopmentPlatformResponse, PermissionActionEnum, PrincipalTypeEnum } from '../../../api/types';
import type { SelectedPrincipal } from '../../common/AddPrincipalDialog/AddPrincipalDialog';
import classes from './EditDevelopmentPlatformDialog.module.css';

export type EditDialogTab = 'details' | 'iam';

interface FormValues {
  name: string;
  description: string;
  iframe_url: string;
  tags: string[];
  is_active: boolean;
}

export interface EditDevelopmentPlatformDialogProps {
  opened: boolean;
  platformId: string | null;
  initialData?: DevelopmentPlatformResponse | null;
  activeTab?: EditDialogTab;
  onClose: () => void;
  onSuccess?: () => void;
  onTabChange?: (tab: EditDialogTab) => void;
}

export const EditDevelopmentPlatformDialog: FC<EditDevelopmentPlatformDialogProps> = ({
  opened,
  platformId,
  initialData,
  activeTab = 'details',
  onClose,
  onSuccess,
  onTabChange,
}) => {
  const { apiClient, selectedTenant } = useIdentity();
  const [platform, setPlatform] = useState<DevelopmentPlatformResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddPrincipalOpen, setIsAddPrincipalOpen] = useState(false);

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
    entityType: 'development-platform',
    entityId: platformId,
  });

  const form = useForm<FormValues>({
    initialValues: {
      name: '',
      description: '',
      iframe_url: '',
      tags: [],
      is_active: true,
    },
    validate: {
      name: (value) => {
        if (!value.trim()) return 'Name is required';
        if (value.length > 255) return 'Name must be 255 characters or less';
        return null;
      },
      iframe_url: (value) => {
        if (!value.trim()) return 'URL is required';
        try {
          new URL(value);
          return null;
        } catch {
          return 'Please enter a valid URL';
        }
      },
    },
  });

  // Initialize form from data
  const initializeFromData = useCallback(
    (data: DevelopmentPlatformResponse) => {
      setPlatform(data);
      form.setValues({
        name: data.name,
        description: data.description || '',
        iframe_url: data.iframe_url || '',
        tags: data.tags?.map((t) => t.name) || [],
        is_active: data.is_active,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Fetch platform details
  const fetchPlatform = useCallback(async () => {
    if (!apiClient || !selectedTenant || !platformId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.getDevelopmentPlatform(selectedTenant.id, platformId);
      initializeFromData(data);
    } catch (err) {
      console.error('Failed to fetch development platform:', err);
      setError('Failed to load development platform details');
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, selectedTenant, platformId, initializeFromData]);

  // Fetch data when dialog opens
  useEffect(() => {
    if (opened && platformId) {
      if (initialData) {
        initializeFromData(initialData);
      } else {
        fetchPlatform();
      }
      // Always fetch principals (they're not in the list data)
      fetchPrincipals();
    } else if (!opened) {
      resetPrincipalsState();
    }
  }, [opened, platformId, initialData, initializeFromData, fetchPlatform, fetchPrincipals, resetPrincipalsState]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    const tab = value as EditDialogTab;
    onTabChange?.(tab);
  };

  // Handle form submit
  const handleSubmit = async (values: FormValues) => {
    if (!apiClient || !selectedTenant || !platformId) return;

    setIsSaving(true);
    setError(null);

    try {
      // Update platform
      await apiClient.updateDevelopmentPlatform(selectedTenant.id, platformId, {
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        iframe_url: values.iframe_url.trim(),
        is_active: values.is_active,
      });

      // Update tags if changed
      const currentTags = platform?.tags?.map((t) => t.name) || [];
      const newTags = values.tags;

      if (JSON.stringify(currentTags.sort()) !== JSON.stringify(newTags.sort())) {
        await apiClient.setDevelopmentPlatformTags(selectedTenant.id, platformId, newTags);
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to update development platform:', err);
      setError('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle adding principals with callback
  const handleAddPrincipalsWithRole = useCallback(
    async (selectedPrincipals: SelectedPrincipal[], role: PermissionActionEnum) => {
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
    setPlatform(null);
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
              <IconCode size={20} />
            </Box>
            <Stack gap={2}>
              <Text fw={600} size="lg">
                {platform?.name}
              </Text>
              {platform && (
                <Group gap="xs">
                  <Badge size="xs" variant="light" color={platform.is_active ? 'green' : 'gray'}>
                    {platform.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Text size="xs" c="dimmed">
                    Development Platform
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

              <TextInput
                label="URL"
                placeholder="https://example.com"
                description="The URL that will be displayed in an iframe"
                required
                withAsterisk
                {...form.getInputProps('iframe_url')}
              />

              <Switch
                label="Active"
                description="Enable or disable this development platform"
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
              onRoleChange={handleRoleChangeWithTypes}
              onDeletePrincipal={handleDeletePrincipalWithTypes}
              onAddPrincipal={() => setIsAddPrincipalOpen(true)}
              entityName="development platform"
            />
          </Box>
        )}
      </Modal>

      <AddPrincipalDialog
        opened={isAddPrincipalOpen}
        onClose={() => setIsAddPrincipalOpen(false)}
        onSubmit={handleAddPrincipalsWithRole}
        entityName="development platform"
        existingPrincipalIds={principals.map((p) => p.principalId)}
      />
    </>
  );
};
