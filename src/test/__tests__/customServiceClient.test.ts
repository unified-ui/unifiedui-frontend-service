import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import {
  CustomServiceError,
  createCustomServiceClient,
} from '../../extensions/client';
import { server } from '../mocks/server';

const baseURL = 'http://localhost:9090/api/v1/custom-service';

describe('CustomServiceClient', () => {
  it('adds authentication and tenant context', async () => {
    server.use(http.get(`${baseURL}/todos`, ({ request }) => {
      expect(request.headers.get('Authorization')).toBe('Bearer access-token');
      expect(request.headers.get('X-Tenant-ID')).toBe('tenant-1');
      return HttpResponse.json([{ id: '1', title: 'Test', completed: false }]);
    }));
    const client = createCustomServiceClient({
      baseURL,
      getAccessToken: async () => 'access-token',
      getTenantId: () => 'tenant-1',
    });

    const result = await client.request<Array<{ id: string }>>('/todos', { tenantScoped: true });
    expect(result).toEqual([{ id: '1', title: 'Test', completed: false }]);
  });

  it('handles empty successful responses', async () => {
    server.use(http.delete(`${baseURL}/todos/1`, () => new HttpResponse(null, { status: 204 })));
    const client = createCustomServiceClient({ baseURL, getAccessToken: async () => null });
    await expect(client.request<void>('/todos/1', { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('normalizes service errors and invokes the callback', async () => {
    server.use(http.get(`${baseURL}/todos`, () => HttpResponse.json(
      { detail: 'Not available' },
      { status: 503, statusText: 'Service Unavailable' },
    )));
    const onError = vi.fn();
    const client = createCustomServiceClient({
      baseURL,
      getAccessToken: async () => null,
      onError,
    });

    await expect(client.request('/todos')).rejects.toMatchObject({
      status: 503,
      detail: 'Not available',
    } satisfies Partial<CustomServiceError>);
    expect(onError).toHaveBeenCalledOnce();
  });

  it('rejects unsafe base URLs and protocol-relative paths', async () => {
    expect(() => createCustomServiceClient({
      baseURL: 'javascript:alert(1)',
      getAccessToken: async () => null,
    })).toThrow('Custom service base URL must use HTTP(S)');

    const client = createCustomServiceClient({ baseURL, getAccessToken: async () => null });
    await expect(client.request('//attacker.example')).rejects.toThrow(
      'Custom service paths cannot be protocol-relative',
    );
  });
});
