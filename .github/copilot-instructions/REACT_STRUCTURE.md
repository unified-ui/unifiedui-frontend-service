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
├── App.css                     # App-spezifische Styles
├── index.css                   # Globale CSS Imports
├── authConfig.ts               # MSAL Konfiguration (Root-Level)
│
├── routes/                     # Route Definitionen
│   ├── index.tsx              # Route Configuration
│   └── ProtectedRoute.tsx     # Auth-Protected Routes
│
├── pages/                      # Page Components
│   ├── LoginPage/
│   │   ├── LoginPage.tsx
│   │   ├── LoginPage.module.css
│   │   └── index.ts
│   ├── DashboardPage/
│   │   ├── DashboardPage.tsx
│   │   ├── DashboardPage.module.css
│   │   └── index.ts
│   ├── ApplicationsPage/
│   │   ├── ApplicationsPage.tsx
│   │   ├── ApplicationsPage.module.css
│   │   └── index.ts
│   ├── AutonomousAgentsPage/
│   │   ├── AutonomousAgentsPage.tsx
│   │   ├── AutonomousAgentsPage.module.css
│   │   └── index.ts
│   ├── ConversationsPage/
│   │   ├── ConversationsPage.tsx
│   │   ├── ConversationsPage.module.css
│   │   └── index.ts
│   ├── CredentialsPage/
│   │   ├── CredentialsPage.tsx
│   │   ├── CredentialsPage.module.css
│   │   └── index.ts
│   ├── TenantSettingsPage/
│   │   ├── TenantSettingsPage.tsx
│   │   ├── TenantSettingsPage.module.css
│   │   └── index.ts
│   ├── ChatWidgetsPage/
│   │   ├── ChatWidgetsPage.tsx
│   │   ├── ChatWidgetsPage.module.css
│   │   └── index.ts
│   ├── DevelopmentPlatformsPage/
│   │   ├── DevelopmentPlatformsPage.tsx
│   │   ├── DevelopmentPlatformsPage.module.css
│   │   └── index.ts
│   ├── DevelopmentPlatformDetailsPage/
│   │   ├── DevelopmentPlatformDetailsPage.tsx
│   │   ├── DevelopmentPlatformDetailsPage.module.css
│   │   └── index.ts
│   ├── WidgetDesignerPage/
│   │   ├── WidgetDesignerPage.tsx
│   │   ├── WidgetDesignerPage.module.css
│   │   └── index.ts
│   └── NotFoundPage/
│       ├── NotFoundPage.tsx
│       ├── NotFoundPage.module.css
│       └── index.ts
│
├── components/                 # Reusable Components
│   ├── common/                # Generic Components (basierend auf Mantine)
│   │   ├── PageContainer/     # Responsive page wrapper
│   │   │   ├── PageContainer.tsx
│   │   │   ├── PageContainer.module.css
│   │   │   └── index.ts
│   │   ├── PageHeader/        # Page title + actions
│   │   │   ├── PageHeader.tsx
│   │   │   ├── PageHeader.module.css
│   │   │   └── index.ts
│   │   ├── DataTable/         # Feature-rich data table
│   │   │   ├── DataTable.tsx
│   │   │   ├── DataTableToolbar.tsx
│   │   │   ├── DataTableRow.tsx
│   │   │   ├── DataTablePagination.tsx
│   │   │   ├── DataTable.module.css
│   │   │   ├── DataTableToolbar.module.css
│   │   │   ├── DataTablePagination.module.css
│   │   │   └── index.ts
│   │   ├── ConfirmDeleteDialog/  # Delete confirmation modal
│   │   │   ├── ConfirmDeleteDialog.tsx
│   │   │   ├── ConfirmDeleteDialog.module.css
│   │   │   └── index.ts
│   │   ├── TagInput/          # Tag input with autocomplete
│   │   │   ├── TagInput.tsx
│   │   │   ├── TagInput.module.css
│   │   │   └── index.ts
│   │   └── index.ts           # Barrel exports
│   ├── dialogs/               # Modal Dialogs für CRUD-Operationen
│   │   ├── index.ts           # Exports
│   │   ├── CreateApplicationDialog.tsx
│   │   ├── CreateAutonomousAgentDialog.tsx
│   │   ├── CreateCredentialDialog.tsx
│   │   ├── CreateChatWidgetDialog.tsx
│   │   ├── CreateDevelopmentPlatformDialog.tsx
│   │   ├── CreateTenantDialog.tsx
│   │   └── Edit*Dialog/       # Edit-Dialoge pro Entity-Typ
│   └── layout/                # Layout Components
│       ├── Header/
│       │   ├── Header.tsx
│       │   ├── Header.module.css
│       │   └── index.ts
│       ├── Sidebar/
│       │   ├── Sidebar.tsx           # Navigation + DataList Integration
│       │   ├── Sidebar.module.css
│       │   ├── SidebarDataList.tsx   # PowerBI-like Entity-Liste
│       │   ├── SidebarDataList.module.css
│       │   └── index.ts
│       └── MainLayout/
│           ├── MainLayout.tsx
│           ├── MainLayout.module.css
│           └── index.ts
│
├── theme/                      # Zentrale Theme-Verwaltung
│   ├── index.ts               # Theme Export
│   ├── mantineTheme.ts        # Mantine Theme Configuration
│   ├── colors.ts              # Color Definitions (alle Themes)
│   └── spacing.ts             # Spacing System
│
├── styles/                     # Globale Styles
│   └── variables.css          # CSS Custom Properties
│
├── auth/                       # Authentication
│   ├── authConfig.ts          # MSAL Configuration
│   ├── AuthProvider.tsx       # Auth Context Provider
│   └── index.ts               # Exports
│
├── api/                        # API Client & Types
│   ├── types.ts               # TypeScript Types für alle API Endpoints
│   ├── client.ts              # UnifiedUIAPIClient (Tenant-basierte Pfade)
│   ├── index.ts               # Exports
│   └── README.md              # API Client Dokumentation
│
├── contexts/                   # React Contexts
│   ├── IdentityContext.tsx    # Global Identity State (User, Tenants)
│   ├── SidebarDataContext.tsx # Global Sidebar Data Cache
│   └── index.ts               # Context Exports
│
└── assets/                     # Static Assets
    └── (images, icons, etc.)
```

---

## Pages-Übersicht

### LoginPage
- MSAL Authentication Integration
- **Auto-Tenant-Erstellung**: Wenn Benutzer keinen Tenant hat → automatisch "default" Tenant erstellen

### DashboardPage
- **Meine letzten Konversationen**: Liste der kürzlich genutzten Conversations
- **Meine letzten Applications**: Liste der kürzlich genutzten Applications
- **Meine letzten Autonomen Agents**: Liste der kürzlich genutzten Agents
- **Meine Favoriten**: Favorisierte Applications und Auto-Agents

### ApplicationsPage
- **Liste**: Übersicht aller Applications mit DataTable
- **Details**: Detailansicht mit Access-Overlay
- **Form**: Application erstellen/bearbeiten
- **Integration**: Nutzt useSidebarData() für Cache-Refresh nach Create/Delete

### AutonomousAgentsPage
- **Liste**: Übersicht aller autonomen Agents mit DataTable
- **Details**: Detailansicht eines Agents
- **Tracing History**: Liste aller Traces mit Details
- **Integration**: Nutzt useSidebarData() für Cache-Refresh nach Create/Delete

### ConversationsPage
- **Als eigenständige Page**: Alle Conversations anzeigen
- **Als Component**: Wiederverwendbar unter ApplicationsPage
- Details mit Messages und Access-Verwaltung

### CredentialsPage
- **Liste**: Übersicht aller Credentials mit DataTable
- **Details**: Detailansicht mit Access-Overlay
- **Form**: Formular zum Erstellen/Bearbeiten
- **Test-Connection**: Funktion zum Testen der Verbindung
- **Integration**: Nutzt useSidebarData() für Cache-Refresh nach Create/Delete

### TenantSettingsPage
- **IAM Settings**:
  - Tenant Access Management
  - Custom Groups Verwaltung

### ChatWidgetsPage
- **Liste**: Übersicht aller Chat Widgets mit DataTable
- **Details**: Detailansicht mit Access-Overlay
- **Form**: Chat Widget erstellen/bearbeiten
- **Widget Types**: `IFRAME` oder `FORM`
- **Integration**: Nutzt useSidebarData() für Cache-Refresh nach Create/Delete

### DevelopmentPlatformsPage
- **Liste**: Übersicht aller Development Platforms mit DataTable
- **Row-Click**: Navigiert zu DevelopmentPlatformDetailsPage
- **Open-Action**: Öffnet `iframe_url` in neuem Tab
- **Integration**: Nutzt useSidebarData() für Cache-Refresh nach Create/Delete

### DevelopmentPlatformDetailsPage
- **Iframe-Anzeige**: Zeigt `iframe_url` in Vollbild-Iframe
- **Route**: `/development-platforms/:id`
- **Loading/Error States**: Skeleton während Laden, Error-Alert bei Fehlern
- **Sidebar-Integration**: SidebarDataList zeigt beim Hover für schnellen Wechsel

### WidgetDesignerPage
- **Placeholder**: Konzept folgt später

### NotFoundPage
- 404 Error Page für unbekannte Routes

---

## Standard Components (Mantine-basiert)

### Common Components
Die Anwendung nutzt **Mantine Components** als Basis. Eigene Common Components sind in `src/components/common/`:

- **PageContainer**: Responsive Container mit max-width
- **PageHeader**: Page-Titel mit optionaler Action
- **DataTable**: Feature-reiche Datentabelle
- **ConfirmDeleteDialog**: Bestätigungs-Dialog für DELETE-Operationen
- **TagInput**: Tag-Input mit Autocomplete und Debouncing

#### Page Building Blocks (`src/components/common/`)

Modulare Komponenten für einheitliche Entity-Pages:

##### PageContainer
Responsive Container mit max-width Constraints.
```typescript
// Props
interface PageContainerProps {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl'; // default: 'lg'
}
// Size Map: sm=800, md=1000, lg=1200, xl=1400
```

##### PageHeader
Page-Titel mit optionaler Action.
```typescript
interface PageHeaderProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: ReactNode;
}
```

##### DataTable
Feature-reiche Datentabelle mit Toolbar, Rows und Pagination.
```typescript
// DataTable Props
interface DataTableProps {
  items: DataTableItem[];
  isLoading?: boolean;
  error?: string | null;
  showType?: boolean;        // Type-Spalte anzeigen
  showTags?: boolean;        // Tags-Spalte anzeigen  
  showStatus?: boolean;      // Status-Switch anzeigen
  searchPlaceholder?: string;
  emptyMessage?: string;
  onOpen: (id: string) => void;      // Dropdown-Menu "Open" Action
  onRowClick?: (id: string) => void; // Click auf Row selbst (Navigation)
  onShare?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onDelete: (id: string) => void;
  renderIcon?: () => ReactNode;
}

// WICHTIG: onRowClick vs onOpen
// - onRowClick: Wird bei Klick auf die Row aufgerufen (z.B. Navigation zu Details)
// - onOpen: Wird bei Klick auf "Öffnen" im Dropdown-Menu aufgerufen (z.B. externe URL)
// DataTableRow verwendet stopPropagation auf Switch und Menu ActionIcon

// DataTableItem Interface
interface DataTableItem {
  id: string;
  name: string;
  description?: string;
  type?: string;
  tags?: string[];
  isActive?: boolean;
}

// Sub-Components
- DataTableToolbar: Search, Sort, Filter (Tags, Status)
- DataTableRow: Icon, Name+Description, Type, Tags (max 3), Status, Actions-Menu
- DataTablePagination: Items per page (25/50/100), Page navigation
```

##### ConfirmDeleteDialog
Bestätigungs-Dialog für DELETE-Operationen.
```typescript
interface ConfirmDeleteDialogProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;           // default: 'Löschen bestätigen'
  itemName?: string;        // Name des zu löschenden Elements
  itemType?: string;        // default: 'Element'
  isLoading?: boolean;
}
```

##### TagInput
Tag-Input-Feld mit Autocomplete und Debouncing.
```typescript
interface TagInputProps {
  value: string[];           // Aktuell ausgewählte Tags
  onChange: (tags: string[]) => void;
  placeholder?: string;      // default: 'Tag hinzufügen...'
  label?: string;            // Optional: Label über dem Input
  maxTags?: number;          // Maximale Anzahl Tags
  allowNew?: boolean;        // default: true - Neue Tags erlauben
  suggestions?: string[];    // Verfügbare Tag-Vorschläge
  disabled?: boolean;
}

// Features:
// - Autocomplete mit Dropdown-Vorschlägen
// - Debounced Suche (300ms)
// - Neue Tags per Enter oder Auswahl erstellen
// - Tags per Klick oder Backspace entfernen
// - Keyboard-Navigation in Vorschlägen
```

##### Verwendungsbeispiel (Entity Page Pattern)
```typescript
import { PageContainer, PageHeader, DataTable, ConfirmDeleteDialog } from '../../components/common';

export const MyEntityPage: FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; name: string }>({ 
    open: false, id: '', name: '' 
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [items, setItems] = useState<DataTableItem[]>([]);

  const handleDeleteClick = (id: string) => {
    const item = items.find(i => i.id === id);
    setDeleteDialog({ open: true, id, name: item?.name || '' });
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await apiClient.deleteEntity(selectedTenant.id, deleteDialog.id);
      setDeleteDialog({ open: false, id: '', name: '' });
      fetchEntities();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <MainLayout>
      <PageContainer>
        <PageHeader
          title="My Entities"
          description="Description text"
          actionLabel="Create Entity"
          onAction={() => setIsCreateDialogOpen(true)}
        />
        <DataTable
          items={items}
          isLoading={isLoading}
          error={error}
          onOpen={handleOpen}
          onDelete={handleDeleteClick}
          renderIcon={() => <IconMyEntity size={20} />}
        />
      </PageContainer>

      <CreateEntityDialog opened={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)} />
      
      <ConfirmDeleteDialog
        opened={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: '', name: '' })}
        onConfirm={handleDeleteConfirm}
        itemName={deleteDialog.name}
        itemType="Entity"
        isLoading={isDeleting}
      />
    </MainLayout>
  );
};
```

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
        <SidebarDataProvider>   {/* Globaler Sidebar Data Cache */}
          <App />
        </SidebarDataProvider>
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
- **Sidebar-Cache nutzen**: Nutze `useSidebarData()` für Entity-Listen in der Sidebar
- **Cache-Refresh nach CRUD**: Rufe `refreshApplications()`, `refreshAutonomousAgents()`, `refreshCredentials()` nach Create/Delete-Operationen auf

---

## SidebarDataContext (`src/contexts/SidebarDataContext.tsx`)

Globaler Cache für Sidebar-Entity-Daten (5 Entity-Typen).

### Unterstützte Entity-Typen
```typescript
type EntityType = 'applications' | 'autonomous-agents' | 'credentials' | 'chat-widgets' | 'development-platforms';
```

### Features

✅ **Einmaliges Laden** - Daten werden nur einmal geladen, dann gecacht
✅ **Separate Refresh-Funktion** - `refresh*()` sendet `X-Use-Cache: false` Header
✅ **Loading-States** - Separate isLoading und isRefreshing States
✅ **Tenant-Aware** - Cache wird bei Tenant-Wechsel automatisch geleert
✅ **Error-Handling** - Error-State pro Entity-Typ

### Verwendung

```typescript
import { useSidebarData } from '../contexts';

const MyComponent = () => {
  const {
    // Applications
    applications,              // DataListItem[]
    applicationsLoading,       // boolean
    applicationsRefreshing,    // boolean
    applicationsError,         // string | null
    fetchApplications,         // () => Promise<void> - verwendet Cache
    refreshApplications,       // () => Promise<void> - X-Use-Cache: false
    
    // Autonomous Agents
    autonomousAgents,
    autonomousAgentsLoading,
    autonomousAgentsRefreshing,
    autonomousAgentsError,
    fetchAutonomousAgents,
    refreshAutonomousAgents,
    
    // Credentials
    credentials,
    credentialsLoading,
    credentialsRefreshing,
    credentialsError,
    fetchCredentials,
    refreshCredentials,
    
    // Chat Widgets
    chatWidgets,
    chatWidgetsLoading,
    chatWidgetsRefreshing,
    chatWidgetsError,
    fetchChatWidgets,
    refreshChatWidgets,
    
    // Development Platforms
    developmentPlatforms,
    developmentPlatformsLoading,
    developmentPlatformsRefreshing,
    developmentPlatformsError,
    fetchDevelopmentPlatforms,
    refreshDevelopmentPlatforms,
    
    // Utility
    clearCache,                // () => void - Leert alle Caches
  } = useSidebarData();
  
  // Nach Create/Delete aufrufen
  const handleCreate = async (data: CreateApplicationRequest) => {
    await apiClient?.createApplication(selectedTenant.id, data);
    await refreshApplications();  // Cache aktualisieren
  };
};
```

### Verwendung in Entity-Pages

```typescript
// In ApplicationsPage.tsx
const { refreshApplications } = useSidebarData();

const handleDeleteConfirm = async () => {
  await apiClient?.deleteApplication(selectedTenant.id, id);
  await refreshApplications();  // Sidebar-Cache aktualisieren
  fetchEntities();              // Page-Daten neu laden
};
```

---

## SidebarDataList Komponente

Die `SidebarDataList` ist eine PowerBI-inspirierte Komponente, die beim Hover über Sidebar-Items erscheint.

### Features
- **Hover-Trigger**: Erscheint beim Hover über Applications, Autonomous Agents, Credentials
- **Auto-Close**: Schließt automatisch nach 300ms wenn Maus die Komponente verlässt
- **Search**: Integrierte Suchfunktion mit Client-Side-Filtering
- **Pagination**: Infinite-Scroll mit 20 Items pro Seite
- **Loading-Delay**: Loading-Indicator erscheint erst nach 300ms (verhindert Flackern)
- **Expand/Collapse**: Breite wechselt zwischen 320px und 450px
- **Entity-Icons**: Jedes Item zeigt sein Entity-Icon (Robot, Brain, Key)
- **Refresh**: Refresh-Button neben der Suche lädt Daten mit `X-Use-Cache: false`

### Props
```typescript
interface SidebarDataListProps {
  title: string;
  icon: React.ReactNode;
  items: DataListItem[];
  isLoading?: boolean;
  isRefreshing?: boolean;    // Refresh-Spinner Status
  error?: string | null;
  onAdd?: () => void;
  onClose: () => void;
  onRefresh?: () => void;    // Refresh Handler
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  addButtonLabel?: string;
}

interface DataListItem {
  id: string;
  name: string;
  link: string;
  icon?: React.ReactNode;
}
```

### Verwendung in Sidebar
Die Sidebar integriert SidebarDataList mit folgender Logik:
- Hover über Nav-Item → Data-Fetch starten + Panel öffnen
- Hover verlassen → 300ms Timeout → Panel schließen
- Klick auf Item → Navigation + Panel schließen
- Add-Button → Öffnet entsprechenden Create-Dialog

### isOnEntityListPage Logic
```typescript
// Sidebar zeigt DataList NUR wenn User NICHT auf der Entity-Listen-Page ist
// ABER: Auf Detail-Pages (z.B. /development-platforms/{id}) wird DataList angezeigt
const isOnEntityListPage = (entityType: EntityType): boolean => {
  const entityPaths: Record<EntityType, string> = {
    'applications': '/applications',
    'autonomous-agents': '/autonomous-agents',
    'credentials': '/credentials',
    'chat-widgets': '/chat-widgets',
    'development-platforms': '/development-platforms',
  };
  // Exact match! startsWith würde auch Detail-Pages matchen
  return location.pathname === entityPaths[entityType];
};
```

### entityConfigs Pattern
```typescript
// Zentrale Konfiguration für alle Entity-Typen in Sidebar
const entityConfigs: Record<EntityType, EntityConfig> = {
  'applications': {
    title: 'Applications',
    icon: <IconRobot size={20} />,
    items: applications,
    isLoading: applicationsLoading,
    isRefreshing: applicationsRefreshing,
    error: applicationsError,
    fetch: fetchApplications,
    refresh: refreshApplications,
    setCreateDialogOpen: setCreateApplicationDialogOpen,
    addButtonLabel: 'Neue Application',
  },
  // ... weitere Entity-Typen
};
```

---

## Dialog-Komponenten (`components/dialogs/`)

Alle Dialogs nutzen `@mantine/form` für Validierung und `useIdentity()` für API-Zugriff.

### Server-Side Filtering Pattern für Dropdowns

Alle Dialoge mit Credential-Dropdowns verwenden Server-Side Filtering:

```typescript
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDebouncedValue } from '@mantine/hooks';

// State für Suche
const [credentialSearch, setCredentialSearch] = useState('');
const [debouncedCredentialSearch] = useDebouncedValue(credentialSearch, 300);

// Load credentials mit useCallback
const loadCredentials = useCallback(async (searchTerm?: string) => {
  if (!apiClient || !selectedTenant) return;
  
  setIsLoadingCredentials(true);
  try {
    const response = await apiClient.listCredentials(selectedTenant.id, {
      limit: 100,
      order_by: 'name',
      order_direction: 'asc',
      ...(searchTerm && { name: searchTerm }),
    });
    setCredentials(Array.isArray(response) ? response : []);
  } catch (error) {
    console.error('Failed to load credentials:', error);
  } finally {
    setIsLoadingCredentials(false);
  }
}, [apiClient, selectedTenant]);

// Initial load beim Dialog öffnen
useEffect(() => {
  if (opened) {
    loadCredentials();
  } else {
    setCredentialSearch(''); // Reset beim Schließen
  }
}, [opened, loadCredentials]);

// Reload bei Suchänderung (debounced)
useEffect(() => {
  if (opened && debouncedCredentialSearch !== undefined) {
    loadCredentials(debouncedCredentialSearch || undefined);
  }
}, [opened, debouncedCredentialSearch, loadCredentials]);

// Select mit searchable
<Select
  label="API Key Credential"
  data={apiKeyCredentials}
  searchable
  onSearchChange={setCredentialSearch}
  nothingFoundMessage="No credentials found"
  {...form.getInputProps('credential_id')}
/>
```

**Vorteile:**
- Initial nur 100 Credentials laden (statt alle 999)
- Server-Side Filtering bei Suche
- 300ms Debouncing verhindert zu viele API-Calls
- Reset beim Schließen des Dialogs

### CreateApplicationDialog
```typescript
// Props
interface CreateApplicationDialogProps {
  opened: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Felder
- name: string (required, max 255)
- description: string (optional, max 2000)
```

### CreateAutonomousAgentDialog
```typescript
// Gleiche Props wie CreateApplicationDialog
// Gleiche Felder wie CreateApplicationDialog
```

### CreateCredentialDialog
```typescript
// Props: gleich wie oben
// Felder
- name: string (required, max 255)
- credential_type: string (required, Select mit Optionen)
- secret_value: string (required, PasswordInput)
- description: string (optional, max 2000)

// Credential-Typen
const CREDENTIAL_TYPES = [
  { value: 'API_KEY', label: 'API Key' },
  { value: 'PASSWORD', label: 'Password' },
  { value: 'TOKEN', label: 'Token' },
  { value: 'SECRET', label: 'Secret' },
  { value: 'CONNECTION_STRING', label: 'Connection String' },
  { value: 'CERTIFICATE', label: 'Certificate' },
  { value: 'OTHER', label: 'Sonstiges' },
];
```

### CreateTenantDialog
```typescript
// Props: gleich wie oben
// Felder: name, description (wie Application)
// Besonderheit: Ruft refreshIdentity() nach Erstellung auf
```

### Dialog-Pattern
```typescript
import { CreateApplicationDialog } from '../../components/dialogs';

const [opened, setOpened] = useState(false);

<CreateApplicationDialog
  opened={opened}
  onClose={() => setOpened(false)}
  onSuccess={() => {
    // Refresh data
    fetchApplications();
  }}
/>
```

---

## API Client - Tenant-basierte Pfade

**WICHTIG**: Alle Entity-Endpoints verwenden tenant-basierte Pfade!

### Endpoint-Struktur
```
/api/v1/tenants/{tenantId}/applications
/api/v1/tenants/{tenantId}/autonomous-agents
/api/v1/tenants/{tenantId}/credentials
/api/v1/tenants/{tenantId}/conversations
/api/v1/tenants/{tenantId}/custom-groups
```

### API-Client Methoden
```typescript
// Alle Entity-Methoden erfordern tenantId als ersten Parameter
// Empfohlen: limit: 100 mit Sortierung für bessere Performance
apiClient.listApplications(tenantId, { limit: 100, order_by: 'name', order_direction: 'asc' })
apiClient.createApplication(tenantId, { name, description })
apiClient.getApplication(tenantId, applicationId)
apiClient.updateApplication(tenantId, applicationId, data)
apiClient.deleteApplication(tenantId, applicationId)

// Mit noCache Option (sendet X-Use-Cache: false Header)
apiClient.listApplications(tenantId, { limit: 100 }, { noCache: true })
apiClient.listAutonomousAgents(tenantId, { limit: 100 }, { noCache: true })
apiClient.listCredentials(tenantId, { limit: 100 }, { noCache: true })

// Mit Server-Side Filtering (name Parameter)
apiClient.listCredentials(tenantId, { limit: 100, order_by: 'name', order_direction: 'asc', name: 'searchTerm' })

// AUSNAHME: SidebarDataContext verwendet limit: 999 mit view: 'quick-list'
apiClient.listApplications(tenantId, { limit: 999, view: 'quick-list', order_by: 'name', order_direction: 'asc' })
```

### Verwendung mit selectedTenant
```typescript
const { apiClient, selectedTenant } = useIdentity();

const fetchData = async () => {
  if (!apiClient || !selectedTenant) return;
  
  const apps = await apiClient.listApplications(selectedTenant.id, { 
    limit: 100,
    order_by: 'name',
    order_direction: 'asc',
  });
};
```
