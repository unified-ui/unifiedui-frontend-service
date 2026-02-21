import { useState, useEffect } from 'react';

/**
 * Hook that delays showing a loading indicator to prevent flashing on fast responses.
 * The loading state will only become true after the specified delay (default 500ms).
 * When loading completes, the state immediately becomes false.
 *
 * @param isLoading - The actual loading state
 * @param delay - Delay in milliseconds before showing the loading indicator (default: 500)
 * @returns Boolean indicating whether to show the loading indicator
 */
export function useDelayedLoading(isLoading: boolean, delay = 500): boolean {
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setShowLoading(true), delay);
      return () => clearTimeout(timer);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowLoading(false);
    }
  }, [isLoading, delay]);

  return showLoading;
}
