import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { GoogleAuthContext } from '../../auth/useGoogleAuth';
import type { GoogleAuthContextType } from '../../auth/useGoogleAuth';
import { CognitoAuthContext } from '../../auth/useCognitoAuth';
import type { CognitoAuthContextType } from '../../auth/useCognitoAuth';
import { useGoogleAuth } from '../../auth/useGoogleAuth';
import { useCognitoAuth } from '../../auth/useCognitoAuth';

describe('useGoogleAuth', () => {
  it('throws when used outside GoogleAuthProvider', () => {
    expect(() => {
      renderHook(() => useGoogleAuth());
    }).toThrow('useGoogleAuth must be used within GoogleAuthProvider');
  });

  it('returns context value when used within provider', () => {
    const mockValue: GoogleAuthContextType = {
      isAuthenticated: true,
      isLoading: false,
      account: null,
      login: vi.fn(),
      logout: vi.fn(),
      getAccessToken: vi.fn(),
      getFoundryToken: vi.fn(),
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <GoogleAuthContext.Provider value={mockValue}>
        {children}
      </GoogleAuthContext.Provider>
    );

    const { result } = renderHook(() => useGoogleAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });
});

describe('useCognitoAuth', () => {
  it('throws when used outside CognitoAuthProvider', () => {
    expect(() => {
      renderHook(() => useCognitoAuth());
    }).toThrow('useCognitoAuth must be used within CognitoAuthProvider');
  });

  it('returns context value when used within provider', () => {
    const mockValue: CognitoAuthContextType = {
      isAuthenticated: false,
      isLoading: true,
      account: null,
      login: vi.fn(),
      logout: vi.fn(),
      getAccessToken: vi.fn(),
      getFoundryToken: vi.fn(),
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <CognitoAuthContext.Provider value={mockValue}>
        {children}
      </CognitoAuthContext.Provider>
    );

    const { result } = renderHook(() => useCognitoAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(true);
  });
});

describe('authConfig', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('exports ALL_IDENTITY_PROVIDERS with all provider types', async () => {
    const { ALL_IDENTITY_PROVIDERS } = await import('../../auth/authConfig');
    expect(ALL_IDENTITY_PROVIDERS).toContain('microsoft');
    expect(ALL_IDENTITY_PROVIDERS).toContain('google');
    expect(ALL_IDENTITY_PROVIDERS).toContain('aws_cognito');
    expect(ALL_IDENTITY_PROVIDERS.length).toBeGreaterThanOrEqual(3);
  });

  it('defaults provider to microsoft when env is not set', async () => {
    vi.stubEnv('VITE_AUTH_PROVIDER', '');
    const { authConfig } = await import('../../auth/authConfig');
    expect(authConfig.provider).toBe('microsoft');
  });

  it('uses custom auth provider from env', async () => {
    vi.stubEnv('VITE_AUTH_PROVIDER', 'google');
    const { authConfig } = await import('../../auth/authConfig');
    expect(authConfig.provider).toBe('google');
  });

  it('includes google config when VITE_GOOGLE_CLIENT_ID is set', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'google-client-123');
    const { authConfig } = await import('../../auth/authConfig');
    expect(authConfig.google).toBeDefined();
    expect(authConfig.google?.clientId).toBe('google-client-123');
  });

  it('excludes google config when VITE_GOOGLE_CLIENT_ID is empty', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '');
    const { authConfig } = await import('../../auth/authConfig');
    expect(authConfig.google).toBeUndefined();
  });

  it('includes cognito config when all env vars are set', async () => {
    vi.stubEnv('VITE_COGNITO_REGION', 'us-east-1');
    vi.stubEnv('VITE_COGNITO_USER_POOL_ID', 'pool-123');
    vi.stubEnv('VITE_COGNITO_CLIENT_ID', 'cognito-client-123');
    vi.stubEnv('VITE_COGNITO_DOMAIN', 'auth.example.com');
    const { authConfig } = await import('../../auth/authConfig');
    expect(authConfig.awsCognito).toBeDefined();
    expect(authConfig.awsCognito?.region).toBe('us-east-1');
    expect(authConfig.awsCognito?.clientId).toBe('cognito-client-123');
  });

  it('excludes cognito config when required env vars are missing', async () => {
    vi.stubEnv('VITE_COGNITO_REGION', '');
    vi.stubEnv('VITE_COGNITO_USER_POOL_ID', '');
    vi.stubEnv('VITE_COGNITO_CLIENT_ID', '');
    const { authConfig } = await import('../../auth/authConfig');
    expect(authConfig.awsCognito).toBeUndefined();
  });

  it('computes enabledProviders based on available configs', async () => {
    vi.stubEnv('VITE_MSAL_CLIENT_ID', 'msal-id');
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'google-id');
    const { enabledProviders } = await import('../../auth/authConfig');
    expect(enabledProviders).toContain('microsoft');
    expect(enabledProviders).toContain('google');
  });

  it('falls back to provider type when no configs are available', async () => {
    vi.stubEnv('VITE_MSAL_CLIENT_ID', '');
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '');
    vi.stubEnv('VITE_COGNITO_REGION', '');
    vi.stubEnv('VITE_COGNITO_USER_POOL_ID', '');
    vi.stubEnv('VITE_COGNITO_CLIENT_ID', '');
    vi.stubEnv('VITE_AUTH_PROVIDER', 'google');
    const { enabledProviders } = await import('../../auth/authConfig');
    expect(enabledProviders).toContain('google');
  });

  it('redirectUri uses current window.location.origin', async () => {
    const { msalConfig } = await import('../../auth/authConfig');
    expect(msalConfig.auth.redirectUri).toBe(window.location.origin);
  });
});
