import type { FC } from 'react';
import { useState } from 'react';
import {
  Stack,
  TextInput,
  Textarea,
  Switch,
  Badge,
  Button,
  Box,
} from '@mantine/core';
import { IconCode } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { WidgetFieldConfig, WidgetFormSchema, DataSourceConfig } from './types';
import { Section } from './Section';
import { DataSourceEditor } from './DataSourceEditor';
import { ScriptEditorDialog } from './ScriptEditorDialog';

interface PageSettingsViewProps {
  schema: WidgetFormSchema;
  allFields: WidgetFieldConfig[];
  onChange: (settings: WidgetFormSchema['settings']) => void;
  onDataSourcesChange: (dataSources: DataSourceConfig[]) => void;
  onScriptsChange: (scripts: WidgetFormSchema['scripts']) => void;
}

export const PageSettingsView: FC<PageSettingsViewProps> = ({ schema, allFields, onChange, onDataSourcesChange, onScriptsChange }) => {
  const { t } = useTranslation('widgetDesigner');
  const [scriptEditor, setScriptEditor] = useState<{ opened: boolean; mode: 'onFormLoad' | 'onBeforeSubmit' | 'onFieldChange' }>({ opened: false, mode: 'onFormLoad' });
  const settings = schema.settings;

  const update = (partial: Partial<WidgetFormSchema['settings']>) => {
    onChange({ ...settings, ...partial });
  };

  return (
    <Stack gap="sm">
      <Section label={t('sections.general')} defaultOpen>
        <Stack gap="xs">
          <TextInput
            label={t('pageSettings.formTitle')}
            value={settings.title ?? ''}
            onChange={(e) => update({ title: e.currentTarget.value || undefined })}
            size="sm"
          />
          <Textarea
            label={t('pageSettings.formDescription')}
            value={settings.description ?? ''}
            onChange={(e) => update({ description: e.currentTarget.value || undefined })}
            rows={2}
            size="sm"
          />
          <TextInput
            label={t('pageSettings.submitButtonText')}
            value={settings.submitButtonText ?? ''}
            onChange={(e) => update({ submitButtonText: e.currentTarget.value || undefined })}
            size="sm"
          />
          <TextInput
            label={t('pageSettings.successMessage')}
            value={settings.successMessage ?? ''}
            onChange={(e) => update({ successMessage: e.currentTarget.value || undefined })}
            size="sm"
          />
        </Stack>
      </Section>

      <Section label={t('sections.tabs')} defaultOpen={false}>
        <Stack gap="xs">
          <Switch
            label={t('pageSettings.enableTabs')}
            checked={settings.enableTabs ?? false}
            onChange={(e) => update({ enableTabs: e.currentTarget.checked })}
            size="sm"
          />
          {settings.enableTabs && (
            <>
              <Switch
                label={t('pageSettings.validateOnTabChange')}
                checked={settings.validateOnTabChange ?? false}
                onChange={(e) => update({ validateOnTabChange: e.currentTarget.checked })}
                size="sm"
              />
            </>
          )}
        </Stack>
      </Section>

      <Section label={t('sections.dataSources')} count={schema.dataSources.length} defaultOpen={false}>
        <Box style={{ opacity: 0.5, pointerEvents: 'none' }}>
          <DataSourceEditor
            dataSources={schema.dataSources}
            allFields={allFields}
            onChange={onDataSourcesChange}
          />
        </Box>
      </Section>

      <Section label={t('sections.scripts')} defaultOpen={false}>
        <Stack gap="xs">
          <Button
            variant="light"
            size="xs"
            leftSection={<IconCode size={12} />}
            onClick={() => setScriptEditor({ opened: true, mode: 'onFormLoad' })}
            fullWidth
          >
            {t('scripts.onFormLoad')}
            {schema.scripts.onFormLoad && <Badge size="xs" variant="dot" ml={4} />}
          </Button>
          <Button
            variant="light"
            size="xs"
            leftSection={<IconCode size={12} />}
            onClick={() => setScriptEditor({ opened: true, mode: 'onBeforeSubmit' })}
            fullWidth
          >
            {t('scripts.onBeforeSubmit')}
            {schema.scripts.onBeforeSubmit && <Badge size="xs" variant="dot" ml={4} />}
          </Button>
          <Button
            variant="light"
            size="xs"
            leftSection={<IconCode size={12} />}
            onClick={() => setScriptEditor({ opened: true, mode: 'onFieldChange' })}
            fullWidth
          >
            {t('scripts.onFieldChange')}
            {schema.scripts.onFieldChange && <Badge size="xs" variant="dot" ml={4} />}
          </Button>
        </Stack>
      </Section>

      <ScriptEditorDialog
        opened={scriptEditor.opened}
        onClose={() => setScriptEditor((s) => ({ ...s, opened: false }))}
        title={t(`scripts.${scriptEditor.mode}`)}
        script={schema.scripts[scriptEditor.mode] ?? ''}
        onSave={(script) => {
          onScriptsChange({ ...schema.scripts, [scriptEditor.mode]: script || undefined });
        }}
        mode={scriptEditor.mode}
        fieldIds={allFields.map((f) => f.id)}
      />
    </Stack>
  );
};
