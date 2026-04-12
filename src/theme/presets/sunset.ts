/**
 * Sunset Theme Preset (Orange/Warm)
 *
 * A warm, energetic theme with sunset-inspired orange tones.
 */

import type { ThemePreset } from './types';

export const sunsetPreset: ThemePreset = {
  name: 'sunset',

  primary: [
    '#fff3e0', // 0 - Very light
    '#ffe0b2', // 1
    '#ffcc80', // 2
    '#ffb74d', // 3
    '#ffa726', // 4 - Dark Mode
    '#ff9800', // 5 - Standard
    '#fb8c00', // 6 - Light Mode
    '#f57c00', // 7 - Hover
    '#ef6c00', // 8
    '#e65100', // 9 - Very dark
  ],

  secondary: [
    '#fce4ec', // 0
    '#f8bbd0', // 1
    '#f48fb1', // 2
    '#f06292', // 3
    '#ec407a', // 4
    '#e91e63', // 5
    '#d81b60', // 6
    '#c2185b', // 7
    '#ad1457', // 8
    '#880e4f', // 9
  ],

  login: {
    bgLeft: 'linear-gradient(160deg, #2a1a0a 0%, #3d2815 50%, #2a1a0a 100%)',
    bgRight: 'linear-gradient(160deg, #3d2815 0%, #4d3820 50%, #3d2815 100%)',
  },
};
