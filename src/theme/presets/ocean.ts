/**
 * Ocean Theme Preset (Teal/Cyan)
 *
 * A calming teal-based theme inspired by ocean colors.
 */

import type { ThemePreset } from './types';

export const oceanPreset: ThemePreset = {
  name: 'ocean',

  primary: [
    '#e0f7fa', // 0 - Very light
    '#b2ebf2', // 1
    '#80deea', // 2
    '#4dd0e1', // 3
    '#26c6da', // 4 - Dark Mode
    '#00bcd4', // 5 - Standard
    '#00acc1', // 6 - Light Mode
    '#0097a7', // 7 - Hover
    '#00838f', // 8
    '#006064', // 9 - Very dark
  ],

  secondary: [
    '#e8f5e9', // 0
    '#c8e6c9', // 1
    '#a5d6a7', // 2
    '#81c784', // 3
    '#66bb6a', // 4
    '#4caf50', // 5
    '#43a047', // 6
    '#388e3c', // 7
    '#2e7d32', // 8
    '#1b5e20', // 9
  ],

  login: {
    bgLeft: 'linear-gradient(160deg, #0a2025 0%, #0f3035 50%, #0a2025 100%)',
    bgRight: 'linear-gradient(160deg, #0f3035 0%, #164545 50%, #0f3035 100%)',
  },
};
