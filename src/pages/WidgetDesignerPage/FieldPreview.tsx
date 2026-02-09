import type { FC } from 'react';
import {
  Title,
  Stack,
  Paper,
  Text,
  Button,
  TextInput,
  Textarea,
  Select,
  Switch,
  MultiSelect,
} from '@mantine/core';
import { IconUpload } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { FormFieldConfig } from './types';

interface FieldPreviewProps {
  fields: FormFieldConfig[];
}

export const FieldPreview: FC<FieldPreviewProps> = ({ fields }) => {
  const { t } = useTranslation('widgetDesigner');

  if (fields.length === 0) {
    return (
      <Text size="sm" c="dimmed" ta="center" py="xl">{t('preview.noFields')}</Text>
    );
  }

  return (
    <Stack gap="md">
      {fields.map((field) => {
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
                placeholder={t('preview.selectPlaceholder')}
                data={field.options || []}
                required={field.required}
                size="sm"
              />
            );
          case 'multi_select':
            return (
              <MultiSelect
                key={field.id}
                label={field.label}
                placeholder={t('preview.selectPlaceholder')}
                data={field.options || []}
                required={field.required}
                size="sm"
              />
            );
          case 'toggle':
            return (
              <Switch
                key={field.id}
                label={field.label}
                defaultChecked={field.default_value === true}
                size="sm"
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
                placeholder={t('preview.chooseFile')}
                readOnly
                size="sm"
                rightSection={<IconUpload size={14} />}
              />
            );
          default:
            return null;
        }
      })}
      <Button mt="sm">{t('preview.submit')}</Button>
    </Stack>
  );
};
