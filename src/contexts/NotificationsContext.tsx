import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode, FC } from 'react';
import type { NotificationResponse, NotificationQueryParams } from '../api/types';
import { useIdentity } from './IdentityContext';

const POLL_INTERVAL_MS = 60_000;

interface NotificationsContextType {
  notifications: NotificationResponse[];
  unreadCount: number;
  isLoading: boolean;
  isPanelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

interface NotificationsProviderProps {
  children: ReactNode;
}

export const NotificationsProvider: FC<NotificationsProviderProps> = ({ children }) => {
  const { apiClient, user, selectedTenant } = useIdentity();
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!apiClient || !selectedTenant) return;
    try {
      const response = await apiClient.getUnreadNotificationCount(selectedTenant.id);
      setUnreadCount(response.unread_count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, [apiClient, selectedTenant]);

  const fetchNotifications = useCallback(async (params?: NotificationQueryParams) => {
    if (!apiClient || !selectedTenant) return;
    setIsLoading(true);
    try {
      const response = await apiClient.listNotifications(selectedTenant.id, params);
      setNotifications(response.notifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, selectedTenant]);

  const refreshNotifications = useCallback(async () => {
    await Promise.all([fetchNotifications(), fetchUnreadCount()]);
  }, [fetchNotifications, fetchUnreadCount]);

  useEffect(() => {
    if (!apiClient || !user || !selectedTenant) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchUnreadCount();

    pollIntervalRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL_MS);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [apiClient, user, selectedTenant, fetchUnreadCount]);

  const openPanel = useCallback(() => {
    setIsPanelOpen(true);
    fetchNotifications();
  }, [fetchNotifications]);

  const closePanel = useCallback(() => {
    setIsPanelOpen(false);
  }, []);

  const togglePanel = useCallback(() => {
    if (isPanelOpen) {
      closePanel();
    } else {
      openPanel();
    }
  }, [isPanelOpen, openPanel, closePanel]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!apiClient || !selectedTenant) return;

    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await apiClient.markNotificationAsRead(selectedTenant.id, notificationId);
    } catch (error) {
      await refreshNotifications();
      console.error('Failed to mark notification as read:', error);
    }
  }, [apiClient, selectedTenant, refreshNotifications]);

  const markAllAsRead = useCallback(async () => {
    if (!apiClient || !selectedTenant) return;

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      await apiClient.markAllNotificationsAsRead(selectedTenant.id);
    } catch (error) {
      await refreshNotifications();
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [apiClient, selectedTenant, refreshNotifications]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!apiClient || !selectedTenant) return;

    const notification = notifications.find(n => n.id === notificationId);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    if (notification && !notification.is_read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    try {
      await apiClient.deleteNotification(selectedTenant.id, notificationId);
    } catch (error) {
      await refreshNotifications();
      console.error('Failed to delete notification:', error);
    }
  }, [apiClient, selectedTenant, notifications, refreshNotifications]);

  const value: NotificationsContextType = {
    notifications,
    unreadCount,
    isLoading,
    isPanelOpen,
    openPanel,
    closePanel,
    togglePanel,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = (): NotificationsContextType => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};
