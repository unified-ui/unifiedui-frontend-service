/**
 * Default Theme Preset (Blue)
 *
 * The standard unified-ui theme with Material Blue as primary color.
 */

import type { ThemePreset } from './types';

export const defaultPreset: ThemePreset = {
  name: 'default',

  primary: [
    '#e3f2fd', // 0 - Very light
    '#bbdefb', // 1 - Light
    '#90caf9', // 2
    '#64b5f6', // 3
    '#42a5f5', // 4 - Dark Mode Buttons
    '#2196f3', // 5 - Standard
    '#1e88e5', // 6 - Light Mode Buttons
    '#1976d2', // 7 - Hover
    '#1565c0', // 8
    '#0d47a1', // 9 - Very dark
  ],

  secondary: [
    '#f3e5f5', // 0
    '#e1bee7', // 1
    '#ce93d8', // 2
    '#ba68c8', // 3
    '#ab47bc', // 4
    '#9c27b0', // 5
    '#8e24aa', // 6
    '#7b1fa2', // 7
    '#6a1b9a', // 8
    '#4a148c', // 9
  ],

  login: {
    bgLeft: 'linear-gradient(160deg, #0a1628 0%, #0f2035 50%, #0a1628 100%)',
    bgRight: 'linear-gradient(160deg, #0f2035 0%, #162a4a 50%, #0f2035 100%)',
  },
};
