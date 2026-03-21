import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
  Modal, TextInput, Textarea, Button, Stack, Group,
  LoadingOverlay, Alert, Box, Text, SegmentedControl, Divider,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconAppWindow, IconInfoCircle, IconShieldLock } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useIdentity } from '../../../contexts';
import { GenerateWithAIButton } from '../../common/GenerateWithAIButton';
import { useEntityPermissions, usePermissions } from '../../../hooks';
import { useFormDirtyGuard } from '../../../hooks';
import { ManageAccessTable, TagInput, AddPrincipalDialog } from '../../common';
import type { ExternalAppResponse, PrincipalTypeEnum } from '../../../api/types';
import { PermissionActionEnum } from '../../../api/types';
import type { SelectedPrincipal } from '../../common/AddPrincipalDialog/AddPrincipalDialog';
import classes from './EditExternalAppDialog.module.css';

export type EditDialogTab = 'details' | 'iam';

interface FormValues {
  name: string;
  description: string;
  url: string;
  image_url: string;
  tags: string[];
}

export interface EditExternalAppDialogProps {
  opened: boolean;
  externalAppId: string | null;
  initialData?: ExternalAppResponse | null;
  activeTab?: EditDialogTab;
  onClose: () => void;
  onSuccess?: () => void;
  onTabChange?: (tab: EditDialogTab) => void;
}

export const EditExternalAppDialog: FC<EditExternalAppDialogProps> = ({
  opened, externalAppId, initialData, activeTab = 'details', onClose, onSuccess, onTabChange,
}) => {
  const { apiClient, selectedTenant } = useIdentity();
  const { t } = useTranslation('externalApps');
  const { t: tc } = useTranslation('common');
  const { isGlobalAdmin } = usePermissions();
  const showIamTab = isGlobalAdmin || !initialData || initialData.my_permission === 'ADMIN';
  const [app, setApp] = useState<ExternalAppResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddPrincipalOpen, setIsAddPrincipalOpen] = useState(false);

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
    entityType: 'external-app',
    entityId: externalAppId,
  });

  const form = useForm<FormValues>({
    initialValues: { name: '', description: '', url: '', image_url: '', tags: [] },
    validate: {
      name: (value) => {
        if (!value.trim()) return tc('validation.required', { field: tc('name') });
        if (value.length > 255) return tc('validation.maxLength', { field: tc('name'), max: 255 });
        return null;
      },
      url: (value) => {
        if (!value.trim()) return tc('validation.required', { field: t('createDialog.urlLabel') });
        if (value.length > 2000) return tc('validation.maxLength', { field: t('createDialog.urlLabel'), max: 2000 });
        return null;
      },
    },
  });

  useFormDirtyGuard(form.isDirty());

  const initializeFromData = useCallback(
    (data: ExternalAppResponse) => {
      setApp(data);
      form.setValues({
        name: data.name,
        description: data.description || '',
        url: data.url,
        image_url: data.image_url || '',
        tags: data.tags?.map((t) => t.name) || [],
      });
      form.resetDirty();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const fetchApp = useCallback(async () => {
    if (!apiClient || !selectedTenant || !externalAppId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.getExternalApp(selectedTenant.id, externalAppId);
      initializeFromData(data);
    } catch {
      setError(t('loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, selectedTenant, externalAppId, initializeFromData, t]);

  useEffect(() => {
    if (opened && externalAppId) {
      if (initialData) {
        initializeFromData(initialData);
      } else {
        fetchApp();
      }
      fetchPrincipals();
    } else if (!opened) {
      resetPrincipalsState();
    }
  }, [opened, externalAppId, initialData, initializeFromData, fetchApp, fetchPrincipals, resetPrincipalsState]);

  const handleTabChange = (value: string) => {
    onTabChange?.(value as EditDialogTab);
  };

  const handleSubmit = async (values: FormValues) => {
    if (!apiClient || !selectedTenant || !externalAppId) return;
    setIsSaving(true);
    setError(null);
    try {
      await apiClient.updateExternalApp(selectedTenant.id, externalAppId, {
        name: values.name.trim(),
        url: values.url.trim(),
        description: values.description?.trim() || undefined,
        image_url: values.image_url?.trim() || undefined,
      });

      const currentTags = app?.tags?.map((t) => t.name) || [];
      const newTags = values.tags;
      if (JSON.stringify(currentTags.sort()) !== JSON.stringify(newTags.sort())) {
        await apiClient.setExternalAppTags(selectedTenant.id, externalAppId, newTags);
      }

      form.resetDirty();
      onSuccess?.();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('already exists')) {
        setError(tc('nameAlreadyExists'));
      } else {
        setError(tc('updateFailed'));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPrincipalsWithRole = useCallback(
    async (selectedPrincipals: SelectedPrincipal[], roles: string[]) => {
      const role = roles[0] as PermissionActionEnum || PermissionActionEnum.READ;
      await handleAddPrincipals(selectedPrincipals, role);
    },
    [handleAddPrincipals]
  );

  const handleRoleChangeWithTypes = useCallback(
    async (principalId: string, principalType: PrincipalTypeEnum, role: PermissionActionEnum, enabled: boolean) => {
      await handleRoleChange(principalId, principalType, role, enabled);
    },
    [handleRoleChange]
  );

  const handleDeletePrincipalWithTypes = useCallback(
    async (principalId: string, principalType: PrincipalTypeEnum) => {
      await handleDeletePrincipal(principalId, principalType);
    },
    [handleDeletePrincipal]
  );

  const handleClose = () => {
    form.reset();
    setError(null);
    setApp(null);
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
              <IconAppWindow size={20} />
            </Box>
            <Text fw={600} size="lg">{app?.name || t('editDialog.title')}</Text>
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
          <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md" onClose={() => setError(null)} withCloseButton>
            {error}
          </Alert>
        )}

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
                      <span>{tc('details')}</span>
                    </Group>
                  ),
                },
                {
                  value: 'iam',
                  label: (
                    <Group gap="xs" wrap="nowrap">
                      <IconShieldLock size={16} />
                      <span>{tc('manageAccess')}</span>
                    </Group>
                  ),
                },
              ]}
              fullWidth
              className={classes.segmentedControl}
            />
          </Box>
        )}

        {activeTab === 'details' ? (
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <TextInput
                label={tc('name')}
                placeholder={t('createDialog.namePlaceholder')}
                required
                withAsterisk
                maxLength={255}
                {...form.getInputProps('name')}
              />
              <TextInput
                label={t('createDialog.urlLabel')}
                placeholder={t('createDialog.urlPlaceholder')}
                required
                withAsterisk
                maxLength={2000}
                {...form.getInputProps('url')}
              />
              <TextInput
                label={t('createDialog.imageUrlLabel')}
                placeholder={t('createDialog.imageUrlPlaceholder')}
                maxLength={2000}
                {...form.getInputProps('image_url')}
              />
              <TagInput
                label={tc('tags')}
                placeholder={tc('tagsPlaceholder')}
                value={form.values.tags}
                onChange={(tags) => form.setFieldValue('tags', tags)}
              />
              <Box pos="relative">
                <Textarea
                  label={tc('description')}
                  placeholder={tc('optionalDescription')}
                  maxLength={2000}
                  minRows={3}
                  maxRows={6}
                  autosize
                  {...form.getInputProps('description')}
                />
                <Box pos="absolute" top={0} right={0}>
                  <GenerateWithAIButton
                    entityType="external_app"
                    entityName={form.values.name}
                    existingDescription={form.values.description || undefined}
                    onGenerated={(desc: string) => form.setFieldValue('description', desc)}
                  />
                </Box>
              </Box>

              <Divider />

              <Group justify="flex-end">
                <Button variant="default" onClick={handleClose} disabled={isSaving}>
                  {tc('cancel')}
                </Button>
                <Button type="submit" loading={isSaving} disabled={!form.isDirty()}>
                  {tc('saveChanges')}
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
              entityName={t('entityName')}
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
        entityName={t('entityName')}
        existingPrincipalIds={principals.map((p) => p.principalId)}
      />
    </>
  );
};
