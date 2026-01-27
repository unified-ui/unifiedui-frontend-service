import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider, ColorSchemeScript } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from './auth/authConfig';
import { AuthProvider } from './auth';
import { theme } from './theme';
import { IdentityProvider, SidebarDataProvider } from './contexts';
import App from './App.tsx';

// Mantine Core Styles
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

// Custom Styles
import './styles/variables.css';
import './index.css';

// Create MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

// Handle redirect after login
msalInstance.initialize().then(() => {
  msalInstance.handleRedirectPromise().then((response) => {
    if (response) {
      console.log('Login successful:', response);
    }
  }).catch((error) => {
    console.error('Redirect error:', error);
  });
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ColorSchemeScript defaultColorScheme="auto" />
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <Notifications position="top-right" />
      <MsalProvider instance={msalInstance}>
        <AuthProvider>
          <IdentityProvider>
            <SidebarDataProvider>
              <App />
            </SidebarDataProvider>
          </IdentityProvider>
        </AuthProvider>
      </MsalProvider>
    </MantineProvider>
  </StrictMode>,
);
