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
  Alert,
  Button,
} from '@mantine/core';
import {
  IconX,
  IconPlus,
  IconAlertTriangle,
  IconCode,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import {
  FIELD_TYPE_ICONS,
  NON_INPUT_FIELDS,
  isFieldIdValid,
  type WidgetFieldConfig,
  type ValidationTrigger,
} from './types';
import { Section } from './Section';
import { FieldTypeConfigSection } from './FieldTypeConfigSection';
import { VisibilityRulesEditor } from './VisibilityRulesEditor';
import { ScriptEditorDialog } from './ScriptEditorDialog';

interface FieldPropertiesViewProps {
  field: WidgetFieldConfig;
  allFields: WidgetFieldConfig[];
  onChange: (field: WidgetFieldConfig) => void;
}

export const FieldPropertiesView: FC<FieldPropertiesViewProps> = ({ field, allFields, onChange }) => {
  const { t } = useTranslation('widgetDesigner');
  const [newOption, setNewOption] = useState('');
  const [jsEditorOpen, setJsEditorOpen] = useState(false);

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

      <FieldTypeConfigSection field={field} updateConfig={updateConfig} />

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

      <Section label={t('sections.visibility')} count={field.visibility?.rules.length ?? 0} defaultOpen={false}>
          <VisibilityRulesEditor
            visibility={field.visibility}
            allFields={allFields}
            currentFieldId={field.id}
            onChange={(visibility) => update({ visibility })}
          />
        </Section>

      {!isNonInput && (
        <Section label={t('sections.validationTrigger')} defaultOpen={false}>
          <Select
            label={t('properties.validationTrigger')}
            value={field.validation[0]?.trigger ?? 'onBlur'}
            onChange={(v) => {
              const trigger = (v as ValidationTrigger) ?? 'onBlur';
              update({ validation: field.validation.map((r) => ({ ...r, trigger })) });
            }}
            data={[
              { value: 'onBlur', label: t('validationTriggers.onBlur') },
              { value: 'onChange', label: t('validationTriggers.onChange') },
              { value: 'onSubmit', label: t('validationTriggers.onSubmit') },
            ]}
            size="sm"
          />
          {(field.type === 'text' || field.type === 'email' || field.type === 'url' || field.type === 'phone') && (
            <TextInput
              label={t('properties.pattern')}
              value={(field.validation.find((v) => v.type === 'pattern')?.params?.regex as string) ?? ''}
              onChange={(e) => {
                const filtered = field.validation.filter((v) => v.type !== 'pattern');
                if (e.currentTarget.value) {
                  filtered.push({ type: 'pattern', params: { regex: e.currentTarget.value }, message: t('properties.patternError') });
                }
                update({ validation: filtered });
              }}
              size="sm"
              mt="xs"
              placeholder="^[A-Z].*"
            />
          )}
          <Button
            variant="light"
            size="xs"
            mt="xs"
            leftSection={<IconCode size={12} />}
            onClick={() => setJsEditorOpen(true)}
            fullWidth
          >
            {t('properties.customJsValidation')}
          </Button>
        </Section>
      )}

      {!isNonInput && field.computed && (
        <Section label={t('sections.computed')} defaultOpen={false}>
          <Stack gap="xs">
            <TextInput
              label={t('properties.computedExpression')}
              value={field.computed.expression}
              onChange={(e) => update({ computed: { ...field.computed!, expression: e.currentTarget.value } })}
              size="sm"
              placeholder="fields.quantity * fields.unit_price"
            />
            <TextInput
              label={t('properties.watchFields')}
              value={field.computed.watchFields.join(', ')}
              onChange={(e) => update({ computed: { ...field.computed!, watchFields: e.currentTarget.value.split(',').map((s) => s.trim()).filter(Boolean) } })}
              size="sm"
              placeholder="quantity, unit_price"
            />
          </Stack>
        </Section>
      )}

      {!isNonInput && (
        <Section label={t('sections.dataSource')} defaultOpen={false}>
          <Stack gap="xs">
            <TextInput
              label={t('properties.dataSourceId')}
              value={field.dataSource?.dataSourceId ?? ''}
              onChange={(e) => {
                if (e.currentTarget.value) {
                  update({ dataSource: { dataSourceId: e.currentTarget.value, params: field.dataSource?.params } });
                } else {
                  update({ dataSource: undefined });
                }
              }}
              size="sm"
              placeholder="ds_1"
            />
          </Stack>
        </Section>
      )}

      <ScriptEditorDialog
        opened={jsEditorOpen}
        onClose={() => setJsEditorOpen(false)}
        title={t('scriptEditor.customValidation')}
        script={field.validation.find((v) => v.type === 'custom')?.script ?? ''}
        onSave={(script) => {
          const filtered = field.validation.filter((v) => v.type !== 'custom');
          if (script.trim()) {
            filtered.push({ type: 'custom', script });
          }
          update({ validation: filtered });
        }}
        mode="validation"
        fieldIds={allFields.map((f) => f.id)}
      />
    </Stack>
  );
};
