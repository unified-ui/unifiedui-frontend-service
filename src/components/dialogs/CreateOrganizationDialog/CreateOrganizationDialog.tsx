import { type FC, useState } from 'react';
import {
  Modal,
  TextInput,
  Textarea,
  Button,
  Group,
  Stack,
  Text,
  Box,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconBuilding } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useIdentity } from '../../../contexts';

interface CreateOrganizationDialogProps {
  opened: boolean;
  onClose: () => void;
}

interface FormValues {
  name: string;
  slug: string;
  description: string;
}

const toSlug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const CreateOrganizationDialog: FC<CreateOrganizationDialogProps> = ({
  opened,
  onClose,
}) => {
  const { t } = useTranslation('header');
  const { t: tCommon } = useTranslation('common');
  const { apiClient, user, refreshIdentity } = useIdentity();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    initialValues: {
      name: '',
      slug: '',
      description: '',
    },
    validate: {
      name: (value) => {
        if (!value || value.trim().length === 0) {
          return tCommon('validation.required', { field: tCommon('name') });
        }
        if (value.length > 255) {
          return tCommon('validation.maxLength', { field: tCommon('name'), max: 255 });
        }
        return null;
      },
      slug: (value) => {
        if (!value || value.trim().length === 0) {
          return tCommon('validation.required', { field: 'Slug' });
        }
        if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(value) && value.length > 1) {
          return t('createOrg.slugValidation');
        }
        return null;
      },
      description: (value) => {
        if (value && value.length > 2000) {
          return tCommon('validation.maxLength', { field: tCommon('description'), max: 2000 });
        }
        return null;
      },
    },
  });

  const handleSubmit = async (values: FormValues) => {
    if (!apiClient || !user) return;

    setIsSubmitting(true);
    try {
      await apiClient.createOrganization({
        name: values.name.trim(),
        slug: values.slug.trim(),
        description: values.description?.trim() || undefined,
        identity_provider: user.identity_provider,
        identity_tenant_id: user.identity_tenant_id || '',
      });
      form.reset();
      await refreshIdentity(true);
      onClose();
    } catch {
      // Error handling is done by the API client
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      onClose();
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="xs">
          <IconBuilding size={20} />
          <Text fw={600}>{t('createOrg.title')}</Text>
        </Group>
      }
      size="lg"
      centered
      closeOnClickOutside={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Box>
            <Text size="sm" c="dimmed" mb="md">
              {t('createOrg.description')}
            </Text>
          </Box>

          <TextInput
            label={tCommon('name')}
            placeholder={t('createOrg.namePlaceholder')}
            required
            disabled={isSubmitting}
            {...form.getInputProps('name')}
            onChange={(e) => {
              form.getInputProps('name').onChange(e);
              if (!form.isTouched('slug')) {
                form.setFieldValue('slug', toSlug(e.currentTarget.value));
              }
            }}
          />

          <TextInput
            label="Slug"
            placeholder={t('createOrg.slugPlaceholder')}
            required
            disabled={isSubmitting}
            {...form.getInputProps('slug')}
          />

          <Textarea
            label={tCommon('description')}
            placeholder={t('createOrg.descriptionPlaceholder')}
            minRows={2}
            maxRows={4}
            autosize
            disabled={isSubmitting}
            {...form.getInputProps('description')}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleClose} disabled={isSubmitting}>
              {tCommon('cancel')}
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {tCommon('create')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
