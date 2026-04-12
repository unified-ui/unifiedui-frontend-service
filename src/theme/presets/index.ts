/**
 * Theme Preset Registry
 *
 * Exports all presets and provides the active preset based on VITE_THEME_PRESET env var.
 */

import { defaultPreset } from './default';
import { forestPreset } from './forest';
import { oceanPreset } from './ocean';
import { purplePreset } from './purple';
import { sunsetPreset } from './sunset';
import type { ThemePreset, ThemePresetName } from './types';

export type { ColorShades, ThemePreset, ThemePresetName } from './types';

/** All available theme presets */
export const presets: Record<ThemePresetName, ThemePreset> = {
  default: defaultPreset,
  ocean: oceanPreset,
  forest: forestPreset,
  sunset: sunsetPreset,
  purple: purplePreset,
};

/** Get the configured theme preset name from env vars */
function getPresetName(): ThemePresetName {
  const envValue = import.meta.env.VITE_THEME_PRESET as string | undefined;
  if (envValue && envValue in presets) {
    return envValue as ThemePresetName;
  }
  return 'default';
}

/** The active theme preset based on VITE_THEME_PRESET */
export const activePreset: ThemePreset = presets[getPresetName()];
