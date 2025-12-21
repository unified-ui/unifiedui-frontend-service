import type { PopupRequest } from "@azure/msal-browser";

// MSAL Konfiguration
export const msalConfig = {
  auth: {
    clientId: "20b38def-1f7e-4f0f-9e30-1b09dd1c8108",
    authority: "https://login.microsoftonline.com/common",
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "localStorage" as const,
    storeAuthStateInCookie: false,
  },
  system: {
    allowNativeBroker: false,
    windowHashTimeout: 60000,
    iframeHashTimeout: 6000,
    loadFrameTimeout: 0,
  },
};

// Scopes für die Authentifizierung
export const loginRequest: PopupRequest = {
  scopes: [
    "User.Read",
    "User.ReadBasic.All",
    "GroupMember.Read.All",
    "Group.Read.All",
  ],
};
