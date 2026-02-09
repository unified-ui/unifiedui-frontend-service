import { http, HttpResponse } from 'msw';

const API_BASE_URL = 'http://localhost:8000';
const AGENT_SERVICE_URL = 'http://localhost:8085';

export const handlers = [
  http.get(`${API_BASE_URL}/v1/me`, () => {
    return HttpResponse.json({
      id: 'test-user-id',
      identity_provider: 'MICROSOFT',
      identity_tenant_id: 'test-tenant-id',
      display_name: 'Test User',
      firstname: 'Test',
      lastname: 'User',
      mail: 'test@example.com',
      tenants: [
        {
          tenant: {
            id: 'tenant-1',
            name: 'Test Tenant',
            description: 'A test tenant',
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
          },
          role: 'GLOBAL_ADMIN',
        },
      ],
    });
  }),

  http.get(`${API_BASE_URL}/v1/tenants/:tenantId/ai-capabilities`, () => {
    return HttpResponse.json({
      title_generation: false,
      trace_analysis: false,
      description_generation: false,
    });
  }),

  http.get(`${API_BASE_URL}/v1/tenants/:tenantId/applications`, () => {
    return HttpResponse.json([]);
  }),

  http.get(`${API_BASE_URL}/v1/tenants/:tenantId/autonomous-agents`, () => {
    return HttpResponse.json([]);
  }),

  http.get(`${API_BASE_URL}/v1/tenants/:tenantId/chat-widgets`, () => {
    return HttpResponse.json([]);
  }),

  http.get(`${AGENT_SERVICE_URL}/v1/tenants/:tenantId/conversations`, () => {
    return HttpResponse.json([]);
  }),
];
