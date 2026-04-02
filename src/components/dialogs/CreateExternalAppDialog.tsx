import { type FC, useState, useMemo } from 'react';
import {
  Modal, TextInput, Textarea, Button, Group, Stack, Text, Box, Alert, Image,
  FileButton, ActionIcon,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconAppWindow, IconUpload, IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useIdentity } from '../../contexts';
import { GenerateWithAIButton } from '../common/GenerateWithAIButton';
import type { ExternalAppResponse } from '../../api/types';

interface CreateExternalAppDialogProps {
  opened: boolean;
  onClose: () => void;
  onSuccess?: (app?: ExternalAppResponse) => void;
}

interface FormValues {
  name: string;
  description: string;
  url: string;
}

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
    initialValues: { name: '', description: '', url: '' },
    validate: {
      name: (value) => {
        if (!value || value.trim().length === 0) return tc('validation.required', { field: tc('name') });
        if (value.length > 255) return tc('validation.maxLength', { field: tc('name'), max: 255 });
        return null;
      },
      url: (value) => {
        if (!value || value.trim().length === 0) return tc('validation.required', { field: t('createDialog.urlLabel') });
        if (value.length > 2000) return tc('validation.maxLength', { field: t('createDialog.urlLabel'), max: 2000 });
        return null;
      },
      description: (value) => {
        if (value && value.length > 2000) return tc('validation.maxLength', { field: tc('description'), max: 2000 });
        return null;
      },
    },
  });

  const handleSubmit = async (values: FormValues) => {
    if (!apiClient || !selectedTenant) return;
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
        url: values.url.trim(),
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
      size="md"
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
          <TextInput
            label={t('createDialog.urlLabel')}
            placeholder={t('createDialog.urlPlaceholder')}
            required
            withAsterisk
            maxLength={2000}
            {...form.getInputProps('url')}
          />
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
