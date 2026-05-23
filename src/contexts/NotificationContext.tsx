import type { FC, ReactNode } from 'react';
import { createContext, useState, useCallback, useMemo } from 'react';

const MAX_NOTIFICATIONS = 100;
const STORAGE_KEY = 'unifiedui_notifications';

export interface NotificationEntry {
  id: string;
  title: string;
  message: string;
  color: string;
  timestamp: number;
  read: boolean;
}

export interface NotificationContextValue {
  notifications: NotificationEntry[];
  unreadCount: number;
  addNotification: (entry: Omit<NotificationEntry, 'id' | 'timestamp' | 'read'>) => void;
  markAllAsRead: () => void;
  markAsRead: (id: string) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);
export { NotificationContext };

function loadNotifications(): NotificationEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as NotificationEntry[];
  } catch {
    return [];
  }
}

function saveNotifications(notifications: NotificationEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch {
    // Storage full or unavailable
  }
}

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationEntry[]>(() => loadNotifications());

  const persist = useCallback(
    (updated: NotificationEntry[]) => {
      saveNotifications(updated);
    },
    [],
  );

  const addNotification = useCallback(
    (entry: Omit<NotificationEntry, 'id' | 'timestamp' | 'read'>) => {
      setNotifications((prev) => {
        const newEntry: NotificationEntry = {
          ...entry,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          read: false,
        };
        const updated = [newEntry, ...prev].slice(0, MAX_NOTIFICATIONS);
        persist(updated);
        return updated;
      });
    },
    [persist],
  );

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      persist(updated);
      return updated;
    });
  }, [persist]);

  const markAsRead = useCallback(
    (id: string) => {
      setNotifications((prev) => {
        const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
        persist(updated);
        return updated;
      });
    },
    [persist],
  );

  const removeNotification = useCallback(
    (id: string) => {
      setNotifications((prev) => {
        const updated = prev.filter((n) => n.id !== id);
        persist(updated);
        return updated;
      });
    },
    [persist],
  );

  const clearAll = useCallback(() => {
    setNotifications([]);
    persist([]);
  }, [persist]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount,
      addNotification,
      markAllAsRead,
      markAsRead,
      removeNotification,
      clearAll,
    }),
    [notifications, unreadCount, addNotification, markAllAsRead, markAsRead, removeNotification, clearAll],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
