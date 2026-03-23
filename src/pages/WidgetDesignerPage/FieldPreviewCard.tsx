import type { FC } from 'react';
import {
  TextInput,
  Textarea,
  NumberInput,
  Select,
  MultiSelect,
  Switch,
  Slider,
  Rating,
  Checkbox,
  Radio,
  Group,
  Text,
  Title,
  Divider,
  Alert,
  Tooltip,
  ActionIcon,
  Box,
} from '@mantine/core';
import { IconInfoCircle, IconUpload } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { WidgetFieldConfig } from './types';

interface FieldPreviewCardProps {
  field: WidgetFieldConfig;
}

const FieldLabel: FC<{ label?: string; tooltip?: string; required?: boolean }> = ({ label, tooltip, required }) => {
  if (!label) return null;
  return (
    <Group gap={4} mb={4}>
      <Text size="sm" fw={500}>
        {label}
        {required && <Text span c="red" ml={2}>*</Text>}
      </Text>
      {tooltip && (
        <Tooltip label={tooltip} multiline maw={300}>
          <ActionIcon variant="transparent" size="xs" c="dimmed">
            <IconInfoCircle size={14} />
          </ActionIcon>
        </Tooltip>
      )}
    </Group>
  );
};

export const FieldPreviewCard: FC<FieldPreviewCardProps> = ({ field }) => {
  const { t } = useTranslation('widgetDesigner');
  const isRequired = field.validation.some((v) => v.type === 'required');
  const options = (field.config.options as string[]) ?? [];

  switch (field.type) {
    case 'text':
    case 'email':
    case 'url':
    case 'phone':
      return (
        <Box>
          <FieldLabel label={field.label} tooltip={field.tooltip} required={isRequired} />
          <TextInput
            placeholder={field.placeholder}
            disabled={field.disabled}
            type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : field.type === 'phone' ? 'tel' : 'text'}
            size="sm"
          />
        </Box>
      );

    case 'password':
      return (
        <Box>
          <FieldLabel label={field.label} tooltip={field.tooltip} required={isRequired} />
          <TextInput placeholder={field.placeholder} disabled={field.disabled} type="password" size="sm" />
        </Box>
      );

    case 'textarea':
      return (
        <Box>
          <FieldLabel label={field.label} tooltip={field.tooltip} required={isRequired} />
          <Textarea
            placeholder={field.placeholder}
            disabled={field.disabled}
            rows={(field.config.rows as number) ?? 4}
            size="sm"
          />
        </Box>
      );

    case 'number':
      return (
        <Box>
          <FieldLabel label={field.label} tooltip={field.tooltip} required={isRequired} />
          <NumberInput
            placeholder={field.placeholder}
            disabled={field.disabled}
            min={field.config.min as number | undefined}
            max={field.config.max as number | undefined}
            step={field.config.step as number | undefined}
            size="sm"
          />
        </Box>
      );

    case 'date':
      return (
        <Box>
          <FieldLabel label={field.label} tooltip={field.tooltip} required={isRequired} />
          <TextInput placeholder={field.placeholder ?? 'YYYY-MM-DD'} disabled={field.disabled} type="date" size="sm" />
        </Box>
      );

    case 'time':
      return (
        <Box>
          <FieldLabel label={field.label} tooltip={field.tooltip} required={isRequired} />
          <TextInput placeholder={field.placeholder ?? 'HH:MM'} disabled={field.disabled} type="time" size="sm" />
        </Box>
      );

    case 'color':
      return (
        <Box>
          <FieldLabel label={field.label} tooltip={field.tooltip} required={isRequired} />
          <TextInput placeholder={field.placeholder ?? '#000000'} disabled={field.disabled} type="color" size="sm" />
        </Box>
      );

    case 'select':
      return (
        <Box>
          <FieldLabel label={field.label} tooltip={field.tooltip} required={isRequired} />
          <Select
            placeholder={field.placeholder ?? t('preview.selectPlaceholder')}
            data={options}
            disabled={field.disabled}
            size="sm"
          />
        </Box>
      );

    case 'multi_select':
      return (
        <Box>
          <FieldLabel label={field.label} tooltip={field.tooltip} required={isRequired} />
          <MultiSelect
            placeholder={field.placeholder ?? t('preview.selectPlaceholder')}
            data={options}
            disabled={field.disabled}
            size="sm"
          />
        </Box>
      );

    case 'radio':
      return (
        <Box>
          <FieldLabel label={field.label} tooltip={field.tooltip} required={isRequired} />
          <Radio.Group>
            {options.map((opt) => (
              <Radio key={opt} value={opt} label={opt} disabled={field.disabled} mb={4} />
            ))}
          </Radio.Group>
        </Box>
      );

    case 'checkbox':
      return (
        <Box>
          <FieldLabel label={field.label} tooltip={field.tooltip} required={isRequired} />
          <Checkbox.Group>
            {options.map((opt) => (
              <Checkbox key={opt} value={opt} label={opt} disabled={field.disabled} mb={4} />
            ))}
          </Checkbox.Group>
        </Box>
      );

    case 'toggle':
      return (
        <Switch
          label={field.label}
          disabled={field.disabled}
          defaultChecked={field.defaultValue === true}
          size="sm"
        />
      );

    case 'rating':
      return (
        <Box>
          <FieldLabel label={field.label} tooltip={field.tooltip} required={isRequired} />
          <Rating count={(field.config.maxRating as number) ?? 5} readOnly={field.disabled} />
        </Box>
      );

    case 'slider':
      return (
        <Box>
          <FieldLabel label={field.label} tooltip={field.tooltip} required={isRequired} />
          <Slider
            min={(field.config.min as number) ?? 0}
            max={(field.config.max as number) ?? 100}
            step={(field.config.step as number) ?? 1}
            disabled={field.disabled}
          />
        </Box>
      );

    case 'file':
    case 'image':
      return (
        <Box>
          <FieldLabel label={field.label} tooltip={field.tooltip} required={isRequired} />
          <TextInput
            placeholder={t('preview.chooseFile')}
            readOnly
            disabled={field.disabled}
            size="sm"
            rightSection={<IconUpload size={14} />}
          />
        </Box>
      );

    case 'heading':
      return (
        <Title order={((field.config.level as string)?.replace('h', '') ? Number((field.config.level as string).replace('h', '')) : 3) as 1 | 2 | 3 | 4 | 5 | 6}>
          {field.label ?? (field.config.text as string) ?? t('fieldTypes.heading')}
        </Title>
      );

    case 'paragraph':
      return (
        <Text size="sm" c="dimmed">
          {(field.config.content as string) ?? field.label ?? t('fieldTypes.paragraph')}
        </Text>
      );

    case 'divider':
      return <Divider label={field.config.label as string | undefined} />;

    case 'spacer': {
      const heights: Record<string, number> = { sm: 8, md: 16, lg: 24, xl: 32 };
      return <Box h={heights[(field.config.height as string) ?? 'md'] ?? 16} />;
    }

    case 'alert':
      return (
        <Alert
          color={field.config.variant === 'error' ? 'red' : field.config.variant === 'warning' ? 'yellow' : field.config.variant === 'success' ? 'green' : 'blue'}
          title={field.config.title as string | undefined}
        >
          {(field.config.content as string) ?? ''}
        </Alert>
      );

    default:
      return (
        <Box>
          <FieldLabel label={field.label} tooltip={field.tooltip} />
          <Text size="xs" c="dimmed">{t(`fieldTypes.${field.type}`)}</Text>
        </Box>
      );
  }
};
