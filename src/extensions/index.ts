export {
  CUSTOM_EXTENSION_API_VERSION,
  defineCustomExtension,
} from './types';
export type {
  CustomComponent,
  CustomExtensionManifest,
  CustomRouteDefinition,
  CustomSidebarItemDefinition,
  CustomSidebarSection,
  CustomSlotDefinition,
  CustomSlotName,
  CustomTranslationResources,
} from './types';
export { MainLayout } from '../components/layout/MainLayout';
export { UnifiedDialog } from '../components/common/UnifiedDialog';
export {
  CustomServiceClient,
  CustomServiceError,
  createCustomServiceClient,
} from './client';
export type {
  CustomServiceClientConfig,
  CustomServiceMethod,
  CustomServiceRequestOptions,
} from './client';
export { useCustomExtensionContext, useCustomServiceClient } from './hooks';
export type { CustomExtensionContextValue, CustomServiceHookConfig } from './hooks';
export { validateCustomExtensionManifest } from './validateManifest';
