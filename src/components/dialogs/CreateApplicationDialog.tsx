import { type FC, useState } from 'react';
import {
  Modal,
  TextInput,
  Textarea,
  Button,
  Group,
  Stack,
  Text,
  Select,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconSparkles } from '@tabler/icons-react';
import { useIdentity } from '../../contexts';
import { ApplicationTypeEnum } from '../../api/types';
import { TagInput } from '../common';

const APPLICATION_TYPES = [
  { value: ApplicationTypeEnum.N8N, label: 'n8n' },
  { value: ApplicationTypeEnum.MICROSOFT_FOUNDRY, label: 'Microsoft Foundry' },
  { value: ApplicationTypeEnum.REST_API, label: 'REST API' },
];

interface CreateApplicationDialogProps {
  opened: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormValues {
  name: string;
  type: string;
  description: string;
  tags: string[];
}

export const CreateApplicationDialog: FC<CreateApplicationDialogProps> = ({
  opened,
  onClose,
  onSuccess,
}) => {
  const { apiClient, selectedTenant } = useIdentity();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    initialValues: {
      name: '',
      type: '',
      description: '',
      tags: [],
    },
    validate: {
      name: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Name ist erforderlich';
        }
        if (value.length > 255) {
          return 'Name darf maximal 255 Zeichen lang sein';
        }
        return null;
      },
      type: (value) => {
        if (!value) {
          return 'Typ ist erforderlich';
        }
        return null;
      },
      description: (value) => {
        if (value && value.length > 2000) {
          return 'Beschreibung darf maximal 2000 Zeichen lang sein';
        }
        return null;
      },
    },
  });

  const handleSubmit = async (values: FormValues) => {
    if (!apiClient || !selectedTenant) return;

    setIsSubmitting(true);
    try {
      // Create the application
      const application = await apiClient.createApplication(selectedTenant.id, {
        name: values.name.trim(),
        type: values.type as ApplicationTypeEnum,
        description: values.description?.trim() || undefined,
      });

      // If tags were added, save them to the application
      if (values.tags.length > 0) {
        try {
          await apiClient.setApplicationTags(
            selectedTenant.id,
            application.id,
            values.tags
          );
        } catch (tagError) {
          console.error('Failed to save tags:', tagError);
          // Application was created successfully, just tags failed
        }
      }

      form.reset();
      onSuccess?.();
      onClose();
    } catch (error) {
      // Error handling is done by the API client
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="sm">
          <IconSparkles size={24} />
          <Text fw={600} size="lg">Chat Agent erstellen</Text>
        </Group>
      }
      size="md"
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Name"
            placeholder="Geben Sie einen Namen ein"
            required
            withAsterisk
            maxLength={255}
            data-autofocus
            {...form.getInputProps('name')}
          />

          <Select
            label="Typ"
            placeholder="Wählen Sie einen Typ"
            required
            withAsterisk
            data={APPLICATION_TYPES}
            {...form.getInputProps('type')}
          />

          <TagInput
            label="Tags"
            placeholder="Tag eingeben und mit Space bestätigen..."
            value={form.values.tags}
            onChange={(tags) => form.setFieldValue('tags', tags)}
          />

          <Textarea
            label="Beschreibung"
            placeholder="Optionale Beschreibung"
            maxLength={2000}
            minRows={3}
            maxRows={6}
            autosize
            {...form.getInputProps('description')}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleClose} disabled={isSubmitting}>
              Abbrechen
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Erstellen
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
