import { type FC, useState } from 'react';
import {
  Modal,
  TextInput,
  Textarea,
  PasswordInput,
  Select,
  Button,
  Group,
  Stack,
  Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconKey } from '@tabler/icons-react';
import { useIdentity } from '../../contexts';
import { TagInput } from '../common';

interface CreateCredentialDialogProps {
  opened: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormValues {
  name: string;
  description: string;
  credential_type: string;
  secret_value: string;
  tags: string[];
}

const CREDENTIAL_TYPES = [
  { value: 'API_KEY', label: 'API Key' },
  { value: 'PASSWORD', label: 'Password' },
  { value: 'TOKEN', label: 'Token' },
  { value: 'SECRET', label: 'Secret' },
  { value: 'CONNECTION_STRING', label: 'Connection String' },
  { value: 'CERTIFICATE', label: 'Certificate' },
  { value: 'OTHER', label: 'Sonstiges' },
];

export const CreateCredentialDialog: FC<CreateCredentialDialogProps> = ({
  opened,
  onClose,
  onSuccess,
}) => {
  const { apiClient, selectedTenant } = useIdentity();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    initialValues: {
      name: '',
      description: '',
      credential_type: '',
      secret_value: '',
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
      description: (value) => {
        if (value && value.length > 2000) {
          return 'Beschreibung darf maximal 2000 Zeichen lang sein';
        }
        return null;
      },
      credential_type: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Typ ist erforderlich';
        }
        return null;
      },
      secret_value: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Secret ist erforderlich';
        }
        return null;
      },
    },
  });

  const handleSubmit = async (values: FormValues) => {
    if (!apiClient || !selectedTenant) return;

    setIsSubmitting(true);
    try {
      const credential = await apiClient.createCredential(selectedTenant.id, {
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        credential_type: values.credential_type,
        secret_value: values.secret_value,
      });

      // If tags were added, save them to the credential
      if (values.tags.length > 0) {
        try {
          await apiClient.setCredentialTags(
            selectedTenant.id,
            credential.id,
            values.tags
          );
        } catch (tagError) {
          console.error('Failed to save tags:', tagError);
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
          <IconKey size={24} />
          <Text fw={600} size="lg">Credential erstellen</Text>
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
            data={CREDENTIAL_TYPES}
            searchable
            {...form.getInputProps('credential_type')}
          />

          <PasswordInput
            label="Secret"
            placeholder="Geben Sie den geheimen Wert ein"
            required
            withAsterisk
            {...form.getInputProps('secret_value')}
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
