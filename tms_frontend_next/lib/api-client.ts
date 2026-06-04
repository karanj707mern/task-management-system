import { API_BASE_URL, HTTP_STATUS, ERROR_MESSAGES } from '@/constants';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public data?: any,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * API Client for communicating with backend
 */
export class ApiClient {
  private static instance: ApiClient;

  private constructor() {}

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private async fetchWithAuth(url: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add auth token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(response.status, error.message || 'An error occurred', error);
    }

    return response.json();
  }

  async get<T>(path: string): Promise<T> {
    return this.fetchWithAuth(`${API_BASE_URL}${path}`);
  }

  async post<T>(path: string, data?: any): Promise<T> {
    return this.fetchWithAuth(`${API_BASE_URL}${path}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(path: string, data?: any): Promise<T> {
    return this.fetchWithAuth(`${API_BASE_URL}${path}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(path: string, data?: any): Promise<T> {
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
}

export const apiClient = ApiClient.getInstance();
