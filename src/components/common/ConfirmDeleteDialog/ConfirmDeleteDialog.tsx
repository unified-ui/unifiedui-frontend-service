import type { FC } from 'react';
import { Modal, Text, Group, Button, Stack, ThemeIcon } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

interface ConfirmDeleteDialogProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  itemName?: string;
  itemType?: string;
  isLoading?: boolean;
  confirmButtonText?: string;
  reverseButtons?: boolean;
}

export const ConfirmDeleteDialog: FC<ConfirmDeleteDialogProps> = ({
  opened,
  onClose,
  onConfirm,
  title = 'Confirm Delete',
  message,
  itemName,
  itemType = 'item',
  isLoading = false,
  confirmButtonText = 'Delete',
  reverseButtons = false,
}) => {
  const handleConfirm = () => {
    onConfirm();
  };

  // Build display message
  const displayMessage = message || (itemName
    ? <>Are you sure you want to delete <Text span fw={600} c="var(--text-primary)">{itemName}</Text>?</>
    : <>Are you sure you want to delete this {itemType}?</>
  );

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
          {displayMessage}
        </Text>
        
        <Text size="xs" c="red.6" style={{
          padding: 'var(--spacing-sm) var(--spacing-sm)',
          backgroundColor: 'var(--color-error-50)',
          borderRadius: 'var(--radius-sm)',
          borderLeft: '3px solid var(--color-error-500)',
        }}>
          This action cannot be undone.
        </Text>

        <Group justify="flex-end" gap="sm" mt="sm">
          {reverseButtons ? (
            <>
              <Button 
                color="red" 
                onClick={handleConfirm}
                loading={isLoading}
              >
                {confirmButtonText}
              </Button>
              <Button 
                variant="default" 
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="default" 
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                color="red" 
                onClick={handleConfirm}
                loading={isLoading}
              >
                {confirmButtonText}
              </Button>
            </>
          )}
        </Group>
      </Stack>
    </Modal>
  );
};
