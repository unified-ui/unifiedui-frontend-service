import type { FC } from 'react';
import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Title,
  Group,
  Text,
  Button,
  ActionIcon,
  LoadingOverlay,
  SegmentedControl,
  Kbd,
} from '@mantine/core';
import { IconDeviceFloppy, IconArrowLeft, IconArrowBackUp, IconArrowForwardUp } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/layout/MainLayout';
import { useIdentity } from '../../contexts';
import { loadWidgetSchema, schemaToConfig } from './schemaMigration';
import { validateSchema } from './schemaValidation';
import { useUndoRedo } from './useUndoRedo';
import { createDefaultField, type FieldType, type WidgetFormSchema, type WidgetFieldConfig, type DesignerMode } from './types';
import { FieldCanvas } from './FieldCanvas';
import { AddFieldPanel } from './AddFieldPanel';
import { PropertiesPanel } from './PropertiesPanel';
import classes from './WidgetDesignerPage.module.css';

const EMPTY_SCHEMA: WidgetFormSchema = {
  version: 2,
  settings: {},
  tabs: [{ id: 'default', label: 'Form', fields: [] }],
  dataSources: [],
  scripts: {},
};

export const WidgetDesignerPage: FC = () => {
  const { t } = useTranslation('widgetDesigner');
  const { widgetId } = useParams<{ widgetId: string }>();
  const navigate = useNavigate();
  const { apiClient, selectedTenant } = useIdentity();

  const { state: schema, set: setSchema, undo, redo, canUndo, canRedo, reset } = useUndoRedo<WidgetFormSchema>(EMPTY_SCHEMA);
  const [savedSchema, setSavedSchema] = useState<WidgetFormSchema | undefined>(undefined);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [widgetName, setWidgetName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<DesignerMode>('edit');
  const [addFieldOpen, setAddFieldOpen] = useState(false);

  const hasChanges = savedSchema !== undefined && JSON.stringify(schema) !== JSON.stringify(savedSchema);
  const activeTabIndex = 0;
  const activeTab = schema.tabs[activeTabIndex];
  const fields = activeTab?.fields ?? [];

  const allFields = useMemo(
    () => schema.tabs.flatMap((tab) => tab.fields),
    [schema]
  );

  const selectedField = useMemo(
    () => allFields.find((f) => f.id === selectedFieldId) ?? null,
    [allFields, selectedFieldId]
  );

  useEffect(() => {
    if (!widgetId || !apiClient || !selectedTenant) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    apiClient.getChatWidget(selectedTenant.id, widgetId)
      .then((widget) => {
        setWidgetName(widget.name);
        const loaded = loadWidgetSchema((widget.config ?? {}) as Record<string, unknown>);
        reset(loaded);
        setSavedSchema(structuredClone(loaded));
      })
      .catch(() => { /* handled by API client */ })
      .finally(() => setIsLoading(false));
  }, [widgetId, apiClient, selectedTenant, reset]);

  const updateFields = useCallback((updater: (prev: WidgetFieldConfig[]) => WidgetFieldConfig[]) => {
    setSchema({
      ...schema,
      tabs: schema.tabs.map((tab, i) =>
        i === activeTabIndex ? { ...tab, fields: updater(tab.fields) } : tab
      ),
    });
  }, [schema, setSchema, activeTabIndex]);

  const handleAddField = useCallback((type: FieldType) => {
    const newField = createDefaultField(type, allFields);
    updateFields((prev) => [...prev, newField]);
    setSelectedFieldId(newField.id);
  }, [allFields, updateFields]);

  const handleRemoveField = useCallback((id: string) => {
    updateFields((prev) => prev.filter((f) => f.id !== id));
    if (selectedFieldId === id) setSelectedFieldId(null);
  }, [selectedFieldId, updateFields]);

  const handleFieldChange = useCallback((updated: WidgetFieldConfig) => {
    updateFields((prev) => prev.map((f) => f.id === updated.id ? updated : f));
  }, [updateFields]);

  const handleMoveField = useCallback((id: string, direction: 'up' | 'down') => {
    updateFields((prev) => {
      const index = prev.findIndex((f) => f.id === id);
      if (index === -1) return prev;
      if (direction === 'up' && index === 0) return prev;
      if (direction === 'down' && index === prev.length - 1) return prev;
      const next = [...prev];
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
      return next;
    });
  }, [updateFields]);

  const handleSettingsChange = useCallback((settings: WidgetFormSchema['settings']) => {
    setSchema({ ...schema, settings });
  }, [schema, setSchema]);

  const handleSave = useCallback(async () => {
    if (!widgetId || !apiClient || !selectedTenant) return;

    const errors = validateSchema(schema);
    if (errors.length > 0) return;

    await apiClient.updateChatWidget(selectedTenant.id, widgetId, {
      config: schemaToConfig(schema),
    });
    setSavedSchema(structuredClone(schema));
  }, [schema, widgetId, apiClient, selectedTenant]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if (isMod && e.key === 'z' && e.shiftKey) { e.preventDefault(); redo(); }
      if (isMod && e.key === 's') { e.preventDefault(); handleSave(); }
      if (isMod && e.key === 'd') { e.preventDefault(); setMode((m) => m === 'edit' ? 'demo' : 'edit'); }
      if (e.key === 'Escape') setSelectedFieldId(null);
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedFieldId && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          handleRemoveField(selectedFieldId);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <MainLayout>
      <div className={classes.page}>
        <LoadingOverlay visible={isLoading} />

        <div className={classes.header}>
          <Group justify="space-between">
            <Group gap="sm">
              <ActionIcon variant="subtle" onClick={() => navigate('/chat-widgets')}>
                <IconArrowLeft size={20} />
              </ActionIcon>
              <Title order={3}>{widgetName || t('title')}</Title>
            </Group>
            <Group gap="xs">
              <ActionIcon variant="subtle" disabled={!canUndo} onClick={undo} title={`${t('undo')} (${Kbd ? '⌘Z' : 'Ctrl+Z'})`}>
                <IconArrowBackUp size={18} />
              </ActionIcon>
              <ActionIcon variant="subtle" disabled={!canRedo} onClick={redo} title={`${t('redo')} (${Kbd ? '⌘⇧Z' : 'Ctrl+Shift+Z'})`}>
                <IconArrowForwardUp size={18} />
              </ActionIcon>
              <SegmentedControl
                value={mode}
                onChange={(v) => setMode(v as DesignerMode)}
                data={[
                  { value: 'edit', label: t('modeEdit') },
                  { value: 'demo', label: t('modeDemo') },
                ]}
                size="xs"
              />
              <Button
                leftSection={<IconDeviceFloppy size={16} />}
                onClick={handleSave}
                disabled={!hasChanges}
                size="sm"
              >
                {t('saveWidget')}
              </Button>
            </Group>
          </Group>
        </div>

        <div className={classes.body}>
          <div className={classes.canvasArea}>
            {schema.settings.title && (
              <Title order={4} mb="sm">{schema.settings.title}</Title>
            )}
            {schema.settings.description && (
              <Text size="sm" c="dimmed" mb="md">{schema.settings.description}</Text>
            )}

            <div className={classes.canvasScrollOuter}>
              <div className={classes.canvasScrollInner}>
                <div className={classes.canvasCard}>
                  <AddFieldPanel
                    opened={addFieldOpen}
                    onClose={() => setAddFieldOpen(false)}
                    onAddField={handleAddField}
                    target={<span />}
                  />
                  <FieldCanvas
                    fields={fields}
                    selectedFieldId={selectedFieldId}
                    onSelectField={setSelectedFieldId}
                    onRemoveField={handleRemoveField}
                    onMoveField={handleMoveField}
                    onOpenAddField={() => setAddFieldOpen(true)}
                  />
                </div>
              </div>
            </div>
          </div>

          {mode === 'edit' && (
            <PropertiesPanel
              selectedField={selectedField}
              schema={schema}
              allFields={allFields}
              onFieldChange={handleFieldChange}
              onSchemaSettingsChange={handleSettingsChange}
            />
          )}
        </div>
      </div>
    </MainLayout>
  );
};
