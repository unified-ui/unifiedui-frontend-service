import type { FC, ReactNode } from 'react';
import { useState, useEffect } from 'react';
import {
  Box,
  TextInput,
  Textarea,
  Switch,
  Button,
  Group,
  Stack,
  Text,
  Paper,
  Skeleton,
  Badge,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconEdit, IconDeviceFloppy, IconX } from '@tabler/icons-react';
import { TagInput } from '../TagInput';
import classes from './EntityDetailsForm.module.css';

// Field configuration
export interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'switch' | 'tags' | 'custom' | 'readonly';
  placeholder?: string;
  description?: string;
  required?: boolean;
  maxLength?: number;
  render?: (value: unknown, isEditing: boolean, onChange: (value: unknown) => void) => ReactNode;
}

interface EntityDetailsFormProps<T> {
  /** Entity data */
  data: T | null;
  /** Loading state */
  isLoading?: boolean;
  /** Field configurations */
  fields: FieldConfig[];
  /** Save handler */
  onSave: (data: Partial<T>) => Promise<void>;
  /** Entity name for labels */
  entityName?: string;
  /** Extra content to render below the form */
  extraContent?: ReactNode;
  /** Whether editing is allowed */
  canEdit?: boolean;
}

export function EntityDetailsForm<T extends object>({
  data,
  isLoading = false,
  fields,
  onSave,
  entityName = 'resource',
  extraContent,
  canEdit = true,
}: EntityDetailsFormProps<T>): ReturnType<FC> {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Build initial values from data
  const getInitialValues = () => {
    if (!data) return {};
    const values: Record<string, unknown> = {};
    const dataRecord = data as Record<string, unknown>;
    fields.forEach((field) => {
      if (field.type !== 'readonly') {
        values[field.key] = dataRecord[field.key] ?? '';
      }
    });
    return values;
  };

  const form = useForm({
    initialValues: getInitialValues(),
  });

  // Reset form when data changes
  useEffect(() => {
    if (data) {
      const values: Record<string, unknown> = {};
      const dataRecord = data as Record<string, unknown>;
      fields.forEach((field) => {
        if (field.type !== 'readonly') {
          values[field.key] = dataRecord[field.key] ?? '';
        }
      });
      form.setValues(values);
      form.resetDirty(values);
    }
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    form.reset();
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(form.values as Partial<T>);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const renderField = (field: FieldConfig) => {
    const dataRecord = data as Record<string, unknown> | null;
    const value = isEditing ? form.values[field.key] : dataRecord?.[field.key];

    if (isLoading) {
      return <Skeleton height={field.type === 'textarea' ? 100 : 36} />;
    }

    // Readonly fields
    if (field.type === 'readonly') {
      return (
        <Box className={classes.readonlyField}>
          <Text size="sm" c="dimmed">
            {field.label}
          </Text>
          <Text size="sm">{String(dataRecord?.[field.key] ?? '-')}</Text>
        </Box>
      );
    }

    // Custom renderer
    if (field.type === 'custom' && field.render) {
      return field.render(
        value,
        isEditing,
        (newValue) => form.setFieldValue(field.key, newValue)
      );
    }

    // View mode
    if (!isEditing) {
      switch (field.type) {
        case 'switch':
          return (
            <Box className={classes.viewField}>
              <Text size="sm" fw={500}>
                {field.label}
              </Text>
              <Badge color={value ? 'green' : 'gray'}>
                {value ? 'Active' : 'Inactive'}
              </Badge>
            </Box>
          );

        case 'tags':
          const tags = value as string[] | undefined;
          return (
            <Box className={classes.viewField}>
              <Text size="sm" fw={500}>
                {field.label}
              </Text>
              {tags && tags.length > 0 ? (
                <Group gap="xs">
                  {tags.map((tag: string) => (
                    <Badge key={tag} variant="light">
                      {tag}
                    </Badge>
                  ))}
                </Group>
              ) : (
                <Text size="sm" c="dimmed">
                  No tags
                </Text>
              )}
            </Box>
          );

        case 'textarea':
          return (
            <Box className={classes.viewField}>
              <Text size="sm" fw={500}>
                {field.label}
              </Text>
              <Text size="sm" className={classes.textValue}>
                {value ? String(value) : '-'}
              </Text>
            </Box>
          );

        default:
          return (
            <Box className={classes.viewField}>
              <Text size="sm" fw={500}>
                {field.label}
              </Text>
              <Text size="sm">{value ? String(value) : '-'}</Text>
            </Box>
          );
      }
    }

    // Edit mode
    switch (field.type) {
      case 'text':
        return (
          <TextInput
            label={field.label}
            placeholder={field.placeholder}
            description={field.description}
            required={field.required}
            maxLength={field.maxLength}
            {...form.getInputProps(field.key)}
          />
        );

      case 'textarea':
        return (
          <Textarea
            label={field.label}
            placeholder={field.placeholder}
            description={field.description}
            required={field.required}
            maxLength={field.maxLength}
            autosize
            minRows={3}
            maxRows={8}
            {...form.getInputProps(field.key)}
          />
        );

      case 'switch':
        return (
          <Switch
            label={field.label}
            description={field.description}
            checked={Boolean(form.values[field.key])}
            onChange={(e) => form.setFieldValue(field.key, e.target.checked)}
          />
        );

      case 'tags':
        return (
          <TagInput
            label={field.label}
            description={field.description}
            value={(form.values[field.key] as string[]) || []}
            onChange={(tags) => form.setFieldValue(field.key, tags)}
            placeholder="Add tags..."
          />
        );

      default:
        return null;
    }
  };

  return (
    <Paper className={classes.container} p="lg" withBorder>
      {/* Header with Edit button */}
      <Group justify="space-between" mb="lg">
        <Text size="lg" fw={600}>
          {entityName} Details
        </Text>
        {canEdit && !isLoading && (
          <>
            {isEditing ? (
              <Group gap="sm">
                <Button
                  variant="default"
                  leftSection={<IconX size={16} />}
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  leftSection={<IconDeviceFloppy size={16} />}
                  onClick={handleSave}
                  loading={isSaving}
                >
                  Save
                </Button>
              </Group>
            ) : (
              <Button
                variant="light"
                leftSection={<IconEdit size={16} />}
                onClick={handleEdit}
              >
                Edit
              </Button>
            )}
          </>
        )}
      </Group>

      {/* Fields */}
      <Stack gap="md">
        {fields.map((field) => (
          <Box key={field.key}>{renderField(field)}</Box>
        ))}
      </Stack>

      {/* Extra content */}
      {extraContent && <Box mt="lg">{extraContent}</Box>}
    </Paper>
  );
}
