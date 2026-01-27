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
import { IconTool } from '@tabler/icons-react';
import { useIdentity } from '../../contexts';
import { ToolTypeEnum } from '../../api/types';
import { TagInput } from '../common';

interface CreateToolDialogProps {
  opened: boolean;
  onClose: () => void;
  onSuccess?: (tool?: { id: string; name: string }) => void;
}

interface FormValues {
  name: string;
  description: string;
  type: string;
  tags: string[];
}

const TOOL_TYPES = [
  { value: ToolTypeEnum.MCP_SERVER, label: 'MCP Server' },
  { value: ToolTypeEnum.OPENAPI_DEFINITION, label: 'OpenAPI Definition' },
];

export const CreateToolDialog: FC<CreateToolDialogProps> = ({
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
      type: '',
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
      type: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Type is required';
        }
        return null;
      },
    },
  });

  const handleSubmit = form.onSubmit(async (values) => {
    if (!apiClient || !selectedTenant) return;

    setIsSubmitting(true);

    try {
      const createdTool = await apiClient.createTool(selectedTenant.id, {
        name: values.name.trim(),
        description: values.description.trim() || undefined,
        type: values.type as ToolTypeEnum,
        config: {}, // Always empty for now
      });

      // Set tags if any were provided
      if (values.tags.length > 0) {
        await apiClient.setToolTags(selectedTenant.id, createdTool.id, values.tags);
      }

      form.reset();
      onClose();
      onSuccess?.({ id: createdTool.id, name: createdTool.name });
    } catch {
      // Error handled by API client
    } finally {
      setIsSubmitting(false);
    }
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="xs">
          <IconTool size={20} />
          <Text fw={600}>Create New Tool</Text>
        </Group>
      }
      size="md"
      centered
      closeOnClickOutside={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="Name"
            placeholder="Tool Name"
            required
            {...form.getInputProps('name')}
            disabled={isSubmitting}
          />

          <Select
            label="Type"
            placeholder="Select tool type"
            required
            data={TOOL_TYPES}
            {...form.getInputProps('type')}
            disabled={isSubmitting}
          />

          <Textarea
            label="Description"
            placeholder="Optional description"
            minRows={3}
            {...form.getInputProps('description')}
            disabled={isSubmitting}
          />

          <TagInput
            label="Tags"
            placeholder="Add tag..."
            value={form.values.tags}
            onChange={(tags) => form.setFieldValue('tags', tags)}
            disabled={isSubmitting}
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
