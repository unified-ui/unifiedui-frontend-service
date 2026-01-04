# Unified UI API Client

Dieser Ordner enthält den vollständigen API-Client für die Unified-UI Plattform.

## Struktur

```
src/api/
├── types.ts       # TypeScript Interfaces für alle Request/Response-Typen
├── client.ts      # UnifiedUIAPIClient Implementierung
└── index.ts       # Export-Datei
```

## Verwendung

### API-Client initialisieren

```typescript
import { UnifiedUIAPIClient } from './api';

const apiClient = new UnifiedUIAPIClient({
  baseURL: 'http://localhost:8000',
  getAccessToken: async () => {
    // MSAL Token abrufen
    return await getAccessToken();
  },
  onError: (error) => {
    // Fehlerbehandlung
    console.error('API Error:', error);
  },
  onSuccess: (message) => {
    // Erfolgsbenachrichtigung
    console.log('Success:', message);
  },
});
```

### Identity API

```typescript
// Aktuellen Benutzer und Tenants abrufen
const meResponse = await apiClient.getMe();

// Benutzer suchen
const users = await apiClient.getUsers({ search: 'john', top: 10 });

// Gruppen abrufen
const groups = await apiClient.getGroups({ top: 20 });
```

### Tenants API

```typescript
// Alle Tenants auflisten
const tenants = await apiClient.listTenants();

// Tenant erstellen
const newTenant = await apiClient.createTenant({
  name: 'My Tenant',
  description: 'Tenant description',
});

// Tenant aktualisieren
const updatedTenant = await apiClient.updateTenant(tenantId, {
  name: 'Updated Name',
});

// Tenant löschen
await apiClient.deleteTenant(tenantId);

// Berechtigungen verwalten
const principals = await apiClient.getTenantPrincipals(tenantId);
await apiClient.setTenantPrincipal(tenantId, {
  principal_id: userId,
  principal_type: PrincipalTypeEnum.USER,
  role: TenantPermissionEnum.GLOBAL_ADMIN,
});
```

### Applications API

```typescript
// Alle Applications auflisten
const apps = await apiClient.listApplications();

// Application erstellen
const newApp = await apiClient.createApplication({
  name: 'My Application',
  description: 'App description',
});

// Application aktualisieren
const updatedApp = await apiClient.updateApplication(appId, {
  name: 'Updated Name',
});

// Application löschen
await apiClient.deleteApplication(appId);

// Berechtigungen verwalten
await apiClient.setApplicationPermission(appId, {
  principal_id: userId,
  principal_type: PrincipalTypeEnum.USER,
  permission: PermissionActionEnum.WRITE,
});
```

### Weitere Ressourcen

Der API-Client unterstützt alle folgenden Ressourcen:

- **Autonomous Agents**: `listAutonomousAgents()`, `createAutonomousAgent()`, etc.
- **Conversations**: `listConversations()`, `createConversation()`, etc.
- **Credentials**: `listCredentials()`, `createCredential()`, etc.
- **Custom Groups**: `listCustomGroups()`, `createCustomGroup()`, etc.

Alle Methoden folgen einem einheitlichen Namensschema:
- `list{Resource}()` - Alle Ressourcen auflisten
- `get{Resource}(id)` - Eine Ressource abrufen
- `create{Resource}(data)` - Ressource erstellen
- `update{Resource}(id, data)` - Ressource aktualisieren
- `delete{Resource}(id)` - Ressource löschen
- `get{Resource}Principals(id)` - Berechtigungen abrufen
- `set{Resource}Permission(id, data)` - Berechtigung setzen

## TypeScript-Typen

Alle Request- und Response-Typen sind in `types.ts` definiert und vollständig typisiert.

```typescript
import type {
  TenantResponse,
  CreateTenantRequest,
  ApplicationResponse,
  // ... weitere Typen
} from './api/types';
```

## Fehlerbehandlung

Der API-Client wirft `APIError`-Objekte bei Fehlern:

```typescript
interface APIError {
  status: number;
  message: string;
  detail?: unknown;
}
```

Diese werden automatisch an den `onError`-Callback weitergeleitet.

## Toast-Benachrichtigungen

Success- und Error-Messages werden automatisch als Mantine-Notifications angezeigt, wenn die entsprechenden Callbacks konfiguriert sind.
