import { useEffect } from 'react';

/**
 * Hook that registers a beforeunload handler when the form has unsaved changes.
 *
 * Designed for Mantine useForm-based components (dialogs and pages).
 * Pass form.isDirty() as the isDirty parameter.
 */
export function useFormDirtyGuard(isDirty: boolean): void {
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);
}
