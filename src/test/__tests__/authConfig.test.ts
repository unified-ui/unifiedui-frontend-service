import { describe, it, expect, vi, afterEach } from 'vitest';

describe('authConfig', () => {
  void import.meta.env;

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('uses default clientId when env var is not set', async () => {
    vi.stubEnv('VITE_MSAL_CLIENT_ID', '');
    const { msalConfig } = await import('../../auth/authConfig');
    expect(msalConfig.auth.clientId).toBeTruthy();
  });

  it('uses env variable for clientId when set', async () => {
    vi.stubEnv('VITE_MSAL_CLIENT_ID', 'custom-client-id-123');
    const { msalConfig } = await import('../../auth/authConfig');
    expect(msalConfig.auth.clientId).toBe('custom-client-id-123');
  });

  it('uses sessionStorage for cache location', async () => {
    const { msalConfig } = await import('../../auth/authConfig');
    expect(msalConfig.cache.cacheLocation).toBe('sessionStorage');
  });

  it('uses default authority when env var is not set', async () => {
    vi.stubEnv('VITE_MSAL_AUTHORITY', '');
    const { msalConfig } = await import('../../auth/authConfig');
    expect(msalConfig.auth.authority).toContain('login.microsoftonline.com');
  });

  it('uses env variable for authority when set', async () => {
    vi.stubEnv('VITE_MSAL_AUTHORITY', 'https://login.microsoftonline.com/my-tenant');
    const { msalConfig } = await import('../../auth/authConfig');
    expect(msalConfig.auth.authority).toBe('https://login.microsoftonline.com/my-tenant');
  });

  it('exports loginRequest with empty scopes when no API scope configured', async () => {
    vi.stubEnv('VITE_MSAL_API_SCOPE', '');
    const { loginRequest } = await import('../../auth/authConfig');
    expect(loginRequest.scopes).toHaveLength(0);
  });

  it('exports loginRequest with API scope when configured', async () => {
    vi.stubEnv('VITE_MSAL_API_SCOPE', 'api://test-id/access_as_user');
    const { loginRequest } = await import('../../auth/authConfig');
    expect(loginRequest.scopes).toHaveLength(1);
    expect(loginRequest.scopes[0]).toContain('access_as_user');
  });

  it('uses env variable for API scope when set', async () => {
    vi.stubEnv('VITE_MSAL_API_SCOPE', 'api://custom-id/access_as_user');
    const { loginRequest } = await import('../../auth/authConfig');
    expect(loginRequest.scopes).toContain('api://custom-id/access_as_user');
  });

  it('sets storeAuthStateInCookie to false', async () => {
    const { msalConfig } = await import('../../auth/authConfig');
    expect(msalConfig.cache.storeAuthStateInCookie).toBe(false);
  });

  it('disables native broker', async () => {
    const { msalConfig } = await import('../../auth/authConfig');
    expect(msalConfig.system.allowNativeBroker).toBe(false);
  });
});
