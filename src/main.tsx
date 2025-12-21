import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider, ColorSchemeScript } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from './auth/authConfig';
import { theme } from './theme';
import App from './App.tsx';

// Mantine Core Styles
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './index.css';

// MSAL-Instanz erstellen
const msalInstance = new PublicClientApplication(msalConfig);

// Redirect-Handling nach Login
msalInstance.initialize().then(() => {
  msalInstance.handleRedirectPromise().then((response) => {
    if (response) {
      console.log('Login erfolgreich:', response);
    }
  }).catch((error) => {
    console.error('Redirect-Fehler:', error);
  });
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ColorSchemeScript defaultColorScheme="auto" />
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <Notifications position="top-right" />
      <MsalProvider instance={msalInstance}>
        <App />
      </MsalProvider>
    </MantineProvider>
  </StrictMode>,
);
