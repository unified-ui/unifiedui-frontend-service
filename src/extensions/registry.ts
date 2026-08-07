import type { i18n as I18n } from 'i18next';
import manifest from 'virtual:custom-extension';
import type {
  CustomRouteDefinition,
  CustomSidebarItemDefinition,
  CustomSidebarSection,
  CustomSlotDefinition,
  CustomSlotName,
} from './types';
import { validateCustomExtensionManifest } from './validateManifest';

const isFeatureEnabled = (envFlag?: `VITE_${string}`): boolean => {
  if (!envFlag) return true;
  const value = import.meta.env[envFlag];
  return value !== 'false' && value !== '0';
};

validateCustomExtensionManifest(manifest);

export const customExtension = manifest;
export const customTranslationNamespace = `custom-${manifest.id}`;

export const initializeCustomExtension = (i18n: I18n): void => {
  if (!manifest.translations) return;
  for (const locale of ['en-US', 'de-DE'] as const) {
    i18n.addResourceBundle(
      locale,
      customTranslationNamespace,
      manifest.translations[locale],
      true,
      true,
    );
  }
};

export const getCustomRoutes = (): CustomRouteDefinition[] =>
  (manifest.routes ?? []).filter(route => isFeatureEnabled(route.envFlag));

export const getCustomSidebarItems = (
  section: CustomSidebarSection,
): CustomSidebarItemDefinition[] =>
  (manifest.sidebarItems ?? [])
    .filter(item => (item.section ?? 'primary') === section && isFeatureEnabled(item.envFlag))
    .sort((left, right) => (left.order ?? 0) - (right.order ?? 0));

export const getCustomSlots = (slot: CustomSlotName): CustomSlotDefinition[] =>
  (manifest.slots ?? [])
    .filter(item => item.slot === slot && isFeatureEnabled(item.envFlag))
    .sort((left, right) => (left.order ?? 0) - (right.order ?? 0));
