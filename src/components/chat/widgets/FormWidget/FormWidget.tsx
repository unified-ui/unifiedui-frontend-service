import type { FC } from 'react';
import { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  TextInput,
  Textarea,
  Select,
  MultiSelect,
  Switch,
  Text,
  Title,
  Paper,
  Stack,
  Badge,
} from '@mantine/core';
import { IconUpload, IconCheck } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { FormFieldConfig } from '../../../../pages/WidgetDesignerPage/types';
import classes from './FormWidget.module.css';

interface FormWidgetProps {
  fields: FormFieldConfig[];
  onSubmit: (data: string) => void;
  disabled?: boolean;
  submittedData?: string;
  widgetData?: Record<string, unknown>;
}

function buildInitialValues(
  fields: FormFieldConfig[],
  widgetData?: Record<string, unknown>,
): Record<string, string | boolean | string[]> {
  const values: Record<string, string | boolean | string[]> = {};
  for (const field of fields) {
    if (field.type === 'label' || field.type === 'description_textarea' || field.type === 'file') continue;
    const prefill = widgetData?.[field.id] ?? widgetData?.[field.label];
    if (prefill !== undefined && prefill !== null) {
      if (field.type === 'multi_select' && Array.isArray(prefill)) {
        values[field.id] = prefill as string[];
      } else if (field.type === 'toggle') {
        values[field.id] = Boolean(prefill);
      } else {
        values[field.id] = String(prefill);
      }
    } else if (field.type === 'toggle') {
      values[field.id] = field.default_value === true;
    } else if (field.type === 'multi_select') {
      values[field.id] = [];
    } else {
      values[field.id] = typeof field.default_value === 'string' ? field.default_value : '';
    }
  }
  return values;
}

function parseSubmittedData(
  submittedData: string,
  fields: FormFieldConfig[],
): Record<string, string | boolean | string[]> | null {
  try {
    const parsed: unknown = JSON.parse(submittedData);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
    const labelMap = parsed as Record<string, unknown>;
    const values: Record<string, string | boolean | string[]> = {};
    for (const field of fields) {
      if (field.type === 'label' || field.type === 'description_textarea' || field.type === 'file') continue;
      const val = labelMap[field.label] ?? labelMap[field.id];
      if (val !== undefined && val !== null) {
        if (field.type === 'multi_select' && Array.isArray(val)) {
          values[field.id] = val as string[];
        } else if (field.type === 'toggle') {
          values[field.id] = Boolean(val);
        } else {
          values[field.id] = String(val);
        }
      } else if (field.type === 'toggle') {
        values[field.id] = false;
      } else if (field.type === 'multi_select') {
        values[field.id] = [];
      } else {
        values[field.id] = '';
      }
    }
    return Object.keys(values).length > 0 ? values : null;
  } catch {
    return null;
  }
}

export const FormWidget: FC<FormWidgetProps> = ({
  fields,
  onSubmit,
  disabled = false,
  submittedData,
  widgetData,
}) => {
  const { t } = useTranslation('widgets');
  const parsedSubmitted = useMemo(
    () => (submittedData ? parseSubmittedData(submittedData, fields) : null),
    [submittedData, fields],
  );
  const isSubmitted = !!parsedSubmitted;

  const [values, setValues] = useState<Record<string, string | boolean | string[]>>(() =>
    parsedSubmitted ?? buildInitialValues(fields, widgetData),
  );
  const [localSubmitted, setLocalSubmitted] = useState(false);

  const effectiveDisabled = disabled || isSubmitted || localSubmitted;
  const effectiveSubmitted = isSubmitted || localSubmitted;

  const handleChange = useCallback((fieldId: string, value: string | boolean | string[]) => {
    setValues(prev => ({ ...prev, [fieldId]: value }));
  }, []);

  const handleSubmit = useCallback(() => {
    const result: Record<string, string | boolean | string[]> = {};
    for (const field of fields) {
      if (field.type === 'label' || field.type === 'description_textarea' || field.type === 'file') continue;
      result[field.label] = values[field.id] ?? '';
    }
    const json = JSON.stringify(result);
    setLocalSubmitted(true);
    onSubmit(json);
  }, [fields, values, onSubmit]);

  if (fields.length === 0) return null;

  return (
    <Box className={classes.formWidget}>
      {effectiveSubmitted && (
        <Badge
          leftSection={<IconCheck size={12} />}
          variant="light"
          color="green"
          size="sm"
          className={classes.submittedBadge}
        >
          {t('form.submitted')}
        </Badge>
      )}
      <Stack gap="md">
        {fields.map((field) => {
          const fieldValue = values[field.id];
          switch (field.type) {
            case 'text':
              return (
                <TextInput
                  key={field.id}
                  label={field.label}
                  placeholder={field.placeholder}
                  required={field.required}
                  maxLength={field.max_length}
                  size="sm"
                  value={(fieldValue as string) ?? ''}
                  onChange={(e) => handleChange(field.id, e.currentTarget.value)}
                  disabled={effectiveDisabled}
                />
              );
            case 'textarea':
              return (
                <Textarea
                  key={field.id}
                  label={field.label}
                  placeholder={field.placeholder}
                  required={field.required}
                  maxLength={field.max_length}
                  rows={field.rows}
                  size="sm"
                  value={(fieldValue as string) ?? ''}
                  onChange={(e) => handleChange(field.id, e.currentTarget.value)}
                  disabled={effectiveDisabled}
                />
              );
            case 'description_textarea':
              return (
                <Paper key={field.id} p="sm" withBorder>
                  <Text size="sm" c="dimmed">{field.content || field.label}</Text>
                </Paper>
              );
            case 'select':
              return (
                <Select
                  key={field.id}
                  label={field.label}
                  placeholder={t('form.selectPlaceholder')}
                  data={field.options || []}
                  required={field.required}
                  size="sm"
                  value={(fieldValue as string) || null}
                  onChange={(val) => handleChange(field.id, val ?? '')}
                  disabled={effectiveDisabled}
                />
              );
            case 'multi_select':
              return (
                <MultiSelect
                  key={field.id}
                  label={field.label}
                  placeholder={t('form.selectPlaceholder')}
                  data={field.options || []}
                  required={field.required}
                  size="sm"
                  value={(fieldValue as string[]) ?? []}
                  onChange={(val) => handleChange(field.id, val)}
                  disabled={effectiveDisabled}
                />
              );
            case 'toggle':
              return (
                <Switch
                  key={field.id}
                  label={field.label}
                  size="sm"
                  checked={fieldValue === true}
                  onChange={(e) => handleChange(field.id, e.currentTarget.checked)}
                  disabled={effectiveDisabled}
                />
              );
            case 'label':
              return field.style === 'heading'
                ? <Title key={field.id} order={4}>{field.text}</Title>
                : <Text key={field.id} size="sm" c="dimmed">{field.text}</Text>;
            case 'file':
              return (
                <TextInput
                  key={field.id}
                  label={field.label}
                  placeholder={t('form.chooseFile')}
                  readOnly
                  size="sm"
                  rightSection={<IconUpload size={14} />}
                  disabled
                />
              );
            default:
              return null;
          }
        })}
        {!effectiveSubmitted && (
          <Button
            mt="sm"
            onClick={handleSubmit}
            disabled={effectiveDisabled}
          >
            {t('form.submit')}
          </Button>
        )}
      </Stack>
    </Box>
  );
};
