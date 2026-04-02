import type { FC } from 'react';
import { Text, Group } from '@mantine/core';
import { IconSettings, IconEdit } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { WidgetFieldConfig, WidgetFormSchema, DataSourceConfig } from './types';
import { FieldPropertiesView } from './FieldPropertiesView';
import { PageSettingsView } from './PageSettingsView';
import classes from './WidgetDesignerPage.module.css';

interface PropertiesPanelProps {
  selectedField: WidgetFieldConfig | null;
  schema: WidgetFormSchema;
  allFields: WidgetFieldConfig[];
  onFieldChange: (field: WidgetFieldConfig) => void;
  onSchemaSettingsChange: (settings: WidgetFormSchema['settings']) => void;
  onDataSourcesChange: (dataSources: DataSourceConfig[]) => void;
  onScriptsChange: (scripts: WidgetFormSchema['scripts']) => void;
}

export const PropertiesPanel: FC<PropertiesPanelProps> = ({
  selectedField,
  schema,
  allFields,
  onFieldChange,
  onSchemaSettingsChange,
  onDataSourcesChange,
  onScriptsChange,
}) => {
  const { t } = useTranslation('widgetDesigner');

  return (
    <div className={classes.sidebar} data-sidebar>
      <div className={classes.sidebarHeader}>
        <Group gap="sm">
          {selectedField ? <IconEdit size={16} /> : <IconSettings size={16} />}
          <Text fw={600} size="sm">
            {selectedField ? t('fieldProperties') : t('pageSettings.title')}
          </Text>
        </Group>
      </div>
      <div className={classes.sidebarScrollOuter}>
        <div className={classes.sidebarScrollInner}>
          {selectedField ? (
            <FieldPropertiesView field={selectedField} allFields={allFields} onChange={onFieldChange} />
          ) : (
            <PageSettingsView
              schema={schema}
              allFields={allFields}
              onChange={onSchemaSettingsChange}
              onDataSourcesChange={onDataSourcesChange}
              onScriptsChange={onScriptsChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};
