# API Client

## Architecture

The API client (`src/api/client.ts`) is a single class `UnifiedUIAPIClient` with ~130 methods organized by resource type.

### Dual Base URL

The client talks to **two backend services**:

| Service | Purpose | Base URL Source |
|---------|---------|----------------|
| Platform Service | CRUD for tenants, applications, credentials, permissions, etc. | Constructor `baseURL` param |
| Agent Service | Chat messages, SSE streaming, traces | `setAgentServiceBaseURL()` — set dynamically |

Platform Service endpoints use `this.baseURL` directly. Agent Service endpoints call `this.getAgentServiceURL()` which throws if not yet configured.

### URL Patterns

```
Platform:  /api/v1/platform-service/tenants/{tenantId}/{resource}
Agent:     /api/v1/agent-service/tenants/{tenantId}/...
```

---

## Usage via IdentityContext

The API client is instantiated once in `IdentityContext` and accessed via hook:

```typescript
const { apiClient } = useIdentity();
const apps = await apiClient.listApplications(tenantId, { skip: 0, limit: 50 });
```

Never create a new `UnifiedUIAPIClient` instance — always use the one from context.

---

## Request Flow

Every method calls `this.request<T>(method, path, body?, successMessage?, options?)`:

1. Gets access token via `this.getAccessToken()` (MSAL)
2. Adds `Authorization: Bearer {token}` header
3. Optionally adds `X-Use-Cache: false` (when `noCache: true`)
4. Calls `fetch()` with JSON body
5. On success: returns parsed JSON, optionally calls `onSuccess` callback
6. On error: calls `onError` callback, throws Error with `detail` from response

### Options

- `noCache: true` → sends `X-Use-Cache: false` header to bypass backend cache
- `additionalHeaders` → merges custom headers

---

## Adding a New Endpoint

### 1. Add types to `src/api/types.ts`

```typescript
export interface MyResourceResponse {
  id: string;
  name: string;
  tenant_id: string;
}

export interface CreateMyResourceRequest {
  name: string;
  description?: string;
}
```

### 2. Add method to `src/api/client.ts`

```typescript
// In the appropriate section of UnifiedUIAPIClient:

async listMyResources(
  tenantId: string,
  params: PaginationParams & SearchParams
): Promise<MyResourceResponse[]> {
  const query = this.buildQueryString(params);
  return this.request<MyResourceResponse[]>(
    'GET',
    `/api/v1/platform-service/tenants/${tenantId}/my-resources${query}`
  );
}

async createMyResource(
  tenantId: string,
  data: CreateMyResourceRequest
): Promise<MyResourceResponse> {
  return this.request<MyResourceResponse>(
    'POST',
    `/api/v1/platform-service/tenants/${tenantId}/my-resources`,
    data,
    'Resource created successfully'
  );
}
```

### 3. Import types in client.ts

Add new types to the import block at the top of `client.ts`.

---

## Method Organization

Methods are grouped by resource with comment headers:

```
// ========== Health Check ==========
// ========== Identity Endpoints ==========
// ========== Tenant Endpoints ==========
// ========== Application Endpoints ==========
// ========== Autonomous Agent Endpoints ==========
// ========== Conversation Endpoints ==========
// ========== Credential Endpoints ==========
// ========== Chat Widget Endpoints ==========
// ========== Tool Endpoints ==========
// ========== Custom Group Endpoints ==========
// ========== Tags Endpoints ==========
// ========== User Favorites Endpoints ==========
// ========== Dashboard Endpoints ==========
// ========== Search Endpoints ==========
// ========== Notification Endpoints ==========
// ========== Recent Visit Endpoints ==========
// ========== AI Model Endpoints ==========
// ========== ReACT Agent Endpoints ==========
// ========== Agent Service ==========
// ========== Trace Endpoints ==========
```

---

## Standard Resource Methods

Most resources follow this pattern:

| Method | HTTP | Path |
|--------|------|------|
| `list{Resource}s` | GET | `/{resource}s?skip=&limit=` |
| `get{Resource}` | GET | `/{resource}s/{id}` |
| `create{Resource}` | POST | `/{resource}s` |
| `update{Resource}` | PUT | `/{resource}s/{id}` |
| `delete{Resource}` | DELETE | `/{resource}s/{id}` |
| `list{Resource}Principals` | GET | `/{resource}s/{id}/principals` |
| `set{Resource}Permission` | PUT | `/{resource}s/{id}/principals/{principalId}` |
| `delete{Resource}Permission` | DELETE | `/{resource}s/{id}/principals/{principalId}` |

---

## SSE Streaming

For chat messages, the client uses `EventSource`-style streaming via `fetch` with `ReadableStream`:

```typescript
async *sendMessageStream(
  tenantId: string,
  data: SendMessageRequest,
  onStreamStart?: (messageId: string, conversationId: string, isNewMessage: boolean) => void,
  onTextChunk?: (content: string) => void,
  onNewMessage?: () => void,
  onStreamEnd?: () => void,
  onError?: (code: string, message: string, details: string) => void,
  onMessageComplete?: (message: MessageResponse) => void,
  onTitleGeneration?: (title: string) => void,
  foundryToken?: string
): AsyncGenerator<SSEEvent, void, unknown>
```

### SSE Event Types

| Type | Purpose |
|------|--------|
| `STREAM_START` | Stream begins, provides messageId and conversationId |
| `TEXT_STREAM` | Text content chunk for typewriter effect |
| `STREAM_NEW_MESSAGE` | New message in multi-message response |
| `STREAM_END` | Stream complete |
| `MESSAGE_COMPLETE` | Full message with metadata |
| `TITLE_GENERATION` | AI-generated conversation title (streamed after first message) |
| `ERROR` | Error in stream |

The `onTitleGeneration` callback receives title text that can be displayed with typewriter animation in the conversations list.

---

## Types File

`src/api/types.ts` contains all interfaces and enums (~1370 lines). Key patterns:

- **Enums**: Defined as `const` objects with a derived type (not TypeScript `enum`)
- **Responses**: Suffixed with `Response` (e.g., `ApplicationResponse`)
- **Requests**: Suffixed with `Request` (e.g., `CreateApplicationRequest`)
- **Params**: Suffixed with `Params` (e.g., `PaginationParams`)

```typescript
export const PrincipalTypeEnum = {
  USER: 'USER',
  IDENTITY_GROUP: 'IDENTITY_GROUP',
  CUSTOM_GROUP: 'CUSTOM_GROUP',
} as const;
export type PrincipalTypeEnum = typeof PrincipalTypeEnum[keyof typeof PrincipalTypeEnum];
```
