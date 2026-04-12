import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
  Switch,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconKey, IconInfoCircle, IconShieldLock } from '@tabler/icons-react';
import { useIdentity } from '../../../contexts';
import { GenerateWithAIButton } from '../../common/GenerateWithAIButton';
import { useEntityPermissions, usePermissions } from '../../../hooks';
import { useFormDirtyGuard } from '../../../hooks';
import { ManageAccessTable, TagInput, AddPrincipalDialog, CredentialTestButton } from '../../common';
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
  // For ENTRA_ID_APP_REGISTRATION
  entra_tenant_id: string;
  entra_client_id: string;
  entra_client_secret: string;
  entra_scopes: string[];
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
  const { t } = useTranslation('credentials');
  const { t: tc } = useTranslation('common');
  const { isGlobalAdmin } = usePermissions();
  const showIamTab = isGlobalAdmin || !initialData || initialData.my_permission === 'ADMIN';
  const [credential, setCredential] = useState<CredentialResponse | null>(null);
  const [originalClientSecret, setOriginalClientSecret] = useState('');
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
      entra_tenant_id: '',
      entra_client_id: '',
      entra_client_secret: '',
      entra_scopes: ['https://graph.microsoft.com/.default'],
    },
    validate: {
      name: (value) => {
        if (!value.trim()) return 'Name is required';
        if (value.length > 255) return 'Name must be 255 characters or less';
        return null;
      },
    },
  });

  useFormDirtyGuard(form.isDirty());

  // Initialize form from data
  const initializeFromData = useCallback(
    async (data: CredentialResponse) => {
      setCredential(data);

      let entraValues = {
        entra_tenant_id: '',
        entra_client_id: '',
        entra_client_secret: '',
        entra_scopes: ['https://graph.microsoft.com/.default'] as string[],
      };

      if (
        data.type === CredentialTypeEnum.ENTRA_ID_APP_REGISTRATION &&
        apiClient &&
        selectedTenant
      ) {
        try {
          const secretResp = await apiClient.getCredentialSecret(
            selectedTenant.id,
            data.id
          );
          const parsed = JSON.parse(secretResp.secret_value) as Record<string, unknown>;
          setOriginalClientSecret((parsed.client_secret as string) || '');
          entraValues = {
            entra_tenant_id: (parsed.tenant_id as string) || '',
            entra_client_id: (parsed.client_id as string) || '',
            entra_client_secret: '',
            entra_scopes: Array.isArray(parsed.scopes)
              ? (parsed.scopes as string[])
              : ['https://graph.microsoft.com/.default'],
          };
        } catch {
          // Fall back to empty values if secret fetch fails
        }
      }

      form.setValues({
        name: data.name,
        description: data.description || '',
        tags: data.tags?.map((t) => t.name) || [],
        is_active: data.is_active,
        secret_value: '',
        username: '',
        password: '',
        ...entraValues,
      });
      form.resetDirty();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apiClient, selectedTenant]
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
      } else if (credential?.type === CredentialTypeEnum.ENTRA_ID_APP_REGISTRATION) {
        const clientSecret = values.entra_client_secret.trim() || originalClientSecret;
        if (values.entra_tenant_id.trim() && values.entra_client_id.trim() && clientSecret) {
          secretValue = JSON.stringify({
            tenant_id: values.entra_tenant_id.trim(),
            client_id: values.entra_client_id.trim(),
            client_secret: clientSecret,
            ...(values.entra_scopes.length > 0 && { scopes: values.entra_scopes }),
          });
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

      form.resetDirty();
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
    setOriginalClientSecret('');
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

              <Switch
                label={tc('active')}
                description={tc('activeDescription')}
                checked={form.values.is_active}
                onChange={(event) => form.setFieldValue('is_active', event.currentTarget.checked)}
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
                  label={t('credentials:newApiKey')}
                  placeholder={t('credentials:leaveEmptyToKeep')}
                  description={t('credentials:fillOnlyToChangeApiKey')}
                  {...form.getInputProps('secret_value')}
                />
              )}

              {credential?.type === CredentialTypeEnum.BASIC_AUTH && (
                <>
                  <TextInput
                    label={t('credentials:newUsername')}
                    placeholder={t('credentials:leaveEmptyToKeep')}
                    description={t('credentials:fillOnlyToChangeUsername')}
                    {...form.getInputProps('username')}
                  />
                  <PasswordInput
                    label={t('credentials:newPassword')}
                    placeholder={t('credentials:leaveEmptyToKeep')}
                    description={t('credentials:fillOnlyToChangePassword')}
                    {...form.getInputProps('password')}
                  />
                </>
              )}

              {credential?.type === CredentialTypeEnum.ENTRA_ID_APP_REGISTRATION && (
                <>
                  <TextInput
                    label={t('credentials:newTenantId')}
                    placeholder={t('credentials:newTenantId')}
                    {...form.getInputProps('entra_tenant_id')}
                  />
                  <TextInput
                    label={t('credentials:newClientId')}
                    placeholder={t('credentials:newClientId')}
                    {...form.getInputProps('entra_client_id')}
                  />
                  <PasswordInput
                    label={t('credentials:newClientSecret')}
                    placeholder={t('credentials:leaveEmptyToKeep')}
                    description={t('credentials:fillOnlyToChangeClientSecret')}
                    {...form.getInputProps('entra_client_secret')}
                  />
                  <TagInput
                    label={t('credentials:newScopes')}
                    placeholder="e.g. https://graph.microsoft.com/.default"
                    value={form.values.entra_scopes}
                    onChange={(scopes) => form.setFieldValue('entra_scopes', scopes)}
                  />
                  <CredentialTestButton
                    tenantId={form.values.entra_tenant_id}
                    clientId={form.values.entra_client_id}
                    clientSecret={form.values.entra_client_secret}
                    scopes={form.values.entra_scopes}
                  />
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
                    entityType="credential"
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
              entityName="credential"
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
        entityName="credential"
        existingPrincipalIds={principals.map((p) => p.principalId)}
      />
    </>
  );
};
