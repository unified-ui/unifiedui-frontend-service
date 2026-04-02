import type { FC } from 'react';
import {
  IconTextSize,
  IconNotes,
  IconSelector,
  IconChecklist,
  IconToggleLeft,
  IconUpload,
  IconHash,
  IconAt,
  IconLink,
  IconPhone,
  IconLock,
  IconCalendar,
  IconClock,
  IconPalette,
  IconCircleDot,
  IconCheckbox,
  IconStar,
  IconAdjustments,
  IconArrowsLeftRight,
  IconPhoto,
  IconWriting,
  IconBold,
  IconH1,
  IconAlignLeft,
  IconMinus,
  IconArrowAutofitHeight,
  IconAlertTriangle,
  IconHome,
  IconColumns,
  IconTable,
  IconBraces,
} from '@tabler/icons-react';

export type FieldType =
  | 'text'
  | 'textarea'
  | 'description_textarea'
  | 'number'
  | 'email'
  | 'url'
  | 'phone'
  | 'password'
  | 'date'
  | 'time'
  | 'datetime'
  | 'color'
  | 'select'
  | 'multi_select'
  | 'radio'
  | 'checkbox'
  | 'toggle'
  | 'rating'
  | 'slider'
  | 'range_slider'
  | 'file'
  | 'image'
  | 'signature'
  | 'rich_text'
  | 'heading'
  | 'paragraph'
  | 'divider'
  | 'spacer'
  | 'alert'
  | 'label'
  | 'address'
  | 'key_value'
  | 'table_input'
  | 'json';

export type ValidationTrigger = 'onBlur' | 'onChange' | 'onSubmit';

export type ValidationType =
  | 'required'
  | 'minLength'
  | 'maxLength'
  | 'min'
  | 'max'
  | 'pattern'
  | 'email'
  | 'url'
  | 'minSelections'
  | 'maxSelections'
  | 'custom';

export interface ValidationRule {
  type: ValidationType;
  params?: Record<string, unknown>;
  message?: string;
  trigger?: ValidationTrigger;
  script?: string;
}

export type VisibilityOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte'
  | 'is_empty'
  | 'is_not_empty'
  | 'in'
  | 'not_in';

export interface VisibilityRule {
  fieldId: string;
  operator: VisibilityOperator;
  value: unknown;
}

export interface VisibilityConfig {
  condition: 'AND' | 'OR';
  rules: VisibilityRule[];
}

export interface FieldLayoutConfig {
  colSpan: number;
  colSpanMobile?: number;
  marginTop?: 'sm' | 'md' | 'lg';
}

export interface FieldDataSourceRef {
  dataSourceId: string;
  params?: Record<string, string>;
}

export interface ComputedFieldConfig {
  expression: string;
  watchFields: string[];
}

export interface WidgetFieldConfig {
  id: string;
  type: FieldType;
  label?: string;
  placeholder?: string;
  defaultValue?: unknown;
  tooltip?: string;
  disabled?: boolean;
  layout: FieldLayoutConfig;
  validation: ValidationRule[];
  visibility?: VisibilityConfig;
  dataSource?: FieldDataSourceRef;
  computed?: ComputedFieldConfig;
  config: Record<string, unknown>;
}

export interface WidgetTab {
  id: string;
  label: string;
  fields: WidgetFieldConfig[];
  visibility?: VisibilityConfig;
}

export interface DataSourceConfig {
  id: string;
  type: 'static' | 'api' | 'dependent';
  url?: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  responsePath?: string;
  labelField?: string;
  valueField?: string;
  refreshOn?: string[];
  cache?: { ttl: number };
  dependsOn?: string;
  mapping?: Record<string, unknown[]>;
}

export interface WidgetFormSchema {
  version: 2;
  settings: {
    title?: string;
    description?: string;
    submitButtonText?: string;
    successMessage?: string;
    enableTabs?: boolean;
    showProgressBar?: boolean;
    validateOnTabChange?: boolean;
  };
  tabs: WidgetTab[];
  dataSources: DataSourceConfig[];
  scripts: {
    onFormLoad?: string;
    onBeforeSubmit?: string;
    onFieldChange?: string;
  };
}

export interface FormFieldConfigV1 {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  max_length?: number;
  rows?: number;
  options?: string[];
  default_value?: string | boolean;
  text?: string;
  style?: 'heading' | 'info';
  content?: string;
  accepted_types?: string[];
  max_size?: number;
}

export type DesignerMode = 'edit' | 'demo';

export interface FieldTypeCategory {
  key: string;
  types: FieldType[];
}

export const FIELD_TYPE_CATEGORIES: FieldTypeCategory[] = [
  {
    key: 'input',
    types: ['text', 'textarea', 'description_textarea', 'number', 'email', 'url', 'phone', 'password', 'date', 'time', 'datetime', 'color'],
  },
  {
    key: 'selection',
    types: ['select', 'multi_select', 'radio', 'checkbox', 'toggle', 'rating', 'slider', 'range_slider'],
  },
  {
    key: 'richContent',
    types: ['file', 'image', 'signature', 'rich_text'],
  },
  {
    key: 'layout',
    types: ['heading', 'paragraph', 'label', 'divider', 'spacer', 'alert'],
  },
  {
    key: 'composite',
    types: ['address', 'key_value', 'table_input', 'json'],
  },
];

export const FIELD_TYPE_ICONS: Record<FieldType, FC<{ size?: number }>> = {
  text: IconTextSize,
  textarea: IconNotes,
  description_textarea: IconNotes,
  number: IconHash,
  email: IconAt,
  url: IconLink,
  phone: IconPhone,
  password: IconLock,
  date: IconCalendar,
  time: IconClock,
  datetime: IconClock,
  color: IconPalette,
  select: IconSelector,
  multi_select: IconChecklist,
  radio: IconCircleDot,
  checkbox: IconCheckbox,
  toggle: IconToggleLeft,
  rating: IconStar,
  slider: IconAdjustments,
  range_slider: IconArrowsLeftRight,
  file: IconUpload,
  image: IconPhoto,
  signature: IconWriting,
  rich_text: IconBold,
  heading: IconH1,
  paragraph: IconAlignLeft,
  divider: IconMinus,
  spacer: IconArrowAutofitHeight,
  alert: IconAlertTriangle,
  label: IconAlignLeft,
  address: IconHome,
  key_value: IconColumns,
  table_input: IconTable,
  json: IconBraces,
};

export const RESERVED_FIELD_IDS = ['submit', 'form', 'tab', 'widget'];

export const FIELD_ID_REGEX = /^[a-z][a-z0-9_]*$/;

export const FIELD_ID_MAX_LENGTH = 64;

export const NON_INPUT_FIELDS: FieldType[] = [
  'heading',
  'paragraph',
  'label',
  'divider',
  'spacer',
  'alert',
];

export function generateFieldId(label: string): string {
  return label
    .toLowerCase()
    .replace(/[äöüß]/g, (ch) => {
      const map: Record<string, string> = { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' };
      return map[ch] ?? ch;
    })
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/^(\d)/, 'f$1')
    .slice(0, FIELD_ID_MAX_LENGTH) || 'field';
}

export function isFieldIdValid(id: string): boolean {
  return (
    FIELD_ID_REGEX.test(id) &&
    id.length <= FIELD_ID_MAX_LENGTH &&
    !RESERVED_FIELD_IDS.includes(id)
  );
}

export function isFieldIdUnique(id: string, allFields: WidgetFieldConfig[], currentFieldId?: string): boolean {
  return !allFields.some((f) => f.id === id && f.id !== currentFieldId);
}

export function createDefaultField(type: FieldType, existingFields: WidgetFieldConfig[]): WidgetFieldConfig {
  const labelMap: Record<FieldType, string> = {
    text: 'Text Field',
    textarea: 'Text Area',
    description_textarea: 'Description',
    number: 'Number',
    email: 'Email',
    url: 'URL',
    phone: 'Phone',
    password: 'Password',
    date: 'Date',
    time: 'Time',
    datetime: 'Date Time',
    color: 'Color',
    select: 'Select',
    multi_select: 'Multi Select',
    radio: 'Radio Group',
    checkbox: 'Checkbox Group',
    toggle: 'Toggle',
    rating: 'Rating',
    slider: 'Slider',
    range_slider: 'Range Slider',
    file: 'File Upload',
    image: 'Image Upload',
    signature: 'Signature',
    rich_text: 'Rich Text',
    heading: 'Heading',
    paragraph: 'Paragraph',
    divider: 'Divider',
    spacer: 'Spacer',
    alert: 'Alert',
    label: 'Label',
    address: 'Address',
    key_value: 'Key Value',
    table_input: 'Table',
    json: 'JSON',
  };

  const label = labelMap[type];
  let baseId = generateFieldId(label);

  const existingIds = new Set(existingFields.map((f) => f.id));
  if (existingIds.has(baseId)) {
    let counter = 2;
    while (existingIds.has(`${baseId}_${counter}`)) {
      counter++;
    }
    baseId = `${baseId}_${counter}`;
  }

  const config: Record<string, unknown> = {};

  if (type === 'select' || type === 'multi_select' || type === 'radio' || type === 'checkbox') {
    config.options = ['Option 1', 'Option 2'];
  }
  if (type === 'textarea') {
    config.rows = 4;
    config.autoResize = false;
  }
  if (type === 'number') {
    config.step = 1;
  }
  if (type === 'slider') {
    config.min = 0;
    config.max = 100;
    config.step = 1;
    config.showValue = true;
  }
  if (type === 'rating') {
    config.maxRating = 5;
    config.icon = 'star';
    config.allowHalf = false;
  }
  if (type === 'heading') {
    config.level = 'h3';
  }
  if (type === 'spacer') {
    config.height = 'md';
  }
  if (type === 'alert') {
    config.variant = 'info';
  }
  if (type === 'divider') {
    config.style = 'solid';
  }
  if (type === 'file') {
    config.maxSize = 10;
    config.maxFiles = 1;
    config.dragDrop = true;
  }
  if (type === 'image') {
    config.maxSize = 10;
    config.maxFiles = 1;
    config.crop = false;
  }
  if (type === 'toggle') {
    config.onLabel = '';
    config.offLabel = '';
  }
  if (type === 'color') {
    config.format = 'hex';
  }
  if (type === 'signature') {
    config.penColor = '#000000';
    config.penWidth = 2;
    config.backgroundColor = '#ffffff';
  }
  if (type === 'url') {
    config.allowedProtocols = ['https'];
  }
  if (type === 'time') {
    config.step = 15;
  }
  if (type === 'address') {
    config.requiredParts = ['street', 'city', 'zip', 'country'];
  }
  if (type === 'key_value') {
    config.keyLabel = 'Key';
    config.valueLabel = 'Value';
  }
  if (type === 'table_input') {
    config.columns = ['Column 1', 'Column 2'];
    config.minRows = 1;
  }
  if (type === 'json') {
    config.rows = 6;
    config.validateJson = true;
  }

  return {
    id: baseId,
    type,
    label: NON_INPUT_FIELDS.includes(type) ? undefined : label,
    placeholder: '',
    defaultValue: undefined,
    tooltip: undefined,
    disabled: false,
    layout: { colSpan: 12 },
    validation: [],
    config,
  };
}
