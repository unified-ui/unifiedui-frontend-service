import type { ComponentType, LazyExoticComponent } from 'react';
import type { Icon } from '@tabler/icons-react';

export const CUSTOM_EXTENSION_API_VERSION = 1 as const;

export type CustomComponent = ComponentType | LazyExoticComponent<ComponentType>;

export type CustomSidebarSection = 'primary' | 'secondary' | 'footer';

export type CustomSlotName = 'sidebar-primary-end' | 'sidebar-secondary-end' | 'sidebar-footer-start';

export interface CustomRouteDefinition {
  id: string;
  path: `/custom/${string}`;
  component: CustomComponent;
  envFlag?: `VITE_${string}`;
}

export interface CustomSidebarItemDefinition {
  id: string;
  path: `/custom/${string}`;
  labelKey: string;
  icon: Icon;
  iconFilled?: Icon;
  section?: CustomSidebarSection;
  order?: number;
  envFlag?: `VITE_${string}`;
  matchPath?: (pathname: string, search: string) => boolean;
}

export interface CustomSlotDefinition {
  id: string;
  slot: CustomSlotName;
  component: CustomComponent;
  order?: number;
  envFlag?: `VITE_${string}`;
}

export interface CustomTranslationResources {
  'en-US': Record<string, string>;
  'de-DE': Record<string, string>;
}

export interface CustomExtensionManifest {
  apiVersion: typeof CUSTOM_EXTENSION_API_VERSION;
  id: string;
  routes?: CustomRouteDefinition[];
  sidebarItems?: CustomSidebarItemDefinition[];
  slots?: CustomSlotDefinition[];
  translations?: CustomTranslationResources;
}

export const defineCustomExtension = <TManifest extends CustomExtensionManifest>(
  manifest: TManifest,
): TManifest => manifest;
