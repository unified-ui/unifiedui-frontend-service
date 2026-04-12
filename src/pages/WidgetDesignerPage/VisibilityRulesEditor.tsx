import type { FC } from 'react';
import {
  Stack,
  Group,
  Select,
  TextInput,
  ActionIcon,
  Button,
  SegmentedControl,
  Text,
  Box,
} from '@mantine/core';
import { IconPlus, IconX } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { VisibilityConfig, VisibilityRule, VisibilityOperator, WidgetFieldConfig } from './types';

interface VisibilityRulesEditorProps {
  visibility?: VisibilityConfig;
  allFields: WidgetFieldConfig[];
  currentFieldId?: string;
  onChange: (visibility: VisibilityConfig | undefined) => void;
}

const OPERATORS: VisibilityOperator[] = [
  'equals',
  'not_equals',
  'contains',
  'not_contains',
  'gt',
  'lt',
  'gte',
  'lte',
  'is_empty',
  'is_not_empty',
  'in',
  'not_in',
];

const NO_VALUE_OPERATORS: VisibilityOperator[] = ['is_empty', 'is_not_empty'];

export const VisibilityRulesEditor: FC<VisibilityRulesEditorProps> = ({
  visibility,
  allFields,
  currentFieldId,
  onChange,
}) => {
  const { t } = useTranslation('widgetDesigner');

  const availableFields = allFields.filter((f) => f.id !== currentFieldId);
  const fieldOptions = availableFields.map((f) => ({
    value: f.id,
    label: f.label ?? f.id,
  }));

  const rules = visibility?.rules ?? [];
  const condition = visibility?.condition ?? 'AND';

  const updateRules = (newRules: VisibilityRule[]) => {
    if (newRules.length === 0) {
      onChange(undefined);
    } else {
      onChange({ condition, rules: newRules });
    }
  };

  const addRule = () => {
    const newRule: VisibilityRule = {
      fieldId: availableFields[0]?.id ?? '',
      operator: 'equals',
      value: '',
    };
    updateRules([...rules, newRule]);
  };

  const removeRule = (index: number) => {
    updateRules(rules.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, partial: Partial<VisibilityRule>) => {
    updateRules(rules.map((r, i) => (i === index ? { ...r, ...partial } : r)));
  };

  return (
    <Stack gap="xs">
      {rules.length > 1 && (
        <SegmentedControl
          value={condition}
          onChange={(v) => onChange({ condition: v as 'AND' | 'OR', rules })}
          data={[
            { value: 'AND', label: t('visibility.and') },
            { value: 'OR', label: t('visibility.or') },
          ]}
          size="xs"
          fullWidth
        />
      )}

      {rules.map((rule, index) => (
        <Box key={index} p="xs" style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)' }}>
          <Stack gap={4}>
            <Group gap="xs" wrap="nowrap">
              <Select
                value={rule.fieldId}
                onChange={(v) => updateRule(index, { fieldId: v ?? '' })}
                data={fieldOptions}
                size="xs"
                style={{ flex: 1 }}
                placeholder={t('visibility.selectField')}
              />
              <ActionIcon size="xs" variant="subtle" color="red" onClick={() => removeRule(index)}>
                <IconX size={12} />
              </ActionIcon>
            </Group>
            <Select
              value={rule.operator}
              onChange={(v) => updateRule(index, { operator: (v as VisibilityOperator) ?? 'equals' })}
              data={OPERATORS.map((op) => ({ value: op, label: t(`visibility.operators.${op}`) }))}
              size="xs"
            />
            {!NO_VALUE_OPERATORS.includes(rule.operator) && (
              <TextInput
                value={typeof rule.value === 'string' ? rule.value : JSON.stringify(rule.value)}
                onChange={(e) => updateRule(index, { value: e.currentTarget.value })}
                placeholder={t('visibility.value')}
                size="xs"
              />
            )}
          </Stack>
        </Box>
      ))}

      {availableFields.length > 0 && (
        <Button
          variant="light"
          size="xs"
          leftSection={<IconPlus size={12} />}
          onClick={addRule}
          fullWidth
        >
          {t('visibility.addRule')}
        </Button>
      )}

      {availableFields.length === 0 && rules.length === 0 && (
        <Text size="xs" c="dimmed">{t('visibility.noFieldsAvailable')}</Text>
      )}
    </Stack>
  );
};
