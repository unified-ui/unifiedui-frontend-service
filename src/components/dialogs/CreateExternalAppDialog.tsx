import { type FC, useState, useMemo, useCallback } from 'react';
import {
  Modal, TextInput, Textarea, Button, Group, Stack, Text, Box, Alert, Image,
  FileButton, ActionIcon, SegmentedControl, Divider,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import {
  IconAlertCircle, IconAppWindow, IconUpload, IconTrash, IconPlus, IconWorld, IconCode,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useIdentity } from '../../contexts';
import { GenerateWithAIButton } from '../common/GenerateWithAIButton';
import type {
  ExternalAppResponse,
  ExternalAppMode,
  ExternalAppConfig,
} from '../../api/types';

interface CreateExternalAppDialogProps {
  opened: boolean;
  onClose: () => void;
  onSuccess?: (app?: ExternalAppResponse) => void;
}

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
}

const PARAM_KEY_REGEX = /^[A-Za-z0-9_-]+$/;
const MAX_PARAMS = 20;

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

const newParamId = (): string =>
  (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);

export const CreateExternalAppDialog: FC<CreateExternalAppDialogProps> = ({
  opened, onClose, onSuccess,
}) => {
  const { apiClient, selectedTenant } = useIdentity();
  const { t } = useTranslation('externalApps');
  const { t: tc } = useTranslation('common');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const imagePreview = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : null),
    [imageFile],
  );

  const form = useForm<FormValues>({
    initialValues: {
      name: '',
      description: '',
      mode: 'url',
      url: '',
      params: [],
      iframeHtml: '',
    },
    validate: {
      name: (value) => {
        if (!value || value.trim().length === 0) return tc('validation.required', { field: tc('name') });
        if (value.length > 255) return tc('validation.maxLength', { field: tc('name'), max: 255 });
        return null;
      },
      url: (value, values) => {
        if (values.mode !== 'url') return null;
        if (!value || value.trim().length === 0) return tc('validation.required', { field: t('createDialog.urlLabel') });
        if (value.length > 2000) return tc('validation.maxLength', { field: t('createDialog.urlLabel'), max: 2000 });
        if (!/^https?:\/\//i.test(value.trim())) return t('createDialog.urlMustStartWithHttp');
        return null;
      },
      iframeHtml: (value, values) => {
        if (values.mode !== 'iframe') return null;
        if (!value || value.trim().length === 0) return tc('validation.required', { field: t('createDialog.iframeHtmlLabel') });
        if (value.length > 8000) return tc('validation.maxLength', { field: t('createDialog.iframeHtmlLabel'), max: 8000 });
        if (!/<iframe/i.test(value)) return t('createDialog.iframeHtmlMustContainIframe');
        return null;
      },
      description: (value) => {
        if (value && value.length > 2000) return tc('validation.maxLength', { field: tc('description'), max: 2000 });
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
    if (!apiClient || !selectedTenant) return;

    const invalidParamKey = values.mode === 'url' && values.params.some((p) => p.key && !PARAM_KEY_REGEX.test(p.key));
    if (invalidParamKey) {
      setError(t('createDialog.invalidParamKey'));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      let imageFileId: string | undefined;
      if (imageFile) {
        const uploaded = await apiClient.uploadFile(selectedTenant.id, imageFile, 'APP_IMAGE');
        imageFileId = uploaded.id;
      }

      const app = await apiClient.createExternalApp(selectedTenant.id, {
        name: values.name.trim(),
        config: buildConfig(values),
        description: values.description?.trim() || undefined,
        image_file_id: imageFileId,
      });
      form.reset();
      setImageFile(null);
      onSuccess?.(app);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('already exists')) {
        setError(tc('nameAlreadyExists'));
      } else if (message.toLowerCase().includes('config') || message.toLowerCase().includes('iframe')) {
        setError(message || tc('createFailed'));
      } else {
        setError(tc('createFailed'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setImageFile(null);
    setError(null);
    onClose();
  };

  const previewSrc = form.values.mode === 'url' ? assembledUrl : '';
  const showPreview =
    (form.values.mode === 'url' && previewSrc) ||
    (form.values.mode === 'iframe' && form.values.iframeHtml);

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="sm">
          <IconAppWindow size={24} />
          <Text fw={600} size="lg">{t('createDialog.title')}</Text>
        </Group>
      }
      size="xl"
      centered
    >
      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md" onClose={() => setError(null)} withCloseButton>
          {error}
        </Alert>
      )}

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

          {showPreview ? (
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
                    src={previewSrc}
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
          ) : null}

          <Divider />

          <Box>
            <Text size="sm" fw={500} mb={4}>{t('createDialog.imageLabel')}</Text>
            <Group gap="sm" align="flex-start">
              {imagePreview && (
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
              )}
              <FileButton onChange={setImageFile} accept="image/*">
                {(props) => (
                  <Button
                    {...props}
                    variant="light"
                    size="xs"
                    leftSection={<IconUpload size={14} />}
                  >
                    {imageFile ? t('createDialog.changeImage') : t('createDialog.uploadImage')}
                  </Button>
                )}
              </FileButton>
            </Group>
          </Box>
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
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleClose} disabled={isSubmitting}>
              {tc('cancel')}
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {tc('create')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
