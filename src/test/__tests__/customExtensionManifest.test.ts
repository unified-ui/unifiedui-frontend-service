import { describe, expect, it } from 'vitest';
import { IconChecklist } from '@tabler/icons-react';
import {
  CUSTOM_EXTENSION_API_VERSION,
  validateCustomExtensionManifest,
  type CustomExtensionManifest,
} from '../../extensions';

const createManifest = (
  overrides: Partial<CustomExtensionManifest> = {},
): CustomExtensionManifest => ({
  apiVersion: CUSTOM_EXTENSION_API_VERSION,
  id: 'test-extension',
  ...overrides,
});

describe('validateCustomExtensionManifest', () => {
  it('accepts a valid additive extension', () => {
    expect(() => validateCustomExtensionManifest(createManifest({
      routes: [{ id: 'route', path: '/custom/test', component: () => null }],
      sidebarItems: [{ id: 'sidebar', path: '/custom/test', labelKey: 'test', icon: IconChecklist }],
    }))).not.toThrow();
  });

  it('rejects duplicate contribution ids', () => {
    expect(() => validateCustomExtensionManifest(createManifest({
      routes: [{ id: 'duplicate', path: '/custom/test', component: () => null }],
      sidebarItems: [{ id: 'duplicate', path: '/custom/test', labelKey: 'test', icon: IconChecklist }],
    }))).toThrow('Duplicate custom extension id: duplicate');
  });

  it('rejects routes outside the custom namespace', () => {
    const manifest = createManifest();
    Object.assign(manifest, {
      routes: [{ id: 'route', path: '/admin', component: () => null }],
    });
    expect(() => validateCustomExtensionManifest(manifest)).toThrow(
      'Custom route must start with /custom/: /admin',
    );
  });
});
