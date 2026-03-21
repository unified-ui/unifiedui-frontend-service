import { useRef, useCallback } from 'react';
import type { ChatWidgetResponse } from '../../api/types';
import type { UnifiedUIAPIClient } from '../../api/client';

export interface WidgetCache {
  getWidget: (tenantId: string, widgetId: string) => Promise<ChatWidgetResponse>;
  clear: () => void;
}

export function useWidgetCache(apiClient: UnifiedUIAPIClient | null): WidgetCache {
  const cacheRef = useRef<Map<string, ChatWidgetResponse>>(new Map());
  const pendingRef = useRef<Map<string, Promise<ChatWidgetResponse>>>(new Map());

  const getWidget = useCallback(async (tenantId: string, widgetId: string): Promise<ChatWidgetResponse> => {
    const cached = cacheRef.current.get(widgetId);
    if (cached) return cached;

    const pending = pendingRef.current.get(widgetId);
    if (pending) return pending;

    if (!apiClient) throw new Error('API client not available');

    const promise = apiClient.getChatWidget(tenantId, widgetId).then((def) => {
      cacheRef.current.set(widgetId, def);
      pendingRef.current.delete(widgetId);
      return def;
    }).catch((err) => {
      pendingRef.current.delete(widgetId);
      throw err;
    });

    pendingRef.current.set(widgetId, promise);
    return promise;
  }, [apiClient]);

  const clear = useCallback(() => {
    cacheRef.current.clear();
    pendingRef.current.clear();
  }, []);

  return { getWidget, clear };
}
