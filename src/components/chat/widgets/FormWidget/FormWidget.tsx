import type { FC } from 'react';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  TextInput,
  Textarea,
  NumberInput,
  Select,
  MultiSelect,
  Switch,
  Slider,
  RangeSlider,
  Rating,
  Radio,
  Checkbox,
  ColorInput,
  FileInput,
  Text,
  Title,
  Paper,
  Badge,
  Divider,
  Alert,
  Group,
  SimpleGrid,
  PasswordInput,
  Tabs,
  Stack,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { IconCheck, IconUpload, IconAlertTriangle, IconInfoCircle, IconCircleCheck, IconAlertCircle, IconPlus, IconX } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useResizeObserver } from '@mantine/hooks';
import type { WidgetFieldConfig, WidgetTab, VisibilityConfig, VisibilityRule } from '../../../../pages/WidgetDesignerPage/types';
import { evaluateExpression } from './computedEvaluator';
import { FormSandbox } from './FormSandbox';
import type { FormSandboxHandle } from './FormSandbox';
import classes from './FormWidget.module.css';

type KVRow = { key: string; value: string };
type TableRow = Record<string, string>;

interface FormWidgetProps {
  tabs: WidgetTab[];
  enableTabs?: boolean;
  onSubmit: (data: string) => void;
  disabled?: boolean;
  submittedData?: string;
  widgetData?: Record<string, unknown>;
  submitButtonText?: string;
  maxHeight?: number;
  fillHeight?: boolean;
  description?: string;
  successMessage?: string;
  scripts?: {
    onFormLoad?: string;
    onBeforeSubmit?: string;
    onFieldChange?: string;
  };
}

type FieldValue = string | number | boolean | string[] | [number, number] | File | null;

const NON_VALUE_TYPES = new Set([
  'heading', 'paragraph', 'label', 'divider', 'spacer', 'alert', 'image_display',
]);

function safeNumberValue(value: unknown, defaultVal: number): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return defaultVal;
}

function safeRangeValue(value: unknown, min: number, max: number): [number, number] {
  if (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === 'number' &&
    typeof value[1] === 'number' &&
    !Number.isNaN(value[0]) &&
    !Number.isNaN(value[1])
  ) {
    return [value[0], value[1]];
  }
  return [min, max];
}

function getAllFields(tabs: WidgetTab[]): WidgetFieldConfig[] {
  return tabs.flatMap((tab) => tab.fields);
}

function evaluateRule(rule: VisibilityRule, values: Record<string, FieldValue>): boolean {
  const fieldVal = values[rule.fieldId];
  const ruleVal = rule.value;

  switch (rule.operator) {
    case 'is_empty':
      return fieldVal === null || fieldVal === undefined || fieldVal === '' ||
        (Array.isArray(fieldVal) && fieldVal.length === 0);
    case 'is_not_empty':
      return fieldVal !== null && fieldVal !== undefined && fieldVal !== '' &&
        !(Array.isArray(fieldVal) && fieldVal.length === 0);
    case 'equals':
      return String(fieldVal) === String(ruleVal);
    case 'not_equals':
      return String(fieldVal) !== String(ruleVal);
    case 'contains':
      if (Array.isArray(fieldVal)) return (fieldVal as string[]).includes(String(ruleVal));
      return String(fieldVal ?? '').includes(String(ruleVal ?? ''));
    case 'not_contains':
      if (Array.isArray(fieldVal)) return !(fieldVal as string[]).includes(String(ruleVal));
      return !String(fieldVal ?? '').includes(String(ruleVal ?? ''));
    case 'gt': return Number(fieldVal) > Number(ruleVal);
    case 'lt': return Number(fieldVal) < Number(ruleVal);
    case 'gte': return Number(fieldVal) >= Number(ruleVal);
    case 'lte': return Number(fieldVal) <= Number(ruleVal);
    case 'in': {
      const list = Array.isArray(ruleVal) ? ruleVal.map(String) : String(ruleVal).split(',').map(s => s.trim());
      return list.includes(String(fieldVal));
    }
    case 'not_in': {
      const list = Array.isArray(ruleVal) ? ruleVal.map(String) : String(ruleVal).split(',').map(s => s.trim());
      return !list.includes(String(fieldVal));
    }
    default: return true;
  }
}

function evaluateVisibility(
  visibility: VisibilityConfig | undefined,
  values: Record<string, FieldValue>,
): boolean {
  if (!visibility || visibility.rules.length === 0) return true;
  const results = visibility.rules.map((rule) => evaluateRule(rule, values));
  return visibility.condition === 'AND' ? results.every(Boolean) : results.some(Boolean);
}

function buildInitialValues(
  fields: WidgetFieldConfig[],
  widgetData?: Record<string, unknown>,
): Record<string, FieldValue> {
  const values: Record<string, FieldValue> = {};
  for (const field of fields) {
    if (NON_VALUE_TYPES.has(field.type)) continue;
    const prefill = widgetData?.[field.id] ?? (field.label ? widgetData?.[field.label] : undefined);
    if (prefill !== undefined && prefill !== null) {
      if ((field.type === 'multi_select' || field.type === 'checkbox') && Array.isArray(prefill)) {
        values[field.id] = prefill as string[];
      } else if (field.type === 'toggle') {
        values[field.id] = Boolean(prefill);
      } else if (field.type === 'rating' || field.type === 'number' || field.type === 'slider') {
        values[field.id] = Number(prefill);
      } else if (field.type === 'range_slider' && Array.isArray(prefill)) {
        values[field.id] = prefill as [number, number];
      } else {
        values[field.id] = String(prefill);
      }
    } else {
      switch (field.type) {
        case 'toggle': values[field.id] = field.defaultValue === true; break;
        case 'multi_select': case 'checkbox': values[field.id] = []; break;
        case 'rating': values[field.id] = 0; break;
        case 'slider': values[field.id] = Number(field.config.min ?? 0); break;
        case 'range_slider': values[field.id] = [Number(field.config.min ?? 0), Number(field.config.max ?? 100)] as [number, number]; break;
        case 'number': values[field.id] = ''; break;
        case 'file': case 'image': values[field.id] = null; break;
        default: values[field.id] = typeof field.defaultValue === 'string' ? field.defaultValue : '';
      }
    }
  }
  return values;
}

function parseSubmittedData(
  submittedData: string,
  fields: WidgetFieldConfig[],
): Record<string, FieldValue> | null {
  try {
    const parsed: unknown = JSON.parse(submittedData);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
    const map = parsed as Record<string, unknown>;
    const values: Record<string, FieldValue> = {};
    for (const field of fields) {
      if (NON_VALUE_TYPES.has(field.type)) continue;
      const val = map[field.label ?? field.id] ?? map[field.id];
      if (val !== undefined && val !== null) {
        if ((field.type === 'multi_select' || field.type === 'checkbox') && Array.isArray(val)) {
          values[field.id] = val as string[];
        } else if (field.type === 'toggle') {
          values[field.id] = Boolean(val);
        } else if (field.type === 'rating' || field.type === 'number' || field.type === 'slider') {
          values[field.id] = Number(val);
        } else {
          values[field.id] = String(val);
        }
      }
    }
    return Object.keys(values).length > 0 ? values : null;
  } catch {
    return null;
  }
}

const BLUR_TRIGGER_TYPES = new Set([
  'text', 'textarea', 'description_textarea', 'email', 'url', 'phone', 'password', 'number', 'json',
]);
const CHANGE_TRIGGER_TYPES = new Set([
  'select', 'multi_select', 'radio', 'checkbox', 'toggle', 'rating', 'slider', 'range_slider',
]);

function getFieldTrigger(field: WidgetFieldConfig): 'onBlur' | 'onChange' | 'onSubmit' {
  const explicit = field.validation.find((v) => v.trigger)?.trigger;
  if (explicit) return explicit;
  if (BLUR_TRIGGER_TYPES.has(field.type)) return 'onBlur';
  if (CHANGE_TRIGGER_TYPES.has(field.type)) return 'onChange';
  return 'onSubmit';
}

function validateSingleField(
  field: WidgetFieldConfig,
  val: FieldValue,
  kvRows: Record<string, KVRow[]>,
  tableRows: Record<string, TableRow[]>,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string | undefined {
  for (const rule of field.validation) {
    switch (rule.type) {
      case 'required': {
        if (field.type === 'key_value') {
          const rows = kvRows[field.id] ?? [{ key: '', value: '' }];
          if (!rows.some(r => r.key.trim() || r.value.trim())) return rule.message ?? t('form.required');
        } else if (field.type === 'table_input') {
          const tRows = tableRows[field.id] ?? [];
          if (!tRows.some(r => Object.values(r).some(v => v.trim()))) return rule.message ?? t('form.required');
        } else {
          const empty =
            val === null || val === undefined || val === '' ||
            (Array.isArray(val) && val.length === 0) ||
            (!(val instanceof File) && val === 0 && field.type === 'rating');
          if (empty) return rule.message ?? t('form.required');
        }
        break;
      }
      case 'minLength': {
        const min = Number(rule.params?.value ?? 0);
        if (typeof val === 'string' && val.length > 0 && val.length < min) {
          return rule.message ?? t('form.minLength', { min });
        }
        break;
      }
      case 'maxLength': {
        const max = Number(rule.params?.value ?? Infinity);
        if (typeof val === 'string' && val.length > max) {
          return rule.message ?? t('form.maxLength', { max });
        }
        break;
      }
      case 'min': {
        const minVal = Number(rule.params?.value ?? -Infinity);
        if (typeof val === 'number' && val < minVal) {
          return rule.message ?? t('form.min', { min: minVal });
        }
        break;
      }
      case 'max': {
        const maxVal = Number(rule.params?.value ?? Infinity);
        if (typeof val === 'number' && val > maxVal) {
          return rule.message ?? t('form.max', { max: maxVal });
        }
        break;
      }
      case 'pattern': {
        const regex = rule.params?.regex as string;
        if (regex && typeof val === 'string' && val.length > 0) {
          try {
            if (!new RegExp(regex).test(val)) return rule.message ?? t('form.pattern');
          } catch { /* invalid regex */ }
        }
        break;
      }
      case 'email': {
        if (typeof val === 'string' && val.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
          return rule.message ?? t('form.email');
        }
        break;
      }
      case 'url': {
        if (typeof val === 'string' && val.length > 0) {
          try { new URL(val); } catch { return rule.message ?? t('form.url'); }
        }
        break;
      }
      case 'minSelections': {
        const min = Number(rule.params?.value ?? 0);
        if (Array.isArray(val) && val.length < min) {
          return rule.message ?? t('form.minSelections', { min });
        }
        break;
      }
      case 'maxSelections': {
        const max = Number(rule.params?.value ?? Infinity);
        if (Array.isArray(val) && val.length > max) {
          return rule.message ?? t('form.maxSelections', { max });
        }
        break;
      }
    }
  }

  if (field.type === 'email' && typeof val === 'string' && val.length > 0) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return t('form.email');
  }
  if (field.type === 'url' && typeof val === 'string' && val.length > 0) {
    try { new URL(val); } catch { return t('form.url'); }
  }

  return undefined;
}

const RESPONSIVE_BREAKPOINT = 600;

const ALERT_ICONS: Record<string, FC<{ size: number }>> = {
  info: IconInfoCircle,
  warning: IconAlertTriangle,
  error: IconAlertCircle,
  success: IconCircleCheck,
};

const ALERT_COLORS: Record<string, string> = {
  info: 'blue', warning: 'yellow', error: 'red', success: 'green',
};

const SPACER_HEIGHTS: Record<string, number> = { sm: 8, md: 16, lg: 24, xl: 32 };

const SignaturePad: FC<{ label?: string; disabled: boolean }> = ({ label, disabled }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || disabled) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
    };

    const onDown = (e: MouseEvent | TouchEvent) => {
      drawing.current = true;
      ctx.beginPath();
      const p = getPos(e);
      ctx.moveTo(p.x, p.y);
    };
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!drawing.current) return;
      const p = getPos(e);
      ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = getComputedStyle(canvas).color || '#000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.stroke();
    };
    const onUp = () => { drawing.current = false; };

    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseup', onUp);
    canvas.addEventListener('mouseleave', onUp);
    canvas.addEventListener('touchstart', onDown as EventListener, { passive: false });
    canvas.addEventListener('touchmove', (e: TouchEvent) => { e.preventDefault(); onMove(e); }, { passive: false });
    canvas.addEventListener('touchend', onUp);

    return () => {
      canvas.removeEventListener('mousedown', onDown);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseup', onUp);
      canvas.removeEventListener('mouseleave', onUp);
    };
  }, [disabled]);

  return (
    <Box>
      {label && <Text size="sm" fw={500} mb={4}>{label}</Text>}
      <Paper withBorder p={0} style={{ overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          width={300}
          height={120}
          style={{
            width: '100%',
            cursor: disabled ? 'default' : 'crosshair',
            display: 'block',
            borderRadius: 'var(--mantine-radius-sm)',
          }}
        />
      </Paper>
      <Text size="xs" c="dimmed" ta="center" mt={4}>Click & drag to sign</Text>
    </Box>
  );
};

const FieldRenderer: FC<{
  field: WidgetFieldConfig;
  value: FieldValue;
  onChange: (id: string, value: FieldValue) => void;
  onBlur: (id: string) => void;
  disabled: boolean;
  error?: string;
  kvRows: Record<string, KVRow[]>;
  tableRows: Record<string, TableRow[]>;
  onKvRowsChange: (fieldId: string, rows: KVRow[]) => void;
  onTableRowsChange: (fieldId: string, rows: TableRow[]) => void;
}> = ({ field, value, onChange, onBlur, disabled, error, kvRows, tableRows, onKvRowsChange, onTableRowsChange }) => {
  const { t } = useTranslation('widgets');
  const isRequired = field.validation.some((v) => v.type === 'required');
  const fieldDisabled = disabled || field.disabled === true;
  const { config } = field;

  const wrapWithTooltip = (content: React.ReactElement) => {
    if (!field.tooltip) return content;
    return <Tooltip label={field.tooltip} multiline maw={300} withArrow position="top-start">{content}</Tooltip>;
  };

  const renderField = () => {
  switch (field.type) {
    case 'text':
    case 'email':
    case 'url':
    case 'phone':
      return (
        <TextInput
          label={field.label}
          placeholder={field.placeholder}
          required={isRequired}
          type={field.type === 'phone' ? 'tel' : field.type === 'url' ? 'url' : field.type === 'email' ? 'email' : 'text'}
          size="sm"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(field.id, e.currentTarget.value)}
          onBlur={() => onBlur(field.id)}
          disabled={fieldDisabled}
          error={error}
        />
      );

    case 'password':
      return (
        <PasswordInput
          label={field.label}
          placeholder={field.placeholder}
          required={isRequired}
          size="sm"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(field.id, e.currentTarget.value)}
          onBlur={() => onBlur(field.id)}
          disabled={fieldDisabled}
          error={error}
        />
      );

    case 'textarea':
    case 'json':
      return (
        <Textarea
          label={field.label}
          placeholder={field.placeholder ?? (field.type === 'json' ? '{ }' : '')}
          required={isRequired}
          rows={(config.rows as number) ?? 4}
          size="sm"
          styles={field.type === 'json' ? { input: { fontFamily: 'monospace', fontSize: 13 } } : undefined}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(field.id, e.currentTarget.value)}
          onBlur={() => onBlur(field.id)}
          disabled={fieldDisabled}
          error={error}
        />
      );

    case 'number':
      return (
        <NumberInput
          label={field.label}
          placeholder={field.placeholder}
          required={isRequired}
          min={config.min as number | undefined}
          max={config.max as number | undefined}
          step={(config.step as number) ?? 1}
          size="sm"
          value={value === '' ? '' : Number(value)}
          onChange={(val) => onChange(field.id, val)}
          onBlur={() => onBlur(field.id)}
          disabled={fieldDisabled}
          error={error}
        />
      );

    case 'date':
      return (
        <TextInput
          label={field.label}
          placeholder={field.placeholder}
          required={isRequired}
          type="date"
          size="sm"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(field.id, e.currentTarget.value)}
          onBlur={() => onBlur(field.id)}
          disabled={fieldDisabled}
          error={error}
        />
      );

    case 'time':
      return (
        <TextInput
          label={field.label}
          required={isRequired}
          type="time"
          size="sm"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(field.id, e.currentTarget.value)}
          onBlur={() => onBlur(field.id)}
          disabled={fieldDisabled}
          error={error}
        />
      );

    case 'datetime':
      return (
        <TextInput
          label={field.label}
          placeholder={field.placeholder}
          required={isRequired}
          type="datetime-local"
          size="sm"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(field.id, e.currentTarget.value)}
          disabled={fieldDisabled}
          error={error}
        />
      );

    case 'color':
      return (
        <ColorInput
          label={field.label}
          format={(config.format as 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsla') ?? 'hex'}
          size="sm"
          value={(value as string) ?? '#000000'}
          onChange={(val) => onChange(field.id, val)}
          disabled={fieldDisabled}
          error={error}
        />
      );

    case 'select':
      return (
        <Select
          label={field.label}
          placeholder={field.placeholder || 'Select...'}
          data={(config.options as string[]) ?? []}
          required={isRequired}
          size="sm"
          value={(value as string) || null}
          onChange={(val) => onChange(field.id, val ?? '')}
          disabled={fieldDisabled}
          error={error}
        />
      );

    case 'multi_select':
      return (
        <MultiSelect
          label={field.label}
          placeholder={field.placeholder || 'Select...'}
          data={(config.options as string[]) ?? []}
          required={isRequired}
          size="sm"
          value={(value as string[]) ?? []}
          onChange={(val) => onChange(field.id, val)}
          disabled={fieldDisabled}
          error={error}
        />
      );

    case 'radio': {
      const opts = (config.options as string[]) ?? [];
      return (
        <Radio.Group
          label={field.label}
          required={isRequired}
          value={(value as string) ?? ''}
          onChange={(val) => onChange(field.id, val)}
          error={error}
        >
          <Group mt="xs" gap="md">
            {opts.map((opt) => (
              <Radio key={opt} value={opt} label={opt} disabled={fieldDisabled} size="sm" />
            ))}
          </Group>
        </Radio.Group>
      );
    }

    case 'checkbox': {
      const opts = (config.options as string[]) ?? [];
      return (
        <Checkbox.Group
          label={field.label}
          required={isRequired}
          value={(value as string[]) ?? []}
          onChange={(val) => onChange(field.id, val)}
          error={error}
        >
          <Group mt="xs" gap="md">
            {opts.map((opt) => (
              <Checkbox key={opt} value={opt} label={opt} disabled={fieldDisabled} size="sm" />
            ))}
          </Group>
        </Checkbox.Group>
      );
    }

    case 'toggle':
      return (
        <Box>
          <Switch
            label={field.label}
            size="sm"
            checked={value === true}
            onChange={(e) => onChange(field.id, e.currentTarget.checked)}
            disabled={fieldDisabled}
            error={error}
          />
          {error && <Text size="xs" c="red" mt={2}>{error}</Text>}
        </Box>
      );

    case 'rating':
      return (
        <Box>
          {field.label && <Text size="sm" fw={500} mb={4}>{field.label}</Text>}
          <Rating
            count={(config.maxRating as number) ?? 5}
            fractions={config.allowHalf ? 2 : 1}
            value={safeNumberValue(value, 0)}
            onChange={(val) => onChange(field.id, val)}
            readOnly={fieldDisabled}
            size="md"
          />
          {error && <Text size="xs" c="red" mt={2}>{error}</Text>}
        </Box>
      );

    case 'slider': {
      const sliderMin = (config.min as number) ?? 0;
      return (
        <Box>
          {field.label && <Text size="sm" fw={500} mb={4}>{field.label}</Text>}
          <Slider
            min={sliderMin}
            max={(config.max as number) ?? 100}
            step={(config.step as number) ?? 1}
            value={safeNumberValue(value, sliderMin)}
            onChange={(val) => onChange(field.id, val)}
            disabled={fieldDisabled}
            size="sm"
            label={config.showValue ? undefined : null}
          />
          {error && <Text size="xs" c="red" mt={2}>{error}</Text>}
        </Box>
      );
    }

    case 'range_slider': {
      const rangeMin = (config.min as number) ?? 0;
      const rangeMax = (config.max as number) ?? 100;
      return (
        <Box>
          {field.label && <Text size="sm" fw={500} mb={4}>{field.label}</Text>}
          <RangeSlider
            min={rangeMin}
            max={rangeMax}
            step={(config.step as number) ?? 1}
            value={safeRangeValue(value, rangeMin, rangeMax)}
            onChange={(val) => onChange(field.id, val)}
            disabled={fieldDisabled}
            size="sm"
          />
          {error && <Text size="xs" c="red" mt={2}>{error}</Text>}
        </Box>
      );
    }

    case 'file':
    case 'image':
      return (
        <FileInput
          label={field.label}
          placeholder={field.placeholder || 'Choose file...'}
          accept={field.type === 'image' ? 'image/*' : undefined}
          size="sm"
          leftSection={<IconUpload size={14} />}
          value={value as File | null}
          onChange={(file) => onChange(field.id, file)}
          disabled={fieldDisabled}
          error={error}
        />
      );

    case 'rich_text':
    case 'description_textarea':
      return (
        <Textarea
          label={field.label}
          placeholder={field.placeholder}
          rows={6}
          size="sm"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(field.id, e.currentTarget.value)}
          onBlur={() => onBlur(field.id)}
          disabled={fieldDisabled}
          error={error}
        />
      );

    case 'signature':
      return <SignaturePad label={field.label} disabled={fieldDisabled} />;

    case 'address':
      return (
        <Box>
          {field.label && <Text size="sm" fw={500} mb={4}>{field.label}</Text>}
          <Stack gap="xs">
            <TextInput placeholder="Street" size="sm" disabled={fieldDisabled}
              value={((value as string) ?? '').split('|')[0] ?? ''}
              onChange={(e) => {
                const parts = ((value as string) ?? '').split('|');
                parts[0] = e.currentTarget.value;
                onChange(field.id, parts.join('|'));
              }}
            />
            <Group grow gap="xs">
              <TextInput placeholder="City" size="sm" disabled={fieldDisabled}
                value={((value as string) ?? '').split('|')[1] ?? ''}
                onChange={(e) => {
                  const parts = ((value as string) ?? '').split('|');
                  while (parts.length < 4) parts.push('');
                  parts[1] = e.currentTarget.value;
                  onChange(field.id, parts.join('|'));
                }}
              />
              <TextInput placeholder="ZIP" size="sm" disabled={fieldDisabled} style={{ maxWidth: 120 }}
                value={((value as string) ?? '').split('|')[2] ?? ''}
                onChange={(e) => {
                  const parts = ((value as string) ?? '').split('|');
                  while (parts.length < 4) parts.push('');
                  parts[2] = e.currentTarget.value;
                  onChange(field.id, parts.join('|'));
                }}
              />
            </Group>
            <TextInput placeholder="Country" size="sm" disabled={fieldDisabled}
              value={((value as string) ?? '').split('|')[3] ?? ''}
              onChange={(e) => {
                const parts = ((value as string) ?? '').split('|');
                while (parts.length < 4) parts.push('');
                parts[3] = e.currentTarget.value;
                onChange(field.id, parts.join('|'));
              }}
            />
          </Stack>
          {error && <Text size="xs" c="red" mt={2}>{error}</Text>}
        </Box>
      );

    case 'key_value': {
      const rows = kvRows[field.id] ?? [{ key: '', value: '' }];
      const keyLabel = (config.keyLabel as string) ?? 'Key';
      const valLabel = (config.valueLabel as string) ?? 'Value';
      return (
        <Box>
          {field.label && <Text size="sm" fw={500} mb={4}>{field.label}</Text>}
          {error && <Text size="xs" c="red" mb={4}>{error}</Text>}
          <Paper withBorder p="sm">
            <Stack gap="xs">
              <Group grow gap="xs">
                <Text size="xs" fw={500}>{keyLabel}</Text>
                <Text size="xs" fw={500}>{valLabel}</Text>
                {!fieldDisabled && <Box style={{ width: 28 }} />}
              </Group>
              {rows.map((row, i) => (
                <Group key={i} grow gap="xs" wrap="nowrap">
                  <TextInput size="sm" placeholder={keyLabel} disabled={fieldDisabled}
                    value={row.key}
                    onChange={(e) => {
                      const next = [...rows];
                      next[i] = { ...row, key: e.currentTarget.value };
                      onKvRowsChange(field.id, next);
                    }}
                  />
                  <TextInput size="sm" placeholder={valLabel} disabled={fieldDisabled}
                    value={row.value}
                    onChange={(e) => {
                      const next = [...rows];
                      next[i] = { ...row, value: e.currentTarget.value };
                      onKvRowsChange(field.id, next);
                    }}
                  />
                  {!fieldDisabled && (
                    <ActionIcon size="sm" variant="subtle" color="red" disabled={rows.length <= 1}
                      onClick={() => onKvRowsChange(field.id, rows.filter((_, idx) => idx !== i))}>
                      <IconX size={12} />
                    </ActionIcon>
                  )}
                </Group>
              ))}
              {!fieldDisabled && (
                <Button size="xs" variant="light" leftSection={<IconPlus size={12} />}
                  onClick={() => onKvRowsChange(field.id, [...rows, { key: '', value: '' }])}>
                  {t('form.addRow')}
                </Button>
              )}
            </Stack>
          </Paper>
        </Box>
      );
    }

    case 'table_input': {
      const cols = (config.columns as string[]) ?? ['Column 1', 'Column 2'];
      const emptyRow: TableRow = Object.fromEntries(cols.map((c) => [c, '']));
      const rows = tableRows[field.id] ?? [{ ...emptyRow }];
      return (
        <Box>
          {field.label && <Text size="sm" fw={500} mb={4}>{field.label}</Text>}
          {error && <Text size="xs" c="red" mb={4}>{error}</Text>}
          <Paper withBorder style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {cols.map((col) => (
                    <th key={col} className={classes.tableHeader}>{col}</th>
                  ))}
                  {!fieldDisabled && <th style={{ width: 32 }} />}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri}>
                    {cols.map((col) => (
                      <td key={col} className={classes.tableCell}>
                        <TextInput size="xs" variant="unstyled" disabled={fieldDisabled}
                          value={row[col] ?? ''}
                          onChange={(e) => {
                            const next = [...rows];
                            next[ri] = { ...row, [col]: e.currentTarget.value };
                            onTableRowsChange(field.id, next);
                          }}
                        />
                      </td>
                    ))}
                    {!fieldDisabled && (
                      <td className={classes.tableCell}>
                        <ActionIcon size="xs" variant="subtle" color="red" disabled={rows.length <= 1}
                          onClick={() => onTableRowsChange(field.id, rows.filter((_, idx) => idx !== ri))}>
                          <IconX size={10} />
                        </ActionIcon>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </Paper>
          {!fieldDisabled && (
            <Button size="xs" variant="light" mt={4} leftSection={<IconPlus size={12} />}
              onClick={() => onTableRowsChange(field.id, [...rows, { ...emptyRow }])}>
              {t('form.addRow')}
            </Button>
          )}
        </Box>
      );
    }

    case 'heading':
      return <Title order={Number((config.level as string)?.replace('h', '') ?? '3') as 1 | 2 | 3 | 4 | 5 | 6}>
        {field.label ?? (config.text as string) ?? 'Heading'}
      </Title>;

    case 'paragraph':
      return <Text size="sm" c="dimmed" style={{ whiteSpace: 'pre-wrap' }}>{(config.content as string) ?? ''}</Text>;

    case 'divider':
      return <Divider />;

    case 'spacer':
      return <Box style={{ height: SPACER_HEIGHTS[(config.height as string) ?? 'md'] ?? 16 }} />;

    case 'alert': {
      const variant = (config.variant as string) ?? 'info';
      const AlertIcon = ALERT_ICONS[variant] ?? IconInfoCircle;
      return (
        <Alert
          icon={<AlertIcon size={16} />}
          color={ALERT_COLORS[variant] ?? 'blue'}
          title={config.title as string | undefined}
          variant="light"
        >
          {(config.content as string) ?? ''}
        </Alert>
      );
    }

    default:
      return (
        <TextInput
          label={field.label ?? field.type}
          placeholder={field.placeholder}
          size="sm"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(field.id, e.currentTarget.value)}
          disabled={fieldDisabled}
        />
      );
  }
  };

  return wrapWithTooltip(renderField());
};

const FieldGrid: FC<{
  fields: WidgetFieldConfig[];
  values: Record<string, FieldValue>;
  onChange: (id: string, value: FieldValue) => void;
  onBlur: (id: string) => void;
  disabled: boolean;
  errors: Record<string, string>;
  kvRows: Record<string, KVRow[]>;
  tableRows: Record<string, TableRow[]>;
  onKvRowsChange: (fieldId: string, rows: KVRow[]) => void;
  onTableRowsChange: (fieldId: string, rows: TableRow[]) => void;
  compact?: boolean;
}> = ({ fields, values, onChange, onBlur, disabled, errors, kvRows, tableRows, onKvRowsChange, onTableRowsChange, compact }) => (
  <SimpleGrid cols={12} spacing="sm" style={{ alignItems: 'start' }}>
    {fields.map((field) => {
      if (!evaluateVisibility(field.visibility, values)) return null;
      const span = compact ? 12 : field.layout.colSpan;
      return (
        <Box key={field.id} style={{ gridColumn: `span ${span}` }}>
          <FieldRenderer
            field={field}
            value={values[field.id]}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            error={errors[field.id]}
            kvRows={kvRows}
            tableRows={tableRows}
            onKvRowsChange={onKvRowsChange}
            onTableRowsChange={onTableRowsChange}
          />
        </Box>
      );
    })}
  </SimpleGrid>
);

export const FormWidget: FC<FormWidgetProps> = ({
  tabs,
  enableTabs = false,
  onSubmit,
  disabled = false,
  submittedData,
  widgetData,
  submitButtonText,
  maxHeight,
  fillHeight,
  description,
  successMessage,
  scripts,
}) => {
  const { t } = useTranslation('widgets');
  const allFields = useMemo(() => getAllFields(tabs), [tabs]);
  const hasTabs = enableTabs && tabs.length > 1;
  const [containerRef, containerRect] = useResizeObserver();
  const isCompact = containerRect.width > 0 && containerRect.width < RESPONSIVE_BREAKPOINT;

  const parsedSubmitted = useMemo(
    () => (submittedData ? parseSubmittedData(submittedData, allFields) : null),
    [submittedData, allFields],
  );
  const isSubmitted = !!parsedSubmitted;

  const [values, setValues] = useState<Record<string, FieldValue>>(() =>
    parsedSubmitted ?? buildInitialValues(allFields, widgetData),
  );
  const [localSubmitted, setLocalSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [kvRows, setKvRows] = useState<Record<string, KVRow[]>>({});
  const [tableRows, setTableRows] = useState<Record<string, TableRow[]>>({});

  const effectiveDisabled = disabled || isSubmitted || localSubmitted;
  const effectiveSubmitted = isSubmitted || localSubmitted;

  const fieldMap = useMemo(
    () => new Map(allFields.map((f) => [f.id, f])),
    [allFields],
  );

  const computedFields = useMemo(
    () => allFields.filter((f) => f.computed?.expression),
    [allFields],
  );

  const runComputedFields = useCallback((currentValues: Record<string, FieldValue>) => {
    if (computedFields.length === 0) return currentValues;
    let updated = currentValues;
    let changed = false;
    for (const field of computedFields) {
      const result = evaluateExpression(
        field.computed!.expression,
        updated as Record<string, unknown>,
      );
      if (result !== null && updated[field.id] !== result) {
        if (!changed) { updated = { ...updated }; changed = true; }
        updated[field.id] = result;
      }
    }
    return updated;
  }, [computedFields]);

  const validateTriggered = useCallback((fieldId: string, currentValues: Record<string, FieldValue>) => {
    const field = fieldMap.get(fieldId);
    if (!field || NON_VALUE_TYPES.has(field.type)) return;
    const err = validateSingleField(field, currentValues[fieldId], kvRows, tableRows, t);
    setErrors((prev) => {
      if (err) return { ...prev, [fieldId]: err };
      if (!prev[fieldId]) return prev;
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  }, [fieldMap, kvRows, tableRows, t]);

  const sandboxRef = useRef<FormSandboxHandle>(null);
  const hasScripts = !!(scripts?.onFormLoad || scripts?.onBeforeSubmit || scripts?.onFieldChange);

  const handleSandboxSetValue = useCallback((id: string, val: FieldValue) => {
    setValues(prev => ({ ...prev, [id]: val }));
  }, []);

  const runScript = useCallback(async (code: string, fieldValues: Record<string, FieldValue>, extra?: Record<string, unknown>): Promise<unknown> => {
    const valuesObj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(fieldValues)) {
      valuesObj[k] = v;
    }
    const context = { tenantId: 'local', userId: 'local', locale: navigator.language, ...extra };

    if (sandboxRef.current) {
      return sandboxRef.current.execute(code, valuesObj, context);
    }
    return undefined;
  }, []);

  const formLoadRan = useRef(false);
  useEffect(() => {
    if (formLoadRan.current || !scripts?.onFormLoad || isSubmitted) return;
    formLoadRan.current = true;
    const timer = setTimeout(() => { runScript(scripts.onFormLoad!, values); }, 100);
    return () => clearTimeout(timer);
  }, [scripts?.onFormLoad, isSubmitted, runScript, values]);

  const handleChange = useCallback((fieldId: string, value: FieldValue) => {
    setValues(prev => {
      const next = { ...prev, [fieldId]: value };
      return runComputedFields(next);
    });
    if (scripts?.onFieldChange) {
      runScript(scripts.onFieldChange, { ...values, [fieldId]: value }, { fieldId }).catch(() => {});
    }
    const field = fieldMap.get(fieldId);
    if (field) {
      const trigger = getFieldTrigger(field);
      if (trigger === 'onChange' || touched[fieldId]) {
        setTimeout(() => {
          setValues((current) => {
            validateTriggered(fieldId, current);
            return current;
          });
        }, 0);
      } else {
        setErrors(prev => {
          if (!prev[fieldId]) return prev;
          const next = { ...prev };
          delete next[fieldId];
          return next;
        });
      }
    }
  }, [scripts, runScript, values, fieldMap, touched, validateTriggered, runComputedFields]);

  const handleBlur = useCallback((fieldId: string) => {
    setTouched((prev) => (prev[fieldId] ? prev : { ...prev, [fieldId]: true }));
    const field = fieldMap.get(fieldId);
    if (!field) return;
    const trigger = getFieldTrigger(field);
    if (trigger === 'onBlur' || trigger === 'onChange') {
      validateTriggered(fieldId, values);
    }
  }, [fieldMap, validateTriggered, values]);

  const handleKvRowsChange = useCallback((fieldId: string, rows: KVRow[]) => {
    setKvRows(prev => ({ ...prev, [fieldId]: rows }));
    setErrors(prev => {
      if (!prev[fieldId]) return prev;
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  }, []);

  const handleTableRowsChange = useCallback((fieldId: string, rows: TableRow[]) => {
    setTableRows(prev => ({ ...prev, [fieldId]: rows }));
    setErrors(prev => {
      if (!prev[fieldId]) return prev;
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    const newErrors: Record<string, string> = {};
    for (const field of allFields) {
      if (NON_VALUE_TYPES.has(field.type)) continue;
      if (!evaluateVisibility(field.visibility, values)) continue;
      const err = validateSingleField(field, values[field.id], kvRows, tableRows, t);
      if (err) newErrors[field.id] = err;
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const allTouched: Record<string, boolean> = {};
      for (const id of Object.keys(newErrors)) allTouched[id] = true;
      setTouched((prev) => ({ ...prev, ...allTouched }));
      return;
    }

    if (scripts?.onBeforeSubmit) {
      const scriptResult = await runScript(scripts.onBeforeSubmit, values);
      if (scriptResult === false) return;
    }

    const result: Record<string, unknown> = {};
    for (const field of allFields) {
      if (NON_VALUE_TYPES.has(field.type)) continue;
      const key = field.label ?? field.id;
      const val = values[field.id];
      if (field.type === 'file' || field.type === 'image') {
        if (val instanceof File) {
          result[key] = `[File: ${val.name}]`;
        }
        continue;
      }
      if (field.type === 'key_value') {
        const rows = kvRows[field.id] ?? [{ key: '', value: '' }];
        result[key] = rows.filter(r => r.key || r.value);
        continue;
      }
      if (field.type === 'table_input') {
        const rows = tableRows[field.id] ?? [];
        result[key] = rows.filter(r => Object.values(r).some(v => v));
        continue;
      }
      result[key] = val ?? '';
    }
    const json = JSON.stringify(result);
    setLocalSubmitted(true);
    onSubmit(json);
  }, [allFields, values, kvRows, tableRows, onSubmit, t, scripts, runScript]);

  const errorsPerTab = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!hasTabs) return counts;
    for (const tab of tabs) {
      let count = 0;
      for (const field of tab.fields) {
        if (errors[field.id]) count++;
      }
      if (count > 0) counts[tab.id] = count;
    }
    return counts;
  }, [hasTabs, tabs, errors]);

  if (allFields.length === 0) return null;

  const fillStyle = fillHeight
    ? { flex: 1, minHeight: 0, display: 'flex' as const, flexDirection: 'column' as const }
    : {};

  const tabsStyle = fillHeight
    ? { flex: 1, minHeight: 0, display: 'flex' as const, flexDirection: 'column' as const, overflow: 'hidden' as const }
    : maxHeight ? { maxHeight } : {};

  const scrollStyle = fillHeight
    ? { flex: 1, overflowY: 'auto' as const, minHeight: 0, paddingRight: 8 }
    : maxHeight
      ? { maxHeight: maxHeight - 80, overflowY: 'auto' as const, paddingRight: 8 }
      : {};

  const contentScrollStyle = fillHeight
    ? { flex: 1, overflowY: 'auto' as const, minHeight: 0, paddingRight: 8 }
    : maxHeight
      ? { maxHeight, overflowY: 'auto' as const, paddingRight: 8 }
      : {};

  return (
    <Box ref={containerRef} className={classes.formWidget} style={fillStyle}>
      {hasScripts && <FormSandbox ref={sandboxRef} onSetFieldValue={handleSandboxSetValue} />}
      {effectiveSubmitted && (
        <Badge
          leftSection={<IconCheck size={12} />}
          variant="light"
          color="green"
          size="sm"
          className={classes.submittedBadge}
        >
          {successMessage ?? t('form.submitted')}
        </Badge>
      )}

      {description && !effectiveSubmitted && (
        <Text size="sm" c="dimmed" mb="sm">{description}</Text>
      )}

      {hasTabs ? (
        <Tabs defaultValue={tabs[0].id} classNames={{ root: classes.tabsRoot, panel: classes.tabPanel }} style={tabsStyle}>
          <Tabs.List className={classes.tabsList}>
            {tabs.filter((tab) => evaluateVisibility(tab.visibility, values)).map((tab) => (
              <Tabs.Tab
                key={tab.id}
                value={tab.id}
                size="sm"
                rightSection={errorsPerTab[tab.id] ? (
                  <Badge size="xs" circle color="red" variant="filled">{errorsPerTab[tab.id]}</Badge>
                ) : undefined}
              >
                {tab.label}
              </Tabs.Tab>
            ))}
          </Tabs.List>
          <div style={scrollStyle}>
            {tabs.filter((tab) => evaluateVisibility(tab.visibility, values)).map((tab) => (
              <Tabs.Panel key={tab.id} value={tab.id} pt="md">
                <FieldGrid fields={tab.fields} values={values} onChange={handleChange} onBlur={handleBlur} disabled={effectiveDisabled} errors={errors} kvRows={kvRows} tableRows={tableRows} onKvRowsChange={handleKvRowsChange} onTableRowsChange={handleTableRowsChange} compact={isCompact} />
              </Tabs.Panel>
            ))}
          </div>
        </Tabs>
      ) : (
        <div style={contentScrollStyle}>
          <FieldGrid fields={allFields} values={values} onChange={handleChange} onBlur={handleBlur} disabled={effectiveDisabled} errors={errors} kvRows={kvRows} tableRows={tableRows} onKvRowsChange={handleKvRowsChange} onTableRowsChange={handleTableRowsChange} compact={isCompact} />
        </div>
      )}

      {!effectiveSubmitted && (
        <Button mt="md" onClick={() => { handleSubmit(); }} disabled={effectiveDisabled} fullWidth>
          {submitButtonText ?? t('form.submit')}
        </Button>
      )}
    </Box>
  );
};
