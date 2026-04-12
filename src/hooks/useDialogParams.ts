import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

interface DialogState {
  dialog: string | null;
  selectedId: string | null;
  dialogTab: string | null;
}

interface OpenDialogOptions {
  selectedId?: string;
  dialogTab?: string;
}

interface UseDialogParamsReturn extends DialogState {
  openDialog: (name: string, options?: OpenDialogOptions) => void;
  closeDialog: () => void;
  setDialogTab: (tab: string) => void;
}

export function useDialogParams(): UseDialogParamsReturn {
  const [searchParams, setSearchParams] = useSearchParams();

  const dialog = searchParams.get('dialog');
  const selectedId = searchParams.get('selectedId');
  const dialogTab = searchParams.get('dialogTab');

  const openDialog = useCallback((name: string, options?: OpenDialogOptions) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('dialog', name);
      if (options?.selectedId) {
        next.set('selectedId', options.selectedId);
      } else {
        next.delete('selectedId');
      }
      if (options?.dialogTab) {
        next.set('dialogTab', options.dialogTab);
      } else {
        next.delete('dialogTab');
      }
      return next;
    });
  }, [setSearchParams]);

  const closeDialog = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('dialog');
      next.delete('selectedId');
      next.delete('dialogTab');
      return next;
    });
  }, [setSearchParams]);

  const setDialogTab = useCallback((tab: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('dialogTab', tab);
      return next;
    });
  }, [setSearchParams]);

  return { dialog, selectedId, dialogTab, openDialog, closeDialog, setDialogTab };
}
