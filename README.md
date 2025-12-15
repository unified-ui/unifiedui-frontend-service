# Microsoft Login React App

Eine React 19 TypeScript Anwendung mit Microsoft Authentication (Azure AD) Integration.

## Features

- ✅ Microsoft/Azure AD Login mit Popup-Flow
- ✅ Benutzerprofilkarte mit Email, Name und ID
- ✅ Access Token mit Kopierfunktion
- ✅ Moderne UI mit Gradient-Hintergrund
- ✅ Vollständige TypeScript-Unterstützung

## Voraussetzungen

- Node.js (Version 18 oder höher)
- Ein Microsoft Azure Account
- Eine registrierte Azure AD Anwendung

## Azure AD App Registrierung

### 1. App in Azure AD registrieren

1. Gehe zum [Azure Portal](https://portal.azure.com)
2. Navigiere zu **Azure Active Directory** → **App registrations** → **New registration**
3. Gib deiner App einen Namen (z.B. "Microsoft Login App")
4. Wähle den unterstützten Kontotyp:
   - **Accounts in any organizational directory and personal Microsoft accounts** (für Multi-Tenant)
   - Oder wähle eine spezifischere Option
5. Bei **Redirect URI**: Wähle **Single-page application (SPA)** und gib `http://localhost:5173` ein
6. Klicke auf **Register**

### 2. Client ID kopieren

Nach der Registrierung:
1. Gehe zur **Overview**-Seite deiner App
2. Kopiere die **Application (client) ID**
3. Füge diese in `src/authConfig.ts` bei `clientId` ein

### 3. API-Berechtigungen konfigurieren (optional)

Die Berechtigung `User.Read` ist standardmäßig vorhanden. Falls nicht:
1. Gehe zu **API permissions**
2. Klicke auf **Add a permission**
3. Wähle **Microsoft Graph** → **Delegated permissions**
4. Suche und wähle **User.Read**
5. Klicke auf **Add permissions**

### 4. Konfiguration anpassen

Öffne `src/authConfig.ts` und passe die Konfiguration an:

```typescript
export const msalConfig: Configuration = {
  auth: {
    clientId: "DEINE_CLIENT_ID_HIER", // ← Hier deine Client ID einfügen
    authority: "https://login.microsoftonline.com/common", 
    // Für Single-Tenant: "https://login.microsoftonline.com/{tenant-id}"
    redirectUri: window.location.origin,
  },
  // ...
};
```

## Installation und Start

### Dependencies installieren
```bash
npm install
```

### Entwicklungsserver starten
```bash
npm run dev
```

Die App läuft nun auf `http://localhost:5173`

## Verwendung

1. Öffne die App im Browser
2. Klicke auf **"Einloggen mit Microsoft"**
3. Ein Popup-Fenster öffnet sich zur Microsoft-Authentifizierung
4. Melde dich mit deinem Microsoft-Konto an
5. Nach erfolgreichem Login wird deine Profilkarte angezeigt mit:
   - Name
   - E-Mail-Adresse
   - Benutzer-ID
   - Access Token (mit Kopierfunktion)

## Projektstruktur

```
src/
├── components/
│   ├── LoginButton.tsx       # Login-Button Komponente
│   ├── LoginButton.css       # Login-Button Styling
│   ├── ProfileCard.tsx       # Profilkarten Komponente
│   └── ProfileCard.css       # Profilkarten Styling
├── authConfig.ts             # MSAL Konfiguration
├── App.tsx                   # Hauptkomponente
├── App.css                   # App Styling
├── main.tsx                  # App Entry Point mit MSAL Provider
└── index.css                 # Globale Styles
```

## Technologie-Stack

- **React 19** - UI Framework
- **TypeScript** - Typsicherheit
- **Vite** - Build Tool
- **@azure/msal-browser** - Microsoft Authentication Library
- **@azure/msal-react** - React Bindings für MSAL

## Wichtige Hinweise

- Die App verwendet den **Popup-Flow** für die Authentifizierung
- Der Access Token wird im LocalStorage gespeichert
- Bei Problemen mit Popups in deinem Browser prüfe die Popup-Blocker-Einstellungen
- Für Produktionsumgebungen: Redirect URI in Azure AD entsprechend anpassen

## Troubleshooting

### "AADSTS700016: Application not found"
- Überprüfe, ob die Client ID in `authConfig.ts` korrekt ist
- Stelle sicher, dass die App in Azure AD registriert ist

### Popup wird blockiert
- Erlaube Popups für `localhost:5173` in deinem Browser
- Alternativ: Implementiere den Redirect-Flow statt Popup

### Token kann nicht abgerufen werden
- Überprüfe die API-Berechtigungen in Azure AD
- Stelle sicher, dass `User.Read` erlaubt ist

## Weiterführende Ressourcen

- [MSAL.js Dokumentation](https://github.com/AzureAD/microsoft-authentication-library-for-js)
- [Azure AD Dokumentation](https://learn.microsoft.com/en-us/azure/active-directory/)
- [Microsoft Graph API](https://learn.microsoft.com/en-us/graph/overview)

---

## React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
