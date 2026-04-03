import { type FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  Box,
  Switch,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconKey } from '@tabler/icons-react';
import { useIdentity } from '../../../contexts';
import { GenerateWithAIButton } from '../../common/GenerateWithAIButton';
import { CredentialTypeEnum } from '../../../api/types';
import { TagInput, CredentialTestButton } from '../../common';

interface CreateCredentialDialogProps {
  opened: boolean;
  onClose: () => void;
  onSuccess?: (credential?: { id: string; name: string }) => void;
}

interface FormValues {
  name: string;
  description: string;
  credential_type: string;
  is_active: boolean;
  // For API_KEY
  secret_value: string;
  // For BASIC_AUTH
  username: string;
  password: string;
  // For ENTRA_ID_APP_REGISTRATION
  entra_tenant_id: string;
  entra_client_id: string;
  entra_client_secret: string;
  entra_scopes: string[];
  tags: string[];
}

const CREDENTIAL_TYPES = [
  { value: CredentialTypeEnum.API_KEY, label: 'API Key' },
  { value: CredentialTypeEnum.BASIC_AUTH, label: 'Basic Auth (Username/Password)' },
  { value: CredentialTypeEnum.ENTRA_ID_APP_REGISTRATION, label: 'Entra ID App Registration' },
];

export const CreateCredentialDialog: FC<CreateCredentialDialogProps> = ({
  opened,
  onClose,
  onSuccess,
}) => {
  const { apiClient, selectedTenant } = useIdentity();
  const { t: tc } = useTranslation('common');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    initialValues: {
      name: '',
      description: '',
      credential_type: '',
      is_active: true,
      secret_value: '',
      username: '',
      password: '',
      entra_tenant_id: '',
      entra_client_id: '',
      entra_client_secret: '',
      entra_scopes: ['https://graph.microsoft.com/.default'],
      tags: [],
    },
    validate: {
      name: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Name is required';
        }
        if (value.length > 255) {
          return 'Name cannot exceed 255 characters';
        }
        return null;
      },
      description: (value) => {
        if (value && value.length > 2000) {
          return 'Description cannot exceed 2000 characters';
        }
        return null;
      },
      credential_type: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Type is required';
        }
        return null;
      },
      secret_value: (value, values) => {
        if (values.credential_type === CredentialTypeEnum.API_KEY) {
          if (!value || value.trim().length === 0) {
            return 'API Key is required';
          }
        }
        return null;
      },
      username: (value, values) => {
        if (values.credential_type === CredentialTypeEnum.BASIC_AUTH) {
          if (!value || value.trim().length === 0) {
            return 'Username is required';
          }
        }
        return null;
      },
      password: (value, values) => {
        if (values.credential_type === CredentialTypeEnum.BASIC_AUTH) {
          if (!value || value.trim().length === 0) {
            return 'Password is required';
          }
        }
        return null;
      },
      entra_tenant_id: (value, values) => {
        if (values.credential_type === CredentialTypeEnum.ENTRA_ID_APP_REGISTRATION) {
          if (!value || value.trim().length === 0) {
            return 'Tenant ID is required';
          }
        }
        return null;
      },
      entra_client_id: (value, values) => {
        if (values.credential_type === CredentialTypeEnum.ENTRA_ID_APP_REGISTRATION) {
          if (!value || value.trim().length === 0) {
            return 'Client ID is required';
          }
        }
        return null;
      },
      entra_client_secret: (value, values) => {
        if (values.credential_type === CredentialTypeEnum.ENTRA_ID_APP_REGISTRATION) {
          if (!value || value.trim().length === 0) {
            return 'Client Secret is required';
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
        secretValue = JSON.stringify({
          username: values.username,
          password: values.password,
        });
      } else if (values.credential_type === CredentialTypeEnum.ENTRA_ID_APP_REGISTRATION) {
        secretValue = JSON.stringify({
          tenant_id: values.entra_tenant_id,
          client_id: values.entra_client_id,
          client_secret: values.entra_client_secret,
          ...(values.entra_scopes.length > 0 && { scopes: values.entra_scopes }),
        });
      } else {
        secretValue = values.secret_value;
      }

      const credential = await apiClient.createCredential(selectedTenant.id, {
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        credential_type: values.credential_type,
        secret_value: secretValue,
        is_active: values.is_active,
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

  const credentialType = form.values.credential_type;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="sm">
          <IconKey size={24} />
          <Text fw={600} size="lg">Create Credential</Text>
        </Group>
      }
      size="lg"
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Name"
            placeholder="Enter a name"
            required
            withAsterisk
            maxLength={255}
            data-autofocus
            {...form.getInputProps('name')}
          />

          <Switch
            label={tc('active')}
            description={tc('activeDescription')}
            checked={form.values.is_active}
            onChange={(event) => form.setFieldValue('is_active', event.currentTarget.checked)}
          />

          <Select
            label="Type"
            placeholder="Select a type"
            required
            withAsterisk
            data={CREDENTIAL_TYPES}
            {...form.getInputProps('credential_type')}
          />

          {/* API Key field - shown when API_KEY is selected */}
          {credentialType === CredentialTypeEnum.API_KEY && (
            <PasswordInput
              label="API Key"
              placeholder="Enter the API Key"
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
                placeholder="Enter the username"
                required
                withAsterisk
                {...form.getInputProps('username')}
              />
              <PasswordInput
                label="Password"
                placeholder="Enter the password"
                required
                withAsterisk
                {...form.getInputProps('password')}
              />
            </>
          )}

          {credentialType === CredentialTypeEnum.ENTRA_ID_APP_REGISTRATION && (
            <>
              <TextInput
                label="Tenant ID"
                placeholder="Enter the Azure AD Tenant ID"
                required
                withAsterisk
                {...form.getInputProps('entra_tenant_id')}
              />
              <TextInput
                label="Client ID"
                placeholder="Enter the App Registration Client ID"
                required
                withAsterisk
                {...form.getInputProps('entra_client_id')}
              />
              <PasswordInput
                label="Client Secret"
                placeholder="Enter the App Registration Client Secret"
                required
                withAsterisk
                {...form.getInputProps('entra_client_secret')}
              />
              <TagInput
                label="Scopes"
                placeholder="e.g. https://graph.microsoft.com/.default"
                value={form.values.entra_scopes}
                onChange={(scopes) => form.setFieldValue('entra_scopes', scopes)}
              />
              <CredentialTestButton
                tenantId={form.values.entra_tenant_id}
                clientId={form.values.entra_client_id}
                clientSecret={form.values.entra_client_secret}
                scopes={form.values.entra_scopes}
              />
            </>
          )}

          <TagInput
            label="Tags"
            placeholder="Enter tag and press Space to confirm..."
            value={form.values.tags}
            onChange={(tags) => form.setFieldValue('tags', tags)}
          />

          <Box pos="relative">
            <Textarea
              label="Description"
              placeholder="Optional description"
              maxLength={2000}
              minRows={3}
              maxRows={6}
              autosize
              {...form.getInputProps('description')}
            />
            <Box pos="absolute" top={0} right={0}>
              <GenerateWithAIButton
                entityType="credential"
                entityName={form.values.name}
                existingDescription={form.values.description || undefined}
                onGenerated={(desc: string) => form.setFieldValue('description', desc)}
              />
            </Box>
          </Box>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Create
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
