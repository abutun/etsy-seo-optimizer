import { getConfig } from '../utils/config.js';
import { getValidAccessToken } from '../auth/tokens.js';
import { rateLimiter } from '../utils/rate-limiter.js';
import { startAuthFlow } from '../auth/server.js';

const BASE_URL = 'https://openapi.etsy.com/v3';

export class EtsyApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public responseBody?: string,
  ) {
    super(`Etsy API Error (${statusCode}): ${message}`);
    this.name = 'EtsyApiError';
  }
}

interface RequestOptions {
  requiresAuth?: boolean;
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: Record<string, unknown>;
  params?: Record<string, string | number | boolean | undefined>;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { requiresAuth = false, method = 'GET', body, params } = options;
  const config = getConfig();

  await rateLimiter.acquire();

  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const headers: Record<string, string> = {
    'x-api-key': config.apiKey,
  };

  if (requiresAuth) {
    try {
      const accessToken = await getValidAccessToken();
      headers['Authorization'] = `Bearer ${accessToken}`;
    } catch (error) {
      if (error instanceof Error && error.message === 'AUTH_REQUIRED') {
        await startAuthFlow();
        const accessToken = await getValidAccessToken();
        headers['Authorization'] = `Bearer ${accessToken}`;
      } else {
        throw error;
      }
    }
  }

  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && requiresAuth) {
    // Token might have expired mid-request, try auth flow
    await startAuthFlow();
    const newToken = await getValidAccessToken();
    headers['Authorization'] = `Bearer ${newToken}`;

    const retryResponse = await fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!retryResponse.ok) {
      const errorText = await retryResponse.text();
      throw new EtsyApiError(retryResponse.status, errorText);
    }

    return retryResponse.json() as Promise<T>;
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new EtsyApiError(response.status, errorText, errorText);
  }

  return response.json() as Promise<T>;
}

export async function apiGet<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
  requiresAuth = false,
): Promise<T> {
  return apiRequest<T>(path, { method: 'GET', params, requiresAuth });
}

export async function apiPatch<T>(
  path: string,
  body: Record<string, unknown>,
  requiresAuth = true,
): Promise<T> {
  return apiRequest<T>(path, { method: 'PATCH', body, requiresAuth });
}

export async function apiPut<T>(
  path: string,
  body: Record<string, unknown>,
  requiresAuth = true,
): Promise<T> {
  return apiRequest<T>(path, { method: 'PUT', body, requiresAuth });
}

export async function apiPost<T>(
  path: string,
  body: Record<string, unknown>,
  requiresAuth = true,
): Promise<T> {
  return apiRequest<T>(path, { method: 'POST', body, requiresAuth });
}
