import type { FormFieldConfigV1, WidgetFormSchema, WidgetFieldConfig, FieldType } from './types';

const V1_TYPE_MAP: Record<string, FieldType> = {
  text: 'text',
  textarea: 'textarea',
  description_textarea: 'paragraph',
  select: 'select',
  multi_select: 'multi_select',
  toggle: 'toggle',
  label: 'heading',
  file: 'file',
};

function migrateFieldV1(field: FormFieldConfigV1): WidgetFieldConfig {
  const type = V1_TYPE_MAP[field.type] ?? 'text';
  const config: Record<string, unknown> = {};
  const validation: WidgetFieldConfig['validation'] = [];

  if (field.options) {
    config.options = field.options;
  }
  if (field.rows) {
    config.rows = field.rows;
  }
  if (field.accepted_types) {
    config.acceptedTypes = field.accepted_types;
  }
  if (field.max_size) {
    config.maxSize = field.max_size;
  }
  if (field.text) {
    config.text = field.text;
  }
  if (field.content) {
    config.content = field.content;
  }
  if (field.style === 'heading') {
    config.level = 'h3';
  }

  if (field.required) {
    validation.push({ type: 'required' });
  }
  if (field.max_length) {
    validation.push({ type: 'maxLength', params: { value: field.max_length } });
  }

  return {
    id: field.id,
    type,
    label: field.label || undefined,
    placeholder: field.placeholder,
    defaultValue: field.default_value,
    layout: { colSpan: 12 },
    validation,
    config,
  };
}

export function migrateV1ToV2(fields: FormFieldConfigV1[]): WidgetFormSchema {
  return {
    version: 2,
    settings: {},
    tabs: [
      {
        id: 'default',
        label: 'Form',
        fields: fields.map(migrateFieldV1),
      },
    ],
    dataSources: [],
    scripts: {},
  };
}

export function isV1Schema(config: Record<string, unknown>): boolean {
  if (Array.isArray(config?.fields) && !('version' in config)) {
    return true;
  }
  return false;
}

export function isV2Schema(config: Record<string, unknown>): boolean {
  return config?.version === 2 && Array.isArray(config?.tabs);
}

export function loadWidgetSchema(config: Record<string, unknown>): WidgetFormSchema {
  if (isV2Schema(config)) {
    return config as unknown as WidgetFormSchema;
  }

  if (isV1Schema(config)) {
    return migrateV1ToV2(config.fields as FormFieldConfigV1[]);
  }

  return {
    version: 2,
    settings: {},
    tabs: [{ id: 'default', label: 'Form', fields: [] }],
    dataSources: [],
    scripts: {},
  };
}

export function schemaToConfig(schema: WidgetFormSchema): Record<string, unknown> {
  return schema as unknown as Record<string, unknown>;
}
