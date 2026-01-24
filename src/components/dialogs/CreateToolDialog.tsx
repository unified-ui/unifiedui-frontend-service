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
      type: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Typ ist erforderlich';
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
          <Text fw={600}>Neues Tool erstellen</Text>
        </Group>
      }
      size="md"
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
            label="Typ"
            placeholder="Tool Typ auswählen"
            required
            data={TOOL_TYPES}
            {...form.getInputProps('type')}
            disabled={isSubmitting}
          />

          <Textarea
            label="Beschreibung"
            placeholder="Optionale Beschreibung"
            minRows={3}
            {...form.getInputProps('description')}
            disabled={isSubmitting}
          />

          <TagInput
            label="Tags"
            placeholder="Tag hinzufügen..."
            value={form.values.tags}
            onChange={(tags) => form.setFieldValue('tags', tags)}
            disabled={isSubmitting}
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
