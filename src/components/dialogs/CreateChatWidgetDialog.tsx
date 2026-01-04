import { type FC, useState } from 'react';
import {
  Modal,
  TextInput,
  Textarea,
  Select,
  Button,
  Group,
  Stack,
  Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconBrandWechat } from '@tabler/icons-react';
import { useIdentity } from '../../contexts';
import { TagInput } from '../common';
import type { ChatWidgetTypeEnum } from '../../api/types';

interface CreateChatWidgetDialogProps {
  opened: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormValues {
  name: string;
  description: string;
  type: string;
  tags: string[];
}

const CHAT_WIDGET_TYPES = [
  { value: 'IFRAME', label: 'IFrame' },
  { value: 'FORM', label: 'Form' },
];

export const CreateChatWidgetDialog: FC<CreateChatWidgetDialogProps> = ({
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
      type: 'IFRAME',
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
      const widget = await apiClient.createChatWidget(selectedTenant.id, {
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        type: values.type as ChatWidgetTypeEnum,
        config: {},
      });

      // If tags were added, save them to the widget
      if (values.tags.length > 0) {
        try {
          await apiClient.setChatWidgetTags(
            selectedTenant.id,
            widget.id,
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
          <IconBrandWechat size={24} />
          <Text fw={600} size="lg">Create Chat Widget</Text>
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

          <Select
            label="Type"
            placeholder="Select a type"
            data={CHAT_WIDGET_TYPES}
            {...form.getInputProps('type')}
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
