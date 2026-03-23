import { describe, it, expect } from 'vitest';
import {
  generateFieldId,
  isFieldIdValid,
  isFieldIdUnique,
  createDefaultField,
  RESERVED_FIELD_IDS,
  NON_INPUT_FIELDS,
  FIELD_TYPE_CATEGORIES,
  FIELD_TYPE_ICONS,
  type WidgetFieldConfig,
  type FieldType,
} from '../../pages/WidgetDesignerPage/types';

describe('generateFieldId', () => {
  it('should convert label to snake_case', () => {
    expect(generateFieldId('First Name')).toBe('first_name');
  });

  it('should handle umlauts', () => {
    expect(generateFieldId('Größe')).toBe('groesse');
    expect(generateFieldId('Ärger')).toBe('aerger');
    expect(generateFieldId('Übung')).toBe('uebung');
    expect(generateFieldId('Straße')).toBe('strasse');
  });

  it('should strip special characters', () => {
    expect(generateFieldId('Hello World!')).toBe('hello_world');
    expect(generateFieldId('test@email#field')).toBe('test_email_field');
  });

  it('should prefix with f when starting with digit', () => {
    expect(generateFieldId('123 Field')).toBe('f123_field');
  });

  it('should remove leading/trailing underscores', () => {
    expect(generateFieldId('  Test  ')).toBe('test');
  });

  it('should return "field" for empty input', () => {
    expect(generateFieldId('')).toBe('field');
    expect(generateFieldId('!@#$')).toBe('field');
  });

  it('should truncate to max length', () => {
    const longLabel = 'a'.repeat(100);
    expect(generateFieldId(longLabel).length).toBeLessThanOrEqual(64);
  });
});

describe('isFieldIdValid', () => {
  it('should accept valid IDs', () => {
    expect(isFieldIdValid('first_name')).toBe(true);
    expect(isFieldIdValid('a')).toBe(true);
    expect(isFieldIdValid('field_123')).toBe(true);
  });

  it('should reject IDs starting with number', () => {
    expect(isFieldIdValid('123field')).toBe(false);
  });

  it('should reject IDs with uppercase', () => {
    expect(isFieldIdValid('FirstName')).toBe(false);
  });

  it('should reject IDs with special characters', () => {
    expect(isFieldIdValid('first-name')).toBe(false);
    expect(isFieldIdValid('first.name')).toBe(false);
  });

  it('should reject reserved IDs', () => {
    RESERVED_FIELD_IDS.forEach((id) => {
      expect(isFieldIdValid(id)).toBe(false);
    });
  });

  it('should reject IDs exceeding max length', () => {
    expect(isFieldIdValid('a'.repeat(65))).toBe(false);
  });

  it('should reject empty string', () => {
    expect(isFieldIdValid('')).toBe(false);
  });
});

describe('isFieldIdUnique', () => {
  const fields: WidgetFieldConfig[] = [
    { id: 'first_name', type: 'text', layout: { colSpan: 12 }, validation: [], config: {} },
    { id: 'email', type: 'email', layout: { colSpan: 12 }, validation: [], config: {} },
  ];

  it('should return true for unique ID', () => {
    expect(isFieldIdUnique('phone', fields)).toBe(true);
  });

  it('should return false for duplicate ID', () => {
    expect(isFieldIdUnique('first_name', fields)).toBe(false);
  });

  it('should allow same ID when it matches currentFieldId', () => {
    expect(isFieldIdUnique('first_name', fields, 'first_name')).toBe(true);
  });
});

describe('createDefaultField', () => {
  it('should create a text field with valid ID', () => {
    const field = createDefaultField('text', []);
    expect(field.id).toBe('text_field');
    expect(field.type).toBe('text');
    expect(field.layout.colSpan).toBe(12);
    expect(field.validation).toEqual([]);
    expect(field.label).toBe('Text Field');
  });

  it('should create unique IDs when duplicates exist', () => {
    const existing: WidgetFieldConfig[] = [
      { id: 'text_field', type: 'text', layout: { colSpan: 12 }, validation: [], config: {} },
    ];
    const field = createDefaultField('text', existing);
    expect(field.id).toBe('text_field_2');
  });

  it('should set options for select-type fields', () => {
    const field = createDefaultField('select', []);
    expect(field.config.options).toEqual(['Option 1', 'Option 2']);
  });

  it('should set rows for textarea', () => {
    const field = createDefaultField('textarea', []);
    expect(field.config.rows).toBe(4);
  });

  it('should set slider defaults', () => {
    const field = createDefaultField('slider', []);
    expect(field.config.min).toBe(0);
    expect(field.config.max).toBe(100);
    expect(field.config.step).toBe(1);
  });

  it('should set rating defaults', () => {
    const field = createDefaultField('rating', []);
    expect(field.config.maxRating).toBe(5);
  });

  it('should not set label for non-input fields', () => {
    NON_INPUT_FIELDS.forEach((type) => {
      const field = createDefaultField(type, []);
      expect(field.label).toBeUndefined();
    });
  });

  it('should set heading defaults', () => {
    const field = createDefaultField('heading', []);
    expect(field.config.level).toBe('h3');
  });

  it('should set alert defaults', () => {
    const field = createDefaultField('alert', []);
    expect(field.config.variant).toBe('info');
  });

  it('should set file upload defaults', () => {
    const field = createDefaultField('file', []);
    expect(field.config.maxSize).toBe(10);
    expect(field.config.maxFiles).toBe(1);
  });
});

describe('FIELD_TYPE_CATEGORIES', () => {
  it('should have 5 categories', () => {
    expect(FIELD_TYPE_CATEGORIES).toHaveLength(5);
  });

  it('should contain expected category keys', () => {
    const keys = FIELD_TYPE_CATEGORIES.map((c) => c.key);
    expect(keys).toEqual(['input', 'selection', 'richContent', 'layout', 'composite']);
  });
});

describe('FIELD_TYPE_ICONS', () => {
  it('should have an icon for every field type in categories', () => {
    const allTypes = FIELD_TYPE_CATEGORIES.flatMap((c) => c.types);
    allTypes.forEach((type) => {
      expect(FIELD_TYPE_ICONS[type]).toBeDefined();
    });
  });

  it('should have icons for all 33 field types', () => {
    const types: FieldType[] = [
      'text', 'textarea', 'number', 'email', 'url', 'phone', 'password',
      'date', 'time', 'datetime', 'color', 'select', 'multi_select',
      'radio', 'checkbox', 'toggle', 'rating', 'slider', 'range_slider',
      'file', 'image', 'signature', 'rich_text', 'heading', 'paragraph',
      'divider', 'spacer', 'alert', 'image_display', 'address', 'repeater',
      'key_value', 'table_input',
    ];
    types.forEach((type) => {
      expect(FIELD_TYPE_ICONS[type]).toBeDefined();
    });
  });
});
