# ADR-002: Authentication Architecture

|                     |                 |
| ------------------- | --------------- |
| **Status**          | Accepted        |
| **Date**            | 2025-01-20      |
| **Decision Makers** | Enrico Goerlitz |

## Context

The unified-ui platform serves enterprise customers who use different identity providers. The frontend must authenticate users and obtain tokens for the platform service API. The platform service then uses the On-Behalf-Of (OBO) flow to call downstream services (Microsoft Graph, etc.).

Requirements:

- Support Microsoft Entra ID (primary, enterprise customers)
- Support Google and AWS Cognito (future customers)
- Multi-tenant: users belong to organizations with multiple tenants
- RBAC: organization-level and tenant-level roles
- Token-based: frontend obtains tokens, platform service validates them

## Decision

### Multi-Provider Architecture

The frontend supports multiple identity providers via a pluggable `AuthProvider` pattern:

```
src/auth/
├── AuthProvider.tsx          # Microsoft MSAL provider (primary)
├── GoogleAuthProvider.tsx    # Google Sign-In provider
├── CognitoAuthProvider.tsx   # AWS Cognito provider
├── authConfig.ts             # MSAL configuration
├── useCognitoAuth.ts         # Cognito hook
└── useGoogleAuth.ts          # Google hook
```

The active provider is selected at build time via configuration in `src/config/`.

### Token Flow

```
┌──────────┐    ┌─────────────┐    ┌──────────────────┐    ┌──────────────┐
│ User     │───▶│ IdP (MSAL/  │───▶│ Frontend         │───▶│ Platform     │
│ (Login)  │    │ Google/     │    │ (API-scoped      │    │ Service      │
│          │    │ Cognito)    │    │  token)           │    │ (OBO flow)   │
└──────────┘    └─────────────┘    └──────────────────┘    └──────────────┘
```

1. User authenticates with the configured IdP
2. Frontend receives an API-scoped token (`api://{client_id}/access_as_user`)
3. Frontend attaches token to all API requests via `Authorization: Bearer <token>`
4. Platform service validates the token and optionally exchanges it via OBO

### Context Hierarchy

```
IdpWrapper (selects auth provider based on config)
  └── AuthProvider (MSAL / Google / Cognito)
      └── IdentityProvider (wraps AuthContext + TenantContext + ApiClientContext)
          └── App
```

The `IdentityProvider` composes three sub-contexts:

- **AuthContext**: user identity, login/logout, token acquisition
- **TenantContext**: current organization and tenant selection
- **ApiClientContext**: pre-configured API client with auth headers

## Rationale

### Why OBO Flow (not direct Graph API access)?

- Frontend never sees Graph tokens — reduced security surface
- Platform service controls which Graph scopes are requested
- Single API scope simplifies frontend token management
- Platform service can audit all downstream API calls

### Why Multi-Provider?

- Different enterprise customers use different IdPs
- Microsoft Entra ID is primary but not universal
- Pluggable architecture allows adding providers without refactoring core auth logic

### Why Build-Time Provider Selection?

- Simpler than runtime detection (no IdP discovery needed)
- Each deployment targets a specific customer/IdP
- Avoids shipping unused auth SDKs to the browser

## Consequences

### Positive

- Clean separation of auth concerns from business logic
- Easy to add new identity providers
- Platform service controls downstream permissions (least privilege)

### Negative

- Three auth implementations to maintain
- Build-time selection means separate builds per provider (or environment variables)
- OBO flow adds latency to first API call after login
