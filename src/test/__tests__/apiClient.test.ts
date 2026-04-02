import { describe, it, expect, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { UnifiedUIAPIClient } from '../../api/client';
import type { APIClientConfig } from '../../api/client';

const BASE_URL = 'http://localhost:8000';
const AGENT_URL = 'http://localhost:8085';

function createClient(overrides: Partial<APIClientConfig> = {}): UnifiedUIAPIClient {
  const config: APIClientConfig = {
    baseURL: BASE_URL,
    getAccessToken: async () => 'test-token',
    ...overrides,
  };
  const client = new UnifiedUIAPIClient(config);
  client.setAgentServiceURL(AGENT_URL);
  return client;
}

describe('UnifiedUIAPIClient', () => {
  describe('constructor & configuration', () => {
    it('creates client with required config', () => {
      const client = createClient();
      expect(client).toBeDefined();
    });

    it('throws when agent service URL is not configured', async () => {
      const config: APIClientConfig = {
        baseURL: BASE_URL,
        getAccessToken: async () => 'test-token',
      };
      const client = new UnifiedUIAPIClient(config);

      server.use(
        http.get(`${AGENT_URL}/api/v1/agent-service/tenants/t1/ai/capabilities`, () => {
          return HttpResponse.json({ title_generation: false });
        }),
      );

      await expect(client.getAICapabilities('t1')).rejects.toThrow(
        'Agent service URL not configured',
      );
    });
  });

  describe('request lifecycle', () => {
    it('adds Authorization header with token', async () => {
      let capturedHeaders: Record<string, string> = {};
      server.use(
        http.get(`${BASE_URL}/api/v1/platform-service/health`, ({ request }) => {
          capturedHeaders = Object.fromEntries(request.headers.entries());
          return HttpResponse.json({ status: 'ok' });
        }),
      );

      const client = createClient();
      await client.getHealth();
      expect(capturedHeaders['authorization']).toBe('Bearer test-token');
    });

    it('omits Authorization header when token is null', async () => {
      let capturedHeaders: Record<string, string> = {};
      server.use(
        http.get(`${BASE_URL}/api/v1/platform-service/health`, ({ request }) => {
          capturedHeaders = Object.fromEntries(request.headers.entries());
          return HttpResponse.json({ status: 'ok' });
        }),
      );

      const client = createClient({ getAccessToken: async () => null });
      await client.getHealth();
      expect(capturedHeaders['authorization']).toBeUndefined();
    });

    it('sends X-Use-Cache: false header when noCache is true', async () => {
      let capturedHeaders: Record<string, string> = {};
      server.use(
        http.get(`${BASE_URL}/api/v1/platform-service/identity/me`, ({ request }) => {
          capturedHeaders = Object.fromEntries(request.headers.entries());
          return HttpResponse.json({
            id: 'u1',
            identity_provider: 'MICROSOFT',
            identity_tenant_id: 'tid',
            display_name: 'Test',
            firstname: 'Test',
            lastname: 'User',
            mail: 'test@test.com',
            tenants: [],
          });
        }),
      );

      const client = createClient();
      await client.getMe({ noCache: true });
      expect(capturedHeaders['x-use-cache']).toBe('false');
    });

    it('calls onSuccess callback on successful mutation', async () => {
      const onSuccess = vi.fn();
      server.use(
        http.post(`${BASE_URL}/api/v1/platform-service/tenants/:tenantId/credentials`, () => {
          return HttpResponse.json({
            id: 'cred-1',
            name: 'Test Credential',
            credential_type: 'API_KEY',
            is_active: true,
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
          });
        }),
      );

      const client = createClient({ onSuccess });
      await client.createCredential('t1', {
        name: 'Test Credential',
        credential_type: 'API_KEY',
        secret_value: 'secret-123',
      });
      expect(onSuccess).toHaveBeenCalledWith('Credential created successfully');
    });

    it('calls onError callback on HTTP error', async () => {
      const onError = vi.fn();
      server.use(
        http.get(`${BASE_URL}/api/v1/platform-service/health`, () => {
          return HttpResponse.json({ detail: 'Server Error' }, { status: 500 });
        }),
      );

      const client = createClient({ onError });
      await expect(client.getHealth()).rejects.toThrow('Server Error');
      expect(onError).toHaveBeenCalled();
    });

    it('handles 204 No Content response', async () => {
      server.use(
        http.delete(`${BASE_URL}/api/v1/platform-service/tenants/:tenantId/credentials/:credId`, () => {
          return new HttpResponse(null, { status: 204 });
        }),
      );

      const client = createClient();
      const result = await client.deleteCredential('t1', 'cred-1');
      expect(result).toBeUndefined();
    });

    it('uses error detail from response body', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/platform-service/health`, () => {
          return HttpResponse.json({ detail: 'Custom error message' }, { status: 400 });
        }),
      );

      const client = createClient();
      await expect(client.getHealth()).rejects.toThrow('Custom error message');
    });

    it('falls back to status text when no detail in error response', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/platform-service/health`, () => {
          return new HttpResponse('not json', { status: 500, statusText: 'Internal Server Error' });
        }),
      );

      const client = createClient();
      await expect(client.getHealth()).rejects.toThrow('HTTP 500: Internal Server Error');
    });
  });

  describe('platform service endpoints', () => {
    it('getHealth returns health check response', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/platform-service/health`, () => {
          return HttpResponse.json({ status: 'healthy' });
        }),
      );

      const client = createClient();
      const result = await client.getHealth();
      expect(result.status).toBe('healthy');
    });

    it('getMe returns user identity', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/platform-service/identity/me`, () => {
          return HttpResponse.json({
            id: 'user-1',
            identity_provider: 'MICROSOFT',
            identity_tenant_id: 'tenant-1',
            display_name: 'Test User',
            firstname: 'Test',
            lastname: 'User',
            mail: 'test@example.com',
            tenants: [],
          });
        }),
      );

      const client = createClient();
      const result = await client.getMe();
      expect(result.id).toBe('user-1');
      expect(result.display_name).toBe('Test User');
    });

    it('listChatAgents sends correct request', async () => {
      let capturedUrl = '';
      server.use(
        http.get(`${BASE_URL}/api/v1/platform-service/tenants/:tenantId/chat-agents`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json([]);
        }),
      );

      const client = createClient();
      const result = await client.listChatAgents('t1', { name: 'test', limit: 10 });
      expect(result).toEqual([]);
      expect(capturedUrl).toContain('name=test');
      expect(capturedUrl).toContain('limit=10');
    });

    it('createTenant sends POST with correct body', async () => {
      let capturedBody: Record<string, unknown> = {};
      server.use(
        http.post(`${BASE_URL}/api/v1/platform-service/tenants`, async ({ request }) => {
          capturedBody = await request.json() as Record<string, unknown>;
          return HttpResponse.json({
            id: 'new-tenant',
            name: 'New Tenant',
            description: 'Test',
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
          });
        }),
      );

      const client = createClient();
      const result = await client.createTenant({
        name: 'New Tenant',
        description: 'Test',
      });
      expect(result.id).toBe('new-tenant');
      expect(capturedBody.name).toBe('New Tenant');
    });
  });

  describe('agent service endpoints', () => {
    it('getAICapabilities sends request to agent service', async () => {
      server.use(
        http.get(`${AGENT_URL}/api/v1/agent-service/tenants/:tenantId/ai/capabilities`, () => {
          return HttpResponse.json({
            title_generation: true,
            trace_analysis: false,
            description_generation: true,
          });
        }),
      );

      const client = createClient();
      const result = await client.getAICapabilities('t1');
      expect(result.title_generation).toBe(true);
      expect(result.trace_analysis).toBe(false);
    });

    it('agent service request adds auth header', async () => {
      let capturedHeaders: Record<string, string> = {};
      server.use(
        http.get(`${AGENT_URL}/api/v1/agent-service/tenants/:tenantId/ai/capabilities`, ({ request }) => {
          capturedHeaders = Object.fromEntries(request.headers.entries());
          return HttpResponse.json({});
        }),
      );

      const client = createClient();
      await client.getAICapabilities('t1');
      expect(capturedHeaders['authorization']).toBe('Bearer test-token');
    });
  });

  describe('query string building', () => {
    it('omits undefined and null params', async () => {
      let capturedUrl = '';
      server.use(
        http.get(`${BASE_URL}/api/v1/platform-service/identity/users`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({ users: [] });
        }),
      );

      const client = createClient();
      await client.getUsers({ search: undefined as unknown as string });
      expect(capturedUrl).not.toContain('search');
    });

    it('builds query string with valid params', async () => {
      let capturedUrl = '';
      server.use(
        http.get(`${BASE_URL}/api/v1/platform-service/identity/users`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({ users: [] });
        }),
      );

      const client = createClient();
      await client.getUsers({ search: 'findme' });
      expect(capturedUrl).toContain('search=findme');
    });
  });
});
