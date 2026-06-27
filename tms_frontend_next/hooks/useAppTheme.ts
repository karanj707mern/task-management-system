'use client';

import { useTheme } from 'next-themes';
import { useEffect, useLayoutEffect } from 'react';

export type ThemeVariant = 'slate' | 'zinc' | 'neutral';

export function useAppTheme() {
  const { theme, setTheme } = useTheme();

  useLayoutEffect(() => {
    const root = document.documentElement;
    const stored = localStorage.getItem('app-theme-variant');
    const saved = (stored as ThemeVariant) || (root.getAttribute('data-theme') as ThemeVariant) || 'slate';
    root.setAttribute('data-theme', saved);
  }, []);

  const setVariant = (next: ThemeVariant) => {
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('app-theme-variant', next);
    } catch {
      // Storage unavailable - theme preference not persisted
    }
  };

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'app-theme-variant' && e.newValue) {
        document.documentElement.setAttribute('data-theme', e.newValue as ThemeVariant);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return {
    theme,
    setTheme,
    variant: (typeof window !== 'undefined' && (document.documentElement.getAttribute('data-theme') as ThemeVariant)) || 'slate',
    setVariant,
  };
}
