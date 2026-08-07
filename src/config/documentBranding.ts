/**
 * Document Branding
 *
 * index.html carries the default title and favicon as static markup. This
 * module applies the active branding to the document itself, so VITE_APP_TITLE
 * and the branding's faviconUrl reach the browser tab instead of only the
 * in-app header.
 */

import { activeBranding, APP_TITLE } from './branding.config';

function applyFavicon(faviconUrl: string): void {
  const existing = document.querySelector<HTMLLinkElement>('link[rel="icon"]');

  if (existing) {
    existing.href = faviconUrl;
    return;
  }

  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/svg+xml';
  link.href = faviconUrl;
  document.head.appendChild(link);
}

/**
 * Applies title and favicon from the active branding.
 * Call once before the app renders.
 */
export function applyDocumentBranding(): void {
  document.title = APP_TITLE;

  if (activeBranding.faviconUrl) {
    applyFavicon(activeBranding.faviconUrl);
  }
}
