import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook that tracks unsaved changes and prevents accidental navigation.
 *
 * Handles browser-level navigation (tab close, refresh via beforeunload).
 *
 * For useForm-based dialogs, prefer using form.isDirty() / form.resetDirty() directly.
 * This hook is designed for pages with useState-based form state.
 */
export function useUnsavedChanges<T>(
  currentValue: T,
  baselineValue: T | undefined,
  enabled = true
): { hasChanges: boolean; resetBaseline: (value: T) => void } {
  const baselineRef = useRef<T | undefined>(baselineValue);
  const hasChanges = enabled
    && baselineRef.current !== undefined
    && !deepEqual(currentValue, baselineRef.current);

  useEffect(() => {
    if (baselineValue !== undefined) {
      baselineRef.current = baselineValue;
    }
  }, [baselineValue]);

  const resetBaseline = useCallback((value: T) => {
    baselineRef.current = structuredClone(value);
  }, []);

  useEffect(() => {
    if (!hasChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasChanges]);

  return { hasChanges, resetBaseline };
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, i) => deepEqual(val, b[i]));
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a as Record<string, unknown>);
    const keysB = Object.keys(b as Record<string, unknown>);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((key) =>
      deepEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key]
      )
    );
  }

  return false;
}
