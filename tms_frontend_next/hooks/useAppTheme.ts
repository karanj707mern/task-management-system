'use client';

import { useTheme } from 'next-themes';
import { useEffect, useLayoutEffect, useState } from 'react';

export type ThemeVariant = 'slate' | 'zinc' | 'neutral' | 'blue' | 'green' | 'violet' | 'rose';

export function useAppTheme() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [variant, setVariantState] = useState<ThemeVariant>('slate');

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const stored = localStorage.getItem('app-theme-variant');
    const saved = (stored as ThemeVariant) || (root.getAttribute('data-theme') as ThemeVariant) || 'slate';
    root.setAttribute('data-theme', saved);
    setVariantState(saved);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const resolved = (resolvedTheme ?? theme ?? 'light') as 'light' | 'dark';
    root.classList.toggle('dark', resolved === 'dark');
    root.style.colorScheme = resolved;
  }, [theme, resolvedTheme]);

  const setVariant = (next: ThemeVariant) => {
    document.documentElement.setAttribute('data-theme', next);
    setVariantState(next);
    try {
      localStorage.setItem('app-theme-variant', next);
    } catch {
      // Storage unavailable - theme preference not persisted
    }
  };

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'app-theme-variant' && e.newValue) {
        const next = e.newValue as ThemeVariant;
        document.documentElement.setAttribute('data-theme', next);
        setVariantState(next);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return {
    theme: mounted ? theme : undefined,
    setTheme,
    variant,
    setVariant,
  };
}
