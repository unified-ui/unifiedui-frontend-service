import type { FC } from 'react';
import { useState, useCallback, useMemo } from 'react';
import {
  Title,
  Stack,
  Group,
  Paper,
  Text,
  Button,
  ActionIcon,
  Divider,
  ScrollArea,
  Badge,
} from '@mantine/core';
import { IconX, IconGripVertical, IconDeviceFloppy } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '../../components/layout/MainLayout';
import { FieldPalette } from './FieldPalette';
import { FieldProperties } from './FieldProperties';
import { FieldPreview } from './FieldPreview';
import { FIELD_TYPE_ICONS, createField, type FieldType, type FormFieldConfig } from './types';
import classes from './WidgetDesignerPage.module.css';

export const WidgetDesignerPage: FC = () => {
  const { t } = useTranslation('widgetDesigner');
  const [fields, setFields] = useState<FormFieldConfig[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  const selectedField = useMemo(
    () => fields.find(f => f.id === selectedFieldId) || null,
    [fields, selectedFieldId]
  );

  const handleAddField = useCallback((type: FieldType) => {
    const newField = createField(type);
    setFields(prev => [...prev, newField]);
    setSelectedFieldId(newField.id);
  }, []);

  const handleRemoveField = useCallback((id: string) => {
    setFields(prev => prev.filter(f => f.id !== id));
    if (selectedFieldId === id) {
      setSelectedFieldId(null);
    }
  }, [selectedFieldId]);

  const handleFieldChange = useCallback((updated: FormFieldConfig) => {
    setFields(prev => prev.map(f => f.id === updated.id ? updated : f));
  }, []);

  const handleMoveField = useCallback((id: string, direction: 'up' | 'down') => {
    setFields(prev => {
      const index = prev.findIndex(f => f.id === id);
      if (index === -1) return prev;
      if (direction === 'up' && index === 0) return prev;
      if (direction === 'down' && index === prev.length - 1) return prev;
      const next = [...prev];
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
      return next;
    });
  }, []);

  const handleSave = useCallback(() => {
    void fields;
  }, [fields]);

  return (
    <MainLayout>
      <Stack gap="md" className={classes.page}>
        <Group justify="space-between">
          <Title order={2}>{t('title')}</Title>
          <Button leftSection={<IconDeviceFloppy size={16} />} onClick={handleSave}>
            {t('saveWidget')}
          </Button>
        </Group>

        <div className={classes.designerGrid}>
          <Paper className={classes.leftPanel} p="md" withBorder>
            <ScrollArea h="100%">
              <Stack gap="lg">
                <FieldPalette onAddField={handleAddField} />
                <Divider />
                <FieldProperties field={selectedField} onChange={handleFieldChange} />
              </Stack>
            </ScrollArea>
          </Paper>

          <Stack gap="md" className={classes.rightPanel}>
            <Paper className={classes.canvas} p="md" withBorder>
              <Text fw={600} size="sm" mb="sm">{t('canvas')}</Text>
              <ScrollArea h="100%">
                {fields.length === 0 ? (
                  <Text size="sm" c="dimmed" ta="center" py="xl">
                    {t('dragFieldsHere')}
                  </Text>
                ) : (
                  <Stack gap="xs">
                    {fields.map((field, index) => {
                      const Icon = FIELD_TYPE_ICONS[field.type];
                      return (
                        <Paper
                          key={field.id}
                          className={`${classes.canvasField} ${selectedFieldId === field.id ? classes.canvasFieldSelected : ''}`}
                          p="xs"
                          withBorder
                          onClick={() => setSelectedFieldId(field.id)}
                        >
                          <Group justify="space-between" wrap="nowrap">
                            <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                              <IconGripVertical size={14} className={classes.gripIcon} />
                              <Icon size={14} />
                              <Text size="sm" truncate>{field.label || field.text || field.type}</Text>
                              <Badge size="xs" variant="light">{t(`fieldTypes.${field.type}`)}</Badge>
                            </Group>
                            <Group gap={4}>
                              <ActionIcon
                                size="xs"
                                variant="subtle"
                                onClick={(e) => { e.stopPropagation(); handleMoveField(field.id, 'up'); }}
                                disabled={index === 0}
                              >
                                ↑
                              </ActionIcon>
                              <ActionIcon
                                size="xs"
                                variant="subtle"
                                onClick={(e) => { e.stopPropagation(); handleMoveField(field.id, 'down'); }}
                                disabled={index === fields.length - 1}
                              >
                                ↓
                              </ActionIcon>
                              <ActionIcon
                                size="xs"
                                variant="subtle"
                                color="red"
                                onClick={(e) => { e.stopPropagation(); handleRemoveField(field.id); }}
                              >
                                <IconX size={12} />
                              </ActionIcon>
                            </Group>
                          </Group>
                        </Paper>
                      );
                    })}
                  </Stack>
                )}
              </ScrollArea>
            </Paper>

            <Paper className={classes.preview} p="md" withBorder>
              <Text fw={600} size="sm" mb="sm">{t('livePreview')}</Text>
              <ScrollArea h="100%">
                <FieldPreview fields={fields} />
              </ScrollArea>
            </Paper>
          </Stack>
        </div>
      </Stack>
    </MainLayout>
  );
};
