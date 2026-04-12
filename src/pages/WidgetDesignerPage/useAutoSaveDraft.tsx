import { useEffect, useState, useCallback, useMemo } from 'react';
import type { WidgetFormSchema } from './types';

const DRAFT_PREFIX = 'widget-designer-draft:';
const DRAFT_EXPIRY_DAYS = 7;

interface DraftData {
  schema: WidgetFormSchema;
  timestamp: number;
}

interface UseAutoSaveDraftResult {
  hasDraft: boolean;
  draftTimestamp: number | null;
  restoreDraft: () => WidgetFormSchema | null;
  discardDraft: () => void;
  clearDraft: () => void;
}

function getDraftKey(widgetId: string): string {
  return `${DRAFT_PREFIX}${widgetId}`;
}

function cleanExpiredDrafts(): void {
  const now = Date.now();
  const expiryMs = DRAFT_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(DRAFT_PREFIX)) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const data = JSON.parse(raw) as DraftData;
          if (now - data.timestamp > expiryMs) {
            localStorage.removeItem(key);
          }
        }
      } catch {
        localStorage.removeItem(key!);
      }
    }
  }
}

export function useAutoSaveDraft(
  widgetId: string | undefined,
  schema: WidgetFormSchema,
  savedSchema: WidgetFormSchema | undefined,
  isLoading: boolean,
): UseAutoSaveDraftResult {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    cleanExpiredDrafts();
  }, []);

  const { hasDraft, draftTimestamp } = useMemo(() => {
    if (!widgetId || isLoading || dismissed) {
      return { hasDraft: false, draftTimestamp: null };
    }
    const key = getDraftKey(widgetId);
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const data = JSON.parse(raw) as DraftData;
        return { hasDraft: true, draftTimestamp: data.timestamp };
      }
    } catch {
      localStorage.removeItem(key);
    }
    return { hasDraft: false, draftTimestamp: null };
  }, [widgetId, isLoading, dismissed]);

  useEffect(() => {
    if (!widgetId || isLoading || !savedSchema) return;

    const hasChanges = JSON.stringify(schema) !== JSON.stringify(savedSchema);
    const key = getDraftKey(widgetId);

    if (hasChanges) {
      const draft: DraftData = { schema, timestamp: Date.now() };
      localStorage.setItem(key, JSON.stringify(draft));
    }
  }, [schema, savedSchema, widgetId, isLoading]);

  const restoreDraft = useCallback((): WidgetFormSchema | null => {
    if (!widgetId) return null;
    const key = getDraftKey(widgetId);
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const data = JSON.parse(raw) as DraftData;
        setDismissed(true);
        return data.schema;
      }
    } catch {
      localStorage.removeItem(key);
    }
    return null;
  }, [widgetId]);

  const discardDraft = useCallback(() => {
    if (!widgetId) return;
    localStorage.removeItem(getDraftKey(widgetId));
    setDismissed(true);
  }, [widgetId]);

  const clearDraft = useCallback(() => {
    if (!widgetId) return;
    localStorage.removeItem(getDraftKey(widgetId));
    setDismissed(true);
  }, [widgetId]);

  return { hasDraft, draftTimestamp, restoreDraft, discardDraft, clearDraft };
}
