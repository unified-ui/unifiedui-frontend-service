import type { FC } from 'react';
import { Modal, Text, Group, Button, Stack, ThemeIcon } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

interface ConfirmDeleteDialogProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  itemName?: string;
  itemType?: string;
  isLoading?: boolean;
}

export const ConfirmDeleteDialog: FC<ConfirmDeleteDialogProps> = ({
  opened,
  onClose,
  onConfirm,
  title = 'Löschen bestätigen',
  itemName,
  itemType = 'Element',
  isLoading = false,
}) => {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <ThemeIcon color="red" variant="light" size="lg" radius="xl">
            <IconAlertTriangle size={20} />
          </ThemeIcon>
          <Text fw={600} size="lg">{title}</Text>
        </Group>
      }
      centered
      size="md"
      styles={{
        header: {
          borderBottom: '1px solid var(--border-default)',
          paddingBottom: 'var(--spacing-sm)',
        },
        body: {
          paddingTop: 'var(--spacing-lg)',
        },
      }}
    >
      <Stack gap="lg">
        <Text size="sm" c="dimmed">
          {itemName ? (
            <>
              Sind Sie sicher, dass Sie <Text span fw={600} c="var(--text-primary)">{itemName}</Text> löschen möchten?
            </>
          ) : (
            <>Sind Sie sicher, dass Sie dieses {itemType} löschen möchten?</>
          )}
        </Text>
        
        <Text size="xs" c="red.6" style={{
          padding: 'var(--spacing-sm) var(--spacing-sm)',
          backgroundColor: 'var(--color-error-50)',
          borderRadius: 'var(--radius-sm)',
          borderLeft: '3px solid var(--color-error-500)',
        }}>
          Diese Aktion kann nicht rückgängig gemacht werden.
        </Text>

        <Group justify="flex-end" gap="sm" mt="sm">
          <Button 
            variant="default" 
            onClick={onClose}
            disabled={isLoading}
          >
            Abbrechen
          </Button>
          <Button 
            color="red" 
            onClick={handleConfirm}
            loading={isLoading}
          >
            Löschen
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
