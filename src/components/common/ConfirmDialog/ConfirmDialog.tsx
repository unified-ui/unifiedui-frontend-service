import type { FC, ReactNode } from 'react';
import { Modal, Text, Group, Button, Stack, ThemeIcon } from '@mantine/core';
import { IconAlertTriangle, IconInfoCircle, IconAlertCircle } from '@tabler/icons-react';
import classes from './ConfirmDialog.module.css';

type ConfirmDialogType = 'danger' | 'warning' | 'info';

interface ConfirmDialogProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  type?: ConfirmDialogType;
  title: string;
  message?: string | ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  icon?: ReactNode;
}

const TYPE_CONFIG: Record<ConfirmDialogType, {
  color: string;
  icon: ReactNode;
  bannerClass: string;
}> = {
  danger: {
    color: 'red',
    icon: <IconAlertTriangle size={20} />,
    bannerClass: 'bannerDanger',
  },
  warning: {
    color: 'yellow',
    icon: <IconAlertCircle size={20} />,
    bannerClass: 'bannerWarning',
  },
  info: {
    color: 'blue',
    icon: <IconInfoCircle size={20} />,
    bannerClass: 'bannerInfo',
  },
};

export const ConfirmDialog: FC<ConfirmDialogProps> = ({
  opened,
  onClose,
  onConfirm,
  type = 'danger',
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isLoading = false,
  icon,
}) => {
  const config = TYPE_CONFIG[type];
  const displayIcon = icon ?? config.icon;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <ThemeIcon color={config.color} variant="light" size="lg" radius="xl">
            {displayIcon}
          </ThemeIcon>
          <Text fw={600} size="lg">{title}</Text>
        </Group>
      }
      centered
      size="md"
      classNames={{
        header: classes.header,
        body: classes.body,
      }}
    >
      <Stack gap="lg">
        {message && (
          <Text size="sm" c="dimmed">
            {message}
          </Text>
        )}

        {type === 'danger' && (
          <Text size="xs" className={classes[config.bannerClass]}>
            This action cannot be undone.
          </Text>
        )}

        <Group justify="flex-end" gap="sm" mt="sm">
          <Button
            variant="default"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            color={config.color}
            onClick={onConfirm}
            loading={isLoading}
          >
            {confirmLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
