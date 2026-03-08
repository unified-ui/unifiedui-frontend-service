import { type FC, useState, useMemo } from 'react';
import {
  Modal,
  TextInput,
  Textarea,
  Select,
  Button,
  Group,
  Stack,
  Text,
  Box,
  Alert,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconTool, IconAlertCircle } from '@tabler/icons-react';
import { useIdentity } from '../../contexts';
import { GenerateWithAIButton } from '../common/GenerateWithAIButton';
import { ToolTypeEnum } from '../../api/types';
import { TagInput } from '../common';
import { validateToolConfig } from '../../utils/toolConfigValidator';

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
  configJson: string;
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
      configJson: '',
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

  const configValidation = useMemo(() => {
    if (!form.values.configJson.trim() || !form.values.type) return null;
    return validateToolConfig(form.values.type as ToolTypeEnum, form.values.configJson);
  }, [form.values.configJson, form.values.type]);

  const handleSubmit = form.onSubmit(async (values) => {
    if (!apiClient || !selectedTenant) return;
    if (configValidation && !configValidation.valid) return;

    setIsSubmitting(true);

    try {
      let parsedConfig: Record<string, unknown> = {};
      if (values.configJson.trim()) {
        parsedConfig = JSON.parse(values.configJson);
      }

      const createdTool = await apiClient.createTool(selectedTenant.id, {
        name: values.name.trim(),
        description: values.description.trim() || undefined,
        type: values.type as ToolTypeEnum,
        config: parsedConfig,
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
      size="lg"
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

          {form.values.type && (
            <Stack gap="xs">
              <Textarea
                label="Configuration (JSON)"
                placeholder={form.values.type === ToolTypeEnum.MCP_SERVER
                  ? '{\n  "server_url": "https://...",\n  "transport": "sse"\n}'
                  : '{\n  "openapi": "3.0.0",\n  "info": { "title": "...", "version": "1.0" },\n  "paths": {}\n}'}
                minRows={6}
                maxRows={12}
                autosize
                styles={{ input: { fontFamily: 'monospace', fontSize: 12 } }}
                {...form.getInputProps('configJson')}
                disabled={isSubmitting}
              />
              {configValidation && !configValidation.valid && (
                <Alert
                  icon={<IconAlertCircle size={16} />}
                  color="red"
                  variant="light"
                  title="Configuration Error"
                >
                  {configValidation.errors.map((err, i) => (
                    <Text key={i} size="xs">{err}</Text>
                  ))}
                </Alert>
              )}
              {configValidation && configValidation.valid && configValidation.warnings.length > 0 && (
                <Alert
                  icon={<IconAlertCircle size={16} />}
                  color="yellow"
                  variant="light"
                  title="Warning"
                >
                  {configValidation.warnings.map((w, i) => (
                    <Text key={i} size="xs">{w}</Text>
                  ))}
                </Alert>
              )}
            </Stack>
          )}

          <Box pos="relative">
            <Textarea
              label="Description"
              placeholder="Optional description"
              minRows={3}
              {...form.getInputProps('description')}
              disabled={isSubmitting}
            />
            <Box pos="absolute" top={0} right={0}>
              <GenerateWithAIButton
                entityType="tool"
                entityName={form.values.name}
                existingDescription={form.values.description || undefined}
                onGenerated={(desc: string) => form.setFieldValue('description', desc)}
              />
            </Box>
          </Box>

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
