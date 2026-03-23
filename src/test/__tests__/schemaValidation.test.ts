import { describe, it, expect } from 'vitest';
import { validateSchema } from '../../pages/WidgetDesignerPage/schemaValidation';
import type { WidgetFormSchema } from '../../pages/WidgetDesignerPage/types';

function makeSchema(overrides: Partial<WidgetFormSchema> = {}): WidgetFormSchema {
  return {
    version: 2,
    settings: {},
    tabs: [{ id: 'default', label: 'Form', fields: [] }],
    dataSources: [],
    scripts: {},
    ...overrides,
  };
}

describe('validateSchema', () => {
  it('should pass for a valid empty schema', () => {
    const errors = validateSchema(makeSchema());
    expect(errors).toEqual([]);
  });

  it('should pass for valid fields', () => {
    const schema = makeSchema({
      tabs: [{
        id: 'tab1',
        label: 'Tab 1',
        fields: [
          { id: 'first_name', type: 'text', layout: { colSpan: 6 }, validation: [], config: {} },
          { id: 'last_name', type: 'text', layout: { colSpan: 6 }, validation: [], config: {} },
          { id: 'email', type: 'email', layout: { colSpan: 12 }, validation: [], config: {} },
        ],
      }],
    });
    const errors = validateSchema(schema);
    expect(errors).toEqual([]);
  });

  it('should detect duplicate field IDs within same tab', () => {
    const schema = makeSchema({
      tabs: [{
        id: 'tab1',
        label: 'Tab 1',
        fields: [
          { id: 'name', type: 'text', layout: { colSpan: 12 }, validation: [], config: {} },
          { id: 'name', type: 'text', layout: { colSpan: 12 }, validation: [], config: {} },
        ],
      }],
    });
    const errors = validateSchema(schema);
    expect(errors.some((e) => e.message.includes('Duplicate field ID'))).toBe(true);
  });

  it('should detect duplicate field IDs across tabs', () => {
    const schema = makeSchema({
      tabs: [
        { id: 'tab1', label: 'Tab 1', fields: [{ id: 'email', type: 'text', layout: { colSpan: 12 }, validation: [], config: {} }] },
        { id: 'tab2', label: 'Tab 2', fields: [{ id: 'email', type: 'text', layout: { colSpan: 12 }, validation: [], config: {} }] },
      ],
    });
    const errors = validateSchema(schema);
    expect(errors.some((e) => e.message.includes('Duplicate field ID'))).toBe(true);
  });

  it('should detect invalid field ID format', () => {
    const schema = makeSchema({
      tabs: [{
        id: 'tab1',
        label: 'Tab 1',
        fields: [
          { id: 'FirstName', type: 'text', layout: { colSpan: 12 }, validation: [], config: {} },
        ],
      }],
    });
    const errors = validateSchema(schema);
    expect(errors.some((e) => e.message.includes('Invalid field ID format'))).toBe(true);
  });

  it('should detect reserved field IDs', () => {
    const schema = makeSchema({
      tabs: [{
        id: 'tab1',
        label: 'Tab 1',
        fields: [
          { id: 'submit', type: 'text', layout: { colSpan: 12 }, validation: [], config: {} },
        ],
      }],
    });
    const errors = validateSchema(schema);
    expect(errors.some((e) => e.message.includes('reserved field ID'))).toBe(true);
  });

  it('should detect invalid colSpan', () => {
    const schema = makeSchema({
      tabs: [{
        id: 'tab1',
        label: 'Tab 1',
        fields: [
          { id: 'a_field', type: 'text', layout: { colSpan: 0 }, validation: [], config: {} },
        ],
      }],
    });
    const errors = validateSchema(schema);
    expect(errors.some((e) => e.message.includes('colSpan must be 1–12'))).toBe(true);
  });

  it('should detect colSpan > 12', () => {
    const schema = makeSchema({
      tabs: [{
        id: 'tab1',
        label: 'Tab 1',
        fields: [
          { id: 'a_field', type: 'text', layout: { colSpan: 13 }, validation: [], config: {} },
        ],
      }],
    });
    const errors = validateSchema(schema);
    expect(errors.some((e) => e.message.includes('colSpan must be 1–12'))).toBe(true);
  });

  it('should detect visibility rules referencing unknown fields', () => {
    const schema = makeSchema({
      tabs: [{
        id: 'tab1',
        label: 'Tab 1',
        fields: [
          {
            id: 'conditional_field',
            type: 'text',
            layout: { colSpan: 12 },
            validation: [],
            config: {},
            visibility: {
              condition: 'AND',
              rules: [{ fieldId: 'nonexistent', operator: 'equals', value: 'test' }],
            },
          },
        ],
      }],
    });
    const errors = validateSchema(schema);
    expect(errors.some((e) => e.message.includes('unknown field'))).toBe(true);
  });

  it('should detect unknown data source references', () => {
    const schema = makeSchema({
      tabs: [{
        id: 'tab1',
        label: 'Tab 1',
        fields: [
          {
            id: 'country',
            type: 'select',
            layout: { colSpan: 12 },
            validation: [],
            config: {},
            dataSource: { dataSourceId: 'missing_ds' },
          },
        ],
      }],
    });
    const errors = validateSchema(schema);
    expect(errors.some((e) => e.message.includes('unknown data source'))).toBe(true);
  });

  it('should pass when data source reference is valid', () => {
    const schema = makeSchema({
      tabs: [{
        id: 'tab1',
        label: 'Tab 1',
        fields: [
          {
            id: 'country',
            type: 'select',
            layout: { colSpan: 12 },
            validation: [],
            config: {},
            dataSource: { dataSourceId: 'countries' },
          },
        ],
      }],
      dataSources: [{ id: 'countries', type: 'static' }],
    });
    const errors = validateSchema(schema);
    expect(errors).toEqual([]);
  });

  it('should detect duplicate tab IDs', () => {
    const schema = makeSchema({
      tabs: [
        { id: 'tab1', label: 'Tab A', fields: [] },
        { id: 'tab1', label: 'Tab B', fields: [] },
      ],
    });
    const errors = validateSchema(schema);
    expect(errors.some((e) => e.message.includes('Duplicate tab ID'))).toBe(true);
  });

  it('should require at least one tab when tabs are enabled', () => {
    const schema = makeSchema({
      settings: { enableTabs: true },
      tabs: [],
    });
    const errors = validateSchema(schema);
    expect(errors.some((e) => e.message.includes('At least one tab'))).toBe(true);
  });

  it('should not require tabs when enableTabs is false', () => {
    const schema = makeSchema({ tabs: [] });
    const errors = validateSchema(schema);
    expect(errors.filter((e) => e.message.includes('tab'))).toEqual([]);
  });
});
