import type { FC } from 'react';
import { Text, ActionIcon, Group, Box, Button } from '@mantine/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IconGripVertical, IconX, IconArrowUp, IconArrowDown } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { WidgetFieldConfig } from './types';
import { FieldPreviewCard } from './FieldPreviewCard';
import classes from './WidgetDesignerPage.module.css';

interface SortableFieldCardProps {
  field: WidgetFieldConfig;
  index: number;
  total: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
}

const SortableFieldCard: FC<SortableFieldCardProps> = ({
  field, index, total, isSelected, onSelect, onRemove, onMove,
}) => {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    gridColumn: `span ${field.layout.colSpan}`,
    marginTop: field.layout.marginTop ? `var(--spacing-${field.layout.marginTop})` : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      className={`${classes.fieldCard} ${isSelected ? classes.fieldCardSelected : ''}`}
      onClick={(e) => { e.stopPropagation(); onSelect(field.id); }}
      data-field-card
    >
      <div className={classes.fieldActions}>
        <Group gap={2}>
          <ActionIcon size="xs" variant="subtle" onClick={(e) => { e.stopPropagation(); onMove(field.id, 'up'); }} disabled={index === 0}>
            <IconArrowUp size={12} />
          </ActionIcon>
          <ActionIcon size="xs" variant="subtle" onClick={(e) => { e.stopPropagation(); onMove(field.id, 'down'); }} disabled={index === total - 1}>
            <IconArrowDown size={12} />
          </ActionIcon>
          <ActionIcon size="xs" variant="subtle" color="red" onClick={(e) => { e.stopPropagation(); onRemove(field.id); }}>
            <IconX size={12} />
          </ActionIcon>
        </Group>
      </div>
      <Group gap={4} mb={4} wrap="nowrap">
        <span {...attributes} {...listeners} style={{ cursor: 'grab' }}>
          <IconGripVertical size={14} className={classes.gripHandle} />
        </span>
      </Group>
      <FieldPreviewCard field={field} />
    </Box>
  );
};

interface FieldCanvasProps {
  fields: WidgetFieldConfig[];
  selectedFieldId: string | null;
  onSelectField: (id: string | null) => void;
  onRemoveField: (id: string) => void;
  onMoveField: (id: string, direction: 'up' | 'down') => void;
  onOpenAddField: () => void;
}

export const FieldCanvas: FC<FieldCanvasProps> = ({
  fields,
  selectedFieldId,
  onSelectField,
  onRemoveField,
  onMoveField,
  onOpenAddField,
}) => {
  const { t } = useTranslation('widgetDesigner');

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onSelectField(null);
    }
  };

  if (fields.length === 0) {
    return (
      <div>
        <div className={classes.emptyCanvas}>
          <Text size="lg" fw={500} mb="xs">{t('emptyCanvas.title')}</Text>
          <Text size="sm" c="dimmed" mb="md">{t('emptyCanvas.description')}</Text>
        </div>
        <div className={classes.addFieldBar}>
          <Button variant="light" fullWidth onClick={onOpenAddField}>
            {t('addField')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div onClick={handleCanvasClick}>
      <div className={classes.fieldGrid}>
        {fields.map((field, index) => (
          <SortableFieldCard
            key={field.id}
            field={field}
            index={index}
            total={fields.length}
            isSelected={selectedFieldId === field.id}
            onSelect={onSelectField}
            onRemove={onRemoveField}
            onMove={onMoveField}
          />
        ))}
      </div>
      <div className={classes.addFieldBar}>
        <Button variant="light" fullWidth onClick={onOpenAddField}>
          {t('addField')}
        </Button>
      </div>
      <div className={classes.submitBar}>
        <Button fullWidth disabled>
          {t('preview.submit')}
        </Button>
      </div>
    </div>
  );
};
