import type { PopupRequest } from "@azure/msal-browser";

const MSAL_CLIENT_ID = import.meta.env.VITE_MSAL_CLIENT_ID || "20b38def-1f7e-4f0f-9e30-1b09dd1c8108";
const MSAL_AUTHORITY = import.meta.env.VITE_MSAL_AUTHORITY || "https://login.microsoftonline.com/common";

export const msalConfig = {
  auth: {
    clientId: MSAL_CLIENT_ID,
    authority: MSAL_AUTHORITY,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage" as const,
    storeAuthStateInCookie: false,
  },
  system: {
    allowNativeBroker: false,
    windowHashTimeout: 60000,
    iframeHashTimeout: 6000,
    loadFrameTimeout: 0,
  },
};

export const loginRequest: PopupRequest = {
  scopes: [
    "User.Read",
    "User.ReadBasic.All",
    "GroupMember.Read.All",
    "Group.Read.All",
  ],
};

