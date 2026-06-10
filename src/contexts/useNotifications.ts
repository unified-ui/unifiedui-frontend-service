import { useContext } from 'react';

import { NotificationContext } from './NotificationContext';
import type { NotificationContextValue } from './NotificationContext';

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return ctx;
}
