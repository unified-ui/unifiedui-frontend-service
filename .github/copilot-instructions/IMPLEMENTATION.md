# Unified UI API Client - Implementierungsdokumentation

## Übersicht

Die vollständige API-Client-Integration für die Unified-UI Plattform wurde implementiert. Diese Dokumentation beschreibt die Architektur und Verwendung.

## Implementierte Komponenten

### 1. TypeScript Type Definitions (`src/api/types.ts`)

Alle Request- und Response-Typen für die Backend-API:
- Identity-Typen (User, Groups, Me-Response)
- Tenant-Management
- Applications, Autonomous Agents, Conversations
- Credentials, Custom Groups
- Permissions und Enums

### 2. API Client (`src/api/client.ts`)

**UnifiedUIAPIClient** - Vollständiger HTTP-Client mit:
- ✅ MSAL Token-Integration
- ✅ Automatisches Error-Handling
- ✅ Success/Error-Callbacks für Toast-Benachrichtigungen
- ✅ Typsichere Methoden für alle Endpoints
- ✅ Query-Parameter-Builder
- ✅ 204 No Content Handling

**Unterstützte Endpoints:**
- Health Check
- Identity (Me, Users, Groups)
- Tenants (CRUD + Permissions)
- Applications (CRUD + Permissions)
- Autonomous Agents (CRUD + Permissions)
- Conversations (CRUD + Permissions)
- Credentials (CRUD + Permissions)
- Custom Groups (CRUD + Permissions)

### 3. Identity Context (`src/contexts/IdentityContext.tsx`)

Globaler State für Identity-Management:
- ✅ `/me` Response global verfügbar
- ✅ Automatische Tenant-Erstellung ("default") wenn kein Tenant vorhanden
- ✅ Tenant-Wechsel-Funktionalität
- ✅ LocalStorage-Persistierung des gewählten Tenants
- ✅ Automatisches Nachladen nach Login
- ✅ Integration mit MSAL für Token-Abruf

### 4. Toast-Benachrichtigungen

Mantine Notifications integriert in:
- ✅ API-Client für automatische Error/Success-Messages
- ✅ Tenant-Wechsel-Benachrichtigungen
- ✅ Position: Top-Right
- ✅ Farbcodierung: Grün (Success), Rot (Error), Blau (Info)

### 5. Header-Integration

User-Dropdown erweitert mit:
- ✅ Anzeige des aktuellen Tenants
- ✅ Dropdown zur Tenant-Auswahl
- ✅ Live-Daten aus Identity Context
- ✅ Tenant-ID-Anzeige

### 6. Login-Flow

LoginPage mit Identity-Integration:
- ✅ Automatisches Laden der Identity-Daten nach Login
- ✅ Loading-Indicator während Identity-Abruf
- ✅ Anzeige aller verfügbaren Tenants
- ✅ Redirect erst nach vollständigem Identity-Load

### 7. Dashboard-Integration

Beispiel-Implementation für API-Client-Nutzung:
- ✅ Anzeige von User-Informationen
- ✅ Aktueller Tenant mit Details
- ✅ Übersicht aller Tenants
- ✅ Tenant-Details (Created, Updated)

## Verwendung

### Environment-Konfiguration

`.env` Datei erstellen:
```env
VITE_API_BASE_URL=http://localhost:8000
```

### API-Client verwenden

```typescript
import { useIdentity } from './contexts';

const MyComponent = () => {
  const { apiClient, selectedTenant } = useIdentity();
  
  const loadApplications = async () => {
    if (!apiClient) return;
    
    const apps = await apiClient.listApplications();
    console.log(apps);
  };
};
```

### Identity-Daten abrufen

```typescript
import { useIdentity } from './contexts';

const MyComponent = () => {
  const { user, tenants, selectedTenant, selectTenant } = useIdentity();
  
  return (
    <div>
      <p>User: {user?.display_name}</p>
      <p>Tenant: {selectedTenant?.name}</p>
      <button onClick={() => selectTenant(tenants[0].id)}>
        Switch Tenant
      </button>
    </div>
  );
};
```

## Architektur-Diagramm

```
┌─────────────────────────────────────────────┐
│            MSAL Authentication              │
│         (Azure AD / OAuth 2.0)              │
└────────────────┬────────────────────────────┘
                 │ Access Token
                 ↓
┌─────────────────────────────────────────────┐
│         IdentityProvider (Context)          │
│  - Lädt /me Response beim Login             │
│  - Erstellt "default" Tenant falls nötig    │
│  - Verwaltet Tenant-Auswahl (localStorage)  │
│  - Stellt apiClient global bereit           │
└────────────────┬────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────┐
│       UnifiedUIAPIClient                    │
│  - Verwendet Token von MSAL                 │
│  - HTTP Requests mit fetch()                │
│  - Error-Handling + Toast-Notifications     │
│  - Typsichere Methoden für alle Endpoints   │
└────────────────┬────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────┐
│         Backend API (FastAPI)               │
│  /api/v1/identity/me                        │
│  /api/v1/tenants                            │
│  /api/v1/applications                       │
│  /api/v1/autonomous-agents                  │
│  /api/v1/conversations                      │
│  /api/v1/credentials                        │
│  /api/v1/custom-groups                      │
└─────────────────────────────────────────────┘
```

## Automatischer Tenant-Creation Flow

```
1. User loggt sich ein (MSAL)
   ↓
2. IdentityProvider ruft /me auf
   ↓
3. Keine Tenants vorhanden?
   ↓ Ja
4. POST /api/v1/tenants { name: "default" }
   ↓
5. Erneuter Aufruf /me
   ↓
6. Tenant in State speichern
   ↓
7. Redirect zu Dashboard
```

## Lokale Tenant-Persistierung

Der gewählte Tenant wird in localStorage gespeichert:
```typescript
// Key: 'unified-ui-selected-tenant-id'
// Value: tenant.id (UUID)
```

Beim nächsten Login wird automatisch der zuletzt gewählte Tenant selektiert.

## Error-Handling

Alle API-Fehler werden automatisch als Toast-Benachrichtigungen angezeigt:

```typescript
// Beispiel-Error
{
  title: 'Fehler',
  message: 'Tenant konnte nicht erstellt werden',
  color: 'red',
  position: 'top-right'
}
```

## Success-Messages

Erfolgreiche Operationen zeigen ebenfalls Toasts:

```typescript
// Beispiel-Success
{
  title: 'Erfolg',
  message: 'Tenant "My Tenant" wurde erfolgreich erstellt',
  color: 'green',
  position: 'top-right'
}
```

## Nächste Schritte

1. **Backend URL konfigurieren**: `.env` Datei mit `VITE_API_BASE_URL` erstellen
2. **MSAL konfigurieren**: Azure AD App-Registrierung in `authConfig.ts` eintragen
3. **Backend starten**: FastAPI Backend auf Port 8000 starten
4. **Frontend starten**: `npm run dev`
5. **Testen**: Login durchführen und Tenant-Erstellung beobachten

## Weitere Ressourcen

- API-Client Dokumentation: `src/api/README.md`
- Type Definitions: `src/api/types.ts`
- Context Implementation: `src/contexts/IdentityContext.tsx`
- Beispiel-Verwendung: `src/pages/DashboardPage/DashboardPage.tsx`
