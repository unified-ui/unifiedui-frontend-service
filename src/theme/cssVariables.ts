/**
 * Theme CSS Custom Properties
 *
 * styles/variables.css ships the default palette as a static fallback, and the
 * CSS modules across the app consume those variables. This module writes the
 * *active* preset's shades onto the document root so that VITE_THEME_PRESET
 * reaches plain CSS too, not just the Mantine components.
 *
 * Only the raw palette scales are written. Semantic variables (--text-link,
 * --border-focus, --gradient-accent, …) already reference them and therefore
 * follow automatically — and they stay in the stylesheet, so the light/dark
 * rules keep working.
 */

import { colors } from './colors';

/** CSS variable step names, in the order of a Mantine 10-shade tuple */
const SHADE_STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'] as const;

/** Converts '#003893' to '0, 56, 147' for use in rgba(var(--…-rgb), <alpha>) */
function hexToRgbTriple(hex: string): string | null {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;

  const value = parseInt(match[1], 16);
  return `${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}`;
}

function applyScale(root: HTMLElement, name: string, shades: readonly string[]): void {
  SHADE_STEPS.forEach((step, index) => {
    const shade = shades[index];
    if (shade) {
      root.style.setProperty(`--color-${name}-${step}`, shade);
    }
  });
}

/**
 * Writes the active preset's primary and secondary palettes to :root.
 * Call once before the app renders.
 */
export function applyThemeCssVariables(): void {
  const root = document.documentElement;

  applyScale(root, 'primary', colors.primary);
  applyScale(root, 'secondary', colors.secondary);

  const primaryRgb = hexToRgbTriple(colors.primary[5]);
  if (primaryRgb) {
    root.style.setProperty('--color-primary-rgb', primaryRgb);
  }
}
