import type { FC } from 'react';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  Title,
  Group,
  Text,
  TextInput,
  Button,
  ActionIcon,
  LoadingOverlay,
  SegmentedControl,
  Alert,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconDeviceFloppy, IconArrowLeft, IconArrowBackUp, IconArrowForwardUp, IconAlertTriangle } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { MainLayout } from '../../components/layout/MainLayout';
import { EditChatWidgetDialog } from '../../components/dialogs';
import { useIdentity, useRecentVisits } from '../../contexts';
import { useDialogParams } from '../../hooks';
import { loadWidgetSchema, schemaToConfig } from './schemaMigration';
import { useUndoRedo } from './useUndoRedo';
import { useAutoSaveDraft } from './useAutoSaveDraft';
import { createDefaultField, type FieldType, type WidgetFormSchema, type WidgetFieldConfig, type WidgetTab, type DesignerMode, type DataSourceConfig } from './types';
import { FieldCanvas } from './FieldCanvas';
import { AddFieldPanel } from './AddFieldPanel';
import { PropertiesPanel } from './PropertiesPanel';
import { TabBar } from './TabBar';
import { DemoModeRenderer } from './DemoModeRenderer';
import { ImportExportActions } from './ImportExportActions';
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
  const { trackVisit } = useRecentVisits();
  const { dialog, openDialog, closeDialog } = useDialogParams();

  const { state: schema, set: setSchema, undo, redo, canUndo, canRedo, reset } = useUndoRedo<WidgetFormSchema>(EMPTY_SCHEMA);
  const [savedSchema, setSavedSchema] = useState<WidgetFormSchema | undefined>(undefined);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [widgetName, setWidgetName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<DesignerMode>('edit');
  const [addFieldOpen, setAddFieldOpen] = useState(false);
  const [insertIndex, setInsertIndex] = useState<number | undefined>(undefined);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);
  const savedNameRef = useRef('');

  const { hasDraft, draftTimestamp, restoreDraft, discardDraft, clearDraft } =
    useAutoSaveDraft(widgetId, schema, savedSchema, isLoading);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const hasChanges = savedSchema !== undefined && JSON.stringify(schema) !== JSON.stringify(savedSchema);
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
    setIsLoading(true);
    apiClient.getChatWidget(selectedTenant.id, widgetId)
      .then((widget) => {
        setWidgetName(widget.name);
        savedNameRef.current = widget.name;
        const loaded = loadWidgetSchema((widget.config ?? {}) as Record<string, unknown>);
        reset(loaded);
        setSavedSchema(structuredClone(loaded));
      })
      .catch(() => { /* handled by API client */ })
      .finally(() => setIsLoading(false));
  }, [widgetId, apiClient, selectedTenant, reset]);

  useEffect(() => {
    if (widgetId && widgetName) {
      trackVisit({
        resource_type: 'chat_widget',
        resource_id: widgetId,
        resource_name: widgetName,
      });
    }
  }, [widgetId, widgetName, trackVisit]);

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
    if (insertIndex !== undefined) {
      updateFields((prev) => {
        const next = [...prev];
        next.splice(insertIndex, 0, newField);
        return next;
      });
    } else {
      updateFields((prev) => [...prev, newField]);
    }
    setSelectedFieldId(newField.id);
    setInsertIndex(undefined);
  }, [allFields, updateFields, insertIndex]);

  const handleRemoveField = useCallback((id: string) => {
    updateFields((prev) => prev.filter((f) => f.id !== id));
    if (selectedFieldId === id) setSelectedFieldId(null);
  }, [selectedFieldId, updateFields]);

  const handleFieldChange = useCallback((updated: WidgetFieldConfig) => {
    updateFields((prev) => prev.map((f) => f.id === selectedFieldId ? updated : f));
    if (updated.id !== selectedFieldId) setSelectedFieldId(updated.id);
  }, [updateFields, selectedFieldId]);

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

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      updateFields((prev) => {
        const oldIndex = prev.findIndex((f) => f.id === active.id);
        const newIndex = prev.findIndex((f) => f.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }, [updateFields]);

  const handleSettingsChange = useCallback((settings: WidgetFormSchema['settings']) => {
    setSchema({ ...schema, settings });
  }, [schema, setSchema]);

  const handleDataSourcesChange = useCallback((dataSources: DataSourceConfig[]) => {
    setSchema({ ...schema, dataSources });
  }, [schema, setSchema]);

  const handleScriptsChange = useCallback((scripts: WidgetFormSchema['scripts']) => {
    setSchema({ ...schema, scripts });
  }, [schema, setSchema]);

  const handleAddTab = useCallback(() => {
    const newTab: WidgetTab = {
      id: `tab_${Date.now()}`,
      label: `${t('tabs.newTab')} ${schema.tabs.length + 1}`,
      fields: [],
    };
    setSchema({ ...schema, tabs: [...schema.tabs, newTab] });
    setActiveTabIndex(schema.tabs.length);
  }, [schema, setSchema, t]);

  const handleRemoveTab = useCallback((index: number) => {
    if (schema.tabs.length <= 1) return;
    const newTabs = schema.tabs.filter((_, i) => i !== index);
    setSchema({ ...schema, tabs: newTabs });
    setActiveTabIndex((prev) => Math.min(prev, newTabs.length - 1));
    setSelectedFieldId(null);
  }, [schema, setSchema]);

  const handleRenameTab = useCallback((index: number, label: string) => {
    setSchema({
      ...schema,
      tabs: schema.tabs.map((tab, i) => (i === index ? { ...tab, label } : tab)),
    });
  }, [schema, setSchema]);

  const handleMoveTab = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const newTabs = arrayMove(schema.tabs, fromIndex, toIndex);
    setSchema({ ...schema, tabs: newTabs });
    if (activeTabIndex === fromIndex) setActiveTabIndex(toIndex);
    else if (activeTabIndex === toIndex) setActiveTabIndex(fromIndex);
  }, [schema, setSchema, activeTabIndex]);

  const handleRestoreDraft = useCallback(() => {
    const draft = restoreDraft();
    if (draft) {
      reset(draft);
    }
  }, [restoreDraft, reset]);

  const handleImportSchema = useCallback((imported: WidgetFormSchema) => {
    reset(imported);
    setActiveTabIndex(0);
    setSelectedFieldId(null);
  }, [reset]);

  const handleSave = useCallback(async () => {
    if (!widgetId || !apiClient || !selectedTenant) return;

    setIsSaving(true);
    try {
      await apiClient.updateChatWidget(selectedTenant.id, widgetId, {
        name: widgetName,
        config: schemaToConfig(schema),
      });
      setSavedSchema(structuredClone(schema));
      clearDraft();
    } catch {
      notifications.show({ message: t('widgetSaveFailed'), color: 'red' });
    } finally {
      setIsSaving(false);
    }
  }, [schema, widgetId, widgetName, apiClient, selectedTenant, clearDraft, t]);

  useEffect(() => {
    if (!widgetName || widgetName === savedNameRef.current) return;
    savedNameRef.current = widgetName;
    handleSave();
  }, [widgetName, handleSave]);

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
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        if (selectedFieldId && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'SELECT') {
          e.preventDefault();
          handleMoveField(selectedFieldId, e.key === 'ArrowUp' ? 'up' : 'down');
        }
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-field-card]') || target.closest('[data-no-deselect]') || target.closest('[data-sidebar]') || target.closest('[data-mantine-portal]') || target.closest('.mantine-Popover-dropdown') || target.closest('.mantine-Select-dropdown') || target.closest('.mantine-Combobox-dropdown')) return;
      setSelectedFieldId(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  });

  return (
    <MainLayout>
      <div className={classes.page}>
        <LoadingOverlay visible={isLoading} />

        {hasDraft && (
          <Alert
            icon={<IconAlertTriangle size={14} />}
            color="yellow"
            variant="light"
            withCloseButton
            onClose={discardDraft}
            m="sm"
          >
            <Group gap="sm">
              <Text size="sm">
                {t('draft.found', { date: draftTimestamp ? new Date(draftTimestamp).toLocaleString() : '' })}
              </Text>
              <Button size="xs" variant="light" onClick={handleRestoreDraft}>
                {t('draft.restore')}
              </Button>
              <Button size="xs" variant="subtle" onClick={discardDraft}>
                {t('draft.discard')}
              </Button>
            </Group>
          </Alert>
        )}

        <div className={classes.header}>
          <Group justify="space-between">
            <Group gap="sm">
              <ActionIcon variant="subtle" onClick={() => navigate('/chat-widgets')}>
                <IconArrowLeft size={20} />
              </ActionIcon>
              {isEditingName ? (
                <TextInput
                  ref={nameInputRef}
                  value={editNameValue}
                  onChange={(e) => setEditNameValue(e.currentTarget.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      nameInputRef.current?.blur();
                    }
                    if (e.key === 'Escape') setIsEditingName(false);
                  }}
                  onBlur={() => {
                    const trimmed = editNameValue.trim();
                    if (trimmed && trimmed !== widgetName) {
                      setWidgetName(trimmed);
                    }
                    setIsEditingName(false);
                  }}
                  size="sm"
                  styles={{ input: { fontWeight: 700, fontSize: 'var(--mantine-h3-font-size)' } }}
                  data-no-deselect
                />
              ) : (
                <Title
                  order={3}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setEditNameValue(widgetName || t('title'));
                    setIsEditingName(true);
                    setTimeout(() => nameInputRef.current?.focus(), 0);
                  }}
                >
                  {widgetName || t('title')}
                </Title>
              )}
            </Group>
            <Group gap="xs">
              <ActionIcon variant="subtle" disabled={!canUndo} onClick={undo} title={`${t('undo')} (${navigator.platform?.includes('Mac') ? '⌘Z' : 'Ctrl+Z'})`}>
                <IconArrowBackUp size={18} />
              </ActionIcon>
              <ActionIcon variant="subtle" disabled={!canRedo} onClick={redo} title={`${t('redo')} (${navigator.platform?.includes('Mac') ? '⌘⇧Z' : 'Ctrl+Shift+Z'})`}>
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
              <ImportExportActions
                schema={schema}
                widgetName={widgetName}
                onImport={handleImportSchema}
                onEditDetails={() => openDialog('edit-details')}
              />
              <Button
                leftSection={<IconDeviceFloppy size={16} />}
                onClick={handleSave}
                disabled={!hasChanges}
                loading={isSaving}
                size="sm"
              >
                {t('saveWidget')}
              </Button>
            </Group>
          </Group>
        </div>

        <div className={classes.body}>
          <div
            className={classes.canvasArea}
          >
            {schema.settings.title && (
              <Title order={4} mb="sm">{schema.settings.title}</Title>
            )}
            {schema.settings.description && (
              <Text size="sm" c="dimmed" mb="md">{schema.settings.description}</Text>
            )}

            {schema.settings.enableTabs && mode === 'edit' && (
              <TabBar
                tabs={schema.tabs}
                activeTabIndex={activeTabIndex}
                onSelectTab={(i) => { setActiveTabIndex(i); setSelectedFieldId(null); }}
                onAddTab={handleAddTab}
                onRemoveTab={handleRemoveTab}
                onRenameTab={handleRenameTab}
                onMoveTab={handleMoveTab}
              />
            )}

            <div
              className={classes.canvasScrollOuter}
              style={mode === 'demo' ? { display: 'flex', flexDirection: 'column' } : undefined}
            >
              <div
                className={classes.canvasScrollInner}
                style={mode === 'demo' ? { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 } : undefined}
              >
                <div
                  className={classes.canvasCard}
                  style={mode === 'demo' ? { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 } : undefined}
                >
                  {mode === 'edit' ? (
                    <>
                      <AddFieldPanel
                        opened={addFieldOpen}
                        onClose={() => { setAddFieldOpen(false); setInsertIndex(undefined); }}
                        onAddField={handleAddField}
                      />
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={fields.map((f) => f.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <FieldCanvas
                            fields={fields}
                            selectedFieldId={selectedFieldId}
                            onSelectField={setSelectedFieldId}
                            onRemoveField={handleRemoveField}
                            onMoveField={handleMoveField}
                            onOpenAddField={(idx) => { setInsertIndex(idx); setAddFieldOpen(true); }}
                          />
                        </SortableContext>
                      </DndContext>
                    </>
                  ) : (
                    <DemoModeRenderer schema={schema} />
                  )}
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
              onDataSourcesChange={handleDataSourcesChange}
              onScriptsChange={handleScriptsChange}
            />
          )}
        </div>
      </div>

      <EditChatWidgetDialog
        opened={dialog === 'edit-details'}
        chatWidgetId={widgetId || null}
        initialData={null}
        activeTab="details"
        onClose={closeDialog}
        onSuccess={() => {
          closeDialog();
          if (widgetId && apiClient && selectedTenant) {
            apiClient.getChatWidget(selectedTenant.id, widgetId)
              .then((widget) => {
                setWidgetName(widget.name);
                savedNameRef.current = widget.name;
              })
              .catch(() => {});
          }
        }}
        onTabChange={() => {}}
      />
    </MainLayout>
  );
};
