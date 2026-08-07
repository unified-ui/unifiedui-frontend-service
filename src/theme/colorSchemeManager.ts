/**
 * Color Scheme Manager
 *
 * Mantine's default localStorage manager subscribes to `storage` events to keep
 * the color scheme in sync across tabs. Those events only fire in *other* tabs
 * of the same origin, and with two tabs open the two managers overwrite each
 * other's value in an endless loop — the UI flickers between light and dark and
 * the localStorage entry flips with it (observed: >10.000 attribute writes in
 * 12 seconds; stack: handleStorageEvent → setColorSchemeAttribute).
 *
 * Dropping the subscription stops the ping-pong. Trade-off: switching the theme
 * in one tab no longer propagates to other open tabs until they reload — which
 * is the behaviour users expect anyway, and far better than the meltdown.
 */

import { localStorageColorSchemeManager, type MantineColorSchemeManager } from '@mantine/core';

const STORAGE_KEY = 'mantine-color-scheme-value';

const storageManager = localStorageColorSchemeManager({ key: STORAGE_KEY });

/** localStorage-backed manager without the cross-tab `storage` subscription */
export const colorSchemeManager: MantineColorSchemeManager = {
  ...storageManager,
  subscribe: () => {},
  unsubscribe: () => {},
};
