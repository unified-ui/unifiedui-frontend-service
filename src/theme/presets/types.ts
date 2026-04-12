/**
 * Theme Preset Type Definitions
 *
 * Defines the structure for theme presets that can be selected via VITE_THEME_PRESET.
 */

/** Mantine-compatible 10-shade color tuple */
export type ColorShades = readonly [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];

/** Theme preset configuration */
export interface ThemePreset {
  /** Unique preset identifier */
  name: string;

  /** Primary color shades (10 shades, Material Design style) */
  primary: ColorShades;

  /** Secondary/accent color shades (optional) */
  secondary?: ColorShades;

  /** Login page styling */
  login: {
    /** Background gradient/color for left panel */
    bgLeft: string;
    /** Background gradient/color for right panel */
    bgRight: string;
  };
}

/** Available theme preset names */
export type ThemePresetName = 'default' | 'ocean' | 'forest' | 'sunset' | 'purple';
