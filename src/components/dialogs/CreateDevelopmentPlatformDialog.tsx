import { type FC, useState } from 'react';
import {
  Modal,
  TextInput,
  Textarea,
  Button,
  Group,
  Stack,
  Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCode } from '@tabler/icons-react';
import { useIdentity } from '../../contexts';
import { TagInput } from '../common';

interface CreateDevelopmentPlatformDialogProps {
  opened: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormValues {
  name: string;
  description: string;
  iframe_url: string;
  tags: string[];
}

export const CreateDevelopmentPlatformDialog: FC<CreateDevelopmentPlatformDialogProps> = ({
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
      iframe_url: '',
      tags: [],
    },
    validate: {
      name: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Name is required';
        }
        if (value.length > 255) {
          return 'Name must be 255 characters or less';
        }
        return null;
      },
      iframe_url: (value) => {
        if (!value || value.trim().length === 0) {
          return 'URL is required';
        }
        try {
          new URL(value);
          return null;
        } catch {
          return 'Please enter a valid URL';
        }
      },
      description: (value) => {
        if (value && value.length > 2000) {
          return 'Description must be 2000 characters or less';
        }
        return null;
      },
    },
  });

  const handleSubmit = async (values: FormValues) => {
    if (!apiClient || !selectedTenant) return;

    setIsSubmitting(true);
    try {
      const platform = await apiClient.createDevelopmentPlatform(selectedTenant.id, {
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        iframe_url: values.iframe_url.trim(),
      });

      // If tags were added, save them to the platform
      if (values.tags.length > 0) {
        try {
          await apiClient.setDevelopmentPlatformTags(
            selectedTenant.id,
            platform.id,
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
          <IconCode size={24} />
          <Text fw={600} size="lg">Create Development Platform</Text>
        </Group>
      }
      size="md"
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

          <TextInput
            label="URL"
            placeholder="https://example.com"
            description="The URL that will be displayed in an iframe"
            required
            withAsterisk
            {...form.getInputProps('iframe_url')}
          />

          <TagInput
            label="Tags"
            placeholder="Enter a tag and press Space to add..."
            value={form.values.tags}
            onChange={(tags) => form.setFieldValue('tags', tags)}
          />

          <Textarea
            label="Description"
            placeholder="Optional description"
            maxLength={2000}
            minRows={3}
            maxRows={6}
            autosize
            {...form.getInputProps('description')}
          />

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
