import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useUrlState(): {
  get: (key: string) => string | null;
  getAll: (key: string) => string[];
  set: (updates: Record<string, string | string[] | null | undefined>) => void;
} {
  const [searchParams, setSearchParams] = useSearchParams();

  const get = useCallback((key: string): string | null => searchParams.get(key), [searchParams]);

  const getAll = useCallback(
    (key: string): string[] => {
      const v = searchParams.get(key);
      if (!v) return [];
      return v.split(',').filter(Boolean);
    },
    [searchParams]
  );

  const set = useCallback(
    (updates: Record<string, string | string[] | null | undefined>): void => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          let changed = false;
          Object.entries(updates).forEach(([key, value]) => {
            const prevValue = next.get(key);
            if (value === null || value === undefined || value === '') {
              if (prevValue !== null) {
                next.delete(key);
                changed = true;
              }
            } else if (Array.isArray(value)) {
              if (value.length === 0) {
                if (prevValue !== null) {
                  next.delete(key);
                  changed = true;
                }
              } else {
                const joined = value.join(',');
                if (prevValue !== joined) {
                  next.set(key, joined);
                  changed = true;
                }
              }
            } else if (prevValue !== value) {
              next.set(key, value);
              changed = true;
            }
          });
          return changed ? next : prev;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  return { get, getAll, set };
}
