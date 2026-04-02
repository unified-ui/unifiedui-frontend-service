import type { FC } from 'react';
import { useState } from 'react';
import {
  Stack,
  Text,
  TextInput,
  Textarea,
  Select,
  Switch,
  NumberInput,
  Badge,
  Group,
  ActionIcon,
} from '@mantine/core';
import { IconX, IconPlus } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { FormFieldConfigV1 } from './types';

interface FieldPropertiesProps {
  field: FormFieldConfigV1 | null;
  onChange: (field: FormFieldConfigV1) => void;
}

export const FieldProperties: FC<FieldPropertiesProps> = ({ field, onChange }) => {
  const { t } = useTranslation('widgetDesigner');
  const [newOption, setNewOption] = useState('');

  if (!field) {
    return (
      <Stack gap="sm">
        <Text fw={600} size="sm">{t('fieldProperties')}</Text>
        <Text size="sm" c="dimmed">{t('noFieldSelected')}</Text>
      </Stack>
    );
  }

  const update = (partial: Partial<FormFieldConfigV1>) => {
    onChange({ ...field, ...partial });
  };

  const handleAddOption = () => {
    if (newOption.trim() && field.options) {
      update({ options: [...field.options, newOption.trim()] });
      setNewOption('');
    }
  };

  const handleRemoveOption = (index: number) => {
    if (field.options) {
      update({ options: field.options.filter((_: string, i: number) => i !== index) });
    }
  };

  return (
    <Stack gap="sm">
      <Text fw={600} size="sm">{t('fieldProperties')}</Text>
      <Badge size="sm" variant="light">{t(`fieldTypes.${field.type}`)}</Badge>

      {field.type !== 'label' && field.type !== 'description_textarea' && (
        <TextInput
          label={t('properties.label')}
          value={field.label}
          onChange={(e) => update({ label: e.currentTarget.value })}
          size="sm"
        />
      )}

      {(field.type === 'text' || field.type === 'textarea') && (
        <>
          <TextInput
            label={t('properties.placeholder')}
            value={field.placeholder || ''}
            onChange={(e) => update({ placeholder: e.currentTarget.value })}
            size="sm"
          />
          <Switch
            label={t('properties.required')}
            checked={field.required || false}
            onChange={(e) => update({ required: e.currentTarget.checked })}
            size="sm"
          />
          <NumberInput
            label={t('properties.maxLength')}
            value={field.max_length || 255}
            onChange={(val) => update({ max_length: Number(val) || 255 })}
            size="sm"
            min={1}
            max={32000}
          />
        </>
      )}

      {field.type === 'textarea' && (
        <NumberInput
          label={t('properties.rows')}
          value={field.rows || 4}
          onChange={(val) => update({ rows: Number(val) || 4 })}
          size="sm"
          min={2}
          max={20}
        />
      )}

      {field.type === 'description_textarea' && (
        <Textarea
          label={t('properties.content')}
          value={field.content || ''}
          onChange={(e) => update({ content: e.currentTarget.value })}
          size="sm"
          rows={4}
        />
      )}

      {(field.type === 'select' || field.type === 'multi_select') && (
        <>
          <Switch
            label={t('properties.required')}
            checked={field.required || false}
            onChange={(e) => update({ required: e.currentTarget.checked })}
            size="sm"
          />
          <Text size="sm" fw={500}>{t('properties.options')}</Text>
          <Stack gap={4}>
            {field.options?.map((opt: string, i: number) => (
              <Group key={i} gap="xs">
                <TextInput
                  value={opt}
                  onChange={(e) => {
                    const newOptions = [...(field.options || [])];
                    newOptions[i] = e.currentTarget.value;
                    update({ options: newOptions });
                  }}
                  size="xs"
                  style={{ flex: 1 }}
                />
                <ActionIcon size="sm" variant="subtle" color="red" onClick={() => handleRemoveOption(i)}>
                  <IconX size={12} />
                </ActionIcon>
              </Group>
            ))}
          </Stack>
          <Group gap="xs">
            <TextInput
              value={newOption}
              onChange={(e) => setNewOption(e.currentTarget.value)}
              placeholder={t('properties.addOption')}
              size="xs"
              style={{ flex: 1 }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddOption();
                }
              }}
            />
            <ActionIcon size="sm" variant="light" onClick={handleAddOption}>
              <IconPlus size={12} />
            </ActionIcon>
          </Group>
        </>
      )}

      {field.type === 'toggle' && (
        <Switch
          label={t('properties.defaultValue')}
          checked={field.default_value === true}
          onChange={(e) => update({ default_value: e.currentTarget.checked })}
          size="sm"
        />
      )}

      {field.type === 'label' && (
        <>
          <TextInput
            label={t('properties.text')}
            value={field.text || ''}
            onChange={(e) => update({ text: e.currentTarget.value })}
            size="sm"
          />
          <Select
            label={t('properties.style')}
            value={field.style || 'info'}
            onChange={(val) => update({ style: (val as 'heading' | 'info') || 'info' })}
            data={[
              { value: 'heading', label: t('properties.heading') },
              { value: 'info', label: t('properties.info') },
            ]}
            size="sm"
          />
        </>
      )}

      {field.type === 'file' && (
        <>
          <TextInput
            label={t('properties.acceptedTypes')}
            value={field.accepted_types?.join(', ') || ''}
            onChange={(e) => update({ accepted_types: e.currentTarget.value.split(',').map(s => s.trim()).filter(Boolean) })}
            size="sm"
          />
          <NumberInput
            label={t('properties.maxSize')}
            value={field.max_size || 10}
            onChange={(val) => update({ max_size: Number(val) || 10 })}
            size="sm"
            min={1}
            max={100}
          />
        </>
      )}
    </Stack>
  );
};
