import type { PopupRequest } from "@azure/msal-browser";

// MSAL Konfiguration
export const msalConfig = {
  auth: {
    clientId: "20b38def-1f7e-4f0f-9e30-1b09dd1c8108", // Ersetze mit deiner Azure AD App Client ID
    authority: "https://login.microsoftonline.com/common", // "common" für Multi-Tenant oder deine Tenant ID
    redirectUri: window.location.origin, // Standardmäßig die aktuelle URL
  },
  cache: {
    cacheLocation: "localStorage" as const, // oder "sessionStorage"
    storeAuthStateInCookie: false,
  },
  system: {
    allowNativeBroker: false, // Deaktiviert native broker
    windowHashTimeout: 60000,
    iframeHashTimeout: 6000,
    loadFrameTimeout: 0,
  },
};

// Scopes für die Authentifizierung
export const loginRequest: PopupRequest = {
  scopes: [
    "User.Read",              // Benutzerprofil lesen
    "GroupMember.Read.All",   // Gruppenmitgliedschaften des Benutzers lesen
    "Group.Read.All",         // Alle Gruppen in der Organisation lesen
  ],
};
