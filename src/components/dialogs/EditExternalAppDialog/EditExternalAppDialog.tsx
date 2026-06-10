import type { FC } from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Modal, TextInput, Textarea, Button, Stack, Group,
  LoadingOverlay, Alert, Box, Text, SegmentedControl, Divider,
  FileButton, ActionIcon, Image,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconAppWindow, IconInfoCircle, IconShieldLock, IconUpload, IconTrash, IconPlus, IconWorld, IconCode } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useIdentity } from '../../../contexts';
import { GenerateWithAIButton } from '../../common/GenerateWithAIButton';
import { useEntityPermissions, usePermissions } from '../../../hooks';
import { useFormDirtyGuard } from '../../../hooks';
import { ManageAccessTable, TagInput, AddPrincipalDialog, AuthImage } from '../../common';
import type { ExternalAppResponse, PrincipalTypeEnum, ExternalAppMode, ExternalAppConfig } from '../../../api/types';
import { PermissionActionEnum } from '../../../api/types';
import type { SelectedPrincipal } from '../../common/AddPrincipalDialog/AddPrincipalDialog';
import classes from './EditExternalAppDialog.module.css';

export type EditDialogTab = 'details' | 'iam';

interface ParamEntry {
  id: string;
  key: string;
  value: string;
}

interface FormValues {
  name: string;
  description: string;
  mode: ExternalAppMode;
  url: string;
  params: ParamEntry[];
  iframeHtml: string;
  tags: string[];
}

const PARAM_KEY_REGEX = /^[A-Za-z0-9_-]+$/;
const MAX_PARAMS = 20;

const newParamId = (): string =>
  (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);

const buildAssembledUrl = (url: string, params: ParamEntry[]): string => {
  if (!url) return '';
  const valid = params.filter((p) => p.key && PARAM_KEY_REGEX.test(p.key));
  if (valid.length === 0) return url;
  try {
    const u = new URL(url);
    valid.forEach((p) => u.searchParams.set(p.key, p.value));
    return u.toString();
  } catch {
    const qs = valid.map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&');
    return url.includes('?') ? `${url}&${qs}` : `${url}?${qs}`;
  }
};

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  const imagePreview = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : null),
    [imageFile],
  );

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
    initialValues: { name: '', description: '', mode: 'url', url: '', params: [], iframeHtml: '', tags: [] },
    validate: {
      name: (value) => {
        if (!value.trim()) return tc('validation.required', { field: tc('name') });
        if (value.length > 255) return tc('validation.maxLength', { field: tc('name'), max: 255 });
        return null;
      },
      url: (value, values) => {
        if (values.mode !== 'url') return null;
        if (!value.trim()) return tc('validation.required', { field: t('createDialog.urlLabel') });
        if (value.length > 2000) return tc('validation.maxLength', { field: t('createDialog.urlLabel'), max: 2000 });
        if (!/^https?:\/\//i.test(value.trim())) return t('createDialog.urlMustStartWithHttp');
        return null;
      },
      iframeHtml: (value, values) => {
        if (values.mode !== 'iframe') return null;
        if (!value.trim()) return tc('validation.required', { field: t('createDialog.iframeHtmlLabel') });
        if (value.length > 8000) return tc('validation.maxLength', { field: t('createDialog.iframeHtmlLabel'), max: 8000 });
        if (!/<iframe/i.test(value)) return t('createDialog.iframeHtmlMustContainIframe');
        return null;
      },
    },
  });

  const addParam = useCallback(() => {
    if (form.values.params.length >= MAX_PARAMS) return;
    form.setFieldValue('params', [...form.values.params, { id: newParamId(), key: '', value: '' }]);
  }, [form]);

  const removeParam = useCallback((id: string) => {
    form.setFieldValue('params', form.values.params.filter((p) => p.id !== id));
  }, [form]);

  const updateParam = useCallback((id: string, field: 'key' | 'value', value: string) => {
    form.setFieldValue(
      'params',
      form.values.params.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
  }, [form]);

  const assembledUrl = useMemo(
    () => buildAssembledUrl(form.values.url.trim(), form.values.params),
    [form.values.url, form.values.params],
  );

  useFormDirtyGuard(form.isDirty() || !!imageFile || removeImage);

  const initializeFromData = useCallback(
    (data: ExternalAppResponse) => {
      setApp(data);
      setImageFile(null);
      setRemoveImage(false);
      const cfg = data.config;
      const mode: ExternalAppMode = cfg?.mode === 'iframe' ? 'iframe' : 'url';
      const url = cfg?.mode === 'url' ? cfg.url : '';
      const paramsRecord = cfg?.mode === 'url' ? cfg.params : {};
      const params: ParamEntry[] = Object.entries(paramsRecord || {}).map(([k, v]) => ({
        id: newParamId(), key: k, value: v,
      }));
      const iframeHtml = cfg?.mode === 'iframe' ? cfg.iframe_html : '';
      form.setValues({
        name: data.name,
        description: data.description || '',
        mode,
        url,
        params,
        iframeHtml,
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

  const buildConfig = (values: FormValues): ExternalAppConfig => {
    if (values.mode === 'iframe') {
      return { mode: 'iframe', iframe_html: values.iframeHtml.trim() };
    }
    const params: Record<string, string> = {};
    values.params.forEach((p) => {
      if (p.key && PARAM_KEY_REGEX.test(p.key)) {
        params[p.key] = p.value;
      }
    });
    return { mode: 'url', url: values.url.trim(), params };
  };

  const handleSubmit = async (values: FormValues) => {
    if (!apiClient || !selectedTenant || !externalAppId) return;

    const invalidParamKey = values.mode === 'url' && values.params.some((p) => p.key && !PARAM_KEY_REGEX.test(p.key));
    if (invalidParamKey) {
      setError(t('createDialog.invalidParamKey'));
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      let imageFileId: string | undefined = app?.image_file_id;
      if (imageFile) {
        const uploaded = await apiClient.uploadFile(selectedTenant.id, imageFile, 'APP_IMAGE');
        imageFileId = uploaded.id;
      } else if (removeImage) {
        imageFileId = undefined;
      }

      await apiClient.updateExternalApp(selectedTenant.id, externalAppId, {
        name: values.name.trim(),
        config: buildConfig(values),
        description: values.description?.trim() || undefined,
        image_file_id: imageFileId,
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
      } else if (message.toLowerCase().includes('config') || message.toLowerCase().includes('iframe')) {
        setError(message || tc('updateFailed'));
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
    setImageFile(null);
    setRemoveImage(false);
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
              <Box>
                <Text size="sm" fw={500} mb={4}>{t('createDialog.modeLabel')}</Text>
                <SegmentedControl
                  value={form.values.mode}
                  onChange={(v) => form.setFieldValue('mode', v as ExternalAppMode)}
                  data={[
                    {
                      value: 'url',
                      label: (
                        <Group gap="xs" wrap="nowrap" justify="center">
                          <IconWorld size={14} />
                          <span>{t('createDialog.modeUrl')}</span>
                        </Group>
                      ),
                    },
                    {
                      value: 'iframe',
                      label: (
                        <Group gap="xs" wrap="nowrap" justify="center">
                          <IconCode size={14} />
                          <span>{t('createDialog.modeIframe')}</span>
                        </Group>
                      ),
                    },
                  ]}
                  fullWidth
                />
              </Box>

              {form.values.mode === 'url' ? (
                <>
                  <TextInput
                    label={t('createDialog.urlLabel')}
                    placeholder={t('createDialog.urlPlaceholder')}
                    required
                    withAsterisk
                    maxLength={2000}
                    {...form.getInputProps('url')}
                  />

                  <Box>
                    <Group justify="space-between" mb={4}>
                      <Text size="sm" fw={500}>{t('createDialog.paramsLabel')}</Text>
                      <Button
                        size="xs"
                        variant="light"
                        leftSection={<IconPlus size={14} />}
                        onClick={addParam}
                        disabled={form.values.params.length >= MAX_PARAMS}
                      >
                        {t('createDialog.addParam')}
                      </Button>
                    </Group>
                    {form.values.params.length === 0 ? (
                      <Text size="xs" c="dimmed">{t('createDialog.noParams')}</Text>
                    ) : (
                      <Stack gap="xs">
                        {form.values.params.map((p) => {
                          const keyInvalid = !!p.key && !PARAM_KEY_REGEX.test(p.key);
                          return (
                            <Group key={p.id} gap="xs" wrap="nowrap" align="flex-start">
                              <TextInput
                                placeholder={t('createDialog.paramKeyPlaceholder')}
                                value={p.key}
                                onChange={(e) => updateParam(p.id, 'key', e.currentTarget.value)}
                                maxLength={64}
                                error={keyInvalid ? t('createDialog.invalidParamKey') : undefined}
                                style={{ flex: 1 }}
                              />
                              <TextInput
                                placeholder={t('createDialog.paramValuePlaceholder')}
                                value={p.value}
                                onChange={(e) => updateParam(p.id, 'value', e.currentTarget.value)}
                                maxLength={2000}
                                style={{ flex: 2 }}
                              />
                              <ActionIcon
                                color="red"
                                variant="subtle"
                                onClick={() => removeParam(p.id)}
                                aria-label={tc('remove')}
                              >
                                <IconTrash size={16} />
                              </ActionIcon>
                            </Group>
                          );
                        })}
                      </Stack>
                    )}
                  </Box>
                </>
              ) : (
                <Textarea
                  label={t('createDialog.iframeHtmlLabel')}
                  description={t('createDialog.iframeHtmlDescription')}
                  placeholder={t('createDialog.iframeHtmlPlaceholder')}
                  required
                  withAsterisk
                  minRows={5}
                  maxRows={10}
                  autosize
                  maxLength={8000}
                  {...form.getInputProps('iframeHtml')}
                />
              )}

              {((form.values.mode === 'url' && assembledUrl) || (form.values.mode === 'iframe' && form.values.iframeHtml)) && (
                <Box>
                  <Text size="sm" fw={500} mb={4}>{t('createDialog.preview')}</Text>
                  <Box
                    style={{
                      border: '1px solid var(--mantine-color-default-border)',
                      borderRadius: 'var(--mantine-radius-sm)',
                      overflow: 'hidden',
                      height: 300,
                    }}
                  >
                    {form.values.mode === 'url' ? (
                      <iframe
                        src={assembledUrl}
                        title="Preview"
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        sandbox="allow-scripts allow-same-origin"
                      />
                    ) : (
                      <Box
                        style={{ width: '100%', height: '100%' }}
                        dangerouslySetInnerHTML={{ __html: form.values.iframeHtml }}
                      />
                    )}
                  </Box>
                </Box>
              )}

              <Box>
                <Text size="sm" fw={500} mb={4}>{t('createDialog.imageLabel')}</Text>
                <Group gap="sm" align="flex-start">
                  {imagePreview ? (
                    <Box pos="relative">
                      <Image src={imagePreview} w={120} h={80} radius="sm" fit="cover" />
                      <ActionIcon
                        size="xs"
                        color="red"
                        variant="filled"
                        pos="absolute"
                        top={4}
                        right={4}
                        onClick={() => setImageFile(null)}
                      >
                        <IconTrash size={12} />
                      </ActionIcon>
                    </Box>
                  ) : !removeImage && (app?.image_file_id || app?.image_url) ? (
                    <Box pos="relative">
                      <AuthImage src={app?.image_file_id || app?.image_url} w={120} h={80} radius="sm" fit="cover" />
                      <ActionIcon
                        size="xs"
                        color="red"
                        variant="filled"
                        pos="absolute"
                        top={4}
                        right={4}
                        onClick={() => setRemoveImage(true)}
                      >
                        <IconTrash size={12} />
                      </ActionIcon>
                    </Box>
                  ) : null}
                  <FileButton onChange={(file) => { setImageFile(file); setRemoveImage(false); }} accept="image/*">
                    {(props) => (
                      <Button
                        {...props}
                        variant="light"
                        size="xs"
                        leftSection={<IconUpload size={14} />}
                      >
                        {imageFile || (!removeImage && (app?.image_file_id || app?.image_url)) ? t('createDialog.changeImage') : t('createDialog.uploadImage')}
                      </Button>
                    )}
                  </FileButton>
                </Group>
              </Box>
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
                <Button type="submit" loading={isSaving} disabled={!form.isDirty() && !imageFile && !removeImage}>
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
