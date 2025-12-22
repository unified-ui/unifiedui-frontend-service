# React + Vite + TypeScript Projektstruktur

Diese Datei definiert die Projektstruktur für ein mittelgroßes bis großes React-Projekt mit TypeScript, Vite und Mantine als UI-Framework.

## Technologie-Stack
- **React 18+** mit TypeScript
- **Vite** als Build-Tool
- **Mantine** als UI-Framework (Theme-Management, Components)
- **React Router** für SPA-Navigation
- **MSAL** für Azure AD Authentication
- **Light/Dark Mode** mit zentralem Theme-Management

## Projektstruktur

```
src/
├── main.tsx                    # Entry Point
├── App.tsx                     # Main App Component mit Router
├── routes/                     # Route Definitionen
│   ├── index.tsx              # Route Configuration
│   └── ProtectedRoute.tsx     # Auth-Protected Routes
│
├── pages/                      # Page Components
│   ├── LoginPage/
│   │   ├── LoginPage.tsx
│   │   └── LoginPage.module.css
│   ├── DashboardPage/
│   │   ├── DashboardPage.tsx
│   │   └── DashboardPage.module.css
│   ├── CredentialsPage/
│   │   ├── CredentialsPage.tsx
│   │   ├── CredentialsList.tsx
│   │   ├── CredentialsDetails.tsx
│   │   ├── CredentialsForm.tsx
│   │   └── CredentialsPage.module.css
│   ├── TenantSettingsPage/
│   │   ├── TenantSettingsPage.tsx
│   │   ├── IAMSettings.tsx
│   │   └── TenantSettingsPage.module.css
│   ├── ApplicationsPage/
│   │   ├── ApplicationsPage.tsx
│   │   ├── ApplicationsList.tsx
│   │   ├── ApplicationDetails.tsx
│   │   ├── ApplicationForm.tsx
│   │   └── ApplicationsPage.module.css
│   ├── ConversationsPage/
│   │   ├── ConversationsPage.tsx
│   │   ├── ConversationsList.tsx
│   │   ├── ConversationDetails.tsx
│   │   ├── MessagesList.tsx
│   │   └── ConversationsPage.module.css
│   ├── AutonomousAgentsPage/
│   │   ├── AutonomousAgentsPage.tsx
│   │   ├── AgentsList.tsx
│   │   ├── AgentDetails.tsx
│   │   ├── TracingHistory.tsx
│   │   └── AutonomousAgentsPage.module.css
│   ├── WidgetDesignerPage/
│   │   ├── WidgetDesignerPage.tsx
│   │   └── WidgetDesignerPage.module.css
│   └── NotFoundPage/
│       └── NotFoundPage.tsx
│
├── components/                 # Reusable Components
│   ├── common/                # Generic Components (basierend auf Mantine)
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   └── Button.module.css
│   │   ├── Toast/
│   │   │   ├── Toast.tsx
│   │   │   ├── ToastTypes.ts  # DELETE, SUCCESS, WARNING, INFO
│   │   │   └── Toast.module.css
│   │   ├── Dropdown/
│   │   │   ├── Dropdown.tsx   # Searchable Dropdown
│   │   │   └── Dropdown.module.css
│   │   ├── Checkbox/
│   │   │   ├── Checkbox.tsx
│   │   │   └── Checkbox.module.css
│   │   ├── ToggleButton/
│   │   │   ├── ToggleButton.tsx
│   │   │   └── ToggleButton.module.css
│   │   ├── TextBox/
│   │   │   ├── TextBox.tsx
│   │   │   └── TextBox.module.css
│   │   ├── Card/
│   │   │   ├── Card.tsx
│   │   │   └── Card.module.css
│   │   └── Overlay/
│   │       ├── Overlay.tsx    # Für Access-Dialoge
│   │       └── Overlay.module.css
│   ├── layout/                # Layout Components
│   │   ├── Header/
│   │   │   ├── Header.tsx
│   │   │   └── Header.module.css
│   │   ├── Sidebar/
│   │   │   ├── Sidebar.tsx
│   │   │   └── Sidebar.module.css
│   │   └── MainLayout/
│   │       ├── MainLayout.tsx
│   │       └── MainLayout.module.css
│   └── features/              # Feature-specific Components
│       ├── Conversations/
│       │   ├── ConversationsList.tsx
│       │   ├── ConversationMessages.tsx
│       │   └── ConversationAccess.tsx
│       ├── Credentials/
│       │   ├── CredentialTestConnection.tsx
│       │   └── CredentialAccessOverlay.tsx
│       ├── Applications/
│       │   ├── ApplicationAccessOverlay.tsx
│       │   └── ApplicationCredentialsForm.tsx
│       └── Dashboard/
│           ├── RecentConversations.tsx
│           ├── RecentApplications.tsx
│           ├── RecentAgents.tsx
│           └── Favorites.tsx
│
├── theme/                      # Zentrale Theme-Verwaltung
│   ├── index.ts               # Theme Export
│   ├── mantineTheme.ts        # Mantine Theme Configuration
│   ├── colors.ts              # Color Definitions (alle Themes)
│   ├── spacing.ts             # Spacing System
│   ├── typography.ts          # Typography Settings
│   └── radius.ts              # Border Radius Definitions
│
├── styles/                     # Globale Styles
│   ├── global.css             # Global CSS
│   └── variables.css          # CSS Custom Properties
│
├── auth/                       # Authentication
│   ├── authConfig.ts          # MSAL Configuration
│   ├── AuthProvider.tsx       # Auth Context Provider
│   └── useAuth.ts             # Auth Hook
│
├── hooks/                      # Custom Hooks
│   ├── useTheme.ts            # Theme Hook (Light/Dark + Color Themes)
│   ├── useApi.ts              # API Hook
│   └── useLocalStorage.ts     # Local Storage Hook
│
├── api/                        # API Client & Types
│   ├── types.ts               # TypeScript Types für alle API Endpoints
│   ├── client.ts              # UnifiedUIAPIClient
│   ├── index.ts               # Exports
│   └── README.md              # API Client Dokumentation
│
├── contexts/                   # React Contexts
│   ├── IdentityContext.tsx    # Global Identity State (User, Tenants)
│   └── index.ts               # Context Exports
│
├── services/                   # Legacy API Services (DEPRECATED - use api/)
│   ├── api.ts                 # Base API Configuration
│   ├── userService.ts         # User-related API calls
│   └── authService.ts         # Auth-related API calls
│
│
├── utils/                      # Utility Functions
│   ├── constants.ts           # App Constants
│   ├── helpers.ts             # Helper Functions
│   └── validators.ts          # Validation Functions
│
├── context/                    # React Contexts
│   ├── ThemeContext.tsx       # Theme Context
│   └── AppContext.tsx         # Global App State
│
└── assets/                     # Static Assets
    ├── images/
    ├── icons/
   Pages-Übersicht

### LoginPage
- MSAL Authentication Integration
- **Auto-Tenant-Erstellung**: Wenn Benutzer keinen Tenant hat → automatisch "default" Tenant erstellen

### DashboardPage
- **Meine letzten Konversationen**: Liste der kürzlich genutzten Conversations
- **Meine letzten Applications**: Liste der kürzlich genutzten Applications
- **Meine letzten Autonomen Agents**: Liste der kürzlich genutzten Agents
- **Meine Favoriten**: Favorisierte Applications und Auto-Agents

### CredentialsPage
- **Liste**: Übersicht aller Credentials
- **Details**: Detailansicht mit Access-Overlay
- **Form**: Formular zum Erstellen/Bearbeiten
- **Test-Connection**: Funktion zum Testen der Verbindung

### TenantSettingsPage
- **IAM Settings**:
  - Tenant Access Management
  - Custom Groups Verwaltung

### ApplicationsPage
- **Liste**: Übersicht aller Applications
- **Details**: Detailansicht mit:
  - Access-Overlay
  - Liste der Conversations
    - Conversation Details mit Messages
    - Access-Verwaltung
- **Form**: Application erstellen/bearbeiten
- **Credentials direkt anlegbar** (mit default Namen)

### ConversationsPage
- **Als eigenständige Page**: Alle Conversations anzeigen
- **Als Component**: Wiederverwendbar unter ApplicationsPage
- Details mit Messages und Access-Verwaltung

### AutonomousAgentsPage
- **Liste**: Übersicht aller autonomen Agents
- **Details**: Detailansicht eines Agents
- **Tracing History**:
  - Liste aller Traces
  - Details einzelner Traces

### WidgetDesignerPage
- **Placeholder**: Konzept folgt später

## Standard Components (Mantine-basiert)

### Common Components
- **Button**: Verschiedene Varianten (Primary, Secondary, Danger, etc.)
- **Toast**: Notification-System
  - Types: `DELETE`, `SUCCESS`, `WARNING`, `INFO`, `ERROR`
- **Dropdown**: Searchable Dropdown-Menü
- **Checkbox**: Standard-Checkboxen
- **ToggleButton**: Toggle/Switch Components
- **TextBox**: Input-Felder verschiedener Typen
- **Overlay**: Modal/Dialog für Access-Management

### Layout Components
- **Header**: App-Header mit Navigation
- **Sidebar**: Seitenleiste mit Menü
- **MainLayout**: Haupt-Layout-Container (kombiniert Header + Sidebar + Content)

## Best Practices
- **Mantine Components nutzen**: Baue auf Mantine's Component-Library auf
- **Theme-System verwenden**: Greife immer auf `theme.*` zu, nie hardcoded
- **Component Composition**: Kleine, wiederverwendbare Components
- **Type Safety**: Vollständige TypeScript-Nutzung
- **Lazy Loading**: Code-Splitting für bessere Performance
- **Accessibility**: Nutze Mantine's eingebaute A11y-Features
- **Overlay-Pattern**: Nutze Overlays für Access-Management und Detailansichten
- **Component Reuse**: Conversations als wiederverwendbare Component konzipierendule.css`
- Nutze Mantine Components als Basis, erweitere bei Bedarf
- Trenne gemeinsame Components (`common/`), Layout (`layout/`) und Feature-Components (`features/`)

### 2. Theme-Management (Mantine)
- **Zentrale Theme-Konfiguration** in `theme/mantineTheme.ts`
- Definiere alle Color Themes in `theme/colors.ts`
- Light/Dark Mode über Mantine's `ColorSchemeProvider`
- Spacing, Typography, Radius zentral definiert
- Nutze Mantine's Theme-Object in Components: `theme.colors`, `theme.spacing`, etc.

### 3. Routing
- React Router in `App.tsx` oder dedizierter `routes/index.tsx`
- Protected Routes mit MSAL Authentication
- Lazy Loading für Pages

### 4. Authentication (MSAL)
- MSAL Configuration in `auth/authConfig.ts`
- Auth Context Provider für App-weiten Zugriff
- Custom Hook `useAuth()` für Components

### 5. TypeScript
- Strikte Type-Definitionen in `types/`
- Keine `any` Types
- Interfaces für Props und API Responses

### 6. State Management
- React Context für globalen State
- Lokaler Component State wo möglich
- Bei Bedarf: Zustand oder Redux Toolkit

## Theme-Beispiel (Mantine)

```typescript
// theme/mantineTheme.ts
import { MantineThemeOverride } from '@mantine/core';
import { colors } from './colors';
import { spacing } from './spacing';

export const theme: MantineThemeOverride = {
  colorScheme: 'light', // oder 'dark'
  colors: {
    primary: colors.primary,
    secondary: colors.secondary,
    // Custom color themes
  },
  spacing: spacing,
  radius: { xs: 2, sm: 4, md: 8, lg: 16, xl: 32 },
  fontFamily: 'Inter, sans-serif',
  // Weitere zentrale Definitionen
};
```

## API Client & Identity Management

### UnifiedUIAPIClient (`src/api/`)

Der zentrale API-Client für alle Backend-Kommunikation.

#### Struktur
```typescript
src/api/
├── types.ts      # Alle Request/Response Types
├── client.ts     # UnifiedUIAPIClient Implementation
├── index.ts      # Exports
└── README.md     # Ausführliche Dokumentation
```

#### Verwendung

**Via Identity Context (empfohlen):**
```typescript
import { useIdentity } from '../contexts';

const MyComponent = () => {
  const { apiClient, user, tenants, selectedTenant } = useIdentity();
  
  const loadData = async () => {
    const apps = await apiClient?.listApplications();
  };
};
```

**Direkt initialisieren:**
```typescript
import { UnifiedUIAPIClient } from '../api';

const client = new UnifiedUIAPIClient({
  baseURL: 'http://localhost:8000',
  getAccessToken: async () => await msalInstance.acquireToken(),
  onError: (error) => {
    notifications.show({ 
      title: 'Fehler', 
      message: error.message, 
      color: 'red' 
    });
  },
  onSuccess: (message) => {
    notifications.show({ 
      title: 'Erfolg', 
      message, 
      color: 'green' 
    });
  },
});
```

#### Unterstützte Endpoints

**Identity:**
- `getMe()` - Aktueller User + Tenants + Rollen
- `getUsers(params)` - User-Suche
- `getGroups(params)` - Security Groups

**Tenants:**
- `listTenants()`, `getTenant(id)`, `createTenant(data)`, `updateTenant(id, data)`, `deleteTenant(id)`
- `getTenantPrincipals(id)`, `setTenantPrincipal(id, data)`, `deleteTenantPrincipal(id, data)`

**Applications:**
- `listApplications()`, `getApplication(id)`, `createApplication(data)`, `updateApplication(id, data)`, `deleteApplication(id)`
- `getApplicationPrincipals(id)`, `setApplicationPermission(id, data)`, `deleteApplicationPermission(id, ...)`

**Autonomous Agents:**
- `listAutonomousAgents()`, `getAutonomousAgent(id)`, `createAutonomousAgent(data)`, etc.
- Permission-Management analog zu Applications

**Conversations:**
- `listConversations()`, `getConversation(id)`, `createConversation(data)`, etc.
- Permission-Management analog zu Applications

**Credentials:**
- `listCredentials()`, `getCredential(id)`, `createCredential(data)`, `updateCredential(id, data)`, `deleteCredential(id)`
- Permission-Management analog zu Applications

**Custom Groups:**
- `listCustomGroups()`, `getCustomGroup(id)`, `createCustomGroup(data)`, etc.
- Principal-Management

#### Features

✅ **MSAL Token Integration** - Automatischer Token-Abruf
✅ **Error-Handling** - Automatische Toast-Benachrichtigungen
✅ **Success-Messages** - Toast bei erfolgreichen Operationen
✅ **Type-Safe** - Vollständige TypeScript-Unterstützung
✅ **Singleton Pattern** - Ein Client für die ganze App (via Context)

### Identity Context (`src/contexts/IdentityContext.tsx`)

Globaler State für User und Tenants.

#### Features

✅ **Auto-Load nach Login** - `/me` wird automatisch nach Login aufgerufen
✅ **Auto-Tenant-Creation** - Erstellt "default" Tenant, wenn keiner vorhanden
✅ **Tenant-Switching** - Wechsel zwischen Tenants mit Toast-Benachrichtigung
✅ **LocalStorage Persistierung** - Letzter Tenant wird gespeichert
✅ **API-Client global** - Alle Components können auf denselben Client zugreifen

#### Verwendung

```typescript
import { useIdentity } from '../contexts';

const MyComponent = () => {
  const { 
    user,              // IdentityUser - Aktueller Benutzer
    tenants,           // TenantResponse[] - Alle verfügbaren Tenants
    selectedTenant,    // TenantResponse | null - Aktuell gewählter Tenant
    apiClient,         // UnifiedUIAPIClient | null
    selectTenant,      // (tenantId: string) => void
    refreshIdentity,   // () => Promise<void>
    isLoading          // boolean
  } = useIdentity();
  
  // Tenant wechseln
  const switchTenant = () => {
    selectTenant(tenants[0].id);
    // → Toast: "Sie haben zu 'TenantName' gewechselt"
  };
  
  // Identity neu laden
  const reload = async () => {
    await refreshIdentity();
  };
};
```

#### API Response Structure

**GET /api/v1/identity/me Response:**
```typescript
{
  id: string;
  identity_provider: string;
  identity_tenant_id: string;
  display_name: string;
  firstname: string;
  lastname: string;
  mail: string;
  tenants: [
    {
      tenant: {
        id: string;
        name: string;
        description?: string;
        created_at: string;
        updated_at: string;
        created_by: string;
        updated_by: string;
      },
      roles: string[];  // z.B. ["GLOBAL_ADMIN"]
    }
  ];
  groups: IdentityGroup[];
  custom_groups: unknown[];
}
```

**Context Transformation:**
- `user` = Top-level User-Felder (id, display_name, mail, etc.)
- `tenants` = `response.tenants.map(t => t.tenant)` (extrahiert nur Tenant-Objekte)
- `selectedTenant` = Aus localStorage oder erster Tenant

### Toast-Benachrichtigungen

**Mantine Notifications** sind bereits eingerichtet:

```typescript
// In main.tsx
<Notifications position="top-right" />
```

**Automatische Toasts via API Client:**
- ✅ Erfolgreiche Operationen → Grüner Toast
- ❌ Fehler → Roter Toast
- ℹ️ Tenant-Wechsel → Blauer Toast

**Manuell:**
```typescript
import { notifications } from '@mantine/notifications';

notifications.show({
  title: 'Titel',
  message: 'Nachricht',
  color: 'green', // 'red', 'blue', 'yellow'
  position: 'top-right',
});
```

### Environment-Konfiguration

**.env File:**
```env
VITE_API_BASE_URL=http://localhost:8000
```

**Verwendung:**
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
```

### Provider-Hierarchie

Korrekte Reihenfolge in `main.tsx`:

```tsx
<MantineProvider>
  <Notifications position="top-right" />
  <MsalProvider instance={msalInstance}>
    <AuthProvider>              {/* MSAL Auth Wrapper */}
      <IdentityProvider>        {/* Verwendet useAuth() */}
        <App />
      </IdentityProvider>
    </AuthProvider>
  </MsalProvider>
</MantineProvider>
```

### Migration von altem Code

**Alt (DEPRECATED):**
```typescript
// services/userService.ts
export const getUsers = async () => { ... }

// In Component
import { getUsers } from '../services/userService';
const users = await getUsers();
```

**Neu (EMPFOHLEN):**
```typescript
// In Component
import { useIdentity } from '../contexts';

const { apiClient } = useIdentity();
const users = await apiClient?.getUsers();
```

## Best Practices
- **Mantine Components nutzen**: Baue auf Mantine's Component-Library auf
- **Theme-System verwenden**: Greife immer auf `theme.*` zu, nie hardcoded
- **Component Composition**: Kleine, wiederverwendbare Components
- **Type Safety**: Vollständige TypeScript-Nutzung
- **Lazy Loading**: Code-Splitting für bessere Performance
- **Accessibility**: Nutze Mantine's eingebaute A11y-Features
- **API Client verwenden**: Nutze `useIdentity()` Hook für API-Zugriff
- **Toast-System nutzen**: Automatische Benachrichtigungen via API Client
- **Tenant-Context nutzen**: Greife auf `selectedTenant` zu, nicht auf lokalen State
