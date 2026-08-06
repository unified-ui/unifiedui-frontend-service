# Custom Frontend Extensions

unified-ui can compile deployment-specific frontend code from an optional root-level `custom/` directory. The directory is ignored by the upstream repository and can be created locally, committed in a fork with an adjusted ignore rule, or injected by a deployment pipeline before `npm run build`.

Extensions are build-time modules. They are not downloaded or activated after deployment.

## Quick Start

```bash
cp -R custom.example custom
npm run dev
```

The example adds a protected `/custom/test` route, a **Test** sidebar item, and a local Todo application. Todo data is stored in browser `localStorage`; the example makes no backend requests.

Delete `custom/` to restore the unmodified OSS frontend. The empty extension manifest is used automatically when the directory does not exist.

## Required Structure

```text
custom/
├── index.ts
├── client/
├── components/
├── hooks/
├── pages/
└── types/
```

Only `custom/index.ts` is mandatory. If `custom/` exists without this entry point, development and production builds fail with a structure error.

## Manifest

Import the supported contract through `@unified-ui/custom-api`:

```typescript
import { lazy } from "react";
import { IconChecklist } from "@tabler/icons-react";
import {
  CUSTOM_EXTENSION_API_VERSION,
  defineCustomExtension,
} from "@unified-ui/custom-api";

const Page = lazy(() =>
  import("./pages/Page").then((module) => ({ default: module.Page })),
);

export default defineCustomExtension({
  apiVersion: CUSTOM_EXTENSION_API_VERSION,
  id: "example",
  routes: [{ id: "example-route", path: "/custom/example", component: Page }],
  sidebarItems: [
    {
      id: "example-sidebar",
      path: "/custom/example",
      labelKey: "sidebarLabel",
      icon: IconChecklist,
      section: "primary",
    },
  ],
  translations: {
    "en-US": { sidebarLabel: "Example" },
    "de-DE": { sidebarLabel: "Beispiel" },
  },
});
```

Rules:

- Extension IDs use lowercase letters, numbers, and hyphens.
- Contribution IDs and route paths must be unique.
- Routes and sidebar links must use `/custom/...` paths.
- All custom routes are wrapped in the existing `ProtectedRoute`.
- Contributions are additive and cannot replace core routes or components.
- `envFlag` may reference a build-time `VITE_*` flag. Values `false` and `0` disable the contribution.
- Sidebar sections are `primary`, `secondary`, and `footer`.
- Supported slots are `sidebar-primary-end`, `sidebar-secondary-end`, and `sidebar-footer-start`.
- Both `en-US` and `de-DE` translation resources are required when translations are provided. The namespace is `custom-{manifest.id}`.

## Public API

Custom code should import supported integration points only from `@unified-ui/custom-api`. Direct imports from core `src/` modules are unsupported and may break during an upgrade.

The facade currently exposes:

- Manifest constants, types, and `defineCustomExtension()`
- `MainLayout` and `UnifiedDialog`
- `useCustomExtensionContext()` for user, tenant, tenant roles, and token access
- `CustomServiceClient`, `createCustomServiceClient()`, and `useCustomServiceClient()`

React, Mantine, React Router, i18next, and Tabler Icons can be imported from the project's installed dependencies. Additional packages must be added to the frontend `package.json` before the custom module is built.

## Custom Backend Client

The generic client attaches the current access token and can add the selected tenant ID. Domain endpoints and response types remain in `custom/client/`:

```typescript
import {
  useCustomServiceClient,
  type CustomServiceClient,
} from "@unified-ui/custom-api";

interface ReportResponse {
  id: string;
  title: string;
}

class ReportClient {
  private readonly client: CustomServiceClient;

  constructor(client: CustomServiceClient) {
    this.client = client;
  }

  async list(signal?: AbortSignal): Promise<ReportResponse[]> {
    return this.client.request<ReportResponse[]>("/reports", {
      tenantScoped: true,
      signal,
    });
  }
}

export const useReportClient = (): ReportClient => {
  const client = useCustomServiceClient({
    baseURL: import.meta.env.VITE_CUSTOM_REPORT_API_URL,
  });
  return new ReportClient(client);
};
```

The client supports JSON requests, `204 No Content`, custom headers, abort signals, normalized `CustomServiceError` failures, and optional `X-Tenant-ID` forwarding.

`VITE_*` values are visible in the browser bundle. Use them only for public configuration such as a service URL. Never put API keys, client secrets, passwords, or static bearer tokens in custom code or frontend environment variables. The custom backend must validate the bearer token and tenant authorization independently.

## Deployment

The `custom/` directory must exist inside the frontend build context before `npm run build`. The standard Docker build already copies the complete frontend repository, so no core Dockerfile change is required.

Deployment-specific work normally consists of:

1. Add or inject `custom/` before the frontend build.
2. Pass public custom `VITE_*` variables as Docker build arguments.
3. Add a reverse-proxy route or public endpoint for the separate custom service.
4. Run `npx tsc --noEmit`, `npm run lint`, `npx vitest run`, and `npm run build`.

Use `custom.example/` as the versioned compatibility reference when upgrading the core frontend.
