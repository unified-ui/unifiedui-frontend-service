import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  TextInput,
  Textarea,
  PasswordInput,
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
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconKey, IconInfoCircle, IconShieldLock } from '@tabler/icons-react';
import { useIdentity } from '../../../contexts';
import { useEntityPermissions } from '../../../hooks';
import { ManageAccessTable, TagInput, AddPrincipalDialog } from '../../common';
import type { CredentialResponse, PrincipalTypeEnum } from '../../../api/types';
import { PermissionActionEnum, CredentialTypeEnum } from '../../../api/types';
import type { SelectedPrincipal } from '../../common/AddPrincipalDialog/AddPrincipalDialog';
import classes from './EditCredentialDialog.module.css';

export type EditDialogTab = 'details' | 'iam';

interface FormValues {
  name: string;
  description: string;
  tags: string[];
  is_active: boolean;
  // Optional credential value fields (only submitted if user enters a new value)
  secret_value: string;
  username: string;
  password: string;
}

export interface EditCredentialDialogProps {
  opened: boolean;
  credentialId: string | null;
  initialData?: CredentialResponse | null;
  activeTab?: EditDialogTab;
  onClose: () => void;
  onSuccess?: () => void;
  onTabChange?: (tab: EditDialogTab) => void;
}

export const EditCredentialDialog: FC<EditCredentialDialogProps> = ({
  opened,
  credentialId,
  initialData,
  activeTab = 'details',
  onClose,
  onSuccess,
  onTabChange,
}) => {
  const { apiClient, selectedTenant } = useIdentity();
  const [credential, setCredential] = useState<CredentialResponse | null>(null);
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
    entityType: 'credential',
    entityId: credentialId,
  });

  const form = useForm<FormValues>({
    initialValues: {
      name: '',
      description: '',
      tags: [],
      is_active: true,
      secret_value: '',
      username: '',
      password: '',
    },
    validate: {
      name: (value) => {
        if (!value.trim()) return 'Name is required';
        if (value.length > 255) return 'Name must be 255 characters or less';
        return null;
      },
    },
  });

  // Initialize form from data
  const initializeFromData = useCallback(
    (data: CredentialResponse) => {
      setCredential(data);
      form.setValues({
        name: data.name,
        description: data.description || '',
        tags: data.tags?.map((t) => t.name) || [],
        is_active: data.is_active,
        secret_value: '',
        username: '',
        password: '',
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Fetch credential details
  const fetchCredential = useCallback(async () => {
    if (!apiClient || !selectedTenant || !credentialId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.getCredential(selectedTenant.id, credentialId);
      initializeFromData(data);
    } catch (err) {
      console.error('Failed to fetch credential:', err);
      setError('Failed to load credential details');
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, selectedTenant, credentialId, initializeFromData]);

  // Fetch data when dialog opens
  useEffect(() => {
    if (opened && credentialId) {
      if (initialData) {
        initializeFromData(initialData);
      } else {
        fetchCredential();
      }
      // Always fetch principals (they're not in the list data)
      fetchPrincipals();
    } else if (!opened) {
      resetPrincipalsState();
    }
  }, [opened, credentialId, initialData, initializeFromData, fetchCredential, fetchPrincipals, resetPrincipalsState]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    const tab = value as EditDialogTab;
    onTabChange?.(tab);
  };

  // Handle form submit
  const handleSubmit = async (values: FormValues) => {
    if (!apiClient || !selectedTenant || !credentialId) return;

    setIsSaving(true);
    setError(null);

    try {
      // Build secret_value if user entered new credentials
      let secretValue: string | undefined;
      if (credential?.type === CredentialTypeEnum.BASIC_AUTH) {
        if (values.username.trim() || values.password.trim()) {
          secretValue = JSON.stringify({
            username: values.username.trim(),
            password: values.password.trim(),
          });
        }
      } else if (credential?.type === CredentialTypeEnum.API_KEY) {
        if (values.secret_value.trim()) {
          secretValue = values.secret_value.trim();
        }
      }

      // Update credential
      await apiClient.updateCredential(selectedTenant.id, credentialId, {
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        is_active: values.is_active,
        ...(secretValue && { secret_value: secretValue }),
      });

      // Update tags if changed
      const currentTags = credential?.tags?.map((t) => t.name) || [];
      const newTags = values.tags;

      if (JSON.stringify(currentTags.sort()) !== JSON.stringify(newTags.sort())) {
        await apiClient.setCredentialTags(selectedTenant.id, credentialId, newTags);
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to update credential:', err);
      setError('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

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
    setCredential(null);
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
              <IconKey size={20} />
            </Box>
            <Stack gap={2}>
              <Text fw={600} size="lg">
                {credential?.name}
              </Text>
              {credential && (
                <Group gap="xs">
                  <Badge size="xs" variant="light" color={credential.is_active ? 'green' : 'gray'}>
                    {credential.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Text size="xs" c="dimmed">
                    {credential.type?.replace(/_/g, ' ')}
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

              {credential && (
                <Group grow align="flex-start">
                  <TextInput
                    label="Type"
                    value={credential.type?.replace(/_/g, ' ') || ''}
                    disabled
                  />
                  <TextInput
                    label="Source"
                    value={credential.source || ''}
                    disabled
                  />
                </Group>
              )}

              {/* Credential value fields - type specific */}
              {credential?.type === CredentialTypeEnum.API_KEY && (
                <PasswordInput
                  label="Neuer API Key"
                  placeholder="Leer lassen um den aktuellen Wert beizubehalten"
                  description="Nur ausfüllen, wenn Sie den API Key ändern möchten"
                  {...form.getInputProps('secret_value')}
                />
              )}

              {credential?.type === CredentialTypeEnum.BASIC_AUTH && (
                <>
                  <TextInput
                    label="Neuer Username"
                    placeholder="Leer lassen um den aktuellen Wert beizubehalten"
                    description="Nur ausfüllen, wenn Sie den Username ändern möchten"
                    {...form.getInputProps('username')}
                  />
                  <PasswordInput
                    label="Neues Password"
                    placeholder="Leer lassen um den aktuellen Wert beizubehalten"
                    description="Nur ausfüllen, wenn Sie das Password ändern möchten"
                    {...form.getInputProps('password')}
                  />
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
              entityName="credential"
            />
          </Box>
        )}
      </Modal>

      <AddPrincipalDialog
        opened={isAddPrincipalOpen}
        onClose={() => setIsAddPrincipalOpen(false)}
        onSubmit={handleAddPrincipalsWithRole}
        entityName="credential"
        existingPrincipalIds={principals.map((p) => p.principalId)}
      />
    </>
  );
};
