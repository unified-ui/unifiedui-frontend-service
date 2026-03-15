import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import commonEN from './locales/en-US/common.json';
import dashboardEN from './locales/en-US/dashboard.json';
import loginEN from './locales/en-US/login.json';
import headerEN from './locales/en-US/header.json';
import conversationsEN from './locales/en-US/conversations.json';
import settingsEN from './locales/en-US/settings.json';
import tracingEN from './locales/en-US/tracing.json';
import credentialsEN from './locales/en-US/credentials.json';
import tokenEN from './locales/en-US/token.json';
import widgetDesignerEN from './locales/en-US/widgetDesigner.json';
import reactAgentEN from './locales/en-US/reactAgent.json';
import sidebarEN from './locales/en-US/sidebar.json';
import widgetsEN from './locales/en-US/widgets.json';

const resources = {
  'en-US': {
    common: commonEN,
    dashboard: dashboardEN,
    login: loginEN,
    header: headerEN,
    conversations: conversationsEN,
    settings: settingsEN,
    tracing: tracingEN,
    credentials: credentialsEN,
    token: tokenEN,
    widgetDesigner: widgetDesignerEN,
    reactAgent: reactAgentEN,
    sidebar: sidebarEN,
    widgets: widgetsEN,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en-US',
    defaultNS: 'common',
    ns: ['common', 'dashboard', 'login', 'header', 'conversations', 'settings', 'tracing', 'credentials', 'token', 'widgetDesigner', 'reactAgent', 'sidebar', 'widgets'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['path', 'localStorage', 'navigator'],
      lookupFromPathIndex: 0,
      caches: ['localStorage'],
    },
  });

export default i18n;
