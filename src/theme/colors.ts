/**
 * Theme Color Definitions
 *
 * Primary and Secondary colors are derived from the active theme preset.
 * Other semantic colors (success, warning, error, info, gray) are static.
 */

import { activePreset } from './presets';

export const colors = {
  // Primary Brand Color (from active preset)
  primary: activePreset.primary,

  // Secondary Brand Color (from active preset, fallback to Material Purple)
  secondary: activePreset.secondary ?? [
    '#f3e5f5',
    '#e1bee7',
    '#ce93d8',
    '#ba68c8',
    '#ab47bc',
    '#9c27b0',
    '#8e24aa',
    '#7b1fa2',
    '#6a1b9a',
    '#4a148c',
  ],

  // Success (Material Green)
  success: [
    '#e8f5e9',   // 0
    '#c8e6c9',   // 1
    '#a5d6a7',   // 2
    '#81c784',   // 3
    '#66bb6a',   // 4 - Dark Mode
    '#4caf50',   // 5 - Standard
    '#43a047',   // 6 - Light Mode
    '#388e3c',   // 7 - Hover
    '#2e7d32',   // 8
    '#1b5e20',   // 9
  ] as const,

  // Warning (Material Orange)
  warning: [
    '#fff3e0',   // 0
    '#ffe0b2',   // 1
    '#ffcc80',   // 2
    '#ffb74d',   // 3
    '#ffa726',   // 4 - Dark Mode
    '#ff9800',   // 5 - Standard
    '#fb8c00',   // 6 - Light Mode
    '#f57c00',   // 7 - Hover
    '#ef6c00',   // 8
    '#e65100',   // 9
  ] as const,

  // Error/Danger (Material Red)
  error: [
    '#ffebee',   // 0
    '#ffcdd2',   // 1
    '#ef9a9a',   // 2
    '#e57373',   // 3
    '#ef5350',   // 4 - Dark Mode
    '#f44336',   // 5 - Standard
    '#e53935',   // 6 - Light Mode
    '#d32f2f',   // 7 - Hover
    '#c62828',   // 8
    '#b71c1c',   // 9
  ] as const,

  // Info (Material Light Blue)
  info: [
    '#e1f5fe',   // 0
    '#b3e5fc',   // 1
    '#81d4fa',   // 2
    '#4fc3f7',   // 3
    '#29b6f6',   // 4 - Dark Mode
    '#03a9f4',   // 5 - Standard
    '#039be5',   // 6 - Light Mode
    '#0288d1',   // 7 - Hover
    '#0277bd',   // 8
    '#01579b',   // 9
  ] as const,

  // Gray Scale (Neutral Colors)
  gray: [
    '#ffffff',   // 0 - Pure White
    '#fafafa',   // 1 - App Background (Light)
    '#f5f5f5',   // 2 - Card Background Alternative
    '#eeeeee',   // 3 - Borders, Dividers
    '#e0e0e0',   // 4 - Borders
    '#bdbdbd',   // 5 - Disabled Text
    '#9e9e9e',   // 6 - Disabled Elements
    '#757575',   // 7 - Secondary Text (Light Mode)
    '#616161',   // 8 - Dark Backgrounds
    '#424242',   // 9 - Card Background (Dark)
    '#212121',   // 10 - Primary Text (Light), App BG (Dark) - EXTRA INDEX!
  ] as const,
};

// Semantic Color Mappings für einfacheren Zugriff
export const semanticColors = {
  light: {
    primary: colors.primary[6],
    secondary: colors.secondary[6],
    success: colors.success[6],
    warning: colors.warning[6],
    error: colors.error[6],
    info: colors.info[6],
  },
  dark: {
    primary: colors.primary[4],
    secondary: colors.secondary[4],
    success: colors.success[4],
    warning: colors.warning[4],
    error: colors.error[4],
    info: colors.info[4],
  },
};
