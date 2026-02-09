import type { FC } from 'react';
import { Stack, Text, Button } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { FIELD_TYPE_ICONS, type FieldType } from './types';

const FIELD_TYPES: FieldType[] = ['text', 'textarea', 'description_textarea', 'select', 'multi_select', 'toggle', 'label', 'file'];

interface FieldPaletteProps {
  onAddField: (type: FieldType) => void;
}

export const FieldPalette: FC<FieldPaletteProps> = ({ onAddField }) => {
  const { t } = useTranslation('widgetDesigner');

  return (
    <Stack gap="xs">
      <Text fw={600} size="sm">{t('fieldPalette')}</Text>
      {FIELD_TYPES.map((type) => {
        const Icon = FIELD_TYPE_ICONS[type];
        return (
          <Button
            key={type}
            variant="light"
            justify="flex-start"
            leftSection={<Icon size={16} />}
            onClick={() => onAddField(type)}
            fullWidth
            size="sm"
          >
            {t(`fieldTypes.${type}`)}
          </Button>
        );
      })}
    </Stack>
  );
};
