import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
  Modal, TextInput, Textarea, Button, Stack, Group,
  LoadingOverlay, Alert, Box, Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconAppWindow } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useIdentity } from '../../../contexts';
import { GenerateWithAIButton } from '../../common/GenerateWithAIButton';
import { useFormDirtyGuard } from '../../../hooks';
import type { ExternalAppResponse } from '../../../api/types';
import classes from './EditExternalAppDialog.module.css';

interface FormValues {
  name: string;
  description: string;
  url: string;
  image_url: string;
}

export interface EditExternalAppDialogProps {
  opened: boolean;
  externalAppId: string | null;
  initialData?: ExternalAppResponse | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EditExternalAppDialog: FC<EditExternalAppDialogProps> = ({
  opened, externalAppId, initialData, onClose, onSuccess,
}) => {
  const { apiClient, selectedTenant } = useIdentity();
  const { t } = useTranslation('externalApps');
  const { t: tc } = useTranslation('common');
  const [app, setApp] = useState<ExternalAppResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    initialValues: { name: '', description: '', url: '', image_url: '' },
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
    }
  }, [opened, externalAppId, initialData, initializeFromData, fetchApp]);

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
      form.resetDirty();
      onSuccess?.();
      onClose();
    } catch {
      setError(tc('updateFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setError(null);
    setApp(null);
    onClose();
  };

  return (
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
      size="md"
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
          <TextInput
            label={t('createDialog.imageUrlLabel')}
            placeholder={t('createDialog.imageUrlPlaceholder')}
            maxLength={2000}
            {...form.getInputProps('image_url')}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleClose} disabled={isSaving}>
              {tc('cancel')}
            </Button>
            <Button type="submit" loading={isSaving} disabled={!form.isDirty()}>
              {tc('save')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
