import type { FC } from 'react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Drawer, Text, ActionIcon, Tooltip, Group, Stack, Button, CopyButton, Spoiler } from '@mantine/core';
import { IconX, IconCheck, IconTrash, IconBellOff, IconCopy } from '@tabler/icons-react';
import { useNotifications } from '../../../contexts/useNotifications';
import type { NotificationEntry } from '../../../contexts/NotificationContext';
import classes from './NotificationDrawer.module.css';

interface NotificationDrawerProps {
  opened: boolean;
  onClose: () => void;
}

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatRawJson(raw: unknown): string {
  try {
    return JSON.stringify(raw, null, 2);
  } catch {
    return String(raw);
  }
}

const NotificationDetails: FC<{ notification: NotificationEntry; t: (key: string) => string }> = ({
  notification,
  t,
}) => {
  const hasRequestInfo = notification.method || notification.url;
  const hasRawJson = notification.rawJson !== undefined && notification.rawJson !== null;

  if (!hasRequestInfo && !hasRawJson) return null;

  const rawJsonStr = hasRawJson ? formatRawJson(notification.rawJson) : '';

  return (
    <div className={classes.detailsSection} onClick={(e) => e.stopPropagation()}>
      {hasRequestInfo && (
        <Text className={classes.requestInfo} size="xs">
          {notification.method} {notification.url}
        </Text>
      )}
      {hasRawJson && (
        <Spoiler maxHeight={0} showLabel={t('notifications.showDetails')} hideLabel={t('notifications.hideDetails')}>
          <div className={classes.rawJsonContainer}>
            <CopyButton value={rawJsonStr}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? t('notifications.copied') : t('notifications.copyDetails')}>
                  <ActionIcon
                    className={classes.copyButton}
                    variant="subtle"
                    color={copied ? 'teal' : 'gray'}
                    size="xs"
                    onClick={copy}
                  >
                    {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
            <pre className={classes.rawJson}>{rawJsonStr}</pre>
          </div>
        </Spoiler>
      )}
    </div>
  );
};

export const NotificationDrawer: FC<NotificationDrawerProps> = ({ opened, onClose }) => {
  const { t } = useTranslation('common');
  const { notifications, markAllAsRead, removeNotification, clearAll, markAsRead } = useNotifications();

  const handleItemClick = useCallback(
    (id: string) => {
      markAsRead(id);
    },
    [markAsRead],
  );

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size={380}
      title={t('notifications.title')}
      withCloseButton
      zIndex={300}
    >
      <div className={classes.drawer}>
        <div className={classes.drawerHeader}>
          <Text size="sm" c="dimmed">
            {t('notifications.count', { count: notifications.length })}
          </Text>
          <Group gap="xs">
            <Tooltip label={t('notifications.markAllRead')}>
              <Button
                variant="subtle"
                size="xs"
                leftSection={<IconCheck size={14} />}
                onClick={markAllAsRead}
                disabled={notifications.length === 0}
              >
                {t('notifications.markAllRead')}
              </Button>
            </Tooltip>
            <Tooltip label={t('notifications.clearAll')}>
              <ActionIcon
                variant="subtle"
                color="red"
                size="sm"
                onClick={clearAll}
                disabled={notifications.length === 0}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </div>

        <div className={classes.notificationList}>
          {notifications.length === 0 ? (
            <div className={classes.emptyState}>
              <IconBellOff size={48} stroke={1.2} />
              <Text size="sm" mt="md">{t('notifications.empty')}</Text>
            </div>
          ) : (
            <Stack gap="xs">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`${classes.notificationItem} ${!notification.read ? classes.unread : ''}`}
                  onClick={() => handleItemClick(notification.id)}
                >
                  <div
                    className={classes.colorIndicator}
                    style={{ backgroundColor: `var(--mantine-color-${notification.color}-6)` }}
                  />
                  <div className={classes.notificationContent}>
                    <Text className={classes.notificationTitle} size="sm" fw={700}>{notification.title}</Text>
                    <Text className={classes.notificationMessage} size="xs">{notification.message}</Text>
                    <NotificationDetails notification={notification} t={t} />
                    <Text className={classes.notificationTime}>{formatRelativeTime(notification.timestamp)}</Text>
                  </div>
                  <Tooltip label={t('notifications.dismiss')}>
                    <ActionIcon
                      className={classes.dismissButton}
                      variant="subtle"
                      color="gray"
                      size="xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notification.id);
                      }}
                    >
                      <IconX size={14} />
                    </ActionIcon>
                  </Tooltip>
                </div>
              ))}
            </Stack>
          )}
        </div>
      </div>
    </Drawer>
  );
};
