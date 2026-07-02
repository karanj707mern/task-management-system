'use client';

import { useCallback, useEffect, useState } from 'react';
import { authService } from '@/services/auth.service';
import type { User } from '@/types';
import { apiClient } from '@/lib/api-client';

type LoginResponse = {
  accessToken: string;
  user: User;
};

type LoginParams = {
  email: string;
  password: string;
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const syncState = useCallback((nextUser: User | null, nextAuth: boolean, accessToken?: string) => {
    setUser(nextUser);
    setIsAuthenticated(nextAuth);
    setIsLoading(false);
    if (accessToken !== undefined) {
      apiClient.setAccessToken(accessToken);
    }
    try {
      if (nextAuth && nextUser) {
        sessionStorage.setItem('auth-state', JSON.stringify({ user: nextUser, isAuthenticated: true, accessToken }));
      } else {
        sessionStorage.removeItem('auth-state');
      }
    } catch {
      // Session storage unavailable
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      // Try to restore access token from storage first
      try {
        const stored = sessionStorage.getItem('auth-state');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.accessToken) {
            apiClient.setAccessToken(parsed.accessToken);
          }
        }
      } catch {
        // Session storage unavailable
      }

      const profile = await authService.getProfile();
      syncState(profile, true);
      return true;
    } catch {
      apiClient.setAccessToken(null);
      syncState(null, false);
      return false;
    }
  }, [syncState]);

  useEffect(() => {
    checkAuth().catch(() => {
      // Auth failure is already handled inside checkAuth.
    });
  }, [checkAuth]);

  const login = async (params: LoginParams): Promise<LoginResponse> => {
    const result = await authService.login(params);
    syncState(result.user, true, result.accessToken);
    return result;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Logout request failed - session cleared client-side
    }
    syncState(null, false);
  };

  const updateUser = (updated: User) => {
    setUser(updated);
    const stored = sessionStorage.getItem('auth-state');
    try {
      if (stored) {
        const parsed = JSON.parse(stored);
        sessionStorage.setItem('auth-state', JSON.stringify({ ...parsed, user: updated }));
      }
    } catch {
      // Session storage unavailable
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    refreshAuth: checkAuth,
  };
}
