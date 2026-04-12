/**
 * Purple Theme Preset
 *
 * A sophisticated purple theme for a modern, creative feel.
 */

import type { ThemePreset } from './types';

export const purplePreset: ThemePreset = {
  name: 'purple',

  primary: [
    '#f3e5f5', // 0 - Very light
    '#e1bee7', // 1
    '#ce93d8', // 2
    '#ba68c8', // 3
    '#ab47bc', // 4 - Dark Mode
    '#9c27b0', // 5 - Standard
    '#8e24aa', // 6 - Light Mode
    '#7b1fa2', // 7 - Hover
    '#6a1b9a', // 8
    '#4a148c', // 9 - Very dark
  ],

  secondary: [
    '#e3f2fd', // 0
    '#bbdefb', // 1
    '#90caf9', // 2
    '#64b5f6', // 3
    '#42a5f5', // 4
    '#2196f3', // 5
    '#1e88e5', // 6
    '#1976d2', // 7
    '#1565c0', // 8
    '#0d47a1', // 9
  ],

  login: {
    bgLeft: 'linear-gradient(160deg, #1a0a28 0%, #2d1540 50%, #1a0a28 100%)',
    bgRight: 'linear-gradient(160deg, #2d1540 0%, #3d2055 50%, #2d1540 100%)',
  },
};
