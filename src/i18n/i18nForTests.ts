import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

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

i18n
  .use(initReactI18next)
  .init({
    resources: {
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
      },
    },
    lng: 'en-US',
    fallbackLng: 'en-US',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
