import {
  FIELD_ID_REGEX,
  FIELD_ID_MAX_LENGTH,
  RESERVED_FIELD_IDS,
  type WidgetFormSchema,
  type WidgetFieldConfig,
} from './types';

export interface SchemaValidationError {
  path: string;
  message: string;
}

function validateFieldId(field: WidgetFieldConfig, path: string, allIds: Map<string, string>): SchemaValidationError[] {
  const errors: SchemaValidationError[] = [];

  if (!FIELD_ID_REGEX.test(field.id)) {
    errors.push({ path: `${path}.id`, message: `Invalid field ID format: "${field.id}"` });
  }

  if (field.id.length > FIELD_ID_MAX_LENGTH) {
    errors.push({ path: `${path}.id`, message: `Field ID exceeds max length of ${FIELD_ID_MAX_LENGTH}` });
  }

  if (RESERVED_FIELD_IDS.includes(field.id)) {
    errors.push({ path: `${path}.id`, message: `"${field.id}" is a reserved field ID` });
  }

  const existingPath = allIds.get(field.id);
  if (existingPath && existingPath !== path) {
    errors.push({ path: `${path}.id`, message: `Duplicate field ID: "${field.id}"` });
  }

  if (field.layout.colSpan < 1 || field.layout.colSpan > 12) {
    errors.push({ path: `${path}.layout.colSpan`, message: `colSpan must be 1–12` });
  }

  return errors;
}

export function validateSchema(schema: WidgetFormSchema): SchemaValidationError[] {
  const errors: SchemaValidationError[] = [];
  const allIds = new Map<string, string>();

  if (schema.settings.enableTabs && schema.tabs.length === 0) {
    errors.push({ path: 'settings', message: 'At least one tab is required when tabs are enabled' });
  }

  const tabIds = new Set<string>();
  schema.tabs.forEach((tab, tabIndex) => {
    const tabPath = `tabs[${tabIndex}]`;

    if (tabIds.has(tab.id)) {
      errors.push({ path: `${tabPath}.id`, message: `Duplicate tab ID: "${tab.id}"` });
    }
    tabIds.add(tab.id);

    tab.fields.forEach((field, fieldIndex) => {
      const fieldPath = `${tabPath}.fields[${fieldIndex}]`;
      allIds.set(field.id, fieldPath);
    });
  });

  schema.tabs.forEach((tab, tabIndex) => {
    tab.fields.forEach((field, fieldIndex) => {
      const fieldPath = `tabs[${tabIndex}].fields[${fieldIndex}]`;
      errors.push(...validateFieldId(field, fieldPath, allIds));

      if (field.visibility) {
        field.visibility.rules.forEach((rule, ruleIndex) => {
          if (!allIds.has(rule.fieldId)) {
            errors.push({
              path: `${fieldPath}.visibility.rules[${ruleIndex}].fieldId`,
              message: `Visibility rule references unknown field: "${rule.fieldId}"`,
            });
          }
        });
      }

      if (field.dataSource) {
        const dsExists = schema.dataSources.some((ds) => ds.id === field.dataSource?.dataSourceId);
        if (!dsExists) {
          errors.push({
            path: `${fieldPath}.dataSource`,
            message: `References unknown data source: "${field.dataSource.dataSourceId}"`,
          });
        }
      }
    });
  });

  return errors;
}
