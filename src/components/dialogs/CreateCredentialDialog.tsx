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
import { CredentialTypeEnum } from '../../api/types';
import { TagInput } from '../common';

interface CreateCredentialDialogProps {
  opened: boolean;
  onClose: () => void;
  onSuccess?: (credential?: { id: string; name: string }) => void;
}

interface FormValues {
  name: string;
  description: string;
  credential_type: string;
  // For API_KEY
  secret_value: string;
  // For BASIC_AUTH
  username: string;
  password: string;
  tags: string[];
}

const CREDENTIAL_TYPES = [
  { value: CredentialTypeEnum.API_KEY, label: 'API Key' },
  { value: CredentialTypeEnum.BASIC_AUTH, label: 'Basic Auth (Username/Password)' },
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
      username: '',
      password: '',
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
      secret_value: (value, values) => {
        if (values.credential_type === CredentialTypeEnum.API_KEY) {
          if (!value || value.trim().length === 0) {
            return 'API Key ist erforderlich';
          }
        }
        return null;
      },
      username: (value, values) => {
        if (values.credential_type === CredentialTypeEnum.BASIC_AUTH) {
          if (!value || value.trim().length === 0) {
            return 'Username ist erforderlich';
          }
        }
        return null;
      },
      password: (value, values) => {
        if (values.credential_type === CredentialTypeEnum.BASIC_AUTH) {
          if (!value || value.trim().length === 0) {
            return 'Password ist erforderlich';
          }
        }
        return null;
      },
    },
  });

  const handleSubmit = async (values: FormValues) => {
    if (!apiClient || !selectedTenant) return;

    setIsSubmitting(true);
    try {
      // Build secret_value based on credential type
      let secretValue: string;
      if (values.credential_type === CredentialTypeEnum.BASIC_AUTH) {
        // For BASIC_AUTH, store as JSON string
        secretValue = JSON.stringify({
          username: values.username,
          password: values.password,
        });
      } else {
        secretValue = values.secret_value;
      }

      const credential = await apiClient.createCredential(selectedTenant.id, {
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        credential_type: values.credential_type,
        secret_value: secretValue,
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
      onSuccess?.({ id: credential.id, name: credential.name });
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

  const credentialType = form.values.credential_type;

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
            {...form.getInputProps('credential_type')}
          />

          {/* API Key field - shown when API_KEY is selected */}
          {credentialType === CredentialTypeEnum.API_KEY && (
            <PasswordInput
              label="API Key"
              placeholder="Geben Sie den API Key ein"
              required
              withAsterisk
              {...form.getInputProps('secret_value')}
            />
          )}

          {/* Username/Password fields - shown when BASIC_AUTH is selected */}
          {credentialType === CredentialTypeEnum.BASIC_AUTH && (
            <>
              <TextInput
                label="Username"
                placeholder="Geben Sie den Benutzernamen ein"
                required
                withAsterisk
                {...form.getInputProps('username')}
              />
              <PasswordInput
                label="Password"
                placeholder="Geben Sie das Passwort ein"
                required
                withAsterisk
                {...form.getInputProps('password')}
              />
            </>
          )}

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
