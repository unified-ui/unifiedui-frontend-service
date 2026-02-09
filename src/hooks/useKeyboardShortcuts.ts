import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface KeyboardShortcutHandlers {
  onCommandPalette?: () => void;
  onCreateEntity?: () => void;
  onFocusSearch?: () => void;
  onOpenSettings?: () => void;
}

const PAGE_CREATE_ACTIONS: Record<string, string> = {
  '/applications': 'applications',
  '/autonomous-agents': 'autonomous-agents',
  '/chat-widgets': 'chat-widgets',
};

export const useKeyboardShortcuts = (handlers: KeyboardShortcutHandlers): void => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const target = event.target as HTMLElement;
    const isInputFocused = target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable;

    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      handlers.onCommandPalette?.();
      return;
    }

    if ((event.metaKey || event.ctrlKey) && event.key === ',') {
      event.preventDefault();
      handlers.onOpenSettings?.();
      navigate('/tenant-settings');
      return;
    }

    if (isInputFocused) return;

    if (event.key === 'Escape') {
      (document.activeElement as HTMLElement)?.blur();
      return;
    }

    if (event.key === '/' && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      handlers.onFocusSearch?.();
      return;
    }

    if (event.key === 'n' && !event.metaKey && !event.ctrlKey && !event.altKey) {
      const currentPath = location.pathname;
      const matchedPage = Object.keys(PAGE_CREATE_ACTIONS).find(
        path => currentPath === path || currentPath.startsWith(path + '/')
      );
      if (matchedPage) {
        event.preventDefault();
        handlers.onCreateEntity?.();
      }
      return;
    }
  }, [handlers, navigate, location.pathname]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};
