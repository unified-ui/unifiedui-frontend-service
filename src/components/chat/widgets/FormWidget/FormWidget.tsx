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
} from '@mantine/core';
import { IconCheck, IconUpload, IconAlertTriangle, IconInfoCircle, IconCircleCheck, IconAlertCircle } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { WidgetFieldConfig, WidgetTab } from '../../../../pages/WidgetDesignerPage/types';
import classes from './FormWidget.module.css';

interface FormWidgetProps {
  tabs: WidgetTab[];
  enableTabs?: boolean;
  onSubmit: (data: string) => void;
  disabled?: boolean;
  submittedData?: string;
  widgetData?: Record<string, unknown>;
  submitButtonText?: string;
  maxHeight?: number;
}

type FieldValue = string | number | boolean | string[] | [number, number] | File | null;

const NON_VALUE_TYPES = new Set([
  'heading', 'paragraph', 'divider', 'spacer', 'alert', 'image_display',
]);

function getAllFields(tabs: WidgetTab[]): WidgetFieldConfig[] {
  return tabs.flatMap((tab) => tab.fields);
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
  disabled: boolean;
}> = ({ field, value, onChange, disabled }) => {
  const isRequired = field.validation.some((v) => v.type === 'required');
  const fieldDisabled = disabled || field.disabled === true;
  const { config } = field;

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
          disabled={fieldDisabled}
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
          disabled={fieldDisabled}
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
          disabled={fieldDisabled}
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
          disabled={fieldDisabled}
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
          disabled={fieldDisabled}
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
          disabled={fieldDisabled}
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
        <Switch
          label={field.label}
          size="sm"
          checked={value === true}
          onChange={(e) => onChange(field.id, e.currentTarget.checked)}
          disabled={fieldDisabled}
        />
      );

    case 'rating':
      return (
        <Box>
          {field.label && <Text size="sm" fw={500} mb={4}>{field.label}</Text>}
          <Rating
            count={(config.maxRating as number) ?? 5}
            fractions={config.allowHalf ? 2 : 1}
            value={(value as number) ?? 0}
            onChange={(val) => onChange(field.id, val)}
            readOnly={fieldDisabled}
            size="md"
          />
        </Box>
      );

    case 'slider':
      return (
        <Box>
          {field.label && <Text size="sm" fw={500} mb={4}>{field.label}</Text>}
          <Slider
            min={(config.min as number) ?? 0}
            max={(config.max as number) ?? 100}
            step={(config.step as number) ?? 1}
            value={(value as number) ?? 0}
            onChange={(val) => onChange(field.id, val)}
            disabled={fieldDisabled}
            size="sm"
            label={config.showValue ? undefined : null}
          />
        </Box>
      );

    case 'range_slider':
      return (
        <Box>
          {field.label && <Text size="sm" fw={500} mb={4}>{field.label}</Text>}
          <RangeSlider
            min={(config.min as number) ?? 0}
            max={(config.max as number) ?? 100}
            step={(config.step as number) ?? 1}
            value={(value as [number, number]) ?? [0, 100]}
            onChange={(val) => onChange(field.id, val)}
            disabled={fieldDisabled}
            size="sm"
          />
        </Box>
      );

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
        />
      );

    case 'rich_text':
      return (
        <Textarea
          label={field.label}
          placeholder={field.placeholder}
          rows={6}
          size="sm"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(field.id, e.currentTarget.value)}
          disabled={fieldDisabled}
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
        </Box>
      );

    case 'key_value':
      return (
        <Box>
          {field.label && <Text size="sm" fw={500} mb={4}>{field.label}</Text>}
          <Paper withBorder p="sm">
            <Stack gap="xs">
              <Group grow gap="xs">
                <Text size="xs" fw={500}>{(config.keyLabel as string) ?? 'Key'}</Text>
                <Text size="xs" fw={500}>{(config.valueLabel as string) ?? 'Value'}</Text>
              </Group>
              <Group grow gap="xs">
                <TextInput size="sm" placeholder={(config.keyLabel as string) ?? 'Key'} disabled={fieldDisabled} />
                <TextInput size="sm" placeholder={(config.valueLabel as string) ?? 'Value'} disabled={fieldDisabled} />
              </Group>
            </Stack>
          </Paper>
        </Box>
      );

    case 'table_input': {
      const cols = (config.columns as string[]) ?? ['Column 1', 'Column 2'];
      return (
        <Box>
          {field.label && <Text size="sm" fw={500} mb={4}>{field.label}</Text>}
          <Paper withBorder style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {cols.map((col) => (
                    <th key={col} className={classes.tableHeader}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {cols.map((col) => (
                    <td key={col} className={classes.tableCell}>
                      <TextInput size="xs" variant="unstyled" disabled={fieldDisabled} />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </Paper>
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

const FieldGrid: FC<{
  fields: WidgetFieldConfig[];
  values: Record<string, FieldValue>;
  onChange: (id: string, value: FieldValue) => void;
  disabled: boolean;
}> = ({ fields, values, onChange, disabled }) => (
  <SimpleGrid cols={12} spacing="sm" style={{ alignItems: 'start' }}>
    {fields.map((field) => (
      <Box key={field.id} style={{ gridColumn: `span ${field.layout.colSpan}` }}>
        <FieldRenderer
          field={field}
          value={values[field.id]}
          onChange={onChange}
          disabled={disabled}
        />
      </Box>
    ))}
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
}) => {
  const { t } = useTranslation('widgets');
  const allFields = useMemo(() => getAllFields(tabs), [tabs]);
  const hasTabs = enableTabs && tabs.length > 1;

  const parsedSubmitted = useMemo(
    () => (submittedData ? parseSubmittedData(submittedData, allFields) : null),
    [submittedData, allFields],
  );
  const isSubmitted = !!parsedSubmitted;

  const [values, setValues] = useState<Record<string, FieldValue>>(() =>
    parsedSubmitted ?? buildInitialValues(allFields, widgetData),
  );
  const [localSubmitted, setLocalSubmitted] = useState(false);

  const effectiveDisabled = disabled || isSubmitted || localSubmitted;
  const effectiveSubmitted = isSubmitted || localSubmitted;

  const handleChange = useCallback((fieldId: string, value: FieldValue) => {
    setValues(prev => ({ ...prev, [fieldId]: value }));
  }, []);

  const handleSubmit = useCallback(() => {
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
      result[key] = val ?? '';
    }
    const json = JSON.stringify(result);
    setLocalSubmitted(true);
    onSubmit(json);
  }, [allFields, values, onSubmit]);

  if (allFields.length === 0) return null;

  const tabsStyle = maxHeight ? { maxHeight } : {};

  const scrollStyle = maxHeight
    ? { maxHeight: maxHeight - 80, overflowY: 'auto' as const, paddingRight: 8 }
    : {};

  const contentScrollStyle = maxHeight
    ? { maxHeight, overflowY: 'auto' as const, paddingRight: 8 }
    : {};

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

      {hasTabs ? (
        <Tabs defaultValue={tabs[0].id} classNames={{ root: classes.tabsRoot, panel: classes.tabPanel }} style={tabsStyle}>
          <Tabs.List className={classes.tabsList}>
            {tabs.map((tab) => (
              <Tabs.Tab key={tab.id} value={tab.id} size="sm">{tab.label}</Tabs.Tab>
            ))}
          </Tabs.List>
          <div style={scrollStyle}>
            {tabs.map((tab) => (
              <Tabs.Panel key={tab.id} value={tab.id} pt="md">
                <FieldGrid fields={tab.fields} values={values} onChange={handleChange} disabled={effectiveDisabled} />
              </Tabs.Panel>
            ))}
          </div>
        </Tabs>
      ) : (
        <div style={contentScrollStyle}>
          <FieldGrid fields={allFields} values={values} onChange={handleChange} disabled={effectiveDisabled} />
        </div>
      )}

      {!effectiveSubmitted && (
        <Button mt="md" onClick={handleSubmit} disabled={effectiveDisabled} fullWidth>
          {submitButtonText ?? t('form.submit')}
        </Button>
      )}
    </Box>
  );
};
