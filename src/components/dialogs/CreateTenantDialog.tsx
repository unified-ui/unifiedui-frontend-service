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
  Select,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconBuilding } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useIdentity } from '../../contexts';
import { EnvironmentTypeEnum } from '../../api/types';
import { GenerateWithAIButton } from '../common/GenerateWithAIButton';

interface CreateTenantDialogProps {
  opened: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormValues {
  name: string;
  description: string;
  environment_type: string;
}

export const CreateTenantDialog: FC<CreateTenantDialogProps> = ({
  opened,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation('settings');
  const { t: tCommon } = useTranslation('common');
  const { apiClient, organization, refreshIdentity } = useIdentity();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    initialValues: {
      name: '',
      description: '',
      environment_type: EnvironmentTypeEnum.SANDBOX,
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
      environment_type: (value) => {
        if (!value || value.trim().length === 0) {
          return tCommon('validation.required', { field: t('environmentType') });
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
    if (!apiClient || !organization) return;

    setIsSubmitting(true);
    try {
      await apiClient.createTenantInOrganization(organization.id, {
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        environment_type: values.environment_type as EnvironmentTypeEnum,
      });
      form.reset();
      await refreshIdentity();
      onSuccess?.();
      onClose();
    } catch {
      // Error handling is done by the API client
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const environmentOptions = [
    { value: EnvironmentTypeEnum.SANDBOX, label: t('environmentSandbox') },
    { value: EnvironmentTypeEnum.PRODUCTION, label: t('environmentProduction') },
  ];

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="sm">
          <IconBuilding size={24} />
          <Text fw={600} size="lg">{t('createTenant')}</Text>
        </Group>
      }
      size="md"
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label={tCommon('name')}
            placeholder={tCommon('enterName')}
            required
            withAsterisk
            maxLength={255}
            data-autofocus
            {...form.getInputProps('name')}
          />

          <Select
            label={t('environmentType')}
            data={environmentOptions}
            required
            withAsterisk
            {...form.getInputProps('environment_type')}
          />

          <Box pos="relative">
            <Textarea
              label={tCommon('description')}
              placeholder={tCommon('optionalDescription')}
              maxLength={2000}
              minRows={3}
              maxRows={6}
              autosize
              {...form.getInputProps('description')}
            />
            <Box pos="absolute" top={0} right={0}>
              <GenerateWithAIButton
                entityType="tenant"
                entityName={form.values.name}
                existingDescription={form.values.description || undefined}
                onGenerated={(desc: string) => form.setFieldValue('description', desc)}
              />
            </Box>
          </Box>

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
