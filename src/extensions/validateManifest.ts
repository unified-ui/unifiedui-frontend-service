import { CUSTOM_EXTENSION_API_VERSION } from './types';
import type { CustomExtensionManifest } from './types';

const extensionIdPattern = /^[a-z][a-z0-9-]*$/;

const assertUnique = (values: string[], label: string): void => {
  const duplicate = values.find((value, index) => values.indexOf(value) !== index);
  if (duplicate) throw new Error(`Duplicate custom extension ${label}: ${duplicate}`);
};

export const validateCustomExtensionManifest = (
  manifest: CustomExtensionManifest,
): void => {
  if (manifest.apiVersion !== CUSTOM_EXTENSION_API_VERSION) {
    throw new Error(`Unsupported custom extension API version: ${manifest.apiVersion}`);
  }
  if (!extensionIdPattern.test(manifest.id)) {
    throw new Error(`Invalid custom extension id: ${manifest.id}`);
  }

  const routes = manifest.routes ?? [];
  const sidebarItems = manifest.sidebarItems ?? [];
  const slots = manifest.slots ?? [];
  assertUnique([...routes, ...sidebarItems, ...slots].map(item => item.id), 'id');
  assertUnique(routes.map(route => route.path), 'route path');

  for (const route of routes) {
    if (!route.path.startsWith('/custom/')) {
      throw new Error(`Custom route must start with /custom/: ${route.path}`);
    }
  }
  for (const item of sidebarItems) {
    if (!item.path.startsWith('/custom/')) {
      throw new Error(`Custom sidebar path must start with /custom/: ${item.path}`);
    }
  }
};
