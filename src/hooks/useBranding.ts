import { activeBranding } from '../config';
import type { BrandingConfig } from '../config';

export function useBranding(): BrandingConfig {
  return activeBranding;
}
