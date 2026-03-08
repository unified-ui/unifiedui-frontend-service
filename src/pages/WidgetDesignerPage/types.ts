import type { FC } from 'react';
import {
  IconTextSize,
  IconNotes,
  IconSelector,
  IconChecklist,
  IconToggleLeft,
  IconTag,
  IconUpload,
  IconFileDescription,
} from '@tabler/icons-react';

export type FieldType = 'text' | 'textarea' | 'description_textarea' | 'select' | 'multi_select' | 'toggle' | 'label' | 'file';

export interface FormFieldConfig {
  id: string;
  type: FieldType;
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

export const FIELD_TYPE_ICONS: Record<FieldType, FC<{ size?: number }>> = {
  text: IconTextSize,
  textarea: IconNotes,
  description_textarea: IconFileDescription,
  select: IconSelector,
  multi_select: IconChecklist,
  toggle: IconToggleLeft,
  label: IconTag,
  file: IconUpload,
};

export const DEFAULT_FIELD_CONFIG: Record<FieldType, Partial<FormFieldConfig>> = {
  text: { label: 'Text Field', placeholder: '', required: false, max_length: 255 },
  textarea: { label: 'Text Area', placeholder: '', required: false, max_length: 2000, rows: 4 },
  description_textarea: { label: 'Description', content: '' },
  select: { label: 'Select', options: ['Option 1', 'Option 2'], required: false },
  multi_select: { label: 'Multi Select', options: ['Tag 1', 'Tag 2'], required: false },
  toggle: { label: 'Toggle', default_value: false },
  label: { text: 'Label Text', style: 'info' },
  file: { label: 'File Upload', accepted_types: ['.pdf', '.png', '.jpg'], max_size: 10 },
};

let fieldIdCounter = 0;

export const createField = (type: FieldType): FormFieldConfig => {
  const defaults = DEFAULT_FIELD_CONFIG[type];
  return {
    id: `field-${++fieldIdCounter}-${Date.now()}`,
    type,
    label: defaults.label || type,
    ...defaults,
  };
};
