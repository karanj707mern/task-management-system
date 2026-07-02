import { API_BASE_URL } from '@/constants';

const AUTH_STATE_KEY = 'auth-state';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  private static instance: ApiClient;

  private accessToken: string | null = null;

  private constructor() {}

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  private getStoredAccessToken(): string | null {
    if (this.accessToken) return this.accessToken;
    try {
      const stored = sessionStorage.getItem(AUTH_STATE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed?.accessToken || null;
      }
    } catch {
      // Session storage unavailable or invalid
    }
    return null;
  }

  private async fetchWithAuth<T>(
    url: string,
    options: RequestInit = {},
    retry = true,
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    };

    const token = this.getStoredAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
      cache: 'no-store',
    });

    if (response.status === 401 && retry && !url.includes('/auth/refresh')) {
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!refreshResponse.ok) {
          this.setAccessToken(null);
          throw new ApiError(401, 'Session expired');
        }
        const refreshText = await refreshResponse.text();
        const refreshBody = refreshText ? JSON.parse(refreshText) : null;
        const newToken = refreshBody?.data?.accessToken || refreshBody?.accessToken;
        if (newToken) {
          this.setAccessToken(newToken);
        }
        return this.fetchWithAuth<T>(url, options, false);
      } catch {
        this.setAccessToken(null);
        throw new ApiError(401, 'Session expired');
      }
    }

    if (!response.ok) {
      let errorBody: { message?: string } = {};
      try {
        errorBody = await response.json();
      } catch {
        errorBody = { message: 'An error occurred' };
      }

      throw new ApiError(
        response.status,
        errorBody?.message || 'An error occurred',
        errorBody,
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    if (!text) {
      return undefined as T;
    }

    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      body = { message: text };
    }

    if (body && typeof body === 'object' && 'success' in body && body.success === true && 'data' in body) {
      return (body as { data: T }).data;
    }
    return body as T;
  }

  async get<T>(path: string, headers?: Record<string, string>): Promise<T> {
    return this.fetchWithAuth(`${API_BASE_URL}${path}`, { headers });
  }

  async post<T>(path: string, data?: unknown): Promise<T> {
    return this.fetchWithAuth(`${API_BASE_URL}${path}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(path: string, data?: unknown): Promise<T> {
    return this.fetchWithAuth(`${API_BASE_URL}${path}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(path: string, data?: unknown): Promise<T> {
    return this.fetchWithAuth(`${API_BASE_URL}${path}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(path: string): Promise<T> {
    return this.fetchWithAuth(`${API_BASE_URL}${path}`, {
      method: 'DELETE',
    });
  }

  async upload<T>(path: string, formData: FormData): Promise<T> {
    const headers: Record<string, string> = {};
    const token = this.getStoredAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    // Do NOT set Content-Type for FormData — the browser will set it
    // automatically with the correct multipart boundary.

    const url = `${API_BASE_URL}${path}`;
    console.log('[API] upload() called:', url, 'headers:', Object.keys(headers), 'FormData entries:', Array.from(formData.entries()).map(([k, v]) => `${k}=${v instanceof File ? `File(${v.name}, ${v.size}B)` : v}`));

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });

    console.log('[API] upload() response:', response.status, response.statusText);

    if (!response.ok) {
      let errorBody: { message?: string } = {};
      try {
        errorBody = await response.json();
      } catch {
        errorBody = { message: 'An error occurred' };
      }
      throw new ApiError(
        response.status,
        errorBody?.message || 'Upload failed',
        errorBody,
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    if (!text) {
      return undefined as T;
    }

    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      body = { message: text };
    }

    if (body && typeof body === 'object' && 'success' in body && body.success === true && 'data' in body) {
      return (body as { data: T }).data;
    }
    return body as T;
  }
}

export const apiClient = ApiClient.getInstance();