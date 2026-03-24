import type { FC } from 'react';
import {
  Stack,
  TextInput,
  NumberInput,
  Select,
  Switch,
  ColorInput,
  MultiSelect,
  Group,
  ActionIcon,
  Button,
  Text,
} from '@mantine/core';
import { IconPlus, IconX } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { WidgetFieldConfig } from './types';
import { Section } from './Section';

interface FieldTypeConfigSectionProps {
  field: WidgetFieldConfig;
  updateConfig: (partial: Record<string, unknown>) => void;
}

export const FieldTypeConfigSection: FC<FieldTypeConfigSectionProps> = ({ field, updateConfig }) => {
  const { t } = useTranslation('widgetDesigner');

  if (field.type === 'textarea') {
    return (
      <Section label={t('sections.typeConfig')} defaultOpen={false}>
        <Stack gap="xs">
          <NumberInput
            label={t('properties.rows')}
            value={(field.config.rows as number) ?? 4}
            onChange={(val) => updateConfig({ rows: Number(val) || 4 })}
            size="sm"
            min={2}
            max={20}
          />
          <Switch
            label={t('properties.autoResize')}
            checked={(field.config.autoResize as boolean) ?? false}
            onChange={(e) => updateConfig({ autoResize: e.currentTarget.checked })}
            size="sm"
          />
          <Switch
            label={t('properties.allowTabs')}
            checked={(field.config.allowTabs as boolean) ?? false}
            onChange={(e) => updateConfig({ allowTabs: e.currentTarget.checked })}
            size="sm"
          />
        </Stack>
      </Section>
    );
  }

  if (field.type === 'number') {
    return (
      <Section label={t('sections.typeConfig')} defaultOpen={false}>
        <Stack gap="xs">
          <NumberInput
            label={t('properties.step')}
            value={(field.config.step as number) ?? 1}
            onChange={(val) => updateConfig({ step: val === '' ? undefined : Number(val) })}
            size="sm"
            min={0}
          />
          <NumberInput
            label={t('properties.decimals')}
            value={(field.config.decimals as number) ?? ''}
            onChange={(val) => updateConfig({ decimals: val === '' ? undefined : Number(val) })}
            size="sm"
            min={0}
            max={10}
          />
          <TextInput
            label={t('properties.unit')}
            value={(field.config.unit as string) ?? ''}
            onChange={(e) => updateConfig({ unit: e.currentTarget.value || undefined })}
            size="sm"
            placeholder="kg, €, %"
          />
        </Stack>
      </Section>
    );
  }

  if (field.type === 'select') {
    return (
      <Section label={t('sections.typeConfig')} defaultOpen={false}>
        <Switch
          label={t('properties.searchable')}
          checked={(field.config.searchable as boolean) ?? false}
          onChange={(e) => updateConfig({ searchable: e.currentTarget.checked })}
          size="sm"
        />
      </Section>
    );
  }

  if (field.type === 'multi_select' || field.type === 'checkbox') {
    return (
      <Section label={t('sections.typeConfig')} defaultOpen={false}>
        <NumberInput
          label={t('properties.maxSelections')}
          value={(field.config.maxSelections as number) ?? ''}
          onChange={(val) => updateConfig({ maxSelections: val === '' ? undefined : Number(val) })}
          size="sm"
          min={1}
        />
      </Section>
    );
  }

  if (field.type === 'radio') {
    return (
      <Section label={t('sections.typeConfig')} defaultOpen={false}>
        <Select
          label={t('properties.radioLayout')}
          value={(field.config.layout as string) ?? 'vertical'}
          onChange={(v) => updateConfig({ layout: v ?? 'vertical' })}
          data={[
            { value: 'vertical', label: t('properties.layoutVertical') },
            { value: 'horizontal', label: t('properties.layoutHorizontal') },
          ]}
          size="sm"
        />
      </Section>
    );
  }

  if (field.type === 'toggle') {
    return (
      <Section label={t('sections.typeConfig')} defaultOpen={false}>
        <Stack gap="xs">
          <TextInput
            label={t('properties.onLabel')}
            value={(field.config.onLabel as string) ?? ''}
            onChange={(e) => updateConfig({ onLabel: e.currentTarget.value || undefined })}
            size="sm"
          />
          <TextInput
            label={t('properties.offLabel')}
            value={(field.config.offLabel as string) ?? ''}
            onChange={(e) => updateConfig({ offLabel: e.currentTarget.value || undefined })}
            size="sm"
          />
        </Stack>
      </Section>
    );
  }

  if (field.type === 'rating') {
    return (
      <Section label={t('sections.typeConfig')} defaultOpen={false}>
        <Stack gap="xs">
          <NumberInput
            label={t('properties.maxRating')}
            value={(field.config.maxRating as number) ?? 5}
            onChange={(val) => updateConfig({ maxRating: Number(val) || 5 })}
            size="sm"
            min={1}
            max={10}
          />
          <Select
            label={t('properties.ratingIcon')}
            value={(field.config.icon as string) ?? 'star'}
            onChange={(v) => updateConfig({ icon: v ?? 'star' })}
            data={[
              { value: 'star', label: t('properties.iconStar') },
              { value: 'heart', label: t('properties.iconHeart') },
              { value: 'emoji', label: t('properties.iconEmoji') },
            ]}
            size="sm"
          />
          <Switch
            label={t('properties.allowHalf')}
            checked={(field.config.allowHalf as boolean) ?? false}
            onChange={(e) => updateConfig({ allowHalf: e.currentTarget.checked })}
            size="sm"
          />
        </Stack>
      </Section>
    );
  }

  if (field.type === 'slider') {
    return (
      <Section label={t('sections.typeConfig')} defaultOpen={false}>
        <Stack gap="xs">
          <NumberInput label={t('properties.min')} value={(field.config.min as number) ?? 0} onChange={(val) => updateConfig({ min: Number(val) })} size="sm" />
          <NumberInput label={t('properties.max')} value={(field.config.max as number) ?? 100} onChange={(val) => updateConfig({ max: Number(val) })} size="sm" />
          <NumberInput label={t('properties.step')} value={(field.config.step as number) ?? 1} onChange={(val) => updateConfig({ step: Number(val) || 1 })} size="sm" min={1} />
          <Switch
            label={t('properties.showValue')}
            checked={(field.config.showValue as boolean) ?? true}
            onChange={(e) => updateConfig({ showValue: e.currentTarget.checked })}
            size="sm"
          />
        </Stack>
      </Section>
    );
  }

  if (field.type === 'date' || field.type === 'datetime') {
    return (
      <Section label={t('sections.typeConfig')} defaultOpen={false}>
        <Stack gap="xs">
          <TextInput
            label={t('properties.minDate')}
            value={(field.config.minDate as string) ?? ''}
            onChange={(e) => updateConfig({ minDate: e.currentTarget.value || undefined })}
            size="sm"
            placeholder="YYYY-MM-DD"
          />
          <TextInput
            label={t('properties.maxDate')}
            value={(field.config.maxDate as string) ?? ''}
            onChange={(e) => updateConfig({ maxDate: e.currentTarget.value || undefined })}
            size="sm"
            placeholder="YYYY-MM-DD"
          />
        </Stack>
      </Section>
    );
  }

  if (field.type === 'time') {
    return (
      <Section label={t('sections.typeConfig')} defaultOpen={false}>
        <Stack gap="xs">
          <TextInput
            label={t('properties.minTime')}
            value={(field.config.minTime as string) ?? ''}
            onChange={(e) => updateConfig({ minTime: e.currentTarget.value || undefined })}
            size="sm"
            placeholder="HH:MM"
          />
          <TextInput
            label={t('properties.maxTime')}
            value={(field.config.maxTime as string) ?? ''}
            onChange={(e) => updateConfig({ maxTime: e.currentTarget.value || undefined })}
            size="sm"
            placeholder="HH:MM"
          />
          <NumberInput
            label={t('properties.step')}
            value={(field.config.step as number) ?? 15}
            onChange={(val) => updateConfig({ step: val === '' ? undefined : Number(val) })}
            size="sm"
            min={1}
            suffix=" min"
          />
        </Stack>
      </Section>
    );
  }

  if (field.type === 'color') {
    return (
      <Section label={t('sections.typeConfig')} defaultOpen={false}>
        <Select
          label={t('properties.colorFormat')}
          value={(field.config.format as string) ?? 'hex'}
          onChange={(v) => updateConfig({ format: v ?? 'hex' })}
          data={[
            { value: 'hex', label: 'HEX' },
            { value: 'rgb', label: 'RGB' },
          ]}
          size="sm"
        />
      </Section>
    );
  }

  if (field.type === 'phone') {
    return (
      <Section label={t('sections.typeConfig')} defaultOpen={false}>
        <TextInput
          label={t('properties.formatMask')}
          value={(field.config.formatMask as string) ?? ''}
          onChange={(e) => updateConfig({ formatMask: e.currentTarget.value || undefined })}
          size="sm"
          placeholder="+## (###) ###-####"
        />
      </Section>
    );
  }

  if (field.type === 'password') {
    return (
      <Section label={t('sections.typeConfig')} defaultOpen={false}>
        <Switch
          label={t('properties.strengthIndicator')}
          checked={(field.config.strengthIndicator as boolean) ?? false}
          onChange={(e) => updateConfig({ strengthIndicator: e.currentTarget.checked })}
          size="sm"
        />
      </Section>
    );
  }

  if (field.type === 'url') {
    return (
      <Section label={t('sections.typeConfig')} defaultOpen={false}>
        <MultiSelect
          label={t('properties.allowedProtocols')}
          value={(field.config.allowedProtocols as string[]) ?? ['https']}
          onChange={(val) => updateConfig({ allowedProtocols: val })}
          data={['https', 'http', 'ftp', 'mailto']}
          size="sm"
        />
      </Section>
    );
  }

  if (field.type === 'signature') {
    return (
      <Section label={t('sections.typeConfig')} defaultOpen={false}>
        <Stack gap="xs">
          <ColorInput
            label={t('properties.penColor')}
            value={(field.config.penColor as string) ?? '#000000'}
            onChange={(val) => updateConfig({ penColor: val })}
            size="sm"
          />
          <NumberInput
            label={t('properties.penWidth')}
            value={(field.config.penWidth as number) ?? 2}
            onChange={(val) => updateConfig({ penWidth: Number(val) || 2 })}
            size="sm"
            min={1}
            max={10}
          />
          <ColorInput
            label={t('properties.backgroundColor')}
            value={(field.config.backgroundColor as string) ?? '#ffffff'}
            onChange={(val) => updateConfig({ backgroundColor: val })}
            size="sm"
          />
        </Stack>
      </Section>
    );
  }

  if (field.type === 'rich_text') {
    return (
      <Section label={t('sections.typeConfig')} defaultOpen={false}>
        <NumberInput
          label={t('properties.maxLength')}
          value={(field.config.maxLength as number) ?? ''}
          onChange={(val) => updateConfig({ maxLength: val === '' ? undefined : Number(val) })}
          size="sm"
          min={1}
        />
      </Section>
    );
  }

  if (field.type === 'divider') {
    return (
      <Section label={t('sections.typeConfig')} defaultOpen={false}>
        <Stack gap="xs">
          <Select
            label={t('properties.dividerStyle')}
            value={(field.config.style as string) ?? 'solid'}
            onChange={(v) => updateConfig({ style: v ?? 'solid' })}
            data={[
              { value: 'solid', label: t('properties.styleSolid') },
              { value: 'dashed', label: t('properties.styleDashed') },
            ]}
            size="sm"
          />
          <TextInput
            label={t('properties.dividerLabel')}
            value={(field.config.label as string) ?? ''}
            onChange={(e) => updateConfig({ label: e.currentTarget.value || undefined })}
            size="sm"
          />
        </Stack>
      </Section>
    );
  }

  if (field.type === 'file' || field.type === 'image') {
    return (
      <Section label={t('sections.typeConfig')} defaultOpen={false}>
        <Stack gap="xs">
          <NumberInput
            label={t('properties.maxSize')}
            value={(field.config.maxSize as number) ?? 10}
            onChange={(val) => updateConfig({ maxSize: Number(val) || 10 })}
            size="sm"
            min={1}
            suffix=" MB"
          />
          <NumberInput
            label={t('properties.maxFiles')}
            value={(field.config.maxFiles as number) ?? 1}
            onChange={(val) => updateConfig({ maxFiles: Number(val) || 1 })}
            size="sm"
            min={1}
          />
          <TextInput
            label={t('properties.acceptedTypes')}
            value={(field.config.acceptedTypes as string) ?? ''}
            onChange={(e) => updateConfig({ acceptedTypes: e.currentTarget.value || undefined })}
            size="sm"
            placeholder=".pdf,.docx,.png"
          />
          {field.type === 'file' && (
            <Switch
              label={t('properties.dragDrop')}
              checked={(field.config.dragDrop as boolean) ?? true}
              onChange={(e) => updateConfig({ dragDrop: e.currentTarget.checked })}
              size="sm"
            />
          )}
          {field.type === 'image' && (
            <>
              <Switch
                label={t('properties.crop')}
                checked={(field.config.crop as boolean) ?? false}
                onChange={(e) => updateConfig({ crop: e.currentTarget.checked })}
                size="sm"
              />
              <TextInput
                label={t('properties.aspectRatio')}
                value={(field.config.aspectRatio as string) ?? ''}
                onChange={(e) => updateConfig({ aspectRatio: e.currentTarget.value || undefined })}
                size="sm"
                placeholder="16:9, 1:1, 4:3"
              />
            </>
          )}
        </Stack>
      </Section>
    );
  }

  if (field.type === 'address') {
    return (
      <Section label={t('sections.typeConfig')} defaultOpen={false}>
        <MultiSelect
          label={t('properties.requiredParts')}
          value={(field.config.requiredParts as string[]) ?? ['street', 'city', 'zip', 'country']}
          onChange={(val) => updateConfig({ requiredParts: val })}
          data={[
            { value: 'street', label: t('preview.addressStreet') },
            { value: 'city', label: t('preview.addressCity') },
            { value: 'zip', label: t('preview.addressZip') },
            { value: 'country', label: t('preview.addressCountry') },
          ]}
          size="sm"
        />
      </Section>
    );
  }

  if (field.type === 'key_value') {
    return (
      <Section label={t('sections.typeConfig')} defaultOpen={false}>
        <Stack gap="xs">
          <TextInput
            label={t('properties.keyLabel')}
            value={(field.config.keyLabel as string) ?? ''}
            onChange={(e) => updateConfig({ keyLabel: e.currentTarget.value || undefined })}
            size="sm"
          />
          <TextInput
            label={t('properties.valueLabel')}
            value={(field.config.valueLabel as string) ?? ''}
            onChange={(e) => updateConfig({ valueLabel: e.currentTarget.value || undefined })}
            size="sm"
          />
          <NumberInput
            label={t('properties.maxPairs')}
            value={(field.config.maxPairs as number) ?? ''}
            onChange={(val) => updateConfig({ maxPairs: val === '' ? undefined : Number(val) })}
            size="sm"
            min={1}
          />
        </Stack>
      </Section>
    );
  }

  if (field.type === 'table_input') {
    const columns = (field.config.columns as string[]) ?? ['Column 1', 'Column 2'];
    return (
      <Section label={t('sections.typeConfig')} defaultOpen={false}>
        <Stack gap="xs">
          <Text size="sm" fw={500}>{t('properties.columns')}</Text>
          {columns.map((col, i) => (
            <Group key={i} gap="xs">
              <TextInput
                value={col}
                onChange={(e) => {
                  const updated = [...columns];
                  updated[i] = e.currentTarget.value;
                  updateConfig({ columns: updated });
                }}
                size="sm"
                style={{ flex: 1 }}
              />
              {columns.length > 1 && (
                <ActionIcon
                  variant="subtle"
                  color="red"
                  size="sm"
                  onClick={() => updateConfig({ columns: columns.filter((_, j) => j !== i) })}
                >
                  <IconX size={14} />
                </ActionIcon>
              )}
            </Group>
          ))}
          <Button
            variant="light"
            size="xs"
            leftSection={<IconPlus size={12} />}
            onClick={() => updateConfig({ columns: [...columns, `Column ${columns.length + 1}`] })}
          >
            {t('properties.addColumn')}
          </Button>
          <NumberInput
            label={t('properties.minRows')}
            value={(field.config.minRows as number) ?? 1}
            onChange={(val) => updateConfig({ minRows: Number(val) || 1 })}
            size="sm"
            min={0}
          />
          <NumberInput
            label={t('properties.maxRows')}
            value={(field.config.maxRows as number) ?? ''}
            onChange={(val) => updateConfig({ maxRows: val === '' ? undefined : Number(val) })}
            size="sm"
            min={1}
          />
        </Stack>
      </Section>
    );
  }

  if (field.type === 'json') {
    return (
      <Section label={t('sections.typeConfig')} defaultOpen={false}>
        <Stack gap="xs">
          <NumberInput
            label={t('properties.rows')}
            value={(field.config.rows as number) ?? 6}
            onChange={(val) => updateConfig({ rows: Number(val) || 6 })}
            size="sm"
            min={2}
            max={30}
          />
          <Switch
            label={t('properties.validateJson')}
            checked={(field.config.validateJson as boolean) ?? true}
            onChange={(e) => updateConfig({ validateJson: e.currentTarget.checked })}
            size="sm"
          />
          <Switch
            label={t('properties.allowTabs')}
            checked={(field.config.allowTabs as boolean) ?? false}
            onChange={(e) => updateConfig({ allowTabs: e.currentTarget.checked })}
            size="sm"
          />
        </Stack>
      </Section>
    );
  }

  return null;
};
