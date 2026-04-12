import type { FC } from 'react';
import { Modal, Text, Stack, UnstyledButton, Tooltip, Alert, Box } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { FIELD_TYPE_CATEGORIES, FIELD_TYPE_ICONS, type FieldType } from './types';
import classes from './WidgetDesignerPage.module.css';

interface AddFieldPanelProps {
  opened: boolean;
  onClose: () => void;
  onAddField: (type: FieldType) => void;
}

export const AddFieldPanel: FC<AddFieldPanelProps> = ({ opened, onClose, onAddField }) => {
  const { t } = useTranslation('widgetDesigner');

  const handleAdd = (type: FieldType) => {
    onAddField(type);
    onClose();
  };

  return (
    <Modal opened={opened} onClose={onClose} title={t('addField')} size="lg" centered>
      <Stack gap="md">
        {FIELD_TYPE_CATEGORIES.map((category) => (
          <Box key={category.key}>
            <Text size="xs" fw={600} tt="uppercase" c="dimmed" mb="xs">
              {t(`categories.${category.key}`)}
            </Text>
            <div className={classes.addFieldGrid}>
              {category.types.map((type) => {
                const Icon = FIELD_TYPE_ICONS[type];
                return (
                  <Tooltip key={type} label={t(`fieldTypes.${type}`)} openDelay={300}>
                    <UnstyledButton
                      className={classes.addFieldButton}
                      onClick={() => handleAdd(type)}
                    >
                      <Icon size={20} />
                      <Text size="xs" ta="center" truncate maw="100%">
                        {t(`fieldTypes.${type}`)}
                      </Text>
                    </UnstyledButton>
                  </Tooltip>
                );
              })}
            </div>
            {category.key === 'input' && (
              <Alert
                icon={<IconAlertTriangle size={14} />}
                color="yellow"
                variant="light"
                mt="xs"
                p="xs"
                className={classes.passwordWarning}
              >
                <Text size="xs">{t('passwordWarning')}</Text>
              </Alert>
            )}
          </Box>
        ))}
      </Stack>
    </Modal>
  );
};
