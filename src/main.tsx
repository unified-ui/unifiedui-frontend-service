import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider, ColorSchemeScript } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { I18nextProvider } from 'react-i18next';
import { msalConfig } from './auth/authConfig';
import { AuthProvider } from './auth';
import { theme } from './theme';
import { IdentityProvider, SidebarDataProvider, AICapabilitiesProvider, FavoritesProvider, RecentVisitsProvider } from './contexts';
import i18n from './i18n';
import App from './App.tsx';

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

import './styles/variables.css';
import './index.css';

const msalInstance = new PublicClientApplication(msalConfig);

msalInstance.initialize().then(() => {
  msalInstance.handleRedirectPromise().catch((error) => {
    console.error('Redirect error:', error);
  });
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ColorSchemeScript defaultColorScheme="auto" />
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <Notifications position="top-right" />
      <I18nextProvider i18n={i18n}>
        <MsalProvider instance={msalInstance}>
          <AuthProvider>
            <IdentityProvider>
              <AICapabilitiesProvider>
                <FavoritesProvider>
                    <RecentVisitsProvider>
                      <SidebarDataProvider>
                        <App />
                      </SidebarDataProvider>
                    </RecentVisitsProvider>
                </FavoritesProvider>
              </AICapabilitiesProvider>
            </IdentityProvider>
          </AuthProvider>
        </MsalProvider>
      </I18nextProvider>
    </MantineProvider>
  </StrictMode>,
);
