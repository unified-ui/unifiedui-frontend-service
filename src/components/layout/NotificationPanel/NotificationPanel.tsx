import type { FC } from 'react';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Drawer, ActionIcon, Loader, Button } from '@mantine/core';
import { IconBellOff, IconCheck, IconTrash, IconX } from '@tabler/icons-react';
import { useNotifications } from '../../../contexts';
import classes from './NotificationPanel.module.css';

const ENTITY_ROUTES: Record<string, string> = {
  application: '/applications',
  autonomous_agent: '/autonomous-agents',
  conversation: '/conversations',
  credential: '/credentials',
};

const formatTimeAgo = (dateStr: string, t: (key: string, options?: Record<string, unknown>) => string): string => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return t('justNow');
  if (diffMin < 60) return t('minutesAgoShort', { count: diffMin });
  if (diffHour < 24) return t('hoursAgoShort', { count: diffHour });
  if (diffDay < 7) return t('daysAgoShort', { count: diffDay });
  return date.toLocaleDateString();
};

export const NotificationPanel: FC = () => {
  const { t } = useTranslation('notifications');
  const navigate = useNavigate();
  const {
    notifications,
    isLoading,
    isPanelOpen,
    closePanel,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const handleClickNotification = useCallback((notificationId: string, resourceType?: string, resourceId?: string) => {
    markAsRead(notificationId);
    if (resourceType && resourceId) {
      const route = ENTITY_ROUTES[resourceType];
      if (route) {
        navigate(`${route}/${resourceId}`);
        closePanel();
      }
    }
  }, [markAsRead, navigate, closePanel]);

  const handleDelete = useCallback((e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    deleteNotification(notificationId);
  }, [deleteNotification]);

  return (
    <Drawer
      opened={isPanelOpen}
      onClose={closePanel}
      position="right"
      size="sm"
      withCloseButton={false}
      styles={{ body: { padding: 0, height: '100%', display: 'flex', flexDirection: 'column' } }}
    >
      <div className={classes.panelHeader}>
        <span className={classes.panelTitle}>{t('title')}</span>
        <div className={classes.panelActions}>
          <Button
            variant="subtle"
            size="compact-xs"
            leftSection={<IconCheck size={14} />}
            onClick={markAllAsRead}
          >
            {t('markAllRead')}
          </Button>
          <ActionIcon variant="subtle" size="sm" onClick={closePanel}>
            <IconX size={16} />
          </ActionIcon>
        </div>
      </div>

      <div className={classes.list}>
        {isLoading && (
          <div className={classes.empty}>
            <Loader size="sm" />
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <div className={classes.empty}>
            <IconBellOff size={40} className={classes.emptyIcon} />
            <span className={classes.emptyText}>{t('noNotifications')}</span>
          </div>
        )}

        {!isLoading && notifications.map(notification => (
          <div
            key={notification.id}
            className={notification.is_read ? classes.item : classes.itemUnread}
            onClick={() => handleClickNotification(
              notification.id,
              notification.resource_type,
              notification.resource_id
            )}
          >
            <div className={classes.itemContent}>
              <div className={classes.itemTitle}>{notification.title}</div>
              {notification.message && (
                <div className={classes.itemMessage}>{notification.message}</div>
              )}
            </div>
            <span className={classes.itemTime}>
              {formatTimeAgo(notification.created_at, t)}
            </span>
            <ActionIcon
              variant="subtle"
              size="xs"
              color="red"
              className={classes.itemDelete}
              onClick={(e) => handleDelete(e, notification.id)}
            >
              <IconTrash size={14} />
            </ActionIcon>
          </div>
        ))}
      </div>
    </Drawer>
  );
};
