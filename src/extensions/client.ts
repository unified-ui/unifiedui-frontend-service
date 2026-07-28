export type CustomServiceMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface CustomServiceRequestOptions {
  method?: CustomServiceMethod;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  tenantScoped?: boolean;
}

export interface CustomServiceClientConfig {
  baseURL: string;
  getAccessToken: () => Promise<string | null>;
  getTenantId?: () => string | null;
  tenantHeaderName?: string;
  onError?: (error: CustomServiceError) => void;
}

export class CustomServiceError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly detail?: string;
  readonly response?: unknown;

  constructor(
    status: number,
    statusText: string,
    detail?: string,
    response?: unknown,
  ) {
    super(detail || statusText || 'Custom service request failed');
    this.name = 'CustomServiceError';
    this.status = status;
    this.statusText = statusText;
    this.detail = detail;
    this.response = response;
  }
}

const resolveBaseURL = (baseURL: string): URL => {
  const origin = typeof window === 'undefined' ? 'http://localhost' : window.location.origin;
  const url = new URL(baseURL, origin);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Custom service base URL must use HTTP(S) and cannot contain credentials.');
  }
  return url;
};

const getErrorDetail = (response: unknown): string | undefined => {
  if (!response || typeof response !== 'object') return undefined;
  const detail = Reflect.get(response, 'detail');
  return typeof detail === 'string' ? detail : undefined;
};

export class CustomServiceClient {
  private readonly baseURL: URL;
  private readonly config: CustomServiceClientConfig;

  constructor(config: CustomServiceClientConfig) {
    this.config = config;
    this.baseURL = resolveBaseURL(config.baseURL);
  }

  async request<TResponse>(
    path: `/${string}`,
    options: CustomServiceRequestOptions = {},
  ): Promise<TResponse> {
    if (path.startsWith('//')) throw new Error('Custom service paths cannot be protocol-relative.');

    const token = await this.config.getAccessToken();
    const headers = new Headers(options.headers);
    headers.set('Accept', 'application/json');
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const tenantId = options.tenantScoped ? this.config.getTenantId?.() : null;
    if (tenantId) headers.set(this.config.tenantHeaderName ?? 'X-Tenant-ID', tenantId);

    let body: BodyInit | undefined;
    if (options.body !== undefined) {
      headers.set('Content-Type', 'application/json');
      body = JSON.stringify(options.body);
    }

    const requestURL = new URL(path.replace(/^\//, ''), `${this.baseURL.toString().replace(/\/$/, '')}/`);
    const response = await fetch(requestURL, {
      method: options.method ?? 'GET',
      headers,
      body,
      signal: options.signal,
    });

    const hasJSON = response.headers.get('content-type')?.includes('application/json') ?? false;
    const responseBody: unknown = response.status === 204
      ? undefined
      : hasJSON
        ? await response.json()
        : await response.text();

    if (!response.ok) {
      const error = new CustomServiceError(
        response.status,
        response.statusText,
        getErrorDetail(responseBody),
        responseBody,
      );
      this.config.onError?.(error);
      throw error;
    }

    return responseBody as TResponse;
  }
}

export const createCustomServiceClient = (
  config: CustomServiceClientConfig,
): CustomServiceClient => new CustomServiceClient(config);
