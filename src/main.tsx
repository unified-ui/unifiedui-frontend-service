import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { MsalProvider } from '@azure/msal-react'
import { PublicClientApplication } from '@azure/msal-browser'
import { msalConfig } from './authConfig'

// MSAL-Instanz erstellen
const msalInstance = new PublicClientApplication(msalConfig)

// Redirect-Handling nach Login
msalInstance.initialize().then(() => {
  // Handle redirect promise
  msalInstance.handleRedirectPromise().then((response) => {
    if (response) {
      console.log("Login erfolgreich:", response);
    }
  }).catch((error) => {
    console.error("Redirect-Fehler:", error);
  });
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MsalProvider instance={msalInstance}>
      <App />
    </MsalProvider>
  </StrictMode>,
)
