/**
 * Forest Theme Preset (Green)
 *
 * A nature-inspired green theme for a fresh, organic feel.
 */

import type { ThemePreset } from './types';

export const forestPreset: ThemePreset = {
  name: 'forest',

  primary: [
    '#e8f5e9', // 0 - Very light
    '#c8e6c9', // 1
    '#a5d6a7', // 2
    '#81c784', // 3
    '#66bb6a', // 4 - Dark Mode
    '#4caf50', // 5 - Standard
    '#43a047', // 6 - Light Mode
    '#388e3c', // 7 - Hover
    '#2e7d32', // 8
    '#1b5e20', // 9 - Very dark
  ],

  secondary: [
    '#fff8e1', // 0
    '#ffecb3', // 1
    '#ffe082', // 2
    '#ffd54f', // 3
    '#ffca28', // 4
    '#ffc107', // 5
    '#ffb300', // 6
    '#ffa000', // 7
    '#ff8f00', // 8
    '#ff6f00', // 9
  ],

  login: {
    bgLeft: 'linear-gradient(160deg, #1a2f1a 0%, #2d4a2d 50%, #1a2f1a 100%)',
    bgRight: 'linear-gradient(160deg, #2d4a2d 0%, #3d5a3d 50%, #2d4a2d 100%)',
  },
};
