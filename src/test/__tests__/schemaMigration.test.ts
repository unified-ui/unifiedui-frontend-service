import { describe, it, expect } from 'vitest';
import {
  migrateV1ToV2,
  isV1Schema,
  isV2Schema,
  loadWidgetSchema,
  schemaToConfig,
} from '../../pages/WidgetDesignerPage/schemaMigration';
import type { FormFieldConfigV1, WidgetFormSchema } from '../../pages/WidgetDesignerPage/types';

describe('isV1Schema', () => {
  it('should detect v1 schema (fields array, no version)', () => {
    expect(isV1Schema({ fields: [{ id: '1', type: 'text', label: 'Name' }] })).toBe(true);
  });

  it('should not detect v2 schema as v1', () => {
    expect(isV1Schema({ version: 2, tabs: [] })).toBe(false);
  });

  it('should not detect empty config as v1', () => {
    expect(isV1Schema({})).toBe(false);
  });
});

describe('isV2Schema', () => {
  it('should detect v2 schema', () => {
    expect(isV2Schema({ version: 2, tabs: [] })).toBe(true);
  });

  it('should not detect v1 schema as v2', () => {
    expect(isV2Schema({ fields: [] })).toBe(false);
  });

  it('should not detect invalid version as v2', () => {
    expect(isV2Schema({ version: 1, tabs: [] })).toBe(false);
  });
});

describe('migrateV1ToV2', () => {
  it('should migrate empty fields to a single default tab', () => {
    const result = migrateV1ToV2([]);
    expect(result.version).toBe(2);
    expect(result.tabs).toHaveLength(1);
    expect(result.tabs[0].id).toBe('default');
    expect(result.tabs[0].fields).toEqual([]);
  });

  it('should migrate text field', () => {
    const fields: FormFieldConfigV1[] = [
      { id: 'f1', type: 'text', label: 'Name', placeholder: 'Enter name', required: true, max_length: 100 },
    ];
    const result = migrateV1ToV2(fields);
    const field = result.tabs[0].fields[0];

    expect(field.id).toBe('f1');
    expect(field.type).toBe('text');
    expect(field.label).toBe('Name');
    expect(field.placeholder).toBe('Enter name');
    expect(field.layout.colSpan).toBe(12);
    expect(field.validation).toContainEqual({ type: 'required' });
    expect(field.validation).toContainEqual({ type: 'maxLength', params: { value: 100 } });
  });

  it('should map description_textarea to paragraph', () => {
    const fields: FormFieldConfigV1[] = [
      { id: 'f2', type: 'description_textarea', label: 'Desc', content: 'Info text' },
    ];
    const result = migrateV1ToV2(fields);
    expect(result.tabs[0].fields[0].type).toBe('paragraph');
    expect(result.tabs[0].fields[0].config.content).toBe('Info text');
  });

  it('should map label to heading', () => {
    const fields: FormFieldConfigV1[] = [
      { id: 'f3', type: 'label', label: 'Section', text: 'Section Title', style: 'heading' },
    ];
    const result = migrateV1ToV2(fields);
    expect(result.tabs[0].fields[0].type).toBe('heading');
    expect(result.tabs[0].fields[0].config.text).toBe('Section Title');
    expect(result.tabs[0].fields[0].config.level).toBe('h3');
  });

  it('should migrate toggle field', () => {
    const fields: FormFieldConfigV1[] = [
      { id: 'f4', type: 'toggle', label: 'Active', default_value: true },
    ];
    const result = migrateV1ToV2(fields);
    expect(result.tabs[0].fields[0].type).toBe('toggle');
    expect(result.tabs[0].fields[0].defaultValue).toBe(true);
  });

  it('should migrate select with options', () => {
    const fields: FormFieldConfigV1[] = [
      { id: 'f5', type: 'select', label: 'Country', options: ['DE', 'US', 'FR'] },
    ];
    const result = migrateV1ToV2(fields);
    expect(result.tabs[0].fields[0].config.options).toEqual(['DE', 'US', 'FR']);
  });

  it('should migrate file field', () => {
    const fields: FormFieldConfigV1[] = [
      { id: 'f6', type: 'file', label: 'Upload', accepted_types: ['.pdf', '.png'], max_size: 5 },
    ];
    const result = migrateV1ToV2(fields);
    expect(result.tabs[0].fields[0].config.acceptedTypes).toEqual(['.pdf', '.png']);
    expect(result.tabs[0].fields[0].config.maxSize).toBe(5);
  });

  it('should set default settings and empty dataSources/scripts', () => {
    const result = migrateV1ToV2([]);
    expect(result.settings).toEqual({});
    expect(result.dataSources).toEqual([]);
    expect(result.scripts).toEqual({});
  });
});

describe('loadWidgetSchema', () => {
  it('should load v2 schema as-is', () => {
    const v2: WidgetFormSchema = {
      version: 2,
      settings: { title: 'Test' },
      tabs: [{ id: 't1', label: 'Tab 1', fields: [] }],
      dataSources: [],
      scripts: {},
    };
    const result = loadWidgetSchema(v2 as unknown as Record<string, unknown>);
    expect(result.version).toBe(2);
    expect(result.settings.title).toBe('Test');
  });

  it('should migrate v1 schema', () => {
    const v1 = { fields: [{ id: '1', type: 'text', label: 'Name' }] };
    const result = loadWidgetSchema(v1 as Record<string, unknown>);
    expect(result.version).toBe(2);
    expect(result.tabs[0].fields[0].type).toBe('text');
  });

  it('should return empty schema for unknown formats', () => {
    const result = loadWidgetSchema({});
    expect(result.version).toBe(2);
    expect(result.tabs[0].fields).toEqual([]);
  });
});

describe('schemaToConfig', () => {
  it('should convert schema to config object', () => {
    const schema: WidgetFormSchema = {
      version: 2,
      settings: {},
      tabs: [{ id: 'default', label: 'Form', fields: [] }],
      dataSources: [],
      scripts: {},
    };
    const config = schemaToConfig(schema);
    expect(config.version).toBe(2);
    expect(Array.isArray(config.tabs)).toBe(true);
  });
});
