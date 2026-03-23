import type { FC } from 'react';
import { useState } from 'react';
import {
  Stack,
  Text,
  TextInput,
  Textarea,
  NumberInput,
  Select,
  Switch,
  Group,
  ActionIcon,
  Badge,
  Collapse,
  UnstyledButton,
  Box,
  Alert,
} from '@mantine/core';
import {
  IconChevronDown,
  IconChevronRight,
  IconX,
  IconPlus,
  IconAlertTriangle,
  IconSettings,
  IconEdit,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import {
  FIELD_TYPE_ICONS,
  NON_INPUT_FIELDS,
  isFieldIdValid,
  type WidgetFieldConfig,
  type WidgetFormSchema,
} from './types';
import classes from './WidgetDesignerPage.module.css';

interface PropertiesPanelProps {
  selectedField: WidgetFieldConfig | null;
  schema: WidgetFormSchema;
  allFields: WidgetFieldConfig[];
  onFieldChange: (field: WidgetFieldConfig) => void;
  onSchemaSettingsChange: (settings: WidgetFormSchema['settings']) => void;
}

interface SectionProps {
  label: string;
  defaultOpen?: boolean;
  count?: number;
  children: React.ReactNode;
}

const Section: FC<SectionProps> = ({ label, defaultOpen = true, count, children }) => {
  const [opened, setOpened] = useState(defaultOpen);

  return (
    <Box className={classes.sectionToggle}>
      <UnstyledButton onClick={() => setOpened((o) => !o)} w="100%">
        <Group justify="space-between">
          <Group gap={4}>
            {opened ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
            <Text size="sm" fw={600}>{label}</Text>
          </Group>
          {count !== undefined && count > 0 && <Badge size="xs" variant="light">{count}</Badge>}
        </Group>
      </UnstyledButton>
      <Collapse in={opened} mt="xs">
        {children}
      </Collapse>
    </Box>
  );
};

const FieldPropertiesView: FC<{
  field: WidgetFieldConfig;
  allFields: WidgetFieldConfig[];
  onChange: (field: WidgetFieldConfig) => void;
}> = ({ field, allFields, onChange }) => {
  const { t } = useTranslation('widgetDesigner');
  const [newOption, setNewOption] = useState('');

  const Icon = FIELD_TYPE_ICONS[field.type];
  const isNonInput = NON_INPUT_FIELDS.includes(field.type);
  const isRequired = field.validation.some((v) => v.type === 'required');
  const hasOptions = field.type === 'select' || field.type === 'multi_select' || field.type === 'radio' || field.type === 'checkbox';
  const options = (field.config.options as string[]) ?? [];
  const idError = !isFieldIdValid(field.id) ? t('properties.invalidId') : allFields.some((f) => f.id === field.id && f !== field) ? t('properties.duplicateId') : undefined;

  const update = (partial: Partial<WidgetFieldConfig>) => {
    onChange({ ...field, ...partial });
  };

  const updateConfig = (partial: Record<string, unknown>) => {
    onChange({ ...field, config: { ...field.config, ...partial } });
  };

  const toggleRequired = (checked: boolean) => {
    const newValidation = checked
      ? [...field.validation, { type: 'required' as const }]
      : field.validation.filter((v) => v.type !== 'required');
    update({ validation: newValidation });
  };

  const handleAddOption = () => {
    if (newOption.trim()) {
      updateConfig({ options: [...options, newOption.trim()] });
      setNewOption('');
    }
  };

  const handleRemoveOption = (index: number) => {
    updateConfig({ options: options.filter((_: string, i: number) => i !== index) });
  };

  return (
    <Stack gap="sm">
      <Group gap="sm">
        <Icon size={16} />
        <Text fw={600} size="sm">{t(`fieldTypes.${field.type}`)}</Text>
      </Group>

      {field.type === 'password' && (
        <Alert icon={<IconAlertTriangle size={14} />} color="yellow" variant="light" p="xs">
          <Text size="xs">{t('passwordWarning')}</Text>
        </Alert>
      )}

      <Section label={t('sections.identity')} defaultOpen>
        <Stack gap="xs">
          <TextInput
            label={t('properties.fieldId')}
            value={field.id}
            onChange={(e) => update({ id: e.currentTarget.value })}
            error={idError}
            size="sm"
          />
          <Badge size="xs" variant="light">{field.type}</Badge>
        </Stack>
      </Section>

      {!isNonInput && (
        <Section label={t('sections.general')} defaultOpen>
          <Stack gap="xs">
            <TextInput
              label={t('properties.label')}
              value={field.label ?? ''}
              onChange={(e) => update({ label: e.currentTarget.value })}
              size="sm"
            />
            <TextInput
              label={t('properties.placeholder')}
              value={field.placeholder ?? ''}
              onChange={(e) => update({ placeholder: e.currentTarget.value })}
              size="sm"
            />
            <TextInput
              label={t('properties.tooltip')}
              value={field.tooltip ?? ''}
              onChange={(e) => update({ tooltip: e.currentTarget.value || undefined })}
              size="sm"
            />
            <Switch
              label={t('properties.disabled')}
              checked={field.disabled ?? false}
              onChange={(e) => update({ disabled: e.currentTarget.checked })}
              size="sm"
            />
          </Stack>
        </Section>
      )}

      {isNonInput && (
        <Section label={t('sections.content')} defaultOpen>
          <Stack gap="xs">
            {field.type === 'heading' && (
              <>
                <TextInput
                  label={t('properties.label')}
                  value={field.label ?? (field.config.text as string) ?? ''}
                  onChange={(e) => update({ label: e.currentTarget.value })}
                  size="sm"
                />
                <Select
                  label={t('properties.headingLevel')}
                  value={(field.config.level as string) ?? 'h3'}
                  onChange={(v) => updateConfig({ level: v ?? 'h3' })}
                  data={['h2', 'h3', 'h4', 'h5'].map((h) => ({ value: h, label: h.toUpperCase() }))}
                  size="sm"
                />
              </>
            )}
            {field.type === 'paragraph' && (
              <Textarea
                label={t('properties.content')}
                value={(field.config.content as string) ?? ''}
                onChange={(e) => updateConfig({ content: e.currentTarget.value })}
                rows={4}
                size="sm"
              />
            )}
            {field.type === 'alert' && (
              <>
                <TextInput
                  label={t('properties.alertTitle')}
                  value={(field.config.title as string) ?? ''}
                  onChange={(e) => updateConfig({ title: e.currentTarget.value })}
                  size="sm"
                />
                <Textarea
                  label={t('properties.content')}
                  value={(field.config.content as string) ?? ''}
                  onChange={(e) => updateConfig({ content: e.currentTarget.value })}
                  rows={3}
                  size="sm"
                />
                <Select
                  label={t('properties.alertVariant')}
                  value={(field.config.variant as string) ?? 'info'}
                  onChange={(v) => updateConfig({ variant: v ?? 'info' })}
                  data={['info', 'warning', 'error', 'success']}
                  size="sm"
                />
              </>
            )}
            {field.type === 'spacer' && (
              <Select
                label={t('properties.spacerHeight')}
                value={(field.config.height as string) ?? 'md'}
                onChange={(v) => updateConfig({ height: v ?? 'md' })}
                data={['sm', 'md', 'lg', 'xl']}
                size="sm"
              />
            )}
          </Stack>
        </Section>
      )}

      {!isNonInput && (
        <Section label={t('sections.validation')} count={field.validation.length}>
          <Stack gap="xs">
            <Switch
              label={t('properties.required')}
              checked={isRequired}
              onChange={(e) => toggleRequired(e.currentTarget.checked)}
              size="sm"
            />
            {(field.type === 'text' || field.type === 'textarea' || field.type === 'password') && (
              <>
                <NumberInput
                  label={t('properties.minLength')}
                  value={(field.validation.find((v) => v.type === 'minLength')?.params?.value as number) ?? ''}
                  onChange={(val) => {
                    const filtered = field.validation.filter((v) => v.type !== 'minLength');
                    if (val && Number(val) > 0) filtered.push({ type: 'minLength', params: { value: Number(val) } });
                    update({ validation: filtered });
                  }}
                  size="sm"
                  min={0}
                />
                <NumberInput
                  label={t('properties.maxLength')}
                  value={(field.validation.find((v) => v.type === 'maxLength')?.params?.value as number) ?? ''}
                  onChange={(val) => {
                    const filtered = field.validation.filter((v) => v.type !== 'maxLength');
                    if (val && Number(val) > 0) filtered.push({ type: 'maxLength', params: { value: Number(val) } });
                    update({ validation: filtered });
                  }}
                  size="sm"
                  min={1}
                />
              </>
            )}
            {field.type === 'number' && (
              <>
                <NumberInput
                  label={t('properties.min')}
                  value={field.config.min as number ?? ''}
                  onChange={(val) => updateConfig({ min: val === '' ? undefined : Number(val) })}
                  size="sm"
                />
                <NumberInput
                  label={t('properties.max')}
                  value={field.config.max as number ?? ''}
                  onChange={(val) => updateConfig({ max: val === '' ? undefined : Number(val) })}
                  size="sm"
                />
              </>
            )}
          </Stack>
        </Section>
      )}

      {hasOptions && (
        <Section label={t('sections.options')} count={options.length}>
          <Stack gap="xs">
            {options.map((opt: string, i: number) => (
              <Group key={i} gap="xs">
                <TextInput
                  value={opt}
                  onChange={(e) => {
                    const newOpts = [...options];
                    newOpts[i] = e.currentTarget.value;
                    updateConfig({ options: newOpts });
                  }}
                  size="xs"
                  style={{ flex: 1 }}
                />
                <ActionIcon size="sm" variant="subtle" color="red" onClick={() => handleRemoveOption(i)}>
                  <IconX size={12} />
                </ActionIcon>
              </Group>
            ))}
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
          </Stack>
        </Section>
      )}

      {field.type === 'textarea' && (
        <Section label={t('sections.typeConfig')} defaultOpen={false}>
          <NumberInput
            label={t('properties.rows')}
            value={(field.config.rows as number) ?? 4}
            onChange={(val) => updateConfig({ rows: Number(val) || 4 })}
            size="sm"
            min={2}
            max={20}
          />
        </Section>
      )}

      {field.type === 'rating' && (
        <Section label={t('sections.typeConfig')} defaultOpen={false}>
          <NumberInput
            label={t('properties.maxRating')}
            value={(field.config.maxRating as number) ?? 5}
            onChange={(val) => updateConfig({ maxRating: Number(val) || 5 })}
            size="sm"
            min={1}
            max={10}
          />
        </Section>
      )}

      {field.type === 'slider' && (
        <Section label={t('sections.typeConfig')} defaultOpen={false}>
          <Stack gap="xs">
            <NumberInput label={t('properties.min')} value={(field.config.min as number) ?? 0} onChange={(val) => updateConfig({ min: Number(val) })} size="sm" />
            <NumberInput label={t('properties.max')} value={(field.config.max as number) ?? 100} onChange={(val) => updateConfig({ max: Number(val) })} size="sm" />
            <NumberInput label={t('properties.step')} value={(field.config.step as number) ?? 1} onChange={(val) => updateConfig({ step: Number(val) || 1 })} size="sm" min={1} />
          </Stack>
        </Section>
      )}

      {(field.type === 'file' || field.type === 'image') && (
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
          </Stack>
        </Section>
      )}

      <Section label={t('sections.layout')} defaultOpen={false}>
        <Stack gap="xs">
          <NumberInput
            label={t('properties.colSpan')}
            value={field.layout.colSpan}
            onChange={(val) => update({ layout: { ...field.layout, colSpan: Math.min(12, Math.max(1, Number(val) || 12)) } })}
            size="sm"
            min={1}
            max={12}
            suffix=" / 12"
          />
          <Select
            label={t('properties.marginTop')}
            value={field.layout.marginTop ?? ''}
            onChange={(v) => update({ layout: { ...field.layout, marginTop: (v as 'sm' | 'md' | 'lg') || undefined } })}
            data={[
              { value: '', label: t('properties.none') },
              { value: 'sm', label: 'Small' },
              { value: 'md', label: 'Medium' },
              { value: 'lg', label: 'Large' },
            ]}
            size="sm"
            clearable
          />
        </Stack>
      </Section>
    </Stack>
  );
};

const PageSettingsView: FC<{
  settings: WidgetFormSchema['settings'];
  onChange: (settings: WidgetFormSchema['settings']) => void;
}> = ({ settings, onChange }) => {
  const { t } = useTranslation('widgetDesigner');

  const update = (partial: Partial<WidgetFormSchema['settings']>) => {
    onChange({ ...settings, ...partial });
  };

  return (
    <Stack gap="sm">
      <Group gap="sm">
        <IconSettings size={16} />
        <Text fw={600} size="sm">{t('pageSettings.title')}</Text>
      </Group>

      <Section label={t('sections.general')} defaultOpen>
        <Stack gap="xs">
          <TextInput
            label={t('pageSettings.formTitle')}
            value={settings.title ?? ''}
            onChange={(e) => update({ title: e.currentTarget.value || undefined })}
            size="sm"
          />
          <Textarea
            label={t('pageSettings.formDescription')}
            value={settings.description ?? ''}
            onChange={(e) => update({ description: e.currentTarget.value || undefined })}
            rows={2}
            size="sm"
          />
          <TextInput
            label={t('pageSettings.submitButtonText')}
            value={settings.submitButtonText ?? ''}
            onChange={(e) => update({ submitButtonText: e.currentTarget.value || undefined })}
            size="sm"
          />
          <TextInput
            label={t('pageSettings.successMessage')}
            value={settings.successMessage ?? ''}
            onChange={(e) => update({ successMessage: e.currentTarget.value || undefined })}
            size="sm"
          />
        </Stack>
      </Section>

      <Section label={t('sections.tabs')} defaultOpen={false}>
        <Stack gap="xs">
          <Switch
            label={t('pageSettings.enableTabs')}
            checked={settings.enableTabs ?? false}
            onChange={(e) => update({ enableTabs: e.currentTarget.checked })}
            size="sm"
          />
          {settings.enableTabs && (
            <>
              <Switch
                label={t('pageSettings.showProgressBar')}
                checked={settings.showProgressBar ?? false}
                onChange={(e) => update({ showProgressBar: e.currentTarget.checked })}
                size="sm"
              />
              <Switch
                label={t('pageSettings.validateOnTabChange')}
                checked={settings.validateOnTabChange ?? false}
                onChange={(e) => update({ validateOnTabChange: e.currentTarget.checked })}
                size="sm"
              />
            </>
          )}
        </Stack>
      </Section>
    </Stack>
  );
};

export const PropertiesPanel: FC<PropertiesPanelProps> = ({
  selectedField,
  schema,
  allFields,
  onFieldChange,
  onSchemaSettingsChange,
}) => {
  const { t } = useTranslation('widgetDesigner');

  return (
    <div className={classes.sidebar}>
      <div className={classes.sidebarHeader}>
        <Group gap="sm">
          {selectedField ? <IconEdit size={16} /> : <IconSettings size={16} />}
          <Text fw={600} size="sm">
            {selectedField ? t('fieldProperties') : t('pageSettings.title')}
          </Text>
        </Group>
      </div>
      <div className={classes.sidebarScrollOuter}>
        <div className={classes.sidebarScrollInner}>
          {selectedField ? (
            <FieldPropertiesView field={selectedField} allFields={allFields} onChange={onFieldChange} />
          ) : (
            <PageSettingsView settings={schema.settings} onChange={onSchemaSettingsChange} />
          )}
        </div>
      </div>
    </div>
  );
};
